// Included by the build only when PREVIEW_MODE=1. The production handler is unchanged.
(()=>{
 const message='Предпросмотр: заявка не отправлена';
 for(const form of document.querySelectorAll('[data-request-form]')){
  const note=document.createElement('p');note.className='request-data-note';note.dataset.previewNotice='';note.textContent='Предпросмотр макета. Отправка заявок отключена.';
  form.querySelector('.request-submit-row')?.before(note);
  form.querySelector('[data-request-submit]').disabled=false;
 }
 document.addEventListener('submit',event=>{
  const form=event.target;if(!(form instanceof HTMLFormElement)||!form.matches('[data-request-form]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  const note=form.querySelector('[data-preview-notice]');note.textContent=message;note.setAttribute('role','status');note.tabIndex=-1;note.focus({preventScroll:true});
 },true);
})();
