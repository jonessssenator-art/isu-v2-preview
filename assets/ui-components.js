/* ISU · общее поведение компонентов (главная + страницы товаров).
   Подключается в конце <body> после встроенного скрипта страницы. Ничего не ломает, если элементов нет. */
(function () {
  'use strict';
  var doc = document;

  /* ---------- 1. FAQ: раскрывающиеся вопросы-ответы ---------- */
  function setFaqOpen(item, open) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    item.classList.toggle('is-open', open);
    q.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  doc.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (q) q.addEventListener('click', function () { setFaqOpen(item, !item.classList.contains('is-open')); });
  });
  // ссылка на вопрос (например «Доставка» и «Поддержка» в подвале → #delivery, #support) раскрывает его
  function openFaqFor(hash) {
    if (!hash || hash.length < 2) return;
    var target;
    try { target = doc.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return; }
    var item = target && target.closest ? target.closest('.faq-item') : null;
    if (item) setFaqOpen(item, true);
  }
  openFaqFor(location.hash);
  window.addEventListener('hashchange', function () { openFaqFor(location.hash); });
  doc.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (a && a.hash && a.pathname === location.pathname) openFaqFor(a.hash);
  });

  /* ---------- 2. Корзина-шторка как настоящее модальное окно ----------
     Открытие/закрытие делает страница (классом .is-open) — здесь только доступность:
     фокус внутрь, остальное неактивно, Escape закрывает, фокус возвращается на кнопку. */
  var drawer = doc.getElementById('cartDrawer');
  var closeBtn = doc.getElementById('cartCloseBtn');
  if (drawer && closeBtn && 'MutationObserver' in window) {
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    var behind = Array.prototype.slice.call(doc.querySelectorAll('.home-skip-link, header, main, footer, .buybar, .toast'));
    var wasInert = [];
    var opener = null;
    var isOpen = false;
    new MutationObserver(function () {
      var nowOpen = drawer.classList.contains('is-open');
      if (nowOpen === isOpen) return;
      isOpen = nowOpen;
      if (nowOpen) {
        opener = doc.activeElement;
        wasInert = behind.map(function (el) { return el.inert; });
        behind.forEach(function (el) { el.inert = true; });
        closeBtn.focus({ preventScroll: true });
      } else {
        behind.forEach(function (el, i) { el.inert = wasInert[i]; });
        // ссылка в уведомлении к этому моменту уже скрыта — возвращаем фокус на кнопку корзины в шапке
        if (!opener || opener === doc.body || opener.id === 'toastLink' || !doc.contains(opener)) opener = doc.getElementById('cartOpenBtn');
        if (opener && opener.focus) opener.focus({ preventScroll: true });
        opener = null;
      }
    }).observe(drawer, { attributes: true, attributeFilter: ['class'] });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeBtn.click();
    });
  }

  /* ---------- 3. Уведомление «добавлено» читают экранные читалки ---------- */
  var toastText = doc.getElementById('toastText');
  if (toastText && 'MutationObserver' in window) {
    var live = doc.createElement('div');
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    doc.body.appendChild(live);
    new MutationObserver(function () {
      live.textContent = '';
      setTimeout(function () { live.textContent = 'Товар добавлен в корзину: ' + toastText.textContent; }, 50);
    }).observe(toastText, { childList: true, characterData: true, subtree: true });
  }
})();
