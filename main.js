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
