/* CarPing website behaviour: language switch (EN / FA / AR), mobile menu, scroll effects, QR on the card, request form. */
(function () {
  'use strict';

  // ---- settings you will want to change ----
  var CONFIG = {
    email: 'hello@carping.app',            // PLACEHOLDER — replace with the real support address
    qrText: 'https://carping.app/c/demo'   // what the decorative QR on the hero card encodes (not a real card)
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
  var sections = ['home', 'features', 'how', 'about', 'support'].map(function (id) { return document.getElementById(id); });
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

  document.getElementById('year').textContent = new Date().getFullYear();
  setLang(pickInitial());
})();
