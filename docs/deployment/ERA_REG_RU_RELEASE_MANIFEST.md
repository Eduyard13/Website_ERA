# Манифест релиза ЭРА 0.47.0

Дата подготовки — 21 ноября 2026. Цель сборки — `https://era-cycle.ru/`, ветка `deploy/regru`. Исходный коммит релиза `b2b885a8a8468f24a5b0f320d26a6212386acec1`, базовый коммит `main` `f59eed27b862fa52081d7b59b18602ff6eeb2088`.

## Пакеты

| Файл | Размер, байт | SHA-256 |
|---|---:|---|
| `ERA_SITE_PUBLIC.zip` | 498 105 148 | `df40a87116f9e17791bb66876e1d7ec19dba932b0f36d0de08f954043e701e27` |
| `ERA_SERVER_PRIVATE.zip` | 90 185 | `8e062ed80fa1919b48342a26825e8c7865cb752944560be2755e6d0b6fa2f417` |

`dist/` содержит **1073 файлов, 529 356 326 байт** без упаковки и **40 HTML-файлов**, включая страницу 404. Контрольный список в `sitemap.xml` содержит 32 основных страниц. В публичном ZIP `index.html` лежит в его корне. Обязательные пути: `assets/`, `documents/`, `vendor/`, `api/request.php`, `data/cbr.json`, `privacy/index.html`, `404.html`, `robots.txt`, `sitemap.xml`. Приватный пакет содержит `cron/update_cbr.php`, серверные файлы, `config.example.json`, лицензию и исходники PHPMailer **7.2.0** с зафиксированным SHA-256 источника.

Снимок курсов взят из ветки `data/cbr-rates`, сверены исходный XML, SHA-256 и схема JSON. Дата запроса и дата действия — **2026-11-20** и **2026-11-20**. Контрольная сумма XML — `2adeb25ad182398684c4c646e110ded5449f7174e4a4442f8bff6b7d1d32aec6`. Устаревший снимок сохраняется до успешного обновления CRON.

## Что проверено

- На исходном `main` прошли 132 теста. На релизе прошли 133 теста в каждом режиме — Рег.ру, GitHub Pages с `/Website_ERA/` и локальный предпросмотр из корня.
- PHP 8.3.6 и локальный TLS SMTP прошли 9 сценариев. Проверены проверка сертификата, аутентификация, конверт и заголовки письма, отказ SMTP, тайм-аут, ограничения формы, блокировка приёма до согласования, антиспам, архив и файлы, 303 и отправка без JavaScript. Письма уходили только на локальный тестовый SMTP.
- PHP-парсер ЦБ прошёл проверку московской даты, Nominal, невалидного XML и атомарного обновления. Исходящий HTTPS к ЦБ из среды исполнения был недоступен. Запуск самого CLI при этом сохранил исходный JSON. Браузерные проверки показали форматирование, обновление, кэш, старые даты и восстановление.
- В Chrome проверены «Технология», главная, экономика, схемы линий, форма и предпросмотр с отключённым Submit. Проверены воспроизведение и перемотка четырёх MP4. Публичные медиа и оригиналы PDF совпадают с базовым релизом побайтно. Проверено 5229 внутренних ссылок и адресов ассетов.
- Apache 2.4.71 проверил рекомендуемые правила `.htaccess` локально, включая MIME, кэширование, скрытые файлы, ограничения листинга, HTTP 404 и видео с HTTP 206. ZIP прошли контроль содержимого и CRC.

Публикация на Рег.ру требует ручной загрузки. HTTP, сертификат, перенаправления, настройки FastCGI, CRON, доставка в корпоративный ящик и согласование политики проверяются на реальном хостинге по `ERA_REG_RU_DEPLOY_STEPS.md`. Попытки HTTP-проверки нового домена из этой среды остановил сетевой прокси с 403.

## Маршруты production

- `/`
- `/catalog/equipment/predvaritelnyy-izmelchitel/`
- `/catalog/equipment/`
- `/catalog/lines/`
- `/catalog/`
- `/technology/`
- `/automation/`
- `/economics/`
- `/about-us/`
- `/media/`
- `/documents/`
- `/contacts/`
- `/documents/brochures/`
- `/documents/technical/`
- `/documents/layouts/`
- `/documents/drawings/`
- `/documents/investments/`
- `/catalog/equipment/predvaritelnyy-raspushitel/`
- `/catalog/equipment/ballisticheskiy-separator/`
- `/catalog/equipment/rotornyy-raspushitel/`
- `/catalog/equipment/bunker-nakopitel/`
- `/catalog/equipment/vertikalno-rotornyy-izmelchitel/`
- `/catalog/equipment/plenochnyy-flotator/`
- `/catalog/equipment/rotornaya-tsentrifuga/`
- `/catalog/equipment/vintovoy-press/`
- `/catalog/equipment/kapsulyator/`
- `/catalog/equipment/ochistka-stokov/`
- `/catalog/equipment/rama-napolnitel/`
- `/catalog/lines/separatsiya-01/`
- `/catalog/lines/separatsiya-02/`
- `/catalog/lines/separatsiya-03/`
- `/catalog/lines/moyka-plenki/`

