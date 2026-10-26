/* CarPing website behaviour: language switch (EN / FA / AR), mobile menu, scroll effects, QR on the card, request form. */
(function () {
  'use strict';

  // ---- settings you will want to change ----
  var CONFIG = {
    email: 'hello@carping.app',            // PLACEHOLDER — replace with the real support address
    qrText: 'https://carping.app/c/demo',  // what the decorative QR on the hero card encodes (not a real card)
    apiBase: ''                            // the CarPing server that sells cards, e.g. 'https://api.carping.app'. Empty = the online shop is off and visitors see the "leave your details" form.
  };

  var I18N = window.CP_I18N || {};
  var root = document.documentElement;
  var current = 'en';

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function setLang(lang) {
    if (!I18N[lang]) lang = 'en';
    current = lang;
    var dict = I18N[lang], base = I18N.en;
    root.lang = lang;
    root.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var v = dict[k] != null ? dict[k] : base[k];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      var v = dict[k] != null ? dict[k] : base[k];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    document.title = lang === 'en' ? 'CarPing — Your Car. Always Connected.' : 'CarPing — ' + dict.foot_tag;
    safeSet('carping_lang', lang);
    refreshShopTexts();
  }

  function pickInitial() {
    var saved = safeGet('carping_lang');
    if (saved && I18N[saved]) return saved;
    var n = (navigator.language || 'en').toLowerCase();
    if (n.indexOf('fa') === 0) return 'fa';
    if (n.indexOf('ar') === 0) return 'ar';
    return 'en';
  }

  // ---- language buttons ----
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  // ---- mobile menu ----
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  function closeMenu() { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // ---- header shadow + active link ----
  var nav = document.querySelector('.nav');
  var sections = ['home', 'features', 'how', 'about', 'get-card', 'support'].map(function (id) { return document.getElementById(id); });
  var navAs = links.querySelectorAll('a');
  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
    var y = window.scrollY + 140, idx = 0;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) idx = i; });
    navAs.forEach(function (a, i) { a.classList.toggle('is-active', i === idx); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- reveal on scroll ----
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---- decorative QR on the hero card ----
  function drawQr() {
    var host = document.getElementById('heroQr');
    if (!host) return;
    if (window.qrcode) {
      try {
        var qr = window.qrcode(0, 'M');
        qr.addData(CONFIG.qrText);
        qr.make();
        host.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        return;
      } catch (e) { /* fall through to the plain pattern */ }
    }
    // fallback pattern (looks like a QR, is not one)
    var n = 25, s = '';
    function finder(r, c, r0, c0) {
      var dr = r - r0, dc = c - c0;
      if (dr < 0 || dc < 0 || dr > 6 || dc > 6) return null;
      var edge = dr === 0 || dc === 0 || dr === 6 || dc === 6;
      var core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      return edge || core;
    }
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var f = finder(r, c, 0, 0);
      if (f === null) f = finder(r, c, 0, n - 7);
      if (f === null) f = finder(r, c, n - 7, 0);
      var on = f !== null ? f : ((r * 7 + c * 13 + r * c) % 5 < 2);
      if (on) s += '<rect x="' + c + '" y="' + r + '" width="1" height="1"/>';
    }
    host.innerHTML = '<svg viewBox="0 0 ' + n + ' ' + n + '" fill="#071a40" shape-rendering="crispEdges">' + s + '</svg>';
  }
  window.addEventListener('load', drawQr);
  drawQr();

  // ---- request form -> opens the mail app ----
  var form = document.getElementById('cardForm');
  var note = document.getElementById('formNote');
  var mailLink = document.getElementById('mailLink');
  var mailText = document.getElementById('mailText');
  if (mailLink) { mailLink.href = 'mailto:' + CONFIG.email; mailText.textContent = CONFIG.email; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), contact = f.contact.value.trim();
    f.name.classList.toggle('is-bad', !name);
    f.contact.classList.toggle('is-bad', !contact);
    if (!name || !contact) { note.textContent = (I18N[current] || I18N.en).fm_bad; return; }
    var body = [
      'Name: ' + name,
      'Contact: ' + contact,
      'Country: ' + f.country.value.trim(),
      'Cards: ' + (f.count.value || '1'),
      '',
      f.message.value.trim()
    ].join('\n');
    window.location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('CarPing card request') + '&body=' + encodeURIComponent(body);
    note.textContent = (I18N[current] || I18N.en).fm_note;
  });


  // ---- online shop: order -> pay -> card code shown once (talks to the CarPing server, CONFIG.apiBase) ----
  var API = (CONFIG.apiBase || '').replace(/\/+$/, '');
  var shopCfg = null, shopOrder = null;
  var $ = function (id) { return document.getElementById(id); };
  function tr(k) { var d = I18N[current] || I18N.en; return d[k] != null ? d[k] : I18N.en[k]; }

  function money(minor, cur) {
    try {
      var digits = new Intl.NumberFormat('en', { style: 'currency', currency: cur }).resolvedOptions().maximumFractionDigits;
      return new Intl.NumberFormat(current, { style: 'currency', currency: cur }).format(minor / Math.pow(10, digits));
    } catch (e) { return (minor / 100).toFixed(2) + ' ' + cur; }
  }
  function call(method, path, body) {
    return fetch(API + path, {
      method: method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store'
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error('http'); e.status = r.status; throw e; } return j; });
    });
  }
  function saveOrder(o) { try { if (o) localStorage.setItem('carping_order', JSON.stringify(o)); else localStorage.removeItem('carping_order'); } catch (e) { /* ignore */ } }
  function loadSaved() { try { return JSON.parse(localStorage.getItem('carping_order') || 'null'); } catch (e) { return null; } }
  // The codes live only in this tab (sessionStorage) so an accidental refresh does not lose them; the server never shows them twice.
  function saveCodes(c) { try { if (c) sessionStorage.setItem('carping_codes', JSON.stringify(c)); else sessionStorage.removeItem('carping_codes'); } catch (e) { /* ignore */ } }
  function loadCodes() { try { return JSON.parse(sessionStorage.getItem('carping_codes') || 'null'); } catch (e) { return null; } }

  function refreshShopTexts() {
    if (!shopCfg) return;
    updateTotal();
    if (shopOrder) renderOrder();
  }
  function updateTotal() {
    var q = parseInt($('shopQty').value, 10);
    if (!(q >= 1)) q = 1;
    $('shopUnit').textContent = money(shopCfg.unitPriceMinor, shopCfg.currency);
    $('shopTotal').textContent = money(shopCfg.unitPriceMinor * Math.min(q, shopCfg.maxQuantity), shopCfg.currency);
  }

  function qrFor(url) { var qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); return qr; }
  function qrPng(url, cb) {
    var qr = qrFor(url), n = qr.getModuleCount(), cell = 10, pad = 4 * cell, size = n * cell + pad * 2;
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var q = 0; q < n; q++) if (qr.isDark(r, q)) g.fillRect(pad + q * cell, pad + r * cell, cell, cell);
    c.toBlob(cb, 'image/png');
  }
  function button(label, onClick) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = label; b.addEventListener('click', onClick); return b;
  }
  function renderCodes(urls) {
    var host = $('codes'); host.innerHTML = '';
    if (!urls || !urls.length || !window.qrcode) return;
    var warn = document.createElement('p'); warn.className = 'form__note form__note--warn'; warn.textContent = tr('shop_warn'); host.appendChild(warn);
    urls.forEach(function (url, i) {
      var box = document.createElement('div'); box.className = 'code';
      var h = document.createElement('h4'); h.textContent = tr('shop_card_n') + ' ' + (i + 1) + (urls.length > 1 ? ' / ' + urls.length : ''); box.appendChild(h);
      var qrBox = document.createElement('div'); qrBox.className = 'code__qr';
      qrBox.innerHTML = qrFor(url).createSvgTag({ cellSize: 4, margin: 4, scalable: true }); box.appendChild(qrBox);
      var use = document.createElement('p'); use.className = 'code__use'; use.textContent = tr('shop_use'); box.appendChild(use);
      var u = document.createElement('div'); u.className = 'code__url'; u.textContent = url; box.appendChild(u);
      var btns = document.createElement('div'); btns.className = 'code__btns';
      var copy = button(tr('shop_copy'), function () {
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(url).then(function () { copy.textContent = tr('shop_copied'); setTimeout(function () { copy.textContent = tr('shop_copy'); }, 1800); }, function () {});
      });
      btns.appendChild(copy);
      btns.appendChild(button(tr('shop_save'), function () {
        qrPng(url, function (blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'carping-card-' + (i + 1) + '.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); });
      }));
      btns.appendChild(button(tr('shop_print'), function () { window.print(); }));
      box.appendChild(btns);
      host.appendChild(box);
    });
  }

  function renderOrder() {
    var o = shopOrder;
    $('orderForm').hidden = true; $('orderPanel').hidden = false;
    $('orderRef').textContent = o.orderRef;
    $('orderTotal').textContent = money(o.totalMinor, o.currency);
    $('orderState').textContent = tr('shop_st_' + (o.status === 'delivering' ? 'paid' : o.status));
    $('payBtn').hidden = !(o.status === 'pending' && shopCfg.paymentMode === 'test');
    $('payNone').hidden = !(o.status === 'pending' && shopCfg.paymentMode !== 'test');
    $('cancelBtn').hidden = o.status !== 'pending';
    $('cancelledNote').hidden = o.status !== 'cancelled';
    var codes = loadCodes();
    $('getCodeBtn').hidden = !(o.status === 'paid' || o.status === 'delivering');
    $('goneNote').hidden = !(o.status === 'delivered' && !codes);
    renderCodes(o.status === 'delivered' ? codes : null);
  }
  function setNote(k) { $('panelNote').textContent = k ? tr(k) : ''; }
  function showForm() { shopOrder = null; $('codes').innerHTML = ''; $('orderPanel').hidden = true; $('orderForm').hidden = false; }
  function refreshOrder() {
    var saved = loadSaved(); if (!saved) return Promise.resolve();
    return call('GET', '/api/shop/orders/' + encodeURIComponent(saved.viewToken)).then(function (r) { shopOrder = r.order; renderOrder(); }, function (e) {
      if (e.status === 404) { saveOrder(null); saveCodes(null); showForm(); } else { setNote('shop_err'); }
    });
  }

  function initShop() {
    if (!API) return;
    call('GET', '/api/shop/config').then(function (cfg) {
      if (!cfg.enabled) return;
      shopCfg = cfg;
      $('shop').hidden = false; $('cardForm').hidden = true;
      $('shopQty').max = cfg.maxQuantity; updateTotal();
      $('shopQty').addEventListener('input', updateTotal);
      $('orderForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = $('orderForm').elements, note = $('orderNote');
        var name = f.name.value.trim(), contact = f.contact.value.trim(), qty = parseInt(f.quantity.value, 10);
        f.name.classList.toggle('is-bad', !name); f.contact.classList.toggle('is-bad', !contact);
        if (!name || !contact || !(qty >= 1 && qty <= cfg.maxQuantity)) { note.textContent = tr('fm_bad'); return; }
        $('orderBtn').disabled = true; note.textContent = tr('shop_loading');
        call('POST', '/api/shop/orders', { name: name, contact: contact, quantity: qty, lang: current }).then(function (r) {
          saveOrder({ viewToken: r.viewToken, orderRef: r.order.orderRef }); saveCodes(null); shopOrder = r.order; note.textContent = ''; renderOrder();
        }, function () { note.textContent = tr('shop_err'); }).then(function () { $('orderBtn').disabled = false; });
      });
      $('payBtn').addEventListener('click', function () {
        var saved = loadSaved(); if (!saved) return;
        $('payBtn').disabled = true; setNote('shop_loading');
        call('POST', '/api/shop/orders/' + encodeURIComponent(saved.viewToken) + '/test-pay').then(function (r) { shopOrder = r.order; setNote(null); renderOrder(); }, function () { setNote('shop_err'); })
          .then(function () { $('payBtn').disabled = false; });
      });
      $('getCodeBtn').addEventListener('click', function () {
        var saved = loadSaved(); if (!saved) return;
        $('getCodeBtn').disabled = true; setNote('shop_loading');
        call('POST', '/api/shop/orders/' + encodeURIComponent(saved.viewToken) + '/deliver').then(function (r) {
          saveCodes(r.cards.map(function (c) { return c.url; })); shopOrder = r.order; setNote(null); renderOrder();
        }, function (e) { if (e.status === 409) { setNote(null); refreshOrder(); } else { setNote('shop_err'); } })
          .then(function () { $('getCodeBtn').disabled = false; });
      });
      $('cancelBtn').addEventListener('click', function () {
        var saved = loadSaved(); if (!saved || !window.confirm(tr('shop_cancel_confirm'))) return;
        $('cancelBtn').disabled = true; setNote('shop_loading');
        call('POST', '/api/shop/orders/' + encodeURIComponent(saved.viewToken) + '/cancel').then(function (r) { shopOrder = r.order; setNote(null); renderOrder(); }, function () { setNote('shop_err'); })
          .then(function () { $('cancelBtn').disabled = false; });
      });
      $('newOrderBtn').addEventListener('click', function () { saveOrder(null); saveCodes(null); showForm(); });
      // The receipt e-mail links to #order=<key>: that reopens the order on any device.
      var m = /^#order=([A-Za-z0-9_-]{20,100})$/.exec(location.hash || '');
      if (m) { saveOrder({ viewToken: m[1], orderRef: '' }); saveCodes(null); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } location.hash = '#get-card'; }
      refreshOrder();
    }, function () { /* server unreachable: the "leave your details" form stays */ });
  }
  initShop();

  document.getElementById('year').textContent = new Date().getFullYear();
  setLang(pickInitial());
})();
