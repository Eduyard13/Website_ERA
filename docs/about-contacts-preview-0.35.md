# «О нас», «Контакты» и быстрая связь — 0.35.0-preview.1

Макет от 15 ноября 2026 года по [заданию владельца](ERA_CODEX_ABOUT_CONTACTS_PREVIEW_v034.md).
База — опубликованный коммит `ec83717`, версия сайта 0.34.0.
Работа выполнена в `design/about-contacts-preview`, без изменения `main` и без production-деплоя.
Ветка сохранена локально. Отправка этой ветки в GitHub была отклонена автоматической
проверкой разрешений: внешний push расценён как публикация без отдельного согласования.
Повторной попытки не было; для просмотра подготовлены локальные файлы и скриншоты.

В текущем задании отдельно указан режим: «Сейчас делаем только макет» и
«без публикации в production». Он относится именно к этому обновлению.

## Что можно посмотреть

- `/about-us`: шесть блоков — люди и технология, опыт участников команды,
  разработка и изготовление, три карточки команды, пять шагов работы и финальный CTA.
- `/contacts`: компактное вступление, реальные контакты и прежняя форма,
  производственная площадка с незаполненной картой, равноправные YouTube и VK Видео,
  небольшой переход к отправке материалов.
- На содержательных страницах — один контрол быстрой связи: телефон, почта,
  существующая заявка. Неподключённые мессенджеры не появляются как рабочие ссылки.
- Пять верхних пунктов не менялись. «О нас» добавлено в «Все разделы» и подвал.
  «Реквизиты» удалены из публичной навигации; `/company-details` направляет на `/contacts`.
  Прежний `/about` продолжает направлять на главную.
- В подвале одновременно представлены YouTube и VK Видео. Пока URL отсутствуют,
  карточки и значки некликабельны и честно подписаны.

## Просмотр и сборки

Подготовлены два комплекта вне репозитория:

1. [Компактный ZIP](/workspace/exports/era-about-contacts-preview.zip) — компактный автономный макет.
   Распаковать и открыть `about-us.html` или `contacts.html` обычным браузером.
   Стили, четыре исходные фотографии и логотип встроены. Установка Node не требуется.
   Между двумя страницами можно переходить через меню и подвал; остальные разделы
   ведут на действующий сайт. Курсы валют в этом варианте не запрашиваются.
2. [Полная локальная сборка](/workspace/exports/era-full-site-preview.zip) — полная локальная сборка, включая
   все страницы, существующие фото/видео и PDF. После распаковки с Node.js 22+
   выполнить `node start-preview.mjs`, затем открыть `http://127.0.0.1:3038/about-us/`
   или `http://127.0.0.1:3038/contacts/`. Установка npm-пакетов не нужна.

Оба комплекта являются предпросмотром. Отправка формы отключена с уведомлением
«Предпросмотр: заявка не отправлена». В сборке `PREVIEW_MODE=1` кнопка отправки
изначально disabled; JavaScript включает её для демонстрации и перехватывает submit.
При выключенном JavaScript кнопка остаётся недоступной. Обычная сборка сохраняет
рабочий multipart POST и прежний обработчик. Реальные письма не отправлялись.

Управляемый Chromium этой среды запрещает навигацию по `file://`
(`ERR_BLOCKED_BY_ADMINISTRATOR`). Политика не отключалась. Поэтому автономные HTML
дополнительно проверены через локальный HTTP: все изображения/стили встроены,
загрузка внешних ресурсов заблокирована, меню, переход между страницами, панель
и preview-форма работают. Прямой `file://`-запуск в этой среде не подтверждён.
Полная локальная HTTP-сборка запущена и проверена отдельно.

Воспроизводимые команды из корня репозитория:

```sh
npm run build
npm test
BASE_PATH=/Website_ERA npm run build
BASE_PATH=/Website_ERA npm test
PREVIEW_MODE=1 BASE_PATH=/Website_ERA npm test
PREVIEW_MODE=1 npm run build
node scripts/create-design-preview.mjs /tmp/era-design-preview
```

## Реальные скриншоты

Снимки сделаны Chromium, ширины 1440 и 390 px. WebP-копии сохраняют полный макет.
Оригинальные PNG и результаты браузерных проверок находятся в
`/tmp/era-about-contacts-preview/`.

- [«О нас», desktop целиком](about-contacts-preview-0.35/about-us-1440-full.webp)
- [«Контакты», desktop целиком](about-contacts-preview-0.35/contacts-1440-full.webp)
- [«О нас», mobile целиком](about-contacts-preview-0.35/about-us-390-full.webp)
- [«Контакты», mobile целиком](about-contacts-preview-0.35/contacts-390-full.webp)
- [Связь открыта, desktop](about-contacts-preview-0.35/quick-contact-open-1440.webp)
- [Связь закрыта, desktop](about-contacts-preview-0.35/quick-contact-closed-1440.webp)
- [Связь открыта, mobile](about-contacts-preview-0.35/quick-contact-open-390.webp)
- [Связь закрыта, mobile](about-contacts-preview-0.35/quick-contact-closed-390.webp)
- [«Все разделы»](about-contacts-preview-0.35/navigation-1440.webp)
- [Подвал с двумя видеоканалами](about-contacts-preview-0.35/footer-1440.webp)

## Фотографии и места под данные

Использованы только четыре существующих веб-файла:

| Файл от public/assets/ | Контекст |
|---|---|
| photos/ballisticheskiy-separator/01.webp | Первый экран «О нас»: оборудование в составе участка |
| photos/ballisticheskiy-separator/02.webp | Участок сухой сепарации; нейтральное фото оборудования на контактах |
| photos/predvaritelnyy-izmelchitel/02.webp | Общий вид измельчителя со стороны привода |
| photos/predvaritelnyy-izmelchitel/04.webp | Рабочая поверхность ротора |

