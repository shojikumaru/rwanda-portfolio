(function () {
  var root = document.documentElement;
  var titles = {
    en: "replus asia × Rwanda — AI operations for government | replus asia ltd.",
    ja: "replus asia × Rwanda — 政府の現場でAIを回す | replus asia ltd."
  };
  function setLang(lang) {
    if (lang !== "en" && lang !== "ja") lang = "en";
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    document.title = titles[lang];
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
    try { localStorage.setItem("lang", lang); } catch (e) {}
  }
  var q = new URLSearchParams(location.search).get("lang");
  var saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  setLang(q || saved || "en");
  document.querySelectorAll("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
  });
})();
document.querySelectorAll(".vid").forEach(function (box) {
  var btn = box.querySelector(".play-btn");
  btn.addEventListener("click", function () {
    var v = document.createElement("video");
    v.src = box.getAttribute("data-src");
    v.controls = true; v.playsInline = true; v.preload = "auto";
    v.poster = box.querySelector("img").getAttribute("src");
    box.innerHTML = ""; box.appendChild(v);
    v.play().catch(function () {});
    v.focus();
  });
});
document.querySelectorAll(".carousel").forEach(function (c) {
  var t = c.querySelector(".track");
  function step(d) { var card = t.querySelector(".voice"); t.scrollBy({ left: d * (card ? card.offsetWidth + 20 : 300), behavior: "smooth" }); }
  c.querySelector(".car-prev").addEventListener("click", function () { step(-1); });
  c.querySelector(".car-next").addEventListener("click", function () { step(1); });
});
// Scroll reveal for blocks the GSAP layer (js/motion.js) does not animate. Hidden only after JS opts in.
(function () {
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  if ((mq && mq.matches) || !("IntersectionObserver" in window)) return;
  var els = document.querySelectorAll(".portrait, .role, .tag-row, .regions, .partner, .chart, .about, .behind-title, .behind-sub, .logo-band, .car-nav, .contact-inner .btn");
  if (!els.length) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "100000px 0px -8% 0px" }); // huge top margin: blocks skipped by a fast scroll or nav jump count as seen
  els.forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  document.documentElement.classList.add("rv-ready");
  if (mq && mq.addEventListener) mq.addEventListener("change", function (e) {
    if (!e.matches) return;
    io.disconnect();
    els.forEach(function (el) { el.classList.add("rv-in"); });
  });
})();
// The Geist swap and late media shift the layout after ScrollTrigger measured it; re-measure so no reveal is left untriggered.
(function () {
  function refresh() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
})();
