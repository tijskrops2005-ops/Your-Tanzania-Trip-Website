// Cookie consent for Google Analytics 4 (Google consent mode v2).
// The Google tag itself is in the <head> of every page (src/layouts/BaseLayout.astro), with
// consent "denied" by default: GA then only receives cookieless pings. "Accept" switches
// analytics_storage to "granted" (GA cookies); "Decline" keeps it denied and removes GA cookies.
// The choice is remembered in localStorage ("ytt-consent") for 12 months; any link with
// [data-cookie-settings] opens the banner again. Ads storage is always denied.
(function () {
  var KEY = "ytt-consent";
  var MAX_AGE = 365 * 24 * 3600 * 1000;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      return v && Date.now() - v.t < MAX_AGE ? v.c : null;
    } catch (e) { return null; }
  }
  function save(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ c: choice, t: Date.now() })); } catch (e) {}
  }

  function grant() {
    if (window.gtag) gtag("consent", "update", { analytics_storage: "granted" });
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
      '<p class="ytt-consent__text">We use Google Analytics to see how visitors use this site, so we can improve it. ' +
      'It only places cookies if you accept. Read more in our <a href="/privacy-policy/">privacy policy</a>.</p>' +
      '<div class="ytt-consent__actions">' +
      '<button type="button" class="ytt-consent__btn ytt-consent__btn--accept" data-consent="granted">Accept</button>' +
      '<button type="button" class="ytt-consent__btn ytt-consent__btn--decline" data-consent="denied">Decline</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var choice = b.getAttribute("data-consent");
      save(choice);
      if (choice === "granted") grant();
      else revokeGa();
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

  if (read() === null) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
    else show();
  }
})();
