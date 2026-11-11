/* Superfast Robotics pitch deck. Plain HTML, no build step. */
(() => {
  "use strict";

  function init() {
    const deck = document.getElementById("deck");
    if (!deck) return;

    const slides = Array.from(deck.querySelectorAll(".slide"));
    if (!slides.length) return;

    const $ = (id) => document.getElementById(id);
    const controls = {
      previous: $("prev-slide"), next: $("next-slide"),
      fullscreen: $("fullscreen"),
      overview: $("toggle-overview"), motion: $("toggle-motion"),
    };
    const overview = $("overview");
    const viewport = $("viewport");
    const navigation = deck.querySelector(".deck-controls");
    const navigationAnchor = navigation?.nextSibling;
    const status = $("status");
    const baseTitle = document.title;
    const manuallyPaused = new WeakSet();
    const pendingPlays = new WeakMap();
    const warmedVideos = new WeakSet();
    const failedVideos = new WeakSet();
    // This presentation opens playing; Pause/P is the explicit opt-out.
    let motionPaused = false;
    let current = readHash();
    let openPanel = null;
    let returnFocus = null;
    let touchStart = null;
    let resizeFrame = 0;
    let warmTimer = 0;
    let warmGeneration = 0;
    let clearWarmListeners = () => {};

    const announce = (message) => { if (status) status.textContent = message; };
    const activeSlide = () => slides[current];
    const videoIsActive = (video) => activeSlide().contains(video);
    const shouldPlay = (video) => videoIsActive(video) && video.hasAttribute("data-autoplay") &&
      !motionPaused && !document.hidden && !manuallyPaused.has(video) && !failedVideos.has(video);

    function warmVideo(video) {
      if (warmedVideos.has(video) || failedVideos.has(video)) return;
      if (!video.getAttribute("src") && !video.querySelector("source[src]")) return;
      warmedVideos.add(video);
      video.preload = "auto";
      // Changing preload is sufficient for a video that is already loading.
      // Never reset an existing buffer or the presenter's playback position.
      if (video.readyState === 0 && video.networkState !== 2) video.load();
    }

    function scheduleNeighborMedia() {
      clearTimeout(warmTimer);
      clearWarmListeners();
      const generation = ++warmGeneration;
      if (document.hidden || motionPaused) return;
      const activeVideos = [...activeSlide().querySelectorAll("video")].filter(v => !failedVideos.has(v));
      const activeBufferReady = () => activeVideos.every(video => {
        if (failedVideos.has(video)) return true;
        if (video.readyState < 3) return false;
        for (let range = 0; range < video.buffered.length; range += 1) {
          if (video.buffered.start(range) > video.currentTime + .05 || video.buffered.end(range) < video.currentTime) continue;
          const end = video.buffered.end(range);
          const bufferedSeconds = (end - video.currentTime) / Math.max(video.playbackRate, .1);
          return bufferedSeconds >= 4 || (Number.isFinite(video.duration) && end >= video.duration - .05);
        }
        return false;
      });
      const nextVideos = slides.slice(current + 1).flatMap(slide => [...slide.querySelectorAll("video")])
        .filter(video => !failedVideos.has(video)).slice(0, 2);
      const valid = () => generation === warmGeneration && !document.hidden && !motionPaused;
      function prime(index) {
        if (!valid() || index >= nextVideos.length) return;
        const video = nextVideos[index];
        const next = () => {
          clearWarmListeners();
          if (valid()) warmTimer = setTimeout(() => prime(index + 1), 300);
        };
        if (video.readyState >= 3 || failedVideos.has(video)) { next(); return; }
        // A canplay event only promises a few frames. Protect several seconds
        // of current playback before another download shares the connection.
        // Poll because progress need not produce another canplay event.
        if (!warmedVideos.has(video) && !activeBufferReady()) {
          warmTimer = setTimeout(() => prime(index), 250);
          return;
        }
        video.addEventListener("canplay", next, { once:true });
        video.addEventListener("error", next, { once:true });
        clearWarmListeners = () => {
          video.removeEventListener("canplay", next);
          video.removeEventListener("error", next);
          clearWarmListeners = () => {};
        };
        warmVideo(video);
      }
      // Give the current slide first use of the connection; then prepare only
      // the next two video elements, one at a time rather than the whole deck.
      warmTimer = setTimeout(() => prime(0), activeVideos.length ? 300 : 500);
    }

    function fit() {
      const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 700;
      viewport.classList.toggle("touch-navigation", mobile);
      // Keep touch targets in screen pixels instead of shrinking with the slide.
      if (navigation && mobile && navigation.parentElement !== viewport) viewport.append(navigation);
      else if (navigation && !mobile && navigation.parentElement !== deck) deck.insertBefore(navigation, navigationAnchor);
      const navigationSpace = mobile && navigation ? navigation.offsetHeight + 24 : 0;
      const scale = Math.min(window.innerWidth / 1600, Math.max(1, window.innerHeight - navigationSpace) / 900);
      document.documentElement.style.setProperty("--scale", String(scale));
      deck.style.setProperty("--scale", String(scale));
      deck.style.top = mobile ? `calc(50% - ${navigationSpace / 2}px)` : "50%";
      resizeFrame = 0;
    }

    function sourceLink(url) {
      if (!url) return null;
      try {
        const resolved = new URL(url, document.baseURI);
        if (!/^https?:$/.test(resolved.protocol)) return null;
        const link = document.createElement("a");
        link.href = resolved.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Watch the official demo";
        return link;
      } catch (_) { return null; }
    }

    function mediaStatus(video, message, includeSource = false) {
      const frame = video.closest(".media-frame, .trial-card") || video.parentElement;
      if (!frame) return;
      let notice = frame.querySelector("[data-media-status]");
      if (!notice) {
        notice = document.createElement("p");
        notice.className = "media-status";
        notice.dataset.mediaStatus = "";
        notice.setAttribute("role", "status");
        frame.append(notice);
      }
      notice.replaceChildren();
      notice.hidden = !message;
      if (!message) return;
      notice.append(document.createTextNode(message));
      const link = includeSource && sourceLink(video.dataset.sourceUrl);
      if (link) notice.append(document.createTextNode(" "), link);
    }

    function videoButton(video) {
      const frame = video.closest(".media-frame, .trial-card") || video.parentElement;
      return frame && frame.querySelector(".media-play");
    }

    function reflectVideo(video) {
      const playing = !video.paused && !video.ended;
      const frame = video.closest(".media-frame, .trial-card") || video.parentElement;
      if (frame) {
        frame.classList.toggle("is-playing", playing);
        frame.classList.toggle("is-paused", !playing);
      }
      const button = videoButton(video);
      if (!button) return;
      button.dataset.state = playing ? "playing" : "paused";
      button.setAttribute("aria-label", playing ? "Pause video" : "Play video");
      button.setAttribute("aria-pressed", String(playing));
      button.textContent = playing ? "Ⅱ" : "▶";
    }

    function playVideo(video) {
      if (failedVideos.has(video) || pendingPlays.has(video) || (!video.paused && !video.ended)) return;
      if (!video.currentSrc && !video.getAttribute("src") && !video.querySelector("source[src]")) return;
      warmVideo(video);
      video.muted = true;
      video.playbackRate = Number(video.dataset.playbackRate) || 1;
      const result = video.play();
      if (result && typeof result.then === "function") {
        let aborted = false;
        const pending = result.then(() => {
          // A play request can resolve after the presenter has moved on.
          if (!shouldPlay(video)) video.pause();
          else mediaStatus(video, "");
          reflectVideo(video);
        }).catch((error) => {
          aborted = error.name === "AbortError";
          if (error.name === "AbortError" || !videoIsActive(video)) return;
          if (failedVideos.has(video)) return;
          if (error.name === "NotAllowedError") mediaStatus(video, "Press play to start the video.");
          else mediaStatus(video, "Video unavailable.", true);
          reflectVideo(video);
        }).finally(() => {
          if (pendingPlays.get(video) !== pending) return;
          pendingPlays.delete(video);
          // A rapid away/back navigation may abort the old play request after
          // the new slide sync. Resume only if it is still explicitly wanted.
          if (aborted && shouldPlay(video)) playVideo(video);
        });
        pendingPlays.set(video, pending);
      }
    }

    function syncMedia() {
      deck.classList.toggle("document-hidden", document.hidden);
      deck.querySelectorAll("video").forEach((video) => {
        if (videoIsActive(video)) warmVideo(video);
        if (shouldPlay(video)) {
          playVideo(video);
        } else {
          video.pause();
          reflectVideo(video);
        }
      });
      deck.querySelectorAll("img[data-animated-src]").forEach((image) => {
        const running = activeSlide().contains(image) && !motionPaused && !document.hidden &&
          !image.closest('.has-live-motion, .has-wall-video');
        const source = running ? image.dataset.animatedSrc : image.dataset.stillSrc;
        if (source && image.getAttribute("src") !== source) image.src = source;
        image.dataset.motionState = running ? "playing" : "paused";
      });
      scheduleNeighborMedia();
    }

    function setMotion(paused) {
      motionPaused = paused;
      deck.classList.toggle("motion-paused", paused);
      deck.classList.toggle("motion-enabled", !paused);
      if (controls.motion) {
        controls.motion.setAttribute("aria-pressed", String(paused));
        controls.motion.setAttribute("aria-label", paused ? "Resume motion (P)" : "Pause motion (P)");
        controls.motion.title = paused ? "Resume motion (P)" : "Pause motion (P)";
        controls.motion.dataset.state = paused ? "paused" : "playing";
        controls.motion.textContent = paused ? "▶" : "Ⅱ";
      }
      syncMedia();
    }

    function buildTrialGrid() {
      const grid = $("trial-grid");
      if (!grid || !Array.isArray(window.PITCH_TRIALS)) return;
      grid.replaceChildren();
      const useWall = Boolean(window.PITCH_MEDIA?.trials?.src);
      if (useWall) {
        const wall = document.createElement("video");
        wall.className = "trial-wall-video";
        wall.dataset.media = "trials";
        wall.dataset.autoplay = "";
        wall.muted = true;
        wall.loop = true;
        wall.playsInline = true;
        wall.preload = "none";
        wall.setAttribute("aria-label", "18 simultaneous robot evaluation rollouts");
        wall.addEventListener("loadeddata", () => {
          if (!failedVideos.has(wall)) grid.classList.add("wall-ready");
        });
        wall.addEventListener("error", () => {
          failedVideos.add(wall);
          wall.pause();
          wall.hidden = true;
          grid.classList.remove("has-wall-video", "wall-ready");
          syncMedia();
        });
        grid.classList.add("has-wall-video");
        grid.prepend(wall);
      }
      window.PITCH_TRIALS.forEach((item, index) => {
        const figure = document.createElement("figure");
        figure.className = "trial-card";
        figure.dataset.index = String(index + 1);
        const isVideo = !useWall && (item.type === "video" || /\.(mp4|webm|mov)(?:[?#]|$)/i.test(item.src || ""));
        const media = document.createElement(isVideo ? "video" : "img");
        if (item.src && (isVideo || !item.poster)) media.src = item.src;
        if (isVideo) {
          media.muted = true;
          media.loop = true;
          media.playsInline = true;
          media.preload = "none";
          media.dataset.autoplay = "";
          media.setAttribute("aria-label", item.alt || item.label || `Trial setup ${index + 1}`);
          if (item.poster) media.poster = item.poster;
        } else {
          if (item.poster && /\.(gif|webp)(?:[?#]|$)/i.test(item.src || "")) {
            media.src = item.poster;
            media.dataset.animatedSrc = item.src;
            media.dataset.stillSrc = item.poster;
          }
          media.alt = item.alt || item.label || `Trial setup ${index + 1}`;
          media.decoding = "async";
          media.loading = "lazy";
          media.width = 640;
          media.height = 360;
        }
        figure.append(media);
        if (item.label) {
          const caption = document.createElement("figcaption");
          caption.textContent = item.label;
          figure.append(caption);
        }
        grid.append(figure);
      });
    }

    function hydrateMedia() {
      const sources = window.PITCH_MEDIA || {};
      deck.querySelectorAll("video[data-media]").forEach((video) => {
        const source = sources[video.dataset.media];
        if (!source) return;
        video.preload = videoIsActive(video) ? "auto" : "none";
        if (source.src && video.getAttribute("src") !== source.src) video.src = source.src;
        if (source.poster) video.poster = source.poster;
        if (source.sourceUrl) video.dataset.sourceUrl = source.sourceUrl;
        if (source.title) video.setAttribute("aria-label", source.title);
        if (!source.src) mediaStatus(video, "Open the source to watch this demo.", true);
      });
      deck.querySelectorAll("video").forEach((video, index) => {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = videoIsActive(video) ? "auto" : "none";
        video.defaultPlaybackRate = Number(video.dataset.playbackRate) || 1;
        video.playbackRate = video.defaultPlaybackRate;
        if (!video.id) video.id = `pitch-video-${index + 1}`;
        const frame = video.closest(".media-frame");
        let button = videoButton(video);
        // The trial wall stays visually quiet; its clips follow the motion control.
        if (!button && frame) {
          button = document.createElement("button");
          button.type = "button";
          button.className = "media-play";
          button.dataset.generated = "true";
          frame.append(button);
        }
        if (button) {
          button.setAttribute("aria-controls", video.id);
          button.addEventListener("click", () => {
            if (video.paused || video.ended) {
              manuallyPaused.delete(video);
              if (motionPaused) setMotion(false);
              playVideo(video);
            } else {
              manuallyPaused.add(video);
              video.pause();
            }
            reflectVideo(video);
          });
        }
        video.addEventListener("play", () => reflectVideo(video));
        video.addEventListener("pause", () => reflectVideo(video));
        video.addEventListener("error", () => {
          if (video.dataset.media !== "trials") {
            failedVideos.add(video);
            mediaStatus(video, "Video unavailable.", true);
            if (videoIsActive(video)) scheduleNeighborMedia();
          }
        });
        video.addEventListener("loadeddata", () => mediaStatus(video, ""));
        for (const event of ["canplay", "playing"]) video.addEventListener(event, () => {
          if (videoIsActive(video)) scheduleNeighborMedia();
        });
        reflectVideo(video);
      });
    }

    function closePanel(restoreFocus = true) {
      if (!openPanel) return;
      if (typeof openPanel.close === "function" && openPanel.open) openPanel.close();
      openPanel.hidden = true;
      openPanel.setAttribute("aria-hidden", "true");
      controls.overview?.setAttribute("aria-expanded", "false");
      openPanel = null;
      if (viewport) viewport.inert = false;
      if (restoreFocus && returnFocus?.isConnected && !returnFocus.closest("[inert]")) returnFocus.focus();
      returnFocus = null;
    }

    function togglePanel(panel, trigger) {
      if (!panel) return;
      if (openPanel === panel) { closePanel(); return; }
      closePanel(false);
      returnFocus = trigger || document.activeElement;
      openPanel = panel;
      if (viewport) viewport.inert = true;
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      if (panel.tagName === "DIALOG" && typeof panel.showModal === "function") panel.showModal();
      trigger?.setAttribute("aria-expanded", "true");
      const focusTarget = panel.querySelector("[autofocus], button, a[href], [tabindex='0']");
      if (focusTarget) focusTarget.focus();
    }

    function goTo(index, writeHash = true) {
      const next = Math.max(0, Math.min(slides.length - 1, index));
      const oldSlide = activeSlide();
      const focusWasInSlide = oldSlide.contains(document.activeElement);
      current = next;
      slides.forEach((slide, position) => {
        const active = position === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.inert = !active;
      });
      deck.classList.toggle("light-slide", activeSlide().classList.contains("solution-slide"));
      if ($("current-slide")) $("current-slide").textContent = String(current + 1).padStart(2, "0");
      if ($("total-slides")) $("total-slides").textContent = String(slides.length).padStart(2, "0");
      if ($("progress-fill")) $("progress-fill").style.width = `${(current + 1) / slides.length * 100}%`;
      if (controls.previous) controls.previous.disabled = current === 0;
      if (controls.next) controls.next.disabled = current === slides.length - 1;
      $("overview-list")?.querySelectorAll("button").forEach((button, position) => {
        button.classList.toggle("is-current", position === current);
        if (position === current) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      if (writeHash) {
        try { history.replaceState(null, "", `#${current + 1}`); }
        catch (_) { window.location.hash = String(current + 1); }
      }
      const title = activeSlide().dataset.title || `Slide ${current + 1}`;
      document.title = `${title} — ${baseTitle}`;
      syncMedia();
      if (focusWasInSlide && oldSlide !== activeSlide()) {
        activeSlide().tabIndex = -1;
        activeSlide().focus({ preventScroll: true });
      }
      announce(`Slide ${current + 1} of ${slides.length}. ${title}`);
    }

    function readHash() {
      const match = window.location.hash.match(/^#(?:slide-)?(\d+)$/);
      return match ? Math.min(slides.length - 1, Math.max(0, Number(match[1]) - 1)) : 0;
    }

    function buildOverview() {
      const list = $("overview-list");
      if (!list) return;
      list.replaceChildren();
      slides.forEach((slide, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "overview-item";
        const number = document.createElement("span");
        number.className = "overview-number";
        number.textContent = String(index + 1).padStart(2, "0");
        const title = document.createElement("span");
        title.className = "overview-title";
        title.textContent = slide.dataset.title || `Slide ${index + 1}`;
        button.append(number, title);
        button.addEventListener("click", () => { closePanel(); goTo(index); });
        list.append(button);
      });
    }

    async function fullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else announce("Fullscreen is unavailable in this browser. Use the browser's fullscreen command.");
      } catch (_) { announce("Could not enter fullscreen. Use the browser's fullscreen command."); }
    }

    controls.previous?.addEventListener("click", () => goTo(current - 1));
    controls.next?.addEventListener("click", () => goTo(current + 1));
    controls.fullscreen?.addEventListener("click", fullscreen);
    controls.overview?.addEventListener("click", () => togglePanel(overview, controls.overview));
    controls.motion?.addEventListener("click", () => setMotion(!motionPaused));
    $("close-overview")?.addEventListener("click", () => closePanel());
    [overview].filter(Boolean).forEach((panel) => {
      panel.addEventListener("cancel", (event) => { event.preventDefault(); closePanel(); });
      panel.addEventListener("click", (event) => {
        if (panel.tagName !== "DIALOG" || event.target !== panel) return;
        const rect = panel.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePanel();
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && openPanel) { event.preventDefault(); closePanel(); return; }
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (openPanel) {
        if (event.key === "Tab") {
          const items = Array.from(openPanel.querySelectorAll("button:not([disabled]), a[href], input, select, textarea, [tabindex='0']"))
            .filter((element) => !element.hidden && element.getClientRects().length);
          if (items.length) {
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }
        if (event.key.toLowerCase() === "o" && openPanel === overview) { event.preventDefault(); closePanel(); }
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, video, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if ((key === " " || key === "enter") && target?.closest("button, a[href], summary")) return;
      if (["arrowright", "arrowdown", "pagedown", " "].includes(key)) { event.preventDefault(); goTo(current + 1); }
      else if (["arrowleft", "arrowup", "pageup"].includes(key)) { event.preventDefault(); goTo(current - 1); }
      else if (key === "home") { event.preventDefault(); goTo(0); }
      else if (key === "end") { event.preventDefault(); goTo(slides.length - 1); }
      else if (key === "f") { event.preventDefault(); fullscreen(); }
      else if (key === "o") { event.preventDefault(); togglePanel(overview, controls.overview); }
      else if (key === "p") { event.preventDefault(); setMotion(!motionPaused); }
    });

    function beginSwipe(x, y, id, target) {
      touchStart = null;
      if (openPanel || !(target instanceof Element) || target.closest("button, a, input, select, textarea, summary, [role='button'], [contenteditable='true'], video[controls]")) return;
      touchStart = { x, y, id, slide:current, axis:null };
    }
    function moveSwipe(x, y, id, event) {
      if (!touchStart || touchStart.id !== id) return;
      const dx = Math.abs(x - touchStart.x);
      const dy = Math.abs(y - touchStart.y);
      if (!touchStart.axis && Math.max(dx, dy) >= 10) {
        if (dx > dy * 1.4) touchStart.axis = "x";
        else if (dy > dx) touchStart.axis = "y";
      }
      if (touchStart.axis === "x" && event.cancelable) event.preventDefault();
    }
    function finishSwipe(x, y, id, event) {
      if (!touchStart || touchStart.id !== id) return;
      const start = touchStart;
      touchStart = null;
      if (openPanel || start.slide !== current || start.axis === "y") return;
      const dx = x - start.x;
      const dy = y - start.y;
      const threshold = Math.min(64, Math.max(32, window.innerWidth * .09));
      if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
      if (event.cancelable) event.preventDefault();
      goTo(current + (dx < 0 ? 1 : -1));
    }
    // Touch Events avoid browser-specific pointer cancellation during scrolling.
    // Horizontal motion belongs to the deck; vertical motion and pinch remain native.
    if ("ontouchstart" in window) {
      viewport.addEventListener("touchstart", (event) => {
        if (event.touches.length !== 1) { touchStart = null; return; }
        const touch = event.touches[0];
        beginSwipe(touch.clientX, touch.clientY, touch.identifier, event.target);
      }, { passive:true });
      viewport.addEventListener("touchmove", (event) => {
        if (event.touches.length !== 1) { touchStart = null; return; }
        const touch = event.touches[0];
        moveSwipe(touch.clientX, touch.clientY, touch.identifier, event);
      }, { passive:false });
      viewport.addEventListener("touchend", (event) => {
        if (event.touches.length) { touchStart = null; return; }
        const touch = Array.from(event.changedTouches).find(item => item.identifier === touchStart?.id);
        if (touch) finishSwipe(touch.clientX, touch.clientY, touch.identifier, event);
        else touchStart = null;
      }, { passive:false });
      viewport.addEventListener("touchcancel", () => { touchStart = null; });
    } else if (window.PointerEvent) {
      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        if (!event.isPrimary) { touchStart = null; return; }
        beginSwipe(event.clientX, event.clientY, event.pointerId, event.target);
        if (touchStart) {
          try { viewport.setPointerCapture(event.pointerId); } catch (_) { /* capture is optional */ }
        }
      });
      viewport.addEventListener("pointermove", (event) => moveSwipe(event.clientX, event.clientY, event.pointerId, event));
      window.addEventListener("pointerup", (event) => finishSwipe(event.clientX, event.clientY, event.pointerId, event));
      window.addEventListener("pointercancel", () => { touchStart = null; });
    }
    window.addEventListener("blur", () => { touchStart = null; });
    window.addEventListener("hashchange", () => goTo(readHash(), false));
    window.addEventListener("resize", () => { if (!resizeFrame) resizeFrame = requestAnimationFrame(fit); });
    document.addEventListener("visibilitychange", syncMedia);
    document.addEventListener("fullscreenchange", () => {
      controls.fullscreen?.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
      controls.fullscreen?.setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen (F)" : "Fullscreen (F)");
      fit();
    });

    const matrix = $("compression-matrix");
    if (matrix) {
      for (let row = 0; row < 10; row += 1) {
        for (let column = 0; column < 10; column += 1) {
          const node = document.createElement("i");
          node.className = "matrix-node";
          node.style.setProperty("--row", row);
          node.style.setProperty("--col", column);
          node.style.setProperty("--delay", `${(row + column) * 0.025}s`);
          matrix.append(node);
        }
      }
    }
    buildTrialGrid();
    hydrateMedia();
    buildOverview();
    fit();
    setMotion(motionPaused);
    goTo(current);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