География конкретных снимков не утверждается. Кадры не объявлены фотографиями
собственного завода. Никакие новые фото, видео, рендеры или лица не создавались.
Размеры и SHA-256 исходных четырёх файлов — в [манифесте](about-contacts-preview-0.35/manifest.json).

Для заполнения:

- `content/about-us.mjs`: имя, роль, `roleApproved`, описание, путь к портрету и alt
  для каждого из трёх участников. Пока имена/портреты null; роли явно предварительные.
- `content/contact.mjs`: единый `contactChannels` для подтверждённых URL YouTube,
  VK Видео, Telegram, MAX и WhatsApp. Смена null на HTTPS URL активирует только
  соответствующий канал, без перевёрстки; видео открываются новой вкладкой.
- Там же `productionSite`: город, адрес, координаты и выбранные владельцем URL карты.
  До заполнения используется геометрический CSS-макет без пина и iframe.

Возраст более 20 лет относится к опыту участников команды. Юридический статус,
ИНН/ОГРН, принадлежность завода, имена и адреса не выдумывались.

## Сохранность

- SHA-256 всех 519 защищённых исходных файлов совпали с исходной версией:
  существующие медиаматериалы/PDF, финансовые данные и модели, прежний контент,
  `public/request.js`, исходные просмотрщики и ключевые генераторы.
- Содержимое `<main>` остальных 29 страниц, включая `/documents`, совпало после
  исключения версии ресурсов. Изменения общей оболочки ограничены согласованными
  навигацией, подвалом, панелью связи и их ресурсами.
- Функция `requestForm({prefix:'contact',basePath:'/Website_ERA'})` выдаёт побайтно
  ту же HTML-форму: action, имена и ID полей, `_subject`, `_next`, enctype,
  защита от спама, `data-request-*` и предел 5 МБ сохранены.
- Документация, файлы PDF, каталог, галерея, технология, КАИР, главная и экономика
  не перерабатывались. Новых ссылок на документы со страницы «О нас» нет.

## Проверки

- Корневая сборка и тесты: **76/76**.
- `BASE_PATH=/Website_ERA`: сборка и тесты **76/76**.
- Preview-сборка с тем же префиксом: **76/76**.
- `test/about-contacts.browser.py`: 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px;
  обе страницы, отсутствие переполнения, изображения, равные карточки,
  каналы, aria-expanded, Enter/Space/Tab/Escape, внешний клик, возврат фокуса.
- На 11 основных маршрутах: панель и меню не перекрываются. Отдельно проверены
  модальная заявка, новая галерея, прежнее окно фото, КАИР и ввод на телефоне.
- Корневое размещение: полный повтор функциональных сценариев на 390/1440 px.
- `test/request.browser.py`: все девять существующих ширин; multipart,
  байты фото/видео/ZIP, валидация, лимит, контекст и переход после mock-ответа.
  Реальный внешний обработчик перехватывался.
- `test/navigation.browser.py`: 360/768/1024/1440, активные разделы, клавиатура,
  закрытие меню, старые переходы и 404.
- `test/page-progress.browser.py`: 29 содержательных страниц, новые 6/5 разделов,
  свободная прокрутка, мобильные размеры, модальные окна и режим без JS.
- `test/design-preview.browser.py`: демонстрационная отправка в странице/модалке,
  ноль реальных отправлений, два автономных HTML на 390/1440 без внешних ресурсов,
  рабочий переход между ними, disabled-отправка в preview без JS.
- Полный локальный комплект: HTTP 200 у главной, двух новых страниц, галереи,
  документации и JS; исходное видео отдаёт корректный Range HTTP 206.
- Обе ZIP-сборки проверены по CRC. Локальных 4xx и ошибок JavaScript в сценариях нет.

## Изменённые файлы

- `README.md`
- `content/about-us.mjs`
- `content/contact.mjs`
- `content/navigation.mjs`
- `content/site.mjs`
- `docs/ERA_CODEX_ABOUT_CONTACTS_PREVIEW_v034.md`
- `docs/about-contacts-preview-0.35.md`
- `docs/about-contacts-preview-0.35/about-us-1440-full.webp`
- `docs/about-contacts-preview-0.35/about-us-390-full.webp`
- `docs/about-contacts-preview-0.35/contacts-1440-full.webp`
- `docs/about-contacts-preview-0.35/contacts-390-full.webp`
- `docs/about-contacts-preview-0.35/footer-1440.webp`
- `docs/about-contacts-preview-0.35/manifest.json`
- `docs/about-contacts-preview-0.35/navigation-1440.webp`
- `docs/about-contacts-preview-0.35/quick-contact-closed-1440.webp`
- `docs/about-contacts-preview-0.35/quick-contact-closed-390.webp`
- `docs/about-contacts-preview-0.35/quick-contact-open-1440.webp`
- `docs/about-contacts-preview-0.35/quick-contact-open-390.webp`
- `package.json`
- `public/about-us.css`
- `public/company-details-redirect.js`
- `public/contact-premium.css`
- `public/footer.css`
- `public/preview-only.js`
- `public/quick-contact.css`
- `public/quick-contact.js`
- `scripts/about-us.mjs`
- `scripts/build.mjs`
- `scripts/contact-channels.mjs`
- `scripts/contact.mjs`
- `scripts/create-design-preview.mjs`
- `scripts/footer.mjs`
- `scripts/navigation.mjs`
- `scripts/quick-contact.mjs`
- `test/about-contacts.browser.py`
- `test/about-contacts.test.mjs`
- `test/design-preview.browser.py`
- `test/navigation.browser.py`
- `test/page-progress.browser.py`
- `test/request.browser.py`
- `test/site.test.mjs`
