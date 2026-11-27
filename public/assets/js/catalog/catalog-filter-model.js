// The native fields are the single filter state; the URL is re-read on history restoration.
export function readFilterState(url,allowed){
 const state={};
 for(const [key,values] of Object.entries(allowed)){
  const value=url.searchParams.get(key)||'';
  state[key]=values===null?value.trim():values.includes(value)?value:'';
 }
 return state;
}
export function filterUrl(current,state){
 const next=new URL(current);
 for(const [key,value] of Object.entries(state)){
  if(value)next.searchParams.set(key,value);else next.searchParams.delete(key);
 }
 return next;
}
export function matchesEquipment(data,{q='',category='',material=''}){
 return data.title.includes(q.trim().toLocaleLowerCase('ru'))&&(!category||data.category===category)&&(!material||data.materials.split('|').includes(material));
}
