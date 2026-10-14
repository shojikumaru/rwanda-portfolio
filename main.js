(function () {
  var root = document.documentElement;
  var titles = {
    en: "Sho Jikumaru — AI operations for government | re;plus asia",
    ja: "軸丸 翔 — 政府の現場でAIを回す | re;plus asia"
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
