// show-more-projects.js
// Maneja la lógica para mostrar/ocultar proyectos adicionales.
// Requiere un contenedor con id="extra-projects" y un botón con id por defecto "show-more-projects".

/* eslint-env browser */
/* global document, window */

export default function initShowMore(
  buttonId = 'show-more-projects',
  options = {}
) {
  const btn =
    typeof buttonId === 'string' ? document.getElementById(buttonId) : null;
  if (!btn) return;

  const target = document.getElementById(options.targetId || 'extra-projects');
  if (!target) return;

  const hiddenClass = options.hiddenClass || 'hidden';

  btn.addEventListener('click', () => {
    const isHidden = target.classList.contains(hiddenClass);
    if (isHidden) {
      target.classList.remove(hiddenClass);
      btn.setAttribute('aria-expanded', 'true');
      if (options.onShow) options.onShow();
      // Inicializar sliders que estén dentro del contenedor extra cuando se muestren
      // Ensure slider init function is available. If not, inject module script from /js/slider/slider-client.js
      (function ensureAndInitSliders() {
        function runInit(initSliderFn) {
          const sliders = Array.from(
            target.querySelectorAll('[id^="slider-"]')
          );
          sliders.forEach((el) => {
            try {
              if (el.dataset.sliderInitialized === 'true') return;
              initSliderFn(el.id || el);
              el.dataset.sliderInitialized = 'true';
            } catch {
              // noop
            }
          });
        }

        if (typeof window !== 'undefined' && window.initSlider) {
          runInit(window.initSlider);
          return;
        }

        // Inject module script and wait for it to load
        const existing = document.querySelector('script[data-slider-module]');
        if (existing) {
          existing.addEventListener('load', () => {
            if (window.initSlider) runInit(window.initSlider);
          });
          return;
        }

        const script = document.createElement('script');
        script.type = 'module';
        script.src = '/js/slider/slider-client.js';
        script.setAttribute('data-slider-module', '');
        script.addEventListener('load', () => {
          if (window.initSlider) runInit(window.initSlider);
        });
        script.addEventListener('error', () => {
          // noop
        });
        document.head.appendChild(script);
      })();
    } else {
      target.classList.add(hiddenClass);
      btn.setAttribute('aria-expanded', 'false');
      if (options.onHide) options.onHide();
    }
  });
}

// Expose for non-bundled usage when loaded via <script type="module" src="/js/show-more/show-more-projects.js">
try {
  if (typeof window !== 'undefined') {
    window.initShowMore = initShowMore;
  }
} catch {
  // noop
}
