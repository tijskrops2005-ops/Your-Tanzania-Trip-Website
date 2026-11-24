// Form submissions for the static site (there is no WordPress backend behind the Gravity Forms markup).
// Every form posts its fields as JSON to window.YTT_FORMS.endpoint (set in BaseLayout from
// docs/brand-tokens.json). Without an endpoint, or when the request fails, the visitor's e-mail app
// opens with the filled-in request addressed to the company e-mail address, so a request never gets lost.
(function () {
  var cfg = window.YTT_FORMS || {};
  var endpoint = cfg.endpoint && cfg.endpoint.indexOf("[" + "FILL") === -1 ? cfg.endpoint : "";
  var email = cfg.email || "";
  var SKIP = /^(gform_ajax|is_submit|gform_submit|gform_unique_id|state_|gform_target_page|gform_source_page|gform_field_values|version_hash|honeypot|input_\d+_honeypot)/;

  function clean(t) { return t.replace(/\*/g, "").replace(/\s+/g, " ").trim(); }
  function labelFor(form, el) {
    var field = el.closest(".gfield");
    // Checkbox and radio choices: the question is the label, the chosen option is the value.
    if ((el.type === "checkbox" || el.type === "radio") && field) {
      var q = field.querySelector(".gfield_label, legend");
      if (q && clean(q.textContent)) return clean(q.textContent);
    }
    if (el.id) {
      var l = form.querySelector('label[for="' + el.id + '"]');
      if (l && clean(l.textContent)) return clean(l.textContent);
    }
    var holder = field || el.closest("fieldset, .ginput_container");
    var legend = holder && holder.querySelector(".gfield_label, legend, label");
    if (legend && clean(legend.textContent)) return clean(legend.textContent);
    return el.name;
  }

  function collect(form) {
    // International phone fields: the plugin keeps the number in a hidden input; fill it if it lags.
    var tels = form.querySelectorAll("input.iti__tel-input");
    for (var t = 0; t < tels.length; t++) {
      var raw = tels[t], hidden = raw.closest(".ginput_container") && raw.closest(".ginput_container").querySelector("input[type=hidden][name^='input_']");
      if (hidden && !hidden.value && raw.value.trim()) {
        var iti = window.intlTelInputGlobals && window.intlTelInputGlobals.getInstance && window.intlTelInputGlobals.getInstance(raw);
        hidden.value = (iti && iti.getNumber && iti.getNumber()) || raw.value.trim();
      }
    }
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

  // Validation with a clear message under each field (2026-11-23). Hidden fields (conditional logic)
  // are skipped; required checkbox and radio groups need one choice.
  var MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function messageFor(el, group) {
    if (group) return el.type === "checkbox" ? "Please choose at least one option." : "Please choose one option.";
    if (el.tagName === "SELECT") return "Please make a choice.";
    if (el.type === "email" || /mail/i.test(el.name + " " + (el.placeholder || ""))) return "Please enter your e-mail address.";
    if (el.classList.contains("datepicker") || el.type === "date") return "Please choose your arrival date.";
    if (el.type === "tel") return "Please enter your phone number, so we can reach you about your trip.";
    return "Please fill in this field.";
  }
  function showError(wrap, text) {
    var box = wrap.querySelector(".ytt-error");
    if (!text) { if (box) box.remove(); wrap.classList.remove("gfield_error"); return; }
    if (!box) { box = document.createElement("p"); box.className = "ytt-error"; box.setAttribute("role", "alert"); wrap.appendChild(box); }
    box.textContent = text;
    wrap.classList.add("gfield_error");
  }
  function validate(form) {
    var first = null;
    var checked = {};
    var required = form.querySelectorAll("[aria-required='true'], [required], .gfield_contains_required input[type=checkbox], .gfield_contains_required input[type=radio]");
    for (var i = 0; i < required.length; i++) {
      var el = required[i];
      if (el.offsetParent === null && !(el.type === "checkbox" || el.type === "radio")) continue; // hidden by conditional logic
      var wrap = el.closest(".gfield") || el.parentNode;
      if (wrap.offsetParent === null || el.closest("[style*='display: none'], [style*='display:none']")) continue;
      var group = el.type === "checkbox" || el.type === "radio";
      if (group && el.closest(".gfield--type-consent")) continue; // the newsletter tick box is optional
      var key = group ? (wrap.id || el.name.replace(/\.\d+$/, "")) : null;
      if (group && checked[key]) continue;
      if (group) checked[key] = true;
      var problem = "";
      if (group) problem = wrap.querySelector("input:checked") ? "" : messageFor(el, true);
      else if (!el.value.trim()) problem = messageFor(el, false);
      else if ((el.type === "email") && !MAIL.test(el.value.trim())) problem = "Please check your e-mail address, for example name@example.com.";
      showError(wrap, problem);
      if (problem && !first) first = el;
    }
    if (first) {
      var target = first.closest(".gfield") || first;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof first.focus === "function") setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
      return false;
    }
    return true;
  }
  // Clear a message as soon as the visitor fixes the field.
  document.addEventListener("input", clearError, true);
  document.addEventListener("change", clearError, true);
  function clearError(e) {
    var wrap = e.target && e.target.closest && e.target.closest(".gfield_error");
    if (!wrap) return;
    var ok = (e.target.type === "checkbox" || e.target.type === "radio") ? !!wrap.querySelector("input:checked") : !!String(e.target.value || "").trim();
    if (ok) showError(wrap, "");
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

  // Automatic confirmation to the visitor (FormSubmit "_autoresponse": plain text, sent to the "email" field).
  var SIGN = "\n\nKind regards,\n\nTijs Krops & Edrian Waterman\nYour Tanzania Trip\n" + email + (cfg.whatsapp ? " | WhatsApp " + cfg.whatsapp : "") + "\nwww.yourtanzaniatrip.com";
  function autoresponse(form) {
    if (form.id === "gform_2") return "Hello,\n\nThank you for signing up for Tanzania tips from Your Tanzania Trip. A few times a year we send you travel ideas and practical advice about safaris, Kilimanjaro and Zanzibar. No spam, and you can unsubscribe at any time by replying to one of our e-mails." + SIGN;
    if (form.id === "gform_3") return "Hello,\n\nThank you for your message to Your Tanzania Trip. We have received it and will get back to you personally as soon as possible.\n\nWould you like to add something in the meantime? Simply reply to this e-mail." + SIGN;
    return "Hello,\n\nThank you for your trip request to Your Tanzania Trip. We have received your wishes and will look at them carefully.\n\nWhat happens next:\n1. We review your dates, travel style and wishes together with our local partner in Arusha, Baraka and his team.\n2. We contact you personally as soon as possible, with a few questions or a first proposal.\n3. Together we adjust the route, accommodation and price until it fits you. Only then do you decide.\n\nYour request is free and without obligation. Your details are used only to prepare your proposal and are never shared with third parties for marketing.\n\nWould you like to add something, such as flight times or special wishes? Simply reply to this e-mail." + SIGN;
  }

  function send(form) {
    if (!validate(form)) return;
    var subject = subjectFor(form);
    var data = collect(form);
    if (!endpoint) return fallback(form, subject, data);
    // FormSubmit-style endpoint: _subject/_template/_replyto are delivery hints, the rest is the message.
    var replyTo = Object.keys(data).filter(function (k) { return /mail/i.test(k); }).map(function (k) { return data[k]; })[0] || "";
    var payload = Object.assign({ _subject: subject, _template: "table", _replyto: replyTo, _captcha: "false", page: location.href }, data);
    if (replyTo) { payload.email = replyTo; payload._autoresponse = autoresponse(form); }
    var button = form.querySelector(".gform_button");
    if (button) button.disabled = true;
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json().catch(function () { return {}; }); })
      // FormSubmit answers 200 with success "false" while the address is not activated yet: then the
      // request did not reach anyone, so fall back to the visitor's e-mail app instead of saying thanks.
      .then(function (j) { if (j && String(j.success) === "false") throw new Error(j.message || "not sent"); })
      .then(function () { message(form, "<h3>Thank you</h3><p>We have received your request and will get back to you personally as soon as possible. A confirmation is on its way to your inbox. Want to add something? E-mail <a href=\"mailto:" + email + "\">" + email + "</a>.</p>"); })
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
