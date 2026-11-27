// Display-only labels; source keys remain stable for calculations and specification lookups.
export const clientLabel=value=>String(value).replace(/\bERA\b/g,'ЭРА').replace(/^по данным КП$/,'Производительность').replace(/ по КП/g,'');
