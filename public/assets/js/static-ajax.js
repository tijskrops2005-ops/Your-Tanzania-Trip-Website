// Routes the theme's admin-ajax.php calls to static files, so the site works without WordPress.
//  - fetch_post_content / fetch_modal_object / fetch_inner_modal_object -> /ajax/<action>/<id>.html
//    (pre-fetched by scripts/ajax-cache.mjs)
//  - wishlist actions -> answered from localStorage + /ajax/wishlist-posts.json
//  - anything else (forms, quiz, view tracking) -> { success: false }, never a request to the live site
(function () {
  const STATIC_HTML = new Set(['fetch_post_content', 'fetch_modal_object', 'fetch_inner_modal_object']);
  const WISHLIST_KEY = 'ts_wishlist';
  const TOKEN_KEY = 'ts_wishlist_token';

  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

  // The live wishlist needs an e-mail sign-up to create a server token; locally the list lives
  // in this browser only, so a local token lets the theme show the list straight away.
  if (!read(TOKEN_KEY)) write(TOKEN_KEY, 'local');

  let postsPromise;
  const wishlistPosts = () => (postsPromise ||= fetch('/ajax/wishlist-posts.json').then(r => r.json()));

  const toParams = body => {
    if (typeof body === 'string') return new URLSearchParams(body);
    if (body instanceof URLSearchParams) return body;
    const params = new URLSearchParams();
    if (body instanceof FormData) for (const [k, v] of body) if (typeof v === 'string') params.append(k, v);
    return params;
  };

  async function answer(params) {
    const action = params.get('action');
    if (STATIC_HTML.has(action)) return { url: `/ajax/${action}/${encodeURIComponent(params.get('post_id'))}.html` };
    if (action === 'render_wishlist_items') {
      const posts = await wishlistPosts();
      let items = [];
      try { items = JSON.parse(read(WISHLIST_KEY) || '[]'); } catch {}
      const wishlist_posts = items.map(item => posts[item.post_id]).filter(Boolean);
      return { json: { success: true, data: { wishlist_posts } } };
    }
    if (action === 'update_wishlist_items') return { json: { success: true, data: {} } };
    return { json: { success: false, data: { message: 'This feature needs the WordPress server.' } } };
  }

  const isAjax = url => typeof url === 'string' && url.includes('/wp-admin/admin-ajax.php');
  const dataUrl = json => 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json));

  const { open, send, setRequestHeader } = XMLHttpRequest.prototype;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._staticAjax = isAjax(String(url));
    return open.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (...args) {
    if (this._staticAjax) { (this._staticHeaders ||= []).push(args); return; }
    return setRequestHeader.apply(this, args);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (!this._staticAjax) return send.call(this, body);
    answer(toParams(body)).then(({ url, json }) => {
      open.call(this, 'GET', url || dataUrl(json), true);
      send.call(this);
    });
  };

  const nativeFetch = window.fetch;
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!isAjax(url)) return nativeFetch.apply(this, arguments);
    return answer(toParams(init.body)).then(({ url: file, json }) => nativeFetch(file || dataUrl(json)));
  };
})();
