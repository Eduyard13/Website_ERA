const target=new URL(document.querySelector('link[rel=canonical]').href);
target.search=location.search;target.hash=location.hash;
location.replace(target.href);
