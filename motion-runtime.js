/* Local, presentation-aware rendering. Only the visible scene uses the GPU. */
(() => {
  'use strict';
  const entries = [];
  let frame = 0;
  let last = 0;
  let ready = false;
  let deck;

  const active = entry => entry.slide?.classList.contains('is-active');
  const paused = () => document.hidden || deck?.classList.contains('motion-paused');
  // Match the presentation's displayed pixels rather than oversampling its
  // fixed 1600x900 design canvas, especially in a narrow browser side panel.
  const pixelRatio = () => Math.max(.25, Math.min(
    (window.devicePixelRatio || 1) * Math.min(innerWidth / 1600, innerHeight / 900), 1.25
  ));

  function fallback(entry, error) {
    entry.failed = true;
    entry.host?.classList.remove('has-live-motion');
    entry.host?.setAttribute('data-renderer', 'fallback');
    entry.canvas?.remove();
    entry.renderer?.dispose();
    const image = entry.host?.querySelector('img[data-animated-src]');
    if (image) image.src = active(entry) && !paused() ? image.dataset.animatedSrc : image.dataset.stillSrc;
    if (error) console.warn('Using the original animation fallback:', entry.config.slideId, error.message);
  }

  function create(entry) {
    if (entry.renderer || entry.failed || !window.THREE) return;
    const T = window.THREE;
    try {
      const canvas = document.createElement('canvas');
      canvas.className = 'live-motion-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      entry.canvas = canvas;
      entry.host.append(canvas);
      const width = canvas.clientWidth || entry.host.clientWidth;
      const height = canvas.clientHeight || entry.host.clientHeight;
      const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      entry.renderer = renderer;
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(width, height, false);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      entry.scene = entry.config.build(T, width, height, renderer);
      if (Number.isFinite(entry.scene.exposure)) renderer.toneMappingExposure = entry.scene.exposure;
      entry.time = 0;
      entry.scene.update(0, 0);
      renderer.render(entry.scene.scene, entry.scene.camera);
      entry.host.classList.add('has-live-motion');
      const fallbackImage = entry.host.querySelector('img[alt]');
      if (!entry.host.hasAttribute('aria-label') && (entry.config.label || fallbackImage?.alt)) {
        entry.host.setAttribute('role', 'img');
        entry.host.setAttribute('aria-label', entry.config.label || fallbackImage.alt);
      }
      entry.host.querySelectorAll('img[data-still-src]').forEach(image => {
        image.src = image.dataset.stillSrc;
        image.dataset.motionState = 'paused';
      });
      entry.host.dataset.renderer = 'webgl';
      entry.host.dataset.motionState = paused() ? 'paused' : 'playing';
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        fallback(entry);
        sync();
      });
    } catch (error) {
      fallback(entry, error);
    }
  }

  function tick(now) {
    frame = 0;
    const delta = last ? Math.min((now - last) / 1000, 0.06) : 0;
    last = now;
    let running = false;
    if (!paused()) {
      for (const entry of entries) {
        if (!active(entry) || !entry.scene || entry.failed) continue;
        running = true;
        entry.time += delta;
        entry.scene.update(entry.time, delta);
        entry.renderer.render(entry.scene.scene, entry.scene.camera);
      }
    }
    if (running) frame = requestAnimationFrame(tick);
    else last = 0;
  }

  function sync() {
    if (!ready) return;
    let running = false;
    for (const entry of entries) {
      if (active(entry)) create(entry);
      const playing = active(entry) && !paused() && !entry.failed;
      if (entry.host) entry.host.dataset.motionState = playing ? 'playing' : 'paused';
      running ||= playing && Boolean(entry.scene);
    }
    if (running && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  }

  function attach(entry) {
    entry.slide = document.getElementById(entry.config.slideId);
    entry.host = entry.slide?.querySelector(entry.config.host);
    if (!entry.host) entry.failed = true;
  }

  window.SFRMotion = {
    register(config) {
      const entry = { config, time: 0 };
      entries.push(entry);
      if (ready) { attach(entry); sync(); }
    },
  };

  function start() {
    deck = document.getElementById('deck');
    if (!deck) return;
    entries.forEach(attach);
    ready = true;
    const observer = new MutationObserver(sync);
    observer.observe(deck, { attributes: true, attributeFilter: ['class'] });
    deck.querySelectorAll('.slide').forEach(slide => observer.observe(slide, { attributes: true, attributeFilter: ['class'] }));
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', () => {
      entries.forEach(entry => {
        if (!entry.renderer || entry.failed) return;
        entry.renderer.setPixelRatio(pixelRatio());
        if (active(entry)) entry.renderer.render(entry.scene.scene, entry.scene.camera);
      });
    });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
