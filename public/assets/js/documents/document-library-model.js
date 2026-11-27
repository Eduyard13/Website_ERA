export const zipLimitBytes=50_000_000;
export const normalizeDocumentSearch=value=>String(value||'').toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[\u2010-\u2015\u2212-]/g,' ').replace(/\s+/g,' ').trim();
export function readLibraryState(search,{category='',objects=[],categories=[]}={}){
 const p=new URLSearchParams(search),kind=normalizeDocumentSearch(p.get('kind'));
 let selected=p.get('category')||(kind.includes('брош')?'brochures':kind.includes('тех')||kind.includes('паспорт')?'technical':'')||category;
 if(!categories.includes(selected))selected='';
 let objectType=['node','line','project'].includes(p.get('objectType'))?p.get('objectType'):'',product=p.get('product')||'';
 if(product&&!objectType){const matches=objects.filter(o=>o.slug===product);if(matches.length===1)objectType=matches[0].type;}
 return {q:p.get('q')||'',category:selected,objectType,product,sort:['name','category'].includes(p.get('sort'))?p.get('sort'):'name'};
}
export function filterLibraryDocuments(documents,state){
 const q=normalizeDocumentSearch(state.q);
 return documents.filter(d=>d.status==='published'&&(!state.category||d.category===state.category)&&(!state.objectType||d.objectType===state.objectType)&&(!state.product||d.objectSlug===state.product)&&(!q||normalizeDocumentSearch([d.title,d.type,d.objectTitle,d.description].join(' ')).includes(q)))
 .sort((a,b)=>{
  if(q){const rank=d=>normalizeDocumentSearch(d.title).startsWith(q)?0:normalizeDocumentSearch(d.objectTitle).includes(q)?1:2;const relevance=rank(a)-rank(b);if(relevance)return relevance;}
  if(state.sort==='category'){const kind=a.category.localeCompare(b.category);if(kind)return kind;}
  return (a.objectTitle+' '+a.title).localeCompare(b.objectTitle+' '+b.title,'ru');
 });
}
export function libraryStateUrl(url,state,{category=''}={}){
 const next=new URL(url);next.searchParams.delete('kind');
 for(const key of ['q','category','objectType','product','sort']){const value=key==='sort'&&state.sort==='name'||key==='category'&&state.category===category?'':String(state[key]||'').trim();if(value)next.searchParams.set(key,value);else next.searchParams.delete(key);}
 return next;
}
export function selectionSummary(documents,ids){const selected=documents.filter(d=>ids.has(d.id)&&d.access==='public'&&d.status==='published'&&d.file);const bytes=selected.reduce((n,d)=>n+d.bytes,0);return {selected,bytes,overLimit:bytes>zipLimitBytes};}