Проверьте также `/privacy/`, `/contacts/sent/`, перенаправления `/about/`, `/ai/`, `/company-details/`, `robots.txt`, `sitemap.xml`, `/data/cbr.json`, `/api/request.php` (GET 405) и несуществующий `/era404-check/` (404). Для служебных страниц сверяйте `noindex`. На публичных страницах production должен быть абсолютный canonical на основной домен.

## Видео

| Путь | Длительность, с | Размер, байт | SHA-256 |
|---|---:|---:|---|
| `assets/project-home/evidence/cleaning_demo.mp4` | 100.12 | 67881545 | `55b823e9c4a044ea3eded025778eb6c4be01d49feb763523823cd24cd46ef8d9` |
| `assets/project-home/video/era_promo_full.mp4` | 296.00 | 72614623 | `0463355d2142f02dce6e008f51256ab03bee0d0b712a7e9faa19a1b37551e851` |
| `assets/videos/ballisticheskiy-separator.mp4` | 100.12 | 48009962 | `7b82876d7904ae2ddbe514e6d66259098648f4f6f84cf204a6e7986731a92698` |
| `assets/videos/predvaritelnyy-izmelchitel.mp4` | 104.52 | 47412133 | `1537bb5763b2ed8910b3306cf29311f55a9fb92404a758afa2645112638a3833` |

## Исходные PDF

| Путь | Прежний email в оригинале |
|---|---|
| `documents/brochures/era-ballisticheskiy-separator-brochure.pdf` | Есть |
| `documents/brochures/era-bunker-nakopitel-brochure.pdf` | Есть |
| `documents/brochures/era-kapsulyator-brochure.pdf` | Есть |
| `documents/brochures/era-moyka-plenki-brochure.pdf` | Есть |
| `documents/brochures/era-ochistka-stokov-brochure.pdf` | Есть |
| `documents/brochures/era-plenochnyy-flotator-brochure.pdf` | Есть |
| `documents/brochures/era-predvaritelnyy-izmelchitel-brochure.pdf` | Есть |
| `documents/brochures/era-predvaritelnyy-raspushitel-brochure.pdf` | Есть |
| `documents/brochures/era-rama-napolnitel-brochure.pdf` | Есть |
| `documents/brochures/era-rotornaya-tsentrifuga-brochure.pdf` | Есть |
| `documents/brochures/era-rotornyy-raspushitel-brochure.pdf` | Есть |
| `documents/brochures/era-separatsiya-01-brochure.pdf` | Есть |
| `documents/brochures/era-separatsiya-02-overview.pdf` | Есть |
| `documents/brochures/era-separatsiya-03-brochure.pdf` | Есть |
| `documents/brochures/era-vertikalno-rotornyy-izmelchitel-brochure.pdf` | Есть |
| `documents/brochures/era-vintovoy-press-brochure.pdf` | Есть |
| `documents/drawings/era-moyka-plenki-dimensions-a0.pdf` | При проверке не найден |
| `documents/drawings/era-separatsiya-01-dimensions.pdf` | При проверке не найден |
| `documents/drawings/era-separatsiya-02-dimensions-a0.pdf` | При проверке не найден |
| `documents/drawings/era-separatsiya-03-dimensions-a0.pdf` | При проверке не найден |
| `documents/technical/era-ballisticheskiy-separator-technical-description.pdf` | Есть |
| `documents/technical/era-bunker-nakopitel-technical-description.pdf` | Есть |
| `documents/technical/era-kapsulyator-technical-description.pdf` | Есть |
| `documents/technical/era-moyka-plenki-technical-description.pdf` | Есть |
| `documents/technical/era-ochistka-stokov-technical-description.pdf` | Есть |
| `documents/technical/era-plenochnyy-flotator-technical-description.pdf` | Есть |
| `documents/technical/era-predvaritelnyy-izmelchitel-technical-description.pdf` | Есть |
| `documents/technical/era-predvaritelnyy-raspushitel-technical-description.pdf` | Есть |
| `documents/technical/era-rama-napolnitel-technical-description.pdf` | Есть |
| `documents/technical/era-rotornaya-tsentrifuga-technical-description.pdf` | Есть |
| `documents/technical/era-rotornyy-raspushitel-technical-description.pdf` | Есть |
| `documents/technical/era-separatsiya-01-mini-technical-description.pdf` | Есть |
| `documents/technical/era-separatsiya-01-technical-description.pdf` | Есть |
| `documents/technical/era-separatsiya-03-technical-description.pdf` | Есть |
| `documents/technical/era-vertikalno-rotornyy-izmelchitel-technical-description.pdf` | Есть |
| `documents/technical/era-vintovoy-press-technical-description.pdf` | Есть |

