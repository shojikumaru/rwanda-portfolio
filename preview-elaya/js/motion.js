// Shared motion layer (assets served from preview-v2/: vendor, globe, flow player, land data).
// v2 motion: section reveals + number count-up (GSAP ScrollTrigger), hero globe and the 06 flow player (both lazy).
// Everything here is progressive: without JS, without WebGL, or with reduced motion the page is the static v1 page.
(function () {
  var root = document.documentElement;
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = !!(mq && mq.matches);
  var base = document.baseURI;
  var tweens = [];
  var counters = [];

  /* ---------- reveals + counters ---------- */
  function initScroll() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (reduced || !gsap || !ST) return;
    gsap.registerPlugin(ST);
    root.classList.add("motion-ready");
    var ease = "power2.out";

    function reveal(targets, stagger) {
      ST.batch(targets, {
        start: "top 88%",
        once: true,
        onEnter: function (els) {
          els.forEach(function (el) { el.classList.add("is-revealing"); });
          tweens.push(gsap.to(els, {
            opacity: 1, y: 0, duration: 0.8, ease: ease, stagger: stagger || 0,
            onComplete: function () {
              gsap.set(els, { clearProps: "opacity,transform" });
              els.forEach(function (el) { el.classList.remove("is-revealing"); });
            }
          }));
        }
      });
    }
    var text = gsap.utils.toArray(".sec .kicker, .sec h2, .sec .sub, .trust-title");
    var groups = gsap.utils.toArray(".cards > *, .cards-3 > *, .products > *, .offers > *, .principles > div, .trust-grid figure, .skill-stats li, .journey li, .skill-grid > *, .behind-list li, .port, .ad-band, .voice");
    gsap.set(text, { opacity: 0, y: 16 });
    gsap.set(groups, { opacity: 0, y: 22 });
    reveal(text, 0.06);
    reveal(groups, 0.1);

    // Count-up: animate the first number in an element's first text node, then restore the exact original text.
    function counter(el, trigger, duration) {
      var node = null;
      for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\d/.test(n.nodeValue)) { node = n; break; }
      if (!node) return;
      var orig = node.nodeValue;
      var m = orig.match(/^([^\d]*)(\d+(?:\.\d+)?)([\s\S]*)$/);
      if (!m) return;
      var to = parseFloat(m[2]), dec = (m[2].split(".")[1] || "").length;
      var c = { el: el, node: node, orig: orig, v: 0 };
      counters.push(c);
      node.nodeValue = m[1] + (0).toFixed(dec) + m[3];
      el.classList.add("counting");
      c.tween = gsap.to(c, {
        v: to, duration: duration, ease: "power2.out",
        scrollTrigger: { trigger: trigger, start: "top bottom", once: true },
        onUpdate: function () { node.nodeValue = m[1] + c.v.toFixed(dec) + m[3]; },
        onComplete: function () { node.nodeValue = orig; el.classList.remove("counting"); }
      });
      tweens.push(c.tween);
    }
    document.querySelectorAll(".proof li, .skill-stats li").forEach(function (li) {
      li.querySelectorAll("b, .rwf").forEach(function (el) { counter(el, li.parentNode, 1.6); });
    });
    var bars = document.querySelector(".bars");
    if (bars) {
      document.querySelectorAll(".bar").forEach(function (bar, i) {
        bar.querySelectorAll("b, .rwf").forEach(function (el) { counter(el, bars, 1.2 + i * 0.15); });
        gsap.set(bar, { "--g": 0 });
        tweens.push(gsap.to(bar, {
          "--g": 1, duration: 1.2 + i * 0.15, ease: "power2.out",
          scrollTrigger: { trigger: bars, start: "top 90%", once: true },
          onComplete: function () { gsap.set(bar, { clearProps: "--g" }); }
        }));
      });
    }
  }

  // Reduced motion switched on mid-visit: jump everything to its final state.
  function finishAll() {
    tweens.forEach(function (t) { t.progress(1).kill(); });
    tweens = [];
    counters.forEach(function (c) { c.node.nodeValue = c.orig; c.el.classList.remove("counting"); });
    if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (s) { s.kill(); });
    if (window.gsap) window.gsap.set(".motion-ready [style]", { clearProps: "opacity,transform,--g" });
    root.classList.remove("motion-ready");
  }

  /* ---------- hero globe ---------- */
  var globe = null, globeLoading = false;
  function startGlobe() {
    if (reduced || globe || globeLoading) return;
    var hero = document.querySelector(".hero");
    if (!hero) return;
    globeLoading = true;
    import(new URL("../preview-v2/js/globe.js", base).href).then(function (mod) {
      globeLoading = false;
      if (reduced) return;
      globe = mod.createGlobe(hero, new URL("../preview-v2/data/land.json", base).href);
    }).catch(function () { globeLoading = false; });
  }
  function stopGlobe() {
    if (globe) { globe.dispose(); globe = null; }
  }
  function afterPaint(fn) {
    var go = function () { (window.requestIdleCallback || setTimeout)(fn, { timeout: 1200 }); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  }

  /* ---------- 06 flow player (Remotion) ---------- */
  function initFlow() {
    var sec = document.getElementById("rwanda");
    var det = sec && sec.querySelector("details.more");
    var ol = det && det.querySelector(".flow");
    if (!det || !ol || !("IntersectionObserver" in window)) return;
    var mod = null, ctl = null, box, stage, btn, played = false, inView = false, broken = false;

    function lang() { return root.getAttribute("data-lang") === "ja" ? "ja" : "en"; }
    // Visible text of a node in the current language (optionally without its <b> title).
    function txt(el, dropTitle) {
      var c = el.cloneNode(true);
      c.querySelectorAll('[lang]:not([lang="' + lang() + '"])' + (dropTitle ? ", b" : "")).forEach(function (x) { x.remove(); });
      return c.textContent.replace(/\s+/g, " ").trim();
    }
    function labels() {
      var li = ol.children, sp = li[2].children;
      return {
        a: txt(li[0]), b: txt(li[1]),
        c1: txt(sp[0].querySelector("b")), c1d: txt(sp[0], true),
        c2: txt(sp[1].querySelector("b")), c2d: txt(sp[1], true),
        d: txt(li[3])
      };
    }
    function fail() {
      broken = true;
      det.classList.remove("flow-live");
      if (box) box.remove();
      if (ctl) try { ctl.dispose(); } catch (e) {}
      ctl = null;
    }
    function maybePlay() {
      if (!ctl || played || !det.open || !inView) return;
      played = true;
      ctl.play();
    }
    function mount() {
      if (ctl || broken || !mod || !det.open || reduced) return;
      box = document.createElement("div");
      box.className = "flow-anim";
      stage = document.createElement("div");
      stage.className = "flow-stage";
      stage.setAttribute("aria-hidden", "true");
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flow-replay";
      btn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      box.appendChild(stage);
      box.appendChild(btn);
      ol.parentNode.insertBefore(box, ol);
      function label() { btn.setAttribute("aria-label", lang() === "ja" ? "もう一度再生" : "Replay"); }
      label();
      try {
        ctl = mod.mountFlow(stage, { labels: labels(), lang: lang(), onError: fail });
      } catch (e) { fail(); return; }
      det.classList.add("flow-live");
      btn.addEventListener("click", function () { if (ctl) ctl.play(); });
      new IntersectionObserver(function (es) {
        inView = es[es.length - 1].isIntersecting;
        maybePlay();
      }, { threshold: 0.45 }).observe(box);
      new MutationObserver(function () {
        if (!ctl) return;
        label();
        ctl.update({ labels: labels(), lang: lang() });
      }).observe(root, { attributes: true, attributeFilter: ["data-lang"] });
      var lastW = stage.clientWidth;
      new ResizeObserver(function () {
        var w = stage.clientWidth;
        if (ctl && w && Math.abs(w - lastW) > 8) { lastW = w; ctl.update({ W: w }); }
      }).observe(stage);
    }
    det.addEventListener("toggle", function () { mount(); maybePlay(); });
    var io = new IntersectionObserver(function (es) {
      if (!es[es.length - 1].isIntersecting || reduced) return;
      io.disconnect();
      import(new URL("../preview-v2/js/flow-player.js", base).href).then(function (m) {
        mod = m;
        mount();
        maybePlay();
      }).catch(function () {});
    }, { rootMargin: "800px 0px" });
    io.observe(sec);
    return {
      reduce: fail // back to the static list
    };
  }

  initScroll();
  var flow = reduced ? null : initFlow();
  if (!reduced) afterPaint(startGlobe);

  if (mq) {
    var onChange = function () {
      reduced = mq.matches;
      if (reduced) {
        finishAll();
        stopGlobe();
        if (flow) flow.reduce();
      } else {
        startGlobe();
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
  }
})();
