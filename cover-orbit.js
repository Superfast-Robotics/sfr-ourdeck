/* Procedural interpretation of the supplied namecard mark: one tapered blue
   orbit and one concave four-point star. No image, network or GPU dependency. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const TILT = -18 * Math.PI / 180;
  const START = 2.75;
  const PERIOD = 10.5;
  const TRAIL = Math.PI * 1.48;
  const cosTilt = Math.cos(TILT);
  const sinTilt = Math.sin(TILT);

  function initOrbit({ slideId, width:WIDTH, height:HEIGHT, center:CENTER, radius:RADIUS }) {
    const slide = document.getElementById(slideId);
    const deck = document.getElementById('deck');
    if (!slide || !deck) return;
    const back = slide.querySelector('.cover-orbit-back');
    const front = slide.querySelector('.cover-orbit-front');
    if (!back || !front) return;
    const backContext = back.getContext('2d');
    const frontContext = front.getContext('2d');
    if (!backContext || !frontContext) return;
    const layers = [backContext, frontContext];
    let frame = 0;
    let last = 0;
    let time = 0;
    let ratio = 1;

    function point(angle, target = {}) {
      const x = RADIUS.x * Math.cos(angle);
      const y = RADIUS.y * Math.sin(angle);
      const dx = -RADIUS.x * Math.sin(angle);
      const dy = RADIUS.y * Math.cos(angle);
      const tx = dx * cosTilt - dy * sinTilt;
      const ty = dx * sinTilt + dy * cosTilt;
      const length = Math.hypot(tx, ty);
      target.x = CENTER.x + x * cosTilt - y * sinTilt;
      target.y = CENTER.y + x * sinTilt + y * cosTilt;
      target.nx = -ty / length;
      target.ny = tx / length;
      target.depth = Math.sin(angle);
      return target;
    }

    function splitPaths(points, draw) {
      // A shared endpoint at each depth crossing avoids a seam between layers.
      let group = [];
      let frontHalf;
      for (const p of points) {
        const nextHalf = p.depth >= 0;
        if (group.length && nextHalf !== frontHalf) {
          group.push(p);
          draw(layers[frontHalf ? 1 : 0], group, frontHalf);
          group = [p];
        } else group.push(p);
        frontHalf = nextHalf;
      }
      if (group.length > 1) draw(layers[frontHalf ? 1 : 0], group, frontHalf);
    }

    function path(context, points) {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
    }

    const guide = Array.from({ length:321 }, (_, i) => point(i / 320 * TAU));
    const guidePaths = [];
    splitPaths(guide, (context, points, near) => {
      const shape = new Path2D();
      shape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i].x, points[i].y);
      guidePaths.push({ context, shape, near });
    });
    const samples = Array.from({ length:221 }, (_, i) => ({
      progress:i / 220, taper:2.7 * Math.pow(i / 220, 1.7),
    }));
    const starSprite = document.createElement('canvas');
    const starContext = starSprite.getContext('2d');

    function prepareStar() {
      starSprite.width = starSprite.height = Math.round(96 * ratio);
      const context = starContext;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.translate(48, 48);
      const glow = context.createRadialGradient(0, 0, 1, 0, 0, 35);
      glow.addColorStop(0, 'rgba(93,130,255,.3)');
      glow.addColorStop(.35, 'rgba(77,113,255,.12)');
      glow.addColorStop(1, 'rgba(65,105,255,0)');
      context.fillStyle = glow;
      context.fillRect(-36, -36, 72, 72);
      context.beginPath();
      context.moveTo(0, -23);
      context.bezierCurveTo(2.3, -6, 4.4, -3.6, 21, 0);
      context.bezierCurveTo(4.4, 2.5, 2.2, 6, 0, 23);
      context.bezierCurveTo(-2.2, 6, -4.4, 3.6, -21, 0);
      context.bezierCurveTo(-4.4, -2.5, -2.3, -6, 0, -23);
      const face = context.createLinearGradient(-17, -19, 17, 21);
      face.addColorStop(0, '#a8c3ff');
      face.addColorStop(.44, '#7d9dff');
      face.addColorStop(1, '#4774f7');
      context.fillStyle = face;
      context.shadowColor = '#557eff';
      context.shadowBlur = 11;
      context.fill();
    }

    function star(context, p) {
      const scale = 0.74 + 0.24 * (p.depth + 1) / 2;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(TILT - 0.16 + Math.sin(time * 0.35) * 0.06);
      context.scale(scale, scale);
      context.drawImage(starSprite, -48, -48, 96, 96);
      context.restore();
    }

    function render() {
      for (const context of layers) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, WIDTH, HEIGHT);
      }
      // The faint complete silhouette keeps the brand orbit legible at every phase.
      for (const { context, shape, near } of guidePaths) {
        context.strokeStyle = near ? 'rgba(105,144,255,.19)' : 'rgba(105,144,255,.13)';
        context.lineWidth = .65;
        context.stroke(shape);
      }

      const angle = START + time / PERIOD * TAU;
      for (const p of samples) {
        point(angle - TRAIL * (1 - p.progress), p);
        p.width = .10 + p.taper * (1 + .16 * p.depth);
      }
      // A soft halo follows the ribbon, rather than filling the whole ellipse.
      splitPaths(samples, (context, points, near) => {
        context.save();
        path(context, points);
        context.lineCap = 'round';
        context.strokeStyle = `rgba(70,111,255,${near ? .07 : .035})`;
        context.lineWidth = 7;
        context.shadowColor = '#517cff';
        context.shadowBlur = 13;
        context.stroke();
        context.restore();
      });
      const head = samples[samples.length - 1];
      // Each half is one continuous ribbon, avoiding antialiased segment seams.
      splitPaths(samples, (context, points, near) => {
        context.save();
        context.beginPath();
        for (let i = 0; i < points.length; i += 1) {
          const p = points[i];
          const w = p.width;
          if (!i) context.moveTo(p.x + p.nx * w, p.y + p.ny * w);
          else context.lineTo(p.x + p.nx * w, p.y + p.ny * w);
        }
        for (let i = points.length - 1; i >= 0; i -= 1) {
          const p = points[i];
          const w = p.width;
          context.lineTo(p.x - p.nx * w, p.y - p.ny * w);
        }
        context.closePath();
        const color = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, 870);
        color.addColorStop(0, 'rgba(132,165,255,.98)');
        color.addColorStop(.48, 'rgba(106,147,255,.9)');
        color.addColorStop(1, 'rgba(79,123,255,.55)');
        context.globalAlpha = near ? 1 : .8;
        context.fillStyle = color;
        context.shadowColor = 'rgba(74,117,255,.55)';
        context.shadowBlur = 10;
        context.fill();
        context.restore();
      });
      star(layers[head.depth >= 0 ? 1 : 0], head);
    }

    function resize() {
      const displayScale = Math.min(innerWidth / 1600, innerHeight / 900);
      ratio = Math.max(.25, Math.min((window.devicePixelRatio || 1) * displayScale, 1.5));
      for (const canvas of [back, front]) {
        canvas.width = Math.round(WIDTH * ratio);
        canvas.height = Math.round(HEIGHT * ratio);
      }
      prepareStar();
      render();
    }

    const running = () => slide.classList.contains('is-active') && !deck.classList.contains('motion-paused') && !document.hidden;
    function tick(now) {
      frame = 0;
      if (!running()) { last = 0; return; }
      if (last) time += Math.min((now - last) / 1000, .08);
      last = now;
      render();
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      const play = running();
      back.dataset.motionState = front.dataset.motionState = play ? 'playing' : 'paused';
      if (play && !frame) { last = 0; frame = requestAnimationFrame(tick); }
      else if (!play && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    }
    resize();
    const observer = new MutationObserver(sync);
    observer.observe(deck, { attributes:true, attributeFilter:['class'] });
    observer.observe(slide, { attributes:true, attributeFilter:['class'] });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    sync();
  }

  function init() {
    // One mark frames the opening and closing, with room for the longer closing line.
    initOrbit({ slideId:'slide-1', width:960, height:650, center:{ x:435, y:265 }, radius:{ x:415, y:175 } });
    initOrbit({ slideId:document.querySelector('.closing-slide')?.id, width:1080, height:650, center:{ x:510, y:275 }, radius:{ x:490, y:180 } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
