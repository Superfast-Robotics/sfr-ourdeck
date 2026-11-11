/* Choreography decorates the existing deck; it never rewrites slide copy. */
(() => {
  'use strict';
  const reveal = (selector, interval = 0.09, start = 0.07, className = 'motion-reveal') => {
    document.querySelectorAll('.slide').forEach(slide => {
      slide.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add(className);
        element.style.setProperty('--enter-delay', `${start + index * interval}s`);
      });
    });
  };
  function init() {
    reveal('.cover-copy h1, .cover-copy>p, .slide-title, .bottom-line, .success-label, .success-number, .success-copy, .thor-price, .duty-cycle, .economics-takeaway, .solution-copy, .section-kicker, .origin-main, .origin-history>div, .benchmark-head, .benchmark-column, .evidence-copy, .trials-heading, .systems-title, .systems-stack>div, .orin-target, .closing-slide>h2, .closing-contact, .closing-site');
    reveal('.industry-films>figure, .factory-film, .evidence-video', 0.14, 0.12, 'motion-image-reveal');
    reveal('.cover-film, .closing-film', 0, 0, 'motion-film-reveal');
    reveal('.trial-card', 0.027, 0.12, 'motion-image-reveal');
    reveal('.binary-target', 0, 0.55);

    const systems = document.getElementById('slide-11');
    if (systems) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 190 270');
      svg.setAttribute('class', 'system-signal-routes');
      svg.setAttribute('aria-hidden', 'true');
      ['M0 52 H72 Q92 52 92 72 V118 Q92 138 112 138 H190', 'M0 138 H190', 'M0 224 H72 Q92 224 92 204 V158 Q92 138 112 138 H190'].forEach((shape, index) => {
        for (const className of ['route-base', 'route-flow']) {
          const path = document.createElementNS(ns, 'path');
          path.setAttribute('d', shape);
          path.setAttribute('class', className);
          path.setAttribute('pathLength', '100');
          path.style.setProperty('--route-duration', `${[4.2, 2.8, 1.4][index]}s`);
          svg.append(path);
        }
      });
      systems.append(svg);
      systems.classList.add('has-signal-routes');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
