/* Your Tanzania Trip — homepage trip planner and travel-proposal prefill.
   1. Homepage (#ytt-planner): one card, then /travel-proposal/?what=…&date=…&days=…&adults=…&children=…
      Without JavaScript the form still submits as a plain GET.
   2. /travel-proposal/: reads those parameters and fills in the matching fields of the proposal form. */
(function () {
  'use strict';

  /* ---------- 1. Homepage planner (one card: trip, arrival date, length, travellers) ---------- */
  var form = document.getElementById('ytt-planner');
  if (form) {
    var date = form.querySelector('[name="date"]');
    if (date) { var t = new Date(); t.setDate(t.getDate() + 14); date.min = t.toISOString().slice(0, 10); }
    form.querySelectorAll('.ytt-stepper').forEach(function (st) {
      var input = st.querySelector('input');
      st.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var v = (parseInt(input.value, 10) || 0) + (b.value === '+' ? 1 : -1);
        input.value = Math.max(+input.min, Math.min(+input.max, v));
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form), params = new URLSearchParams();
      var what = (data.get('what') || '').split(',').filter(function (v) { return v && v !== 'unsure'; });
      if (what.length) params.set('what', what.join(','));
      var d = data.get('date'); if (d) params.set('date', d);
      var days = data.get('days'); if (days && days !== 'unsure') params.set('days', days);
      ['adults', 'children'].forEach(function (k) { var v = data.get(k); if (v !== null && v !== '') params.set(k, v); });
      params.set('from', 'planner');
      if (window.gtag) window.gtag('event', 'planner_submit', { what: what.join(','), days: days || '' });
      window.location.href = form.action + '?' + params.toString() + '#gform_5';
    });
  }

  /* YouTube film on the homepage: the player (and YouTube's cookies) load only after a click. */
  document.querySelectorAll('[data-youtube]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-youtube') + '?autoplay=1&rel=0&modestbranding=1';
      f.title = btn.getAttribute('aria-label').replace(/ \(loads YouTube\)$/, '');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      btn.replaceWith(Object.assign(document.createElement('div'), { className: 'ytt-film-frame' }));
      document.querySelector('div.ytt-film-frame:not(:has(iframe))').appendChild(f);
    });
  });

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
    var day = q.get('date'); // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(day || '')) {
      var di = gform.querySelector('#input_5_6'), dp = day.split('-');
      if (di && !di.value) { di.value = dp[1] + '/' + dp[2] + '/' + dp[0]; fire(di, ['input', 'change']); }
    }
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
  // The theme scripts (Alpine) can reset fields while they start, so fill in twice.
  var run = function () { setTimeout(fill, 300); setTimeout(fill, 1400); };
  if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
