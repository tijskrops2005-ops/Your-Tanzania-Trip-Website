// Static replacement for FacetWP's server round-trip. FacetWP's own front-end script keeps
// handling the UI; we only swap FWP.fetchData for a local lookup in the JSON that
// scripts/facets.mjs pre-computed from the live site, and build the same response shape.
(function () {
  const dataUrl = document.currentScript.dataset.facets;
  let dataPromise;
  const loadData = () => (dataPromise ||= fetch(dataUrl).then(r => r.json()));

  const parseTemplate = html => {
    const t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
  };

  // Mirrors FacetWP's numbers pager (inner size 2, dots, prev/next).
  function pagerHtml(page, totalPages) {
    if (totalPages <= 1) return '<div class="facetwp-pager"></div>';
    const link = (p, cls, label = p) => `<a class="facetwp-page${cls ? ' ' + cls : ''}" data-page="${p}">${label}</a>`;
    let html = '';
    if (page > 1) html += link(page - 1, 'prev', '« Previous');
    html += link(1, page === 1 ? 'first active' : 'first');
    const innerFirst = Math.max(page - 2, 2);
    const innerLast = Math.min(page + 2, totalPages - 1);
    if (innerFirst > 2) html += '<a class="facetwp-page dots">…</a>';
    for (let p = innerFirst; p <= innerLast; p++) html += link(p, p === page ? 'active' : '');
    if (innerLast < totalPages - 1) html += '<a class="facetwp-page dots">…</a>';
    html += link(totalPages, page === totalPages ? 'last active' : 'last');
    if (page < totalPages) html += link(page + 1, 'next', 'Next »');
    return `<div class="facetwp-pager">${html}</div>`;
  }

  function buildResponse(data, post) {
    const selected = {};
    for (const name of Object.keys(data.matches)) {
      const v = post.facets[name];
      selected[name] = (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
    }
    const sortName = data.sortFacets.find(n => (post.facets[n] || [])[0]);
    const sortKey = sortName ? post.facets[sortName][0] : '';
    // The pre-computed sort orders were captured unsorted, so sort here from the card itself:
    // price = the "From $x" amount, duration = the first "N days" in the title.
    const num = s => (s ? Number(s.replace(/[^\d]/g, '')) : NaN);
    const price = key => num(((data.items[key] || '').match(/\$\s?([\d.,]+)/) || [])[1]);
    const days = key => {
      const title = ((data.items[key] || '').match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [, data.items[key] || ''])[1];
      return num((title.match(/(\d+)\s*-?\s*days?/i) || [])[1]);
    };
    let order = data.order[''];
    const metric = /price/.test(sortKey) ? price : /days/.test(sortKey) ? days : null;
    if (metric) {
      const desc = /high_to_low/.test(sortKey);
      order = [...order].sort((a, b) => {
        const va = metric(a), vb = metric(b);
        if (isNaN(va) && isNaN(vb)) return 0;
        if (isNaN(va)) return 1;
        if (isNaN(vb)) return -1;
        return desc ? vb - va : va - vb;
      });
    }

    // Within one filter the choices are OR'ed, across filters AND'ed (FacetWP checkbox default).
    const sets = {};
    for (const [name, values] of Object.entries(selected))
      if (values.length) sets[name] = new Set(values.flatMap(v => data.matches[name][v] || []));
    const passes = (key, skip) => Object.entries(sets).every(([name, set]) => name === skip || set.has(key));
    const results = order.filter(key => passes(key));

    const facets = {};
    const initial = FWP_JSON.preload_data.facets;
    for (const name of Object.keys(data.matches)) {
      // Counts for a filter ignore that filter's own selection, like FacetWP.
      const pool = order.filter(key => passes(key, name));
      const frag = parseTemplate(initial[name]);
      frag.querySelectorAll('.facetwp-checkbox').forEach(el => {
        const value = el.dataset.value;
        const ids = new Set(data.matches[name][value] || []);
        const count = pool.filter(key => ids.has(key)).length;
        const isChecked = selected[name].includes(value);
        el.classList.toggle('checked', isChecked);
        const counter = el.querySelector('.facetwp-counter');
        if (counter) counter.textContent = `(${count})`;
        if (!count && !isChecked) el.remove();
      });
      const wrap = document.createElement('div');
      wrap.append(frag);
      facets[name] = wrap.innerHTML;
    }
    for (const name of data.sortFacets) {
      const frag = parseTemplate(initial[name]);
      const value = (post.facets[name] || [])[0] || '';
      frag.querySelectorAll('option').forEach(o => o.toggleAttribute('selected', o.value === value));
      const wrap = document.createElement('div');
      wrap.append(frag);
      facets[name] = wrap.innerHTML;
    }

    const perPage = data.perPage;
    const totalPages = Math.max(1, Math.ceil(results.length / perPage));
    const page = Math.min(Math.max(1, Number(post.paged) || 1), totalPages);
    const pageItems = results.slice((page - 1) * perPage, page * perPage).map(key => data.items[key]);
    for (const { index, html } of data.inserts || []) if (index <= pageItems.length) pageItems.splice(index, 0, html);

    for (const [name, settings] of Object.entries(FWP.settings)) {
      if (settings && settings.pager_type === 'counts') facets[name] = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
      if (settings && settings.pager_type === 'numbers') facets[name] = pagerHtml(page, totalPages);
    }

    return {
      facets,
      template: `<div><div class="facetwp-template">${pageItems.join('') || FWP_JSON.no_results_text}</div></div>`,
      settings: {
        ...FWP_JSON.preload_data.settings,
        pager: { page, per_page: perPage, total_rows: results.length, total_rows_unfiltered: order.length, total_pages: totalPages },
      },
    };
  }

  function install() {
    if (!window.FWP || typeof FWP.fetchData !== 'function') return setTimeout(install, 30);
    FWP.fetchData = function () {
      const post = FWP.buildPostData();
      loadData().then(data => FWP.render(buildResponse(data, post)));
    };
    // FacetWP renders the unfiltered preload on first load; apply filters from a shared URL.
    if (/[?&]_[a-z_]+=/.test(location.search)) {
      let applied = false;
      FWP.hooks.addAction('facetwp/loaded', () => {
        if (applied) return;
        applied = true;
        FWP.fetchData();
      });
    }
  }
  install();
})();
