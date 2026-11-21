(() => {
 'use strict';
 const notice = document.querySelector('[data-cookie-notice]');
 const dialog = document.getElementById('cookie-settings');
 if (!notice || !dialog || typeof dialog.showModal !== 'function') return;

 // Update the banner before showing it, including on the preserved 0.48.1 legal pages.
 const copy = notice.querySelector('p');
 const policyLink = copy.querySelector('a');
 copy.replaceChildren('Для работы сайта используются необходимые технические функции. С вашего разрешения мы можем загружать встроенные карты сторонних сервисов, которым могут передаваться технические данные, включая IP-адрес. Вы можете изменить выбор в любое время. ', policyLink, '.');
 notice.querySelector('[data-cookie-choice="allow"]').textContent = 'Принять';

 const choiceKey = 'era-map-consent-v1';
 const providerKey = 'era-contact-map-provider';
 const denied = {choice:'deny', provider:null};
 const form = dialog.querySelector('[data-cookie-form]');
 const radios = [...form.querySelectorAll('input[name=maps]')];
 const root = document.documentElement;
 const touchLayout = matchMedia('(pointer: coarse), (max-width: 767px)');
 const editable = 'textarea, [contenteditable="true"], input:is(:not([type]), [type=text], [type=email], [type=tel], [type=number], [type=search], [type=url], [type=password])';
 let trigger;
 let storageFailed = false;

 function read(){
  try {
   const value = localStorage.getItem(choiceKey);
   const choice = value === 'allow' || value === 'deny' ? value : 'pending';
   const provider = choice === 'allow' ? localStorage.getItem(providerKey) : null;
   return {choice, provider};
  } catch {
   return denied;
  }
 }
 let current = read();

 function measureNotice(){
  const height = notice.offsetHeight;
  root.toggleAttribute('data-cookie-bar-open', height > 0);
  if (height) root.style.setProperty('--cookie-notice-height', height + 'px');
  else root.style.removeProperty('--cookie-notice-height');
 }

 function syncNotice(){
  const typing = touchLayout.matches && document.activeElement?.matches(editable);
  notice.hidden = current.choice !== 'pending' || typing;
  measureNotice();
 }

 function refresh(){
  current = storageFailed ? denied : read();
  syncNotice();
  window.dispatchEvent(new Event('era:map-preferences'));
 }

 function write(key, value){
  try {
   localStorage.setItem(key, value);
   if (localStorage.getItem(key) !== value) throw new Error('Storage unavailable');
   if (key === choiceKey && value === 'deny') localStorage.removeItem(providerKey);
   storageFailed = false;
  } catch {
   storageFailed = true;
   try { localStorage.removeItem(choiceKey); } catch { /* Browser blocks storage. */ }
  }
  refresh();
 }

 window.eraMapPreferences = Object.freeze({
  read: () => ({...current}),
  select(provider){
   if (current.choice === 'allow' && ['google', 'yandex'].includes(provider)) write(providerKey, provider);
  },
 });

 function restoreFocus(element){
  if (element?.getClientRects().length) element.focus({preventScroll:true});
  else {
   const main = document.getElementById('main');
   main.tabIndex = -1;
   main.focus({preventScroll:true});
  }
 }

 for (const button of document.querySelectorAll('[data-cookie-settings]')) {
  button.hidden = false;
  button.addEventListener('click', () => {
   trigger = button;
   for (const radio of radios) radio.checked = radio.value === current.choice;
   dialog.showModal();
  });
 }
 for (const button of notice.querySelectorAll('[data-cookie-choice]')) {
  button.addEventListener('click', () => {
   write(choiceKey, button.dataset.cookieChoice);
   restoreFocus(button);
  });
 }
 dialog.querySelector('[data-cookie-close]').addEventListener('click', () => dialog.close());
 dialog.addEventListener('close', () => restoreFocus(trigger));
 form.addEventListener('submit', event => {
  event.preventDefault();
  const choice = new FormData(form).get('maps');
  if (choice === 'allow' || choice === 'deny') write(choiceKey, choice);
  dialog.close();
 });
 window.addEventListener('storage', event => {
  if (event.key === choiceKey || event.key === providerKey || event.key === null) refresh();
 });
 if (typeof ResizeObserver === 'function') new ResizeObserver(measureNotice).observe(notice);
 document.addEventListener('focusin', syncNotice);
 document.addEventListener('focusout', () => requestAnimationFrame(syncNotice));
 window.addEventListener('resize', syncNotice);
 window.visualViewport?.addEventListener('resize', syncNotice);
 window.addEventListener('pageshow', refresh);
 refresh();
})();
