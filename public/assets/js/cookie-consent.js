// Cookie consent + Google Analytics 4 for the static site.
// GA4 (window.YTT_ANALYTICS.ga4) is only loaded after the visitor clicks "Accept" (basic consent
// mode: nothing is sent to Google before that). The choice is remembered in localStorage
// ("ytt-consent") for 12 months; any link with [data-cookie-settings] opens the banner again.
// Vercel Web Analytics is cookieless and runs independently of this banner.
(function () {
  var cfg = window.YTT_ANALYTICS || {};
  var KEY = "ytt-consent";
  var MAX_AGE = 365 * 24 * 3600 * 1000;
  // Only measure on the live domain, never on localhost or preview deployments.
  var LIVE = /(^|\.)yourtanzaniatrip\.com$/.test(location.hostname);

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      return v && Date.now() - v.t < MAX_AGE ? v.c : null;
    } catch (e) { return null; }
  }
  function save(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ c: choice, t: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  function loadGa() {
    if (loaded || !cfg.ga4) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("js", new Date());
    gtag("config", cfg.ga4);
    if (!LIVE) { console.info("[consent] Google Analytics accepted (not loaded outside yourtanzaniatrip.com)"); return; }
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4);
    document.head.appendChild(s);
  }

  // Withdrawing consent: stop GA and remove its cookies.
  function revokeGa() {
    if (window.gtag) gtag("consent", "update", { analytics_storage: "denied" });
    var host = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (/^_ga/.test(name)) {
        ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
        });
      }
    });
  }

  var banner;
  function build() {
    banner = document.createElement("div");
    banner.className = "ytt-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Cookie settings");
    banner.innerHTML =
      '<p class="ytt-consent__title">Cookies</p>' +
      '<p class="ytt-consent__text">We would like to use Google Analytics cookies to see how visitors use this site, so we can improve it. ' +
      'We only place them if you accept. Read more in our <a href="/privacy-policy/">privacy policy</a>.</p>' +
      '<div class="ytt-consent__actions">' +
      '<button type="button" class="ytt-consent__btn ytt-consent__btn--accept" data-consent="granted">Accept</button>' +
      '<button type="button" class="ytt-consent__btn ytt-consent__btn--decline" data-consent="denied">Decline</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var choice = b.getAttribute("data-consent");
      var before = read();
      save(choice);
      if (choice === "granted") loadGa();
      else if (before === "granted") revokeGa();
      hide();
    });
    document.body.appendChild(banner);
  }
  function show() {
    if (!banner) build();
    banner.hidden = false;
    requestAnimationFrame(function () { banner.classList.add("is-visible"); });
  }
  function hide() {
    if (!banner) return;
    banner.classList.remove("is-visible");
    setTimeout(function () { banner.hidden = true; }, 250);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-cookie-settings]");
    if (!a) return;
    e.preventDefault();
    show();
  });

  var choice = read();
  if (choice === "granted") loadGa();
  else if (choice === null) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
    else show();
  }
})();
