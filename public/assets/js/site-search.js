// Site search for the static site. The theme's search modal was wired to the old operator's Algolia
// index; this replaces its input and results with a local search over /search-index.json
// (built by scripts/rebrand.mjs from content/pages.json). The modal itself (open/close, ⌘K) stays.
(function () {
  var root = document.getElementById("autocomplete");
  var panel = document.getElementById("autocomplete-panel");
  if (!root || !panel) return;

  var index = null;
  function load() {
    if (index) return Promise.resolve(index);
    return fetch("/search-index.json").then(function (r) { return r.json(); }).then(function (d) { index = d; return d; });
  }

  // Replace Algolia's input with our own (same look through the theme's aa-* classes).
  var close = root.querySelector(".aa-CloseButton");
  root.innerHTML = "";
  var form = document.createElement("form");
  form.className = "aa-Form";
  form.setAttribute("role", "search");
  form.innerHTML =
    '<div class="aa-InputWrapperPrefix"><label class="aa-Label"><span class="i-ion-search-outline aa-SubmitIcon" aria-hidden="true"></span></label></div>' +
    '<div class="aa-InputWrapper"><input class="aa-Input" type="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="What are you looking for?" aria-label="Search the site"></div>' +
    '<div class="aa-InputWrapperSuffix"><button class="aa-ClearButton" type="reset" title="Clear" aria-label="Clear"><span class="i-ion-close-round" aria-hidden="true"></span></button></div>';
  root.appendChild(form);
  if (close) root.appendChild(close);
  var input = form.querySelector("input");

  var results = document.createElement("div");
  results.className = "site-search-results";
  panel.innerHTML = "";
  panel.appendChild(results);

  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function search(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var e = index[i];
      var t = norm(e.t), d = norm(e.d), u = norm(e.u);
      var score = 0, ok = true;
      for (var j = 0; j < terms.length; j++) {
        var w = terms[j];
        if (t.indexOf(w) !== -1) score += 10;
        else if (u.indexOf(w) !== -1) score += 6;
        else if (d.indexOf(w) !== -1) score += 3;
        else { ok = false; break; }
      }
      if (!ok) continue;
      if (t.indexOf(norm(q)) !== -1) score += 15;
      // Destinations, trips and guides first; the long accommodation list last.
      score += { Destination: 8, Island: 6, Trip: 5, Blog: 3, "Practical information": 3, Page: 2, Activity: 0, Accommodation: -4, FAQ: 1 }[e.k] || 0;
      scored.push([score, e]);
    }
    scored.sort(function (a, b) { return b[0] - a[0]; });
    return scored.slice(0, 12).map(function (x) { return x[1]; });
  }

  function render(q) {
    if (!q.trim()) { results.innerHTML = ""; return; }
    load().then(function () {
      var hits = search(q);
      if (!hits.length) {
        results.innerHTML = '<p class="site-search-empty">No results for “' + escapeHtml(q) + '”. Try a park, an island or a trip length, or <a href="/contact/">ask us directly</a>.</p>';
        return;
      }
      results.innerHTML = '<ul class="site-search-list">' + hits.map(function (e) {
        return '<li><a href="' + e.u + '"><span class="site-search-kind">' + e.k + '</span><span class="site-search-title">' + escapeHtml(e.t) + '</span>' + (e.d ? '<span class="site-search-desc">' + escapeHtml(e.d) + '</span>' : "") + "</a></li>";
      }).join("") + "</ul>";
    });
  }

  var timer;
  input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { render(input.value); }, 120); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var first = results.querySelector("a"); if (first) location.href = first.getAttribute("href"); });
  form.addEventListener("reset", function () { setTimeout(function () { render(""); input.focus(); }, 0); });
  input.addEventListener("keydown", function (e) {
    var links = results.querySelectorAll("a");
    if (!links.length) return;
    var active = results.querySelector("a.is-active");
    var idx = Array.prototype.indexOf.call(links, active);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      idx = e.key === "ArrowDown" ? Math.min(idx + 1, links.length - 1) : Math.max(idx - 1, 0);
      links.forEach(function (l) { l.classList.remove("is-active"); });
      links[idx].classList.add("is-active");
      links[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      location.href = active.getAttribute("href");
    }
  });

  // Keyword tags: run a search for the tag text (the old handlers queried Algolia).
  document.querySelectorAll(".aa-Tag").forEach(function (tag) {
    var fresh = tag.cloneNode(true);
    tag.parentNode.replaceChild(fresh, tag);
    fresh.addEventListener("click", function (e) { e.preventDefault(); input.value = fresh.textContent.trim(); render(input.value); input.focus(); });
  });

  // Focus the input when the modal opens (the theme toggles it with Alpine).
  document.addEventListener("click", function (e) {
    if (e.target.closest('[aria-label="Open search"]')) setTimeout(function () { input.focus(); }, 250);
  });
  window.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") setTimeout(function () { input.focus(); }, 250);
  });
})();