В 32 из 36 PDF прежний адрес обнаружен в тексте или ссылках документа. Контрольные суммы оригиналов сохранены. Строки сайта и формы используют `info@era-cycle.ru`. Для изменения адреса внутри PDF нужен отдельный выпуск новых редакций.

## Проверка файлов и URL

Проверьте оба архива на компьютере из папки комплекта.

```bash
sha256sum -c SHA256SUMS
unzip -t ERA_SITE_PUBLIC.zip
unzip -t ERA_SERVER_PRIVATE.zip
```

После распаковки и публикации выполните проверку наличия файлов и HTTP-ответов. Запустите из каталога с `ERA_SITE_PUBLIC.zip`, подставив действительный путь к копии веб-корня. Скрипт использует стандартную библиотеку Python 3 и выполняет только GET и HEAD.

```bash
python3 - ERA_SITE_PUBLIC.zip "/путь/к/распакованному/www/era-cycle.ru" <<'CHECK'
from pathlib import Path
from sys import argv
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from zipfile import ZipFile

base = "https://era-cycle.ru/"
root = Path(argv[2])
with ZipFile(argv[1]) as archive:
    files = archive.namelist()
missing = [name for name in files if not (root / name).is_file()]
assert not missing, missing
with urlopen(base + "sitemap.xml", timeout=15) as response:
    urls = [item.text for item in ET.parse(response).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
assert len(urls) == 32 and len(set(urls)) == len(urls)
for url in urls:
    assert urlsplit(url).netloc == "era-cycle.ru", url
    with urlopen(url, timeout=15) as response:
        html = response.read().decode("utf-8")
        assert response.status == 200 and f'<link rel="canonical" href="{url}">' in html, url
        assert '<meta name="robots" content="noindex' not in html, url
for name in files:
    if name.endswith((".pdf", ".mp4")):
        with urlopen(Request(base + quote(name), method="HEAD"), timeout=15) as response:
            assert response.status == 200, name
            assert response.headers.get_content_type() == ("application/pdf" if name.endswith(".pdf") else "video/mp4"), name
print(len(files), "files present;", len(urls), "indexable pages and all PDF/MP4 URLs verified")
CHECK
```

Резервная копия, откат и сохранение `.htaccess`, действующей политики, закрытого конфига и текущего снимка курсов описаны в `ERA_REG_RU_DEPLOY_STEPS.md`. Для воспроизведения архивов той же версии используйте исходный коммит выше и тот же снимок `data/cbr.json` через `CBR_SEED_FILE`.

## Изменённые файлы исходного коммита

```text
M	.github/workflows/pages.yml
M	.gitignore
M	README.md
M	content/contact.mjs
A	docs/ERA_PERSONAL_DATA_TEMPLATE.md
A	docs/ERA_REG_RU_DEPLOY_STEPS.md
A	docs/REG_RU_HTACCESS_RECOMMENDED.md
M	docs/cbr-rates.md
M	package-lock.json
M	package.json
M	public/fx.js
D	public/preview-only.js
M	public/request.css
M	public/request.js
M	scripts/build.mjs
M	scripts/contact.mjs
A	scripts/deploy-target.mjs
M	scripts/equipment.mjs
M	scripts/fx.mjs
M	scripts/hot-film-washing.mjs
M	scripts/line.mjs
M	scripts/mini-line.mjs
A	scripts/package-regru.py
M	scripts/project-story.mjs
M	scripts/separation-drying.mjs
M	scripts/static-server.mjs
M	scripts/views.mjs
A	server/regru/PRIVATE_README.txt
A	server/regru/phpmailer-release.json
A	server/regru/private/attachment-types.json
A	server/regru/private/cbr.php
A	server/regru/private/config.example.json
A	server/regru/private/cron/update_cbr.php
A	server/regru/private/request-handler.php
A	server/regru/private/runtime.php
A	server/regru/private/uploads.php
A	server/regru/public/api/request.php
M	test/about-contacts.browser.py
M	test/about-contacts.test.mjs
M	test/about-final.browser.py
M	test/commercial.browser.py
M	test/contacts-public.mjs
M	test/contacts.browser.py
M	test/design-preview.browser.py
M	test/fixtures/catalog-preserved.json
M	test/fixtures/hot-wash-preserved.json
M	test/fixtures/separation-03-preserved.json
M	test/fx.browser.py
M	test/hot-wash-line.browser.py
M	test/hot-wash-line.test.mjs
M	test/presentation-web.browser.py
M	test/project-home.browser.py
A	test/regru-cbr.php
A	test/regru-server.py
M	test/request.browser.py
M	test/separation-03.browser.py
M	test/separation-03.test.mjs
M	test/site.test.mjs
```
