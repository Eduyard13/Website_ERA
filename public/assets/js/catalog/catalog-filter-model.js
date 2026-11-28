export function readFilterState(url,key,allowed){
 const value=url.searchParams.get(key)||'';
 return allowed.includes(value)?value:'';
}

export function filterUrl(current,key,value){
 const next=new URL(current);
 for(const obsolete of ['q','material','optional'])next.searchParams.delete(obsolete);
 if(value)next.searchParams.set(key,value);
 else next.searchParams.delete(key);
 return next;
}
