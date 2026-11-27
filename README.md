# ЭРА

Многостраничный сайт промышленной переработки плёнок. Предпросмотр работает на GitHub Pages, рабочий сайт размещён на Reg.ru. Node.js генерирует статические страницы. PHP на Reg.ru обслуживает заявки и обновление курсов ЦБ РФ.

- [Предпросмотр](https://eduyard13.github.io/Website_ERA/)
- [Рабочий сайт](https://era-cycle.ru/)
- [Архитектура и правила изменения файлов](docs/architecture/overview.md)
- [Публикация, резервирование и откат на Reg.ru](docs/deployment/ERA_REGRU_UPDATES.md)
- [История версий](CHANGELOG.md)

## Локальная проверка

Используйте Node.js 22.13 или новее и Python 3.11 или новее. CI собирает на Node.js 24. Для PHP-проверок нужны PHP 8.3 или новее и расширения из сценария GitHub Actions.

```sh
npm ci --omit=optional
DEPLOY_TARGET=preview PREVIEW_MODE=1 BASE_PATH=/Website_ERA npm test
DEPLOY_TARGET=preview PREVIEW_MODE=1 BASE_PATH=/Website_ERA npm run build
BASE_PATH=/Website_ERA npm run validate:structure -- --dist dist
DEPLOY_TARGET=regru PREVIEW_MODE=0 BASE_PATH='' SITE_URL=https://era-cycle.ru npm test
DEPLOY_TARGET=regru PREVIEW_MODE=0 BASE_PATH='' SITE_URL=https://era-cycle.ru npm run build
npm run validate:structure -- --dist dist
python3 -m unittest discover -s test/deployment -p 'test_*.py'
python3 scripts/deploy/package-regru.py --vendor-only
php test/deployment/regru-cbr.php
python3 test/deployment/regru-server.py
```

`npm run dev` запускает предпросмотр на локальном порту 3000. Для браузерной проверки собранного сайта укажите его адрес в `ERA_PREVIEW_URL`. Программы `test/browser/*-public.mjs` используют Chromium через `ERA_CHROME_PATH`. Python-проверки в `test/browser` используют Playwright и Chromium. Режим предпросмотра блокирует отправку заявок.

Перед изменениями ознакомьтесь с [AGENTS.md](AGENTS.md). Описание прежней структуры и ранних релизов сохранено в [архиве](docs/archive/readme-0.49.29.md).
