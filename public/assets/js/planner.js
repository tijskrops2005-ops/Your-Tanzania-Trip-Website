/* Your Tanzania Trip — homepage trip planner and travel-proposal prefill.
   1. Homepage (#ytt-planner): four short steps, then GET /travel-proposal/?what=…&days=…&when=…&group=…&adults=…&children=…
      Without JavaScript all steps show at once and the form still submits.
   2. /travel-proposal/: reads those parameters and fills in the matching fields of the proposal form. */
(function () {
  'use strict';

  /* ---------- 1. Homepage planner ---------- */
  var form = document.getElementById('ytt-planner');
  if (form) {
    var steps = [].slice.call(form.querySelectorAll('.ytt-step'));
    var bar = form.querySelector('.ytt-planner-bar span');
    var count = form.querySelector('.ytt-planner-count');
    var back = form.querySelector('.ytt-planner-back');
    var next = form.querySelector('.ytt-planner-next');
    var submit = form.querySelector('.ytt-planner-submit');
    var error = form.querySelector('.ytt-planner-error');
    var current = 0;
    form.classList.add('is-stepped');

    var show = function (i, focus) {
      current = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, n) { s.hidden = n !== current; });
      bar.style.transform = 'scaleX(' + (current + 1) / steps.length + ')';
      count.textContent = 'Step ' + (current + 1) + ' of ' + steps.length;
      back.hidden = current === 0;
      next.hidden = current === steps.length - 1;
      submit.hidden = current !== steps.length - 1;
      error.textContent = '';
      if (focus) { var legend = steps[current].querySelector('legend'); legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
    };
    var valid = function () {
      // Step 1 needs at least one choice; the other steps accept "Not sure yet".
      if (current === 0 && !form.querySelector('[name="what"]:checked')) {
        error.textContent = 'Choose at least one, or pick "Help me choose".';
        return false;
      }
      return true;
    };
    next.addEventListener('click', function () { if (valid()) show(current + 1, true); });
    back.addEventListener('click', function () { show(current - 1, true); });
    // Single-choice steps move on by themselves once something is picked.
    steps.forEach(function (s, n) {
      if (!s.hasAttribute('data-auto')) return;
      s.addEventListener('change', function (e) {
        if (e.target.type === 'radio' && n < steps.length - 1) setTimeout(function () { show(n + 1, true); }, 180);
      });
    });
    // "Help me choose" and the activity chips exclude each other.
    form.addEventListener('change', function (e) {
      if (e.target.name !== 'what') return;
      var unsure = form.querySelector('[name="what"][value="unsure"]');
      if (e.target === unsure && unsure.checked) form.querySelectorAll('[name="what"]:not([value="unsure"])').forEach(function (c) { c.checked = false; });
      else if (e.target.checked && unsure) unsure.checked = false;
      error.textContent = '';
    });
    form.querySelectorAll('.ytt-stepper').forEach(function (st) {
      var input = st.querySelector('input');
      st.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var v = (parseInt(input.value, 10) || 0) + (b.value === '+' ? 1 : -1);
        input.value = Math.max(+input.min, Math.min(+input.max, v));
      });
    });
    form.addEventListener('submit', function (e) {
      if (!valid()) { e.preventDefault(); show(0, true); return; }
      // Send one compact "what" list instead of repeated keys; leave out empty answers.
      e.preventDefault();
      var data = new FormData(form), params = new URLSearchParams();
      var what = data.getAll('what').filter(function (v) { return v !== 'unsure'; });
      if (what.length) params.set('what', what.join(','));
      ['days', 'when', 'group', 'adults', 'children'].forEach(function (k) { var v = data.get(k); if (v) params.set(k, v); });
      params.set('from', 'planner');
      if (window.gtag) window.gtag('event', 'planner_submit', { what: what.join(','), days: data.get('days') || '' });
      window.location.href = form.action + '?' + params.toString() + '#gform_5';
    });
    show(0, false);
  }

  /* ---------- 2. Prefill the travel-proposal form ---------- */
  var q = new URLSearchParams(location.search);
  var gform = document.querySelector('#gform_5, form[id^="gform_5"]');
  if (!gform || !(q.get('from') === 'planner' || q.get('what') || q.get('days'))) return;
  var fire = function (el, types) { types.forEach(function (t) { el.dispatchEvent(new Event(t, { bubbles: true })); }); if (window.jQuery) window.jQuery(el).trigger('change'); };

  var fill = function () {
    (q.get('what') || '').split(',').forEach(function (w) {
      var box = gform.querySelector('input[data-activity-type="' + w + '"]');
      if (box && !box.checked) { box.checked = true; fire(box, ['change', 'input']); }
    });
    var days = parseInt(q.get('days'), 10);
    var range = gform.querySelector('#input_5_3');
    if (range && days) { range.value = Math.max(+range.min, Math.min(+range.max, days)); fire(range, ['input', 'change']); }
    var group = q.get('group');
    var radio = group && gform.querySelector('input[name="input_4"][data-group-type="' + group + '"]');
    if (radio) { radio.checked = true; fire(radio, ['change', 'click']); }
    ['adults:#input_5_8', 'children:#input_5_9'].forEach(function (pair) {
      var p = pair.split(':'), v = q.get(p[0]), el = gform.querySelector(p[1]);
      if (el && v !== null && v !== '') { el.value = v; fire(el, ['input', 'change']); }
    });
    var when = q.get('when'); // YYYY-MM
    if (/^\d{4}-\d{2}$/.test(when || '')) {
      var date = gform.querySelector('#input_5_6');
      var parts = when.split('-');
      if (date && !date.value) { date.value = parts[1] + '/01/' + parts[0]; fire(date, ['input', 'change']); }
      var note = gform.querySelector('#input_5_12');
      var month = new Date(+parts[0], +parts[1] - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (note && note.value.indexOf('Preferred month') === -1) note.value = 'Preferred month: ' + month + ' (dates are flexible).\n' + note.value;
    }
    if (!document.querySelector('.ytt-prefill-note')) {
      var msg = document.createElement('p');
      msg.className = 'ytt-prefill-note';
      msg.setAttribute('role', 'status');
      msg.textContent = 'We filled in your answers from the planner. Check them, add your contact details and send your request.';
      gform.parentNode.insertBefore(msg, gform);
    }
  };
  // The theme scripts build parts of the form after load; fill in once they are ready.
  if (document.readyState === 'complete') setTimeout(fill, 300); else window.addEventListener('load', function () { setTimeout(fill, 300); });
})();
