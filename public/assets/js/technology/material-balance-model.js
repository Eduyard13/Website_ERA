// Educational mass split only. No dependencies on financial or equipment models.
export const materialInput=1500;
export function calculateMaterialBalance(value=50){
 const number=Number(value);
 const contamination=Number.isFinite(number)?Math.max(0,Math.min(50,number)):50;
 const inclusions=materialInput*contamination/100;
 return {input:materialInput,contamination,polymer:materialInput-inclusions,inclusions};
}
export const materialBalancePoints=Array.from({length:11},(_,i)=>calculateMaterialBalance(i*5));
