# Правила Apache для ЭРА на Рег.ру

Сначала сохраните текущий `.htaccess` вне `www`. Сравните его с фрагментом ниже и перенесите только нужные правила. Сохраните параметры FastCGI, SSL и переадресации, которые выставил ispmanager. Правила HTTPS, `www` и HSTS в этот фрагмент не входят.

```apache
DirectoryIndex index.html
ErrorDocument 404 /404.html
Options -Indexes

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule (^|/)\.(?!well-known(?:/|$)) - [R=404,L,NC]
</IfModule>

<FilesMatch "(?i)^(?:\.user\.ini|config(?:\.[^.]+)?\.(?:php|json)|phpinfo\.php|composer\.(?:json|lock)|.*\.(?:bak|log|ini|zip|tar|gz))$">
    Require all denied
</FilesMatch>

<IfModule mod_mime.c>
    AddType text/javascript .js .mjs
    AddType application/json .json
    AddType application/xml .xml
    AddType application/pdf .pdf
    AddType image/webp .webp
    AddType image/svg+xml .svg
    AddType application/wasm .wasm
    AddType video/mp4 .mp4
    AddType video/webm .webm
    AddType font/woff2 .woff2
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "(?i)(\.html?$|^(robots\.txt|sitemap\.xml)$)">
        Header set Cache-Control "public, max-age=0, must-revalidate"
    </FilesMatch>
    <Files "cbr.json">
        Header set Cache-Control "public, max-age=120, must-revalidate"
    </Files>
    <FilesMatch "(?i)\.(css|m?js|svg|ico|png)$">
        Header set Cache-Control "public, max-age=604800" "expr=%{QUERY_STRING} =~ /(?:^|&)v=[A-Za-z0-9._-]+(?:&|$)/"
    </FilesMatch>
</IfModule>
```

PHP сам задаёт `Cache-Control: no-store` и `X-Robots-Tag` для `/api/request.php`. Уберите правила общего кеширования, если они покрывают этот адрес. Ограничения загрузки задаются в настройках PHP домена. Для старых адресов `/about/`, `/ai/` и `/company-details/` в сборке есть страницы переадресации с `noindex`. Если в панели настраиваете постоянные перенаправления для них, укажите точные пути `/`, `/automation/` и `/contacts/` соответственно.

Если сразу после правки появляется HTTP 500, восстановите копию `.htaccess` и посмотрите журнал ошибок домена. Разрешение `AllowOverride` определяет допустимые директивы. Листинг каталогов и обработчик 404 при необходимости настройте в панели или через поддержку.

Проверьте TLS, HTTP 404, MIME и реальный диапазон видео. Статическая выдача Apache должна вернуть HTTP 206 и корректный `Content-Range`.

```bash
curl -sSI https://era-cycle.ru/
curl -sSI https://era-cycle.ru/api/request.php
curl -sSI https://era-cycle.ru/data/cbr.json
curl -sSI https://era-cycle.ru/era404-check/
curl -fsS -D - -o /dev/null -r 0-1023 https://era-cycle.ru/assets/project-home/video/era_promo_full.mp4
```
