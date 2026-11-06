const destination=new URL(document.querySelector('link[rel=canonical]').href);
destination.search=location.search;
destination.hash=location.hash;
location.replace(destination.href);
