// Interface polish (2026-11-23), loaded on every page. Works on top of the theme's own scripts.
// 1. Desktop dropdowns: open with the keyboard (focus) and with a first tap on touch screens.
// 2. Plan my Trip (Gravity form 5): readable counters with a unit, clear age fields, sensible default.
(function () {
  // ---------- 1. Dropdown menus ----------
  var lastPointer = "mouse";
  document.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType || "mouse"; }, true);

  function fire(el, type) { el.dispatchEvent(new Event(type)); }
  function setupMenus() {
    var items = document.querySelectorAll(".js-alpine-menu > li.menu-item-has-children");
    Array.prototype.forEach.call(items, function (li) {
      var link = li.querySelector(":scope > a");
      if (!link) return;
      // Keep aria-expanded in step with the theme's open state (class menu-toggle-on).
      new MutationObserver(function () {
        link.setAttribute("aria-expanded", li.classList.contains("menu-toggle-on") ? "true" : "false");
      }).observe(li, { attributes: true, attributeFilter: ["class"] });
      var closedByKey = false;
      li.addEventListener("focusin", function () { if (!closedByKey) fire(li, "mouseenter"); });
      li.addEventListener("focusout", function (e) { if (!li.contains(e.relatedTarget)) { closedByKey = false; fire(li, "mouseleave"); } });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { closedByKey = true; fire(li, "mouseleave"); link.focus(); }
      });
      // Touch: the first tap opens the dropdown, a second tap follows the link.
      var wasOpen = false;
      link.addEventListener("pointerdown", function () { wasOpen = li.classList.contains("menu-toggle-on"); });
      link.addEventListener("click", function (e) {
        if (lastPointer === "touch" && !wasOpen) { e.preventDefault(); fire(li, "mouseenter"); }
      });
    });
  }

  // ---------- 2. Plan my Trip ----------
  var counters = [];
  function refreshCounters() { setTimeout(function () { counters.forEach(function (f) { f(); }); }, 60); }
  var UNITS = { input_5_8: ["adult", "adults"], input_5_9: ["child", "children"] };
  function unitText(id, n) { var u = UNITS[id]; return n === 1 ? u[0] : u[1]; }

  function setupCounter(input) {
    var box = input.closest(".ginput_container_number");
    if (!box || box.querySelector(".ytt-unit")) return;
    var minus = box.querySelector(".quantity-button_decrement");
    var plus = box.querySelector(".quantity-button_increment");
    if (!minus || !plus) return false;
    var unit = document.createElement("span");
    unit.className = "ytt-unit";
    unit.setAttribute("aria-hidden", "true");
    box.appendChild(unit);
    // Visible, announced value; typing stays off (the buttons enforce the limits).
    input.disabled = false;
    input.readOnly = true;
    input.setAttribute("aria-live", "polite");
    var one = UNITS[input.id][0];
    minus.setAttribute("aria-label", "One " + one + " less");
    plus.setAttribute("aria-label", "One " + one + " more");
    function update() {
      var n = parseInt(input.value, 10);
      var min = parseInt(input.min, 10) || 0;
      var max = parseInt(input.max, 10) || 30;
      if (isNaN(n) || n < min) { n = min; input.value = String(min); }
      if (n > max) { n = max; input.value = String(max); }
      unit.textContent = unitText(input.id, n);
      input.setAttribute("aria-valuetext", n + " " + unitText(input.id, n));
      minus.disabled = n <= min;
      plus.disabled = n >= max;
    }
    box.addEventListener("click", function () { setTimeout(update, 0); });
    input.addEventListener("change", update);
    counters.push(update);
    update();
    return true;
  }

  function labelAges(fieldId, word, optional) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    var legend = field.querySelector(":scope > legend, :scope > .gfield_label");
    if (legend && !legend.dataset.ytt) {
      legend.dataset.ytt = "1";
      legend.textContent = optional ? "Age of each adult (optional)" : "Age of each child";
    }
    var selects = field.querySelectorAll("select");
    Array.prototype.forEach.call(selects, function (sel, i) {
      var cell = sel.closest(".gfield_list_group_item") || sel.parentNode;
      var label = cell.querySelector(".ytt-age-label");
      if (!label) {
        label = document.createElement("label");
        label.className = "ytt-age-label";
        cell.insertBefore(label, sel);
      }
      if (!sel.id) sel.id = fieldId + "_age_" + (i + 1);
      label.setAttribute("for", sel.id);
      label.textContent = word + " " + (i + 1) + (optional ? " (optional)" : "");
      var first = sel.querySelector("option.gf_placeholder, option[value='']");
      if (first) first.textContent = optional ? "Age (optional)" : "Choose an age";
      if (optional) { sel.removeAttribute("required"); sel.removeAttribute("aria-required"); }
      else { sel.setAttribute("required", ""); sel.setAttribute("aria-required", "true"); }
      // Hide the theme's own per-row label, ours replaces it.
      var extra = cell.parentNode && cell.parentNode.querySelectorAll(".gfield_label:not(.ytt-age-label), .gform-field-label:not(.ytt-age-label)");
      Array.prototype.forEach.call(extra || [], function (el) { if (!el.closest("legend") || el.closest(".gfield_list_group")) el.style.display = "none"; });
    });
  }

  function setupPlanner() {
    var form = document.getElementById("gform_5");
    if (!form) return;
    if (!form.querySelector(".ytt-required-note")) {
      var note = document.createElement("p");
      note.className = "ytt-required-note";
      note.textContent = "Fields marked * are required.";
      var body = form.querySelector(".gform_body") || form.firstChild;
      body.parentNode.insertBefore(note, body);
    }
    var tries = 0;
    (function waitForCounters() {
      var ok = ["input_5_8", "input_5_9"].map(function (id) {
        var el = document.getElementById(id);
        return el ? setupCounter(el) !== false : true;
      }).every(Boolean);
      if (!ok && tries++ < 40) setTimeout(waitForCounters, 150);
    })();
    // Gravity's conditional logic re-enables buttons when it shows a field; keep the limits right.
    form.addEventListener("change", refreshCounters);
    form.addEventListener("click", refreshCounters);
    if (window.jQuery) window.jQuery(document).on("gform_post_conditional_logic", refreshCounters);
    // Age rows are added and removed by the theme when the counters change.
    function ages() { labelAges("field_5_10", "Adult", true); labelAges("field_5_11", "Child", false); }
    ages();
    ["field_5_10", "field_5_11"].forEach(function (id) {
      var f = document.getElementById(id);
      if (f) new MutationObserver(function () { setTimeout(ages, 0); }).observe(f, { childList: true, subtree: true });
    });
    // Trip length: start at 10 days (a common first trip) instead of the slider's midpoint,
    // unless the visitor came from the homepage planner with their own choice.
    var params = new URLSearchParams(location.search);
    var days = document.getElementById("input_5_3");
    if (days && !params.get("days")) {
      setTimeout(function () {
        if (days.dataset.yttTouched) return;
        days.value = "10";
        days.dispatchEvent(new Event("input", { bubbles: true }));
        days.dispatchEvent(new Event("change", { bubbles: true }));
      }, 600);
      days.addEventListener("pointerdown", function () { days.dataset.yttTouched = "1"; });
    }
  }

  function start() { setupMenus(); setupPlanner(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 50); });
  else setTimeout(start, 50);
})();
