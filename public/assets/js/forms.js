// Form submissions for the static site (there is no WordPress backend behind the Gravity Forms markup).
// Every form posts its fields as JSON to window.YTT_FORMS.endpoint (set in BaseLayout from
// docs/brand-tokens.json). Without an endpoint, or when the request fails, the visitor's e-mail app
// opens with the filled-in request addressed to the company e-mail address, so a request never gets lost.
(function () {
  var cfg = window.YTT_FORMS || {};
  var endpoint = cfg.endpoint && cfg.endpoint.indexOf("[" + "FILL") === -1 ? cfg.endpoint : "";
  var email = cfg.email || "";
  var SKIP = /^(gform_ajax|is_submit|gform_submit|gform_unique_id|state_|gform_target_page|gform_source_page|gform_field_values|version_hash|honeypot|input_\d+_honeypot)/;

  function labelFor(form, el) {
    if (el.id) {
      var l = form.querySelector('label[for="' + el.id + '"]');
      if (l && l.textContent.trim()) return l.textContent.replace(/\*/g, "").trim();
    }
    var field = el.closest(".gfield, .ginput_container, fieldset");
    var legend = field && field.querySelector(".gfield_label, legend, label");
    if (legend && legend.textContent.trim()) return legend.textContent.replace(/\*/g, "").trim();
    return el.name;
  }

  function collect(form) {
    var data = {};
    var seen = {};
    var controls = form.querySelectorAll("input, select, textarea");
    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (!el.name || SKIP.test(el.name) || el.type === "submit" || el.type === "button" || el.type === "hidden" && !/^input_/.test(el.name)) continue;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
      if (el.closest(".gform_hidden, [style*='display: none'], [style*='display:none']")) continue;
      var value = el.type === "checkbox" || el.type === "radio" ? (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : el.value) : el.value;
      if (!value) continue;
      var label = labelFor(form, el);
      if (seen[label]) data[label] += ", " + value;
      else data[label] = value;
      seen[label] = true;
    }
    return data;
  }

  function validate(form) {
    var ok = true;
    var required = form.querySelectorAll("[aria-required='true'], [required]");
    for (var i = 0; i < required.length; i++) {
      var el = required[i];
      if (el.offsetParent === null) continue; // hidden by conditional logic / pagination
      var group = el.type === "checkbox" || el.type === "radio";
      var filled = group ? form.querySelector('[name^="' + el.name.replace(/\.\d+$/, "") + '"]:checked') : el.value.trim();
      var wrap = el.closest(".gfield") || el;
      wrap.classList.toggle("gfield_error", !filled);
      if (!filled) { ok = false; if (typeof el.focus === "function" && ok === false) el.focus(); }
    }
    return ok;
  }

  function subjectFor(form) {
    var h = form.closest("section, div, main");
    var title = (document.querySelector("h1") || {}).textContent || document.title;
    if (form.id === "gform_3") return "Question via the website";
    if (form.id === "gform_2") return "Newsletter sign-up";
    if (form.id === "gform_6") return "Travel quiz result";
    return "Travel proposal request: " + title.trim();
  }

  function message(form, html) {
    var box = document.createElement("div");
    box.className = "ytt-form-message";
    box.setAttribute("role", "status");
    box.innerHTML = html;
    form.parentNode.insertBefore(box, form);
    form.style.display = "none";
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function mailto(subject, data) {
    var body = Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\n") + "\n\nSent from " + location.href;
    return "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function fallback(form, subject, data) {
    var link = mailto(subject, data);
    message(form, "<h3>Almost there</h3><p>Your e-mail app opens with your request. If it does not, <a href=\"" + link + "\">click here</a> or e-mail us at <a href=\"mailto:" + email + "\">" + email + "</a>.</p>");
    location.href = link;
  }

  function send(form) {
    if (!validate(form)) return;
    var subject = subjectFor(form);
    var data = collect(form);
    if (!endpoint) return fallback(form, subject, data);
    // FormSubmit-style endpoint: _subject/_template/_replyto are delivery hints, the rest is the message.
    var replyTo = Object.keys(data).filter(function (k) { return /mail/i.test(k); }).map(function (k) { return data[k]; })[0] || "";
    var payload = Object.assign({ _subject: subject, _template: "table", _replyto: replyTo, _captcha: "false", page: location.href }, data);
    var button = form.querySelector(".gform_button");
    if (button) button.disabled = true;
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
      .then(function () { message(form, "<h3>Thank you</h3><p>We have received your request and will reply within one working day. Want to add something? E-mail <a href=\"mailto:" + email + "\">" + email + "</a>.</p>"); })
      .catch(function () { if (button) button.disabled = false; fallback(form, subject, data); });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".gform_button, [id^='gform_submit_button_']");
    if (!btn) return;
    var form = btn.closest("form");
    if (!form || form.id === "gform_7") return; // wishlist save/load keeps its own behaviour
    if (btn.getAttribute("data-submission-type") === "next" || btn.getAttribute("data-submission-type") === "previous") return;
    e.preventDefault();
    e.stopPropagation();
    send(form);
  }, true);

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.id || form.id.indexOf("gform_") !== 0 || form.id === "gform_7") return;
    e.preventDefault();
    e.stopPropagation();
    send(form);
  }, true);
})();
