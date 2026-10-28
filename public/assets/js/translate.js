// Language switch: the site is written in English; other languages are translated in the browser by
// Google Translate (website translator element). The choice is kept in the "googtrans" cookie, so
// every page opens in the chosen language. The theme's language menu is rebuilt with these options.
(function () {
  var LANGS = [
    ["en", "English"], ["nl", "Nederlands"], ["de", "Deutsch"], ["fr", "Français"], ["es", "Español"], ["it", "Italiano"],
  ];
  function current() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-z-]+)/);
    return m ? m[1] : "en";
  }
  function setCookie(v) {
    var host = location.hostname;
    var exp = v ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    var val = v ? "/en/" + v : "";
    document.cookie = "googtrans=" + val + "; path=/" + exp;
    if (host.indexOf(".") !== -1) document.cookie = "googtrans=" + val + "; path=/; domain=." + host.replace(/^www\./, "") + exp;
  }
  function choose(code) {
    setCookie(code === "en" ? "" : code);
    location.reload();
  }
  window.yttSetLanguage = choose;

  var lang = current();

  // Rebuild every language menu (desktop top bar and mobile menu).
  document.querySelectorAll(".language-switcher").forEach(function (sw) {
    var flag = sw.querySelector(".selected-lang");
    var txt = sw.querySelector(".selected-lang-text");
    if (flag) flag.className = "selected-lang ts-flag-" + (lang === "en" ? "en" : lang);
    if (txt) txt.textContent = lang;
    var list = sw.querySelector(".language-switcher-wrapper > div");
    if (!list) return;
    list.innerHTML = LANGS.map(function (l) {
      return '<a href="#" data-lang="' + l[0] + '" class="flex items-center px-1 py-1.5 leading-[normal] hover:underline' + (l[0] === lang ? " font-bold" : "") + '"><span class="mr-2 text-base text-white ts-flag ts-flag-' + l[0] + '"></span> ' + l[1] + "</a>";
    }).join("");
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-lang]");
    if (!a) return;
    e.preventDefault();
    choose(a.getAttribute("data-lang"));
  });

  if (lang === "en") return;

  // Load Google's translator only when a language other than English is chosen.
  var holder = document.createElement("div");
  holder.id = "google_translate_element";
  holder.style.display = "none";
  document.body.appendChild(holder);
  window.yttTranslateInit = function () {
    new google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: LANGS.map(function (l) { return l[0]; }).join(","), autoDisplay: false }, "google_translate_element");
  };
  var s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=yttTranslateInit";
  s.async = true;
  document.head.appendChild(s);
})();
