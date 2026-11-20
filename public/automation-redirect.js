const destination=new URL(document.querySelector('main a[href]').href);
destination.search=location.search;
destination.hash=location.hash;
location.replace(destination.href);
