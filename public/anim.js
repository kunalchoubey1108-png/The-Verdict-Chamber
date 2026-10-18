/* ==========================================================================
   NiveshOS — anim.js (Agent B)
   GSAP-driven entrances, chart draw-ins, count-ups and micro-interactions.
   Must never throw, even if app.js/data.js have not rendered anything yet.
   ========================================================================== */
(function () {
  'use strict';

  // -- reduced motion check FIRST, before any other setup ------------------
  var motionPreference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(motionPreference && motionPreference.matches);

  function readMotionMs(name, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var value = parseFloat(raw);
    if (!isFinite(value)) return fallback;
    return raw.indexOf('ms') !== -1 ? value / 1000 : value;
  }

  var motion = {
    fast: readMotionMs('--motion-fast', 0.13),
    base: readMotionMs('--motion-base', 0.18),
    overlay: readMotionMs('--motion-overlay', 0.26),
    enter: readMotionMs('--motion-enter', 0.3),
    stagger: readMotionMs('--motion-stagger', 0.036)
  };

  if (motionPreference && motionPreference.addEventListener) {
    motionPreference.addEventListener('change', function (event) {
      reduced = event.matches;
    });
  }

  var hasGsap = typeof window.gsap !== 'undefined';
  var hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap) {
    gsap.config({ nullTargetWarn: false });
    gsap.defaults({ duration: motion.enter, ease: 'power2.out' });
    // Keep tweens wall-clock based: without this, a throttled/backgrounded tab
    // freezes animations mid-flight instead of letting them complete.
    gsap.ticker.lagSmoothing(0);
  }

  function safe(fn) {
    try { fn(); } catch (err) {
      if (window.console && console.warn) console.warn('[anim.js]', err);
    }
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  // ---------------------------------------------------------------------
  // KPI count-ups: .countup[data-value], ₹ en-IN formatting by default
  // ---------------------------------------------------------------------
  var inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  function formatCountValue(el, val) {
    var prefix = el.hasAttribute('data-prefix') ? el.getAttribute('data-prefix') : '₹';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals'), 10);
    if (isNaN(decimals)) decimals = 0;
    var fmt = decimals > 0
      ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : inrFmt;
    var sign = val < 0 ? '-' : '';
    return sign + prefix + fmt.format(Math.abs(val)) + suffix;
  }

  function countUp(el) {
    var raw = el.getAttribute('data-value');
    if (raw === null) return;
    var target = parseFloat(raw);
    if (isNaN(target)) return;

    if (reduced || !hasGsap) {
      el.textContent = formatCountValue(el, target);
      return;
    }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: motion.enter + 0.05,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: function () { el.textContent = formatCountValue(el, obj.v); },
      onComplete: function () { el.textContent = formatCountValue(el, target); }
    });
  }

  function runCountUps(root) {
    safe(function () {
      $all('.countup', root).forEach(countUp);
    });
  }

  // ---------------------------------------------------------------------
  // Chart draw-ins: .anim-bar (scaleX/scaleY), .anim-line (stroke-dash),
  // .anim-donut (stroke-dashoffset). Triggered on niveshos:rendered + panelchange.
  // ---------------------------------------------------------------------
  function drawBars(root) {
    safe(function () {
      var bars = $all('.anim-bar', root);
      if (!bars.length) return;
      var xBars = [], yBars = [];
      bars.forEach(function (bar) {
        var dir = bar.getAttribute('data-grow') === 'x' ? 'x' : 'y';
        bar.style.transformOrigin = dir === 'x' ? 'left center' : 'bottom center';
        (dir === 'x' ? xBars : yBars).push(bar);
      });
      if (reduced || !hasGsap) return;
      if (xBars.length) gsap.from(xBars, { scaleX: 0, duration: motion.enter + 0.12, ease: 'power2.inOut', stagger: 0.035, overwrite: 'auto' });
      if (yBars.length) gsap.from(yBars, { scaleY: 0, duration: motion.enter + 0.12, ease: 'power2.inOut', stagger: 0.035, overwrite: 'auto' });
    });
  }

  function drawLines(root) {
    safe(function () {
      var lines = $all('.anim-line', root);
      lines.forEach(function (line) {
        if (typeof line.getTotalLength !== 'function') return;
        var len;
        try { len = line.getTotalLength(); } catch (e) { return; }
        if (!len) return;
        if (reduced || !hasGsap) return;
        gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(line, { strokeDashoffset: 0, duration: motion.enter + 0.12, ease: 'power2.inOut', overwrite: 'auto' });
      });
    });
  }

  function drawDonut(root) {
    safe(function () {
      var segs = $all('.anim-donut', root);
      if (!segs.length || reduced || !hasGsap) return;
      segs.forEach(function (seg) {
        var dasharray = seg.getAttribute('stroke-dasharray');
        if (!dasharray) return;
        var parts = dasharray.split(/[\s,]+/).map(function (n) { return parseFloat(n) || 0; });
        var segLen = parts[0];
        var rest = parts.slice(1).join(' ');
        var finalValue = rest ? (segLen + ' ' + rest) : String(segLen);
        gsap.fromTo(seg,
          { strokeDasharray: '0 ' + (rest || '1000') },
          { strokeDasharray: finalValue, duration: motion.enter + 0.12, ease: 'power2.inOut', overwrite: 'auto' }
        );
      });
    });
  }

  function runChartAnimations(root) {
    drawBars(root);
    drawLines(root);
    drawDonut(root);
  }

  // ---------------------------------------------------------------------
  // Panel-internal below-fold reveal (ScrollTrigger, no scroll-jacking)
  // ---------------------------------------------------------------------
  var scrollTriggerRegistered = false;
  function initScrollReveal(root) {
    safe(function () {
      if (reduced || !hasGsap || !hasScrollTrigger) return;
      if (!scrollTriggerRegistered) { gsap.registerPlugin(ScrollTrigger); scrollTriggerRegistered = true; }
      var items = $all('.account-card, .product-card, .lesson-card', root);
      items.forEach(function (el) {
        if (el.dataset.scrollRevealed) return;
        el.dataset.scrollRevealed = '1';
        gsap.fromTo(el, { autoAlpha: 0, y: 16 }, {
          autoAlpha: 1, y: 0, duration: motion.enter, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 95%', once: true }
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  // Panel entrance: direct-child stagger, 0.06s
  // ---------------------------------------------------------------------
  function animatePanelChildren(panelEl) {
    safe(function () {
      if (!panelEl) return;
      var children = Array.prototype.slice.call(panelEl.children);
      if (!children.length || reduced || !hasGsap) return;
      gsap.fromTo(children,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: motion.enter, ease: 'power2.out', stagger: { amount: Math.min(0.2, motion.stagger * children.length) }, overwrite: 'auto' }
      );
    });
  }

  function getPanelEl(name) {
    if (name) return document.getElementById('panel-' + name);
    return document.querySelector('.panel.active');
  }

  // ---------------------------------------------------------------------
  // Initial load entrance: sidebar + first active panel
  // ---------------------------------------------------------------------
  function initialEntrance() {
    safe(function () {
      var sidebar = document.getElementById('sidebar');
      var activePanel = document.querySelector('.panel.active');
      if (reduced || !hasGsap) return;
      var tl = gsap.timeline({ defaults: { duration: motion.enter, ease: 'power2.out' } });
      if (sidebar) tl.from(sidebar, { autoAlpha: 0, x: -16 }, 0);
      if (activePanel) {
        var children = Array.prototype.slice.call(activePanel.children);
        if (children.length) tl.from(children, { autoAlpha: 0, y: 12, stagger: { amount: Math.min(0.2, motion.stagger * children.length) } }, 0.06);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Micro-interactions: card hover lift + button/chip/nav press (transform only)
  // ---------------------------------------------------------------------
  var LIFT_SELECTOR = '.card-hoverable, .product-card, .lesson-card';
  function attachMicroInteractions() {
    if (reduced || !hasGsap) return;

    document.addEventListener('pointerenter', function (e) {
      var el = e.target && e.target.closest && e.target.closest(LIFT_SELECTOR);
      if (el) gsap.to(el, { y: -2, duration: motion.base, ease: 'power2.out', overwrite: 'auto' });
    }, true);

    document.addEventListener('pointerleave', function (e) {
      var el = e.target && e.target.closest && e.target.closest(LIFT_SELECTOR);
      if (el) gsap.to(el, { y: 0, duration: motion.base, ease: 'power2.out', overwrite: 'auto' });
    }, true);

  }

  // ---------------------------------------------------------------------
  // Toast slide-in: auto-animate any node appended to #toast-root
  // ---------------------------------------------------------------------
  function observeToasts() {
    safe(function () {
      var root = document.getElementById('toast-root');
      if (!root || typeof MutationObserver === 'undefined') return;
      var mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (node) {
            if (node.nodeType === 1) {
              safe(function () {
                if (reduced || !hasGsap) return;
                gsap.from(node, { x: 20, autoAlpha: 0, duration: motion.enter, ease: 'power2.out' });
              });
            }
          });
        });
      });
      mo.observe(root, { childList: true });
    });
  }

  // ---------------------------------------------------------------------
  // Modal scale-fade: animate .modal-card whenever #modal-root becomes visible
  // ---------------------------------------------------------------------
  function observeModal() {
    safe(function () {
      var root = document.getElementById('modal-root');
      if (!root || typeof MutationObserver === 'undefined') return;
      var mo = new MutationObserver(function () {
        safe(function () {
          if (root.hasAttribute('hidden')) return;
          var card = root.querySelector('.modal-card');
          if (!card || card.dataset.animShown) return;
          card.dataset.animShown = '1';
          if (reduced || !hasGsap) return;
          gsap.from(card, { scale: 0.98, y: 6, autoAlpha: 0, duration: motion.overlay, ease: 'power2.out' });
        });
      });
      mo.observe(root, { attributes: true, attributeFilter: ['hidden'], childList: true });
    });
  }

  // reset the "already shown" flag whenever the modal is hidden again, so the
  // next open re-animates
  function observeModalReset() {
    safe(function () {
      var root = document.getElementById('modal-root');
      if (!root) return;
      var mo = new MutationObserver(function () {
        if (root.hasAttribute('hidden')) {
          var card = root.querySelector('.modal-card');
          if (card) delete card.dataset.animShown;
        }
      });
      mo.observe(root, { attributes: true, attributeFilter: ['hidden'] });
    });
  }

  // ---------------------------------------------------------------------
  // Event wiring — all listeners are null-safe
  // ---------------------------------------------------------------------
  window.addEventListener('panelchange', function (e) {
    safe(function () {
      var name = e && e.detail && e.detail.panel;
      var panelEl = getPanelEl(name);
      if (!panelEl) return;
      animatePanelChildren(panelEl);
      runChartAnimations(panelEl);
      runCountUps(panelEl);
      initScrollReveal(panelEl);
    });
  });

  window.addEventListener('niveshos:rendered', function () {
    safe(function () {
      runCountUps(document);
      var activePanel = document.querySelector('.panel.active');
      if (activePanel) {
        runChartAnimations(activePanel);
        initScrollReveal(activePanel);
      }
    });
  });

  window.addEventListener('niveshos:lesson-complete', function (e) {
    safe(function () {
      if (reduced || !hasGsap) return;
      var id = e && e.detail && (e.detail.lessonId || e.detail.id);
      var card = id ? document.querySelector('[data-lesson-id="' + id + '"]') : null;
      if (!card) return;
      gsap.fromTo(card, { scale: 1 }, { scale: 1.025, duration: motion.base, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
    });
  });

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  initialEntrance();
  runCountUps(document);
  attachMicroInteractions();
  observeToasts();
  observeModal();
  observeModalReset();
  safe(function () {
    var activePanel = document.querySelector('.panel.active');
    if (activePanel) initScrollReveal(activePanel);
  });

})();
