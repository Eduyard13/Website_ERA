const target=new URL(document.querySelector('main a[href]').href);
target.search=location.search;target.hash=location.hash;
location.replace(target.href);
