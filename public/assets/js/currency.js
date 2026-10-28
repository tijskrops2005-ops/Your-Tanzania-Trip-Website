// Currency switch for the static site. Prices are stored in USD ("$2,181 <small>USD</small>");
// the old WordPress server converted them per request. Here the visitor's choice (?currency=eur,
// remembered in localStorage) converts every price on the page with the day's ECB rate from
// frankfurter.app (cached 12 hours; fixed fallback rates when offline). Cards that FacetWP renders
// later are converted too.
(function () {
  var CUR = {
    usd: { symbol: "$", code: "USD", name: "U.S. Dollar" },
    eur: { symbol: "€", code: "EUR", name: "Euro" },
    gbp: { symbol: "£", code: "GBP", name: "British Pound" },
  };
  var FALLBACK = { EUR: 0.86, GBP: 0.75 };
  var KEY = "ytt-currency";
  var RATES = "ytt-rates";

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var param = (new URLSearchParams(location.search).get("currency") || "").toLowerCase();
  if (CUR[param]) store(KEY, param);
  var cur = CUR[param] ? param : CUR[read(KEY)] ? read(KEY) : "usd";

  function rates() {
    var cached = null;
    try { cached = JSON.parse(read(RATES) || "null"); } catch (e) {}
    if (cached && Date.now() - cached.t < 12 * 3600 * 1000) return Promise.resolve(cached.r);
    return fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.rates) throw 0; store(RATES, JSON.stringify({ t: Date.now(), r: d.rates })); return d.rates; })
      .catch(function () { return (cached && cached.r) || FALLBACK; });
  }

  function fmt(n, decimals) {
    return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  // Header and form buttons show the chosen currency.
  function label() {
    var c = CUR[cur];
    document.querySelectorAll(".currency-switcher > button").forEach(function (b) {
      var sym = b.querySelector(".currency-symbol");
      var txt = b.querySelector(".selected-currency-text");
      if (sym) { sym.textContent = c.symbol; sym.className = "currency-symbol ts-currency-" + cur; }
      if (txt) txt.textContent = c.name;
    });
  }

  function convert(root, rate) {
    if (cur === "usd") return;
    var c = CUR[cur];
    root.querySelectorAll("small").forEach(function (small) {
      if (small.dataset.yttCur || small.textContent.trim() !== "USD") return;
      var node = small.previousSibling;
      while (node && node.nodeType === 3 && !/\$\s?[\d,.]+/.test(node.nodeValue)) node = node.previousSibling;
      if (!node || node.nodeType !== 3) return;
      node.nodeValue = node.nodeValue.replace(/\$\s?([\d,]+)(\.\d+)?/, function (m, whole, dec) {
        var usd = Number(whole.replace(/,/g, "") + (dec || ""));
        var v = usd * rate;
        return c.symbol + fmt(dec ? v : Math.round(v), dec ? 2 : 0);
      });
      small.textContent = c.code;
      small.dataset.yttCur = cur;
      small.title = "Converted from US dollars at today's ECB rate; you pay the amount on your invoice.";
    });
  }

  // Forms: budget sliders (range inputs with data-currency="$") and plain "$250" amounts in labels.
  function convertForms(root, rate) {
    if (cur === "usd") return;
    var c = CUR[cur];
    var round = function (v, to) { return Math.max(to, Math.round(v / to) * to); };
    root.querySelectorAll('input.range-input[data-currency="$"]:not([data-ytt-cur])').forEach(function (r) {
      r.setAttribute("data-ytt-cur", cur);
      ["min", "max"].forEach(function (k) { if (r.getAttribute(k)) r.setAttribute(k, round(Number(r.getAttribute(k)) * rate, 100)); });
      if (r.getAttribute("step")) r.setAttribute("step", round(Number(r.getAttribute("step")) * rate, 50));
      if (r.value) r.value = round(Number(r.value) * rate, 50);
      r.setAttribute("data-currency", c.symbol);
      r.dispatchEvent(new Event("input", { bubbles: true }));
      r.dispatchEvent(new Event("change", { bubbles: true }));
    });
    var walker = document.createTreeWalker(root.querySelector ? root : document, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return /\$\s?\d/.test(n.nodeValue) && n.parentElement && n.parentElement.closest("form, .gform_wrapper, .range") && !n.parentElement.closest("script, style") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      n.nodeValue = n.nodeValue.replace(/\$\s?([\d,]+)(\+?)/g, function (m, whole, plus) {
        return c.symbol + fmt(round(Number(whole.replace(/,/g, "")) * rate, 10), 0) + plus;
      });
    });
  }

  function setCurrency(next) {
    if (!CUR[next]) return;
    store(KEY, next);
    var url = new URL(location.href);
    url.searchParams.set("currency", next);
    location.href = url.toString();
  }
  window.yttSetCurrency = setCurrency;

  // The theme's buttons call Alpine's setCurrency (a reload with ?currency=); make sure a click
  // always works, also where Alpine is not active (form box).
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".currency-switcher li button");
    if (!b) return;
    var m = (b.getAttribute("@click") || b.getAttribute("x-on:click") || "").match(/setCurrency\('(\w+)'\)/);
    if (m) { e.preventDefault(); e.stopPropagation(); setCurrency(m[1]); }
  }, true);

  // Open/close the currency and language menus ourselves: in the form box Alpine's toggle and
  // click-away fired on the same click, so the menu never stayed open.
  function setOpen(sw, open) {
    var box = sw.querySelector(".currency-switcher-wrapper, .language-switcher-wrapper");
    if (box) box.classList.toggle("is-active", open);
    var arrows = sw.querySelectorAll(":scope > button [class*='arrow-icon']");
    if (arrows.length === 2) { arrows[0].style.display = open ? "none" : ""; arrows[1].style.display = open ? "" : "none"; }
    var btn = sw.querySelector(":scope > button");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".currency-switcher > button, .language-switcher > button");
    var openOnes = document.querySelectorAll(".currency-switcher-wrapper.is-active, .language-switcher-wrapper.is-active");
    if (btn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var sw = btn.parentElement;
      var box = sw.querySelector(".currency-switcher-wrapper, .language-switcher-wrapper");
      var willOpen = !(box && box.classList.contains("is-active"));
      openOnes.forEach(function (b) { setOpen(b.parentElement, false); });
      setOpen(sw, willOpen);
      return;
    }
    if (!e.target.closest(".currency-switcher-wrapper, .language-switcher-wrapper")) openOnes.forEach(function (b) { setOpen(b.parentElement, false); });
  }, true);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.querySelectorAll(".currency-switcher-wrapper.is-active, .language-switcher-wrapper.is-active").forEach(function (b) { setOpen(b.parentElement, false); });
  });

  function run() {
    label();
    if (cur === "usd") return;
    rates().then(function (r) {
      var rate = r[CUR[cur].code] || FALLBACK[CUR[cur].code];
      convert(document, rate);
      // Sliders are drawn by the theme after load; convert once it has run.
      setTimeout(function () { convertForms(document, rate); }, 300);
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          m.addedNodes.forEach(function (n) { if (n.nodeType === 1) convert(n, rate); });
        });
      }).observe(document.body, { childList: true, subtree: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
