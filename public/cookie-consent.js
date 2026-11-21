(() => {
 'use strict';
 const notice = document.querySelector('[data-cookie-notice]');
 const dialog = document.getElementById('cookie-settings');
 if (!notice || !dialog || typeof dialog.showModal !== 'function') return;

 const choiceKey = 'era-map-consent-v1';
 const providerKey = 'era-contact-map-provider';
 const denied = {choice:'deny', provider:null};
 const form = dialog.querySelector('[data-cookie-form]');
 const radios = [...form.querySelectorAll('input[name=maps]')];
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

 function refresh(){
  current = storageFailed ? denied : read();
  notice.hidden = current.choice !== 'pending';
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
 window.addEventListener('pageshow', refresh);
 refresh();
})();
