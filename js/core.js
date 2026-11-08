/* DCM & Co. shared helpers
   Loaded before each page script. Exposes one global: window.DCM. */
(function (w) {
  'use strict';

  var DCM = w.DCM = {};

  /* ----- DOM ----- */
  DCM.$ = function (selector, root) { return (root || document).querySelector(selector); };
  DCM.$$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  /* ----- Formatting ----- */
  var HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  DCM.esc = function (value) { return String(value).replace(/[&<>"']/g, function (c) { return HTML_ESCAPES[c]; }); };
  DCM.peso = function (n) {
    return '\u20b1' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  DCM.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
  DCM.nowStamp = function () {
    return new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  DCM.isoToday = function () {
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  /* ----- Session (front-end demo only, not real authentication) ----- */
  DCM.session = function () {
    try { return JSON.parse(sessionStorage.getItem('dcm_session')); } catch (e) { return null; }
  };

  /* ----- localStorage with JSON. keyFn lets a page namespace its keys. ----- */
  DCM.createStore = function (keyFn) {
    var key = keyFn || function (k) { return k; };
    return {
      get: function (k, fallback) {
        try { var v = localStorage.getItem(key(k)); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
      },
      set: function (k, v) { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) {} },
      del: function (k) { try { localStorage.removeItem(key(k)); } catch (e) {} }
    };
  };

  /* ----- Toast: toast(message, 'error'?) ----- */
  DCM.createToast = function (el, ms) {
    var timer;
    return function (message, type) {
      el.textContent = message;
      el.className = 'toast show' + (type === 'error' ? ' error' : '');
      clearTimeout(timer);
      timer = setTimeout(function () { el.className = 'toast'; }, ms || 3300);
    };
  };

  /* ----- Run fn at most once per frame burst (used for cross-tab updates) ----- */
  DCM.debounce = function (fn, wait) {
    var t;
    return function () { var args = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, args); }, wait || 80); };
  };
})(window);
