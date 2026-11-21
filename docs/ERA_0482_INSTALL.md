# ЭРА 0.48.2 · Ручная установка на Рег.ру

Выполняйте команды по одной строке в Shell-клиенте после подтверждения установки. При ошибке остановитесь на текущем шаге. Комплект рассчитан на установленную 0.48.1 с коммитом `03f07c9cae17c20091d2a80dfe44eb35f0d15d05`.

## 1. Загрузите комплект и проверьте SHA-256

Распакуйте внешний артефакт GitHub Actions на компьютере. Создайте закрытые каталоги рядом с `www`.

```bash
mkdir -p -m 700 /var/www/u3736477/data/era-staging/0.48.2 /var/www/u3736477/data/era-backups
```

Через Менеджер файлов ispmanager загрузите весь комплект в `/var/www/u3736477/data/era-staging/0.48.2`. Внутренний `ERA_UPDATE_0.48.2.zip` загрузите целиком. Скриншоты доступны отдельным артефактом для просмотра.

```bash
cd /var/www/u3736477/data/era-staging/0.48.2 && sha256sum -c SHA256SUMS && unzip -t ERA_UPDATE_0.48.2.zip
```

```bash
mkdir -m 700 /var/www/u3736477/data/era-staging/0.48.2/patch && unzip -q /var/www/u3736477/data/era-staging/0.48.2/ERA_UPDATE_0.48.2.zip -d /var/www/u3736477/data/era-staging/0.48.2/patch
```

## 2. Сверьте установленную версию 0.48.1

```bash
/opt/php/8.3/bin/php /var/www/u3736477/data/era-staging/0.48.2/regru_verify.php /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2/BEFORE.json
```

Ожидается `Verified 0.48.1 (03f07c9cae17c20091d2a80dfe44eb35f0d15d05), 1076 public files.`. Отдельно проверьте три юридических HTML и три PDF.

```bash
cd /var/www/u3736477/data/www/era-cycle.ru && sha256sum -c /var/www/u3736477/data/era-staging/0.48.2/LEGAL_SHA256SUMS
```

## 3. Проверьте список, сделайте резервную копию и выполните dry-run

`PATCH_MANIFEST.md` содержит полный список. Патч содержит только `UPDATE`. Помощник сверяет установленные и распакованные файлы по SHA-256 до копирования. Его запускают из закрытой папки с правами владельца сайта.

```bash
bash /var/www/u3736477/data/era-staging/0.48.2/regru_0482_files.sh preflight /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2 /var/www/u3736477/data/era-backups
```

```bash
bash /var/www/u3736477/data/era-staging/0.48.2/regru_0482_files.sh backup /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2 /var/www/u3736477/data/era-backups
```

Резервные копии будут в `/var/www/u3736477/data/era-backups/0.48.1-before-0.48.2`. Dry-run повторно сверяет SHA-256 оригиналов, файлов патча и резервных копий и выводит пути замены.

```bash
bash /var/www/u3736477/data/era-staging/0.48.2/regru_0482_files.sh dry-run /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2 /var/www/u3736477/data/era-backups
```

## 4. Примените патч и проверьте результат

```bash
bash /var/www/u3736477/data/era-staging/0.48.2/regru_0482_files.sh apply /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2 /var/www/u3736477/data/era-backups
```

```bash
/opt/php/8.3/bin/php /var/www/u3736477/data/era-staging/0.48.2/regru_verify.php /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2/LIVE_AFTER.json
```

Ожидается `Verified 0.48.2 … 1076 public files.`. Повторите сверку юридических файлов из шага 2. Скопированные файлы сохраняют прежние права и владельца.

1. Откройте главную в приватном окне на компьютере и телефоне. Полоса находится у нижнего края, а первый экран начинается сразу после шапки.
2. Откройте быструю связь и настройки cookies. Проверьте Escape, «Отклонить», сохранение выбора после перехода и кнопку настроек в футере.
3. В обычном окне проверьте старый сохранённый выбор. На страницах юридического раздела, которые уже были закешированы, прежние адреса CSS и JavaScript обновляются при ревалидации браузером. Для немедленной проверки используйте приватное окно или жёсткую перезагрузку.
4. Откройте каталог, любую линию, экономику, медиатеку и PDF. Для `GET /api/request.php` ожидается `405`. Приём заявок на этой проверке остаётся выключенным.

## 5. Откатите 0.48.2 при необходимости

Команда восстанавливает из копии только файлы из списка `UPDATE`. Сверьте результат с `BEFORE.json` и повторите проверку SHA-256 юридических файлов из шага 2.

```bash
bash /var/www/u3736477/data/era-staging/0.48.2/regru_0482_files.sh rollback /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2 /var/www/u3736477/data/era-backups
```

```bash
/opt/php/8.3/bin/php /var/www/u3736477/data/era-staging/0.48.2/regru_verify.php /var/www/u3736477/data/www/era-cycle.ru /var/www/u3736477/data/era-staging/0.48.2/BEFORE.json
```

Ожидается `Verified 0.48.1 … 1076 public files.`. Для быстрой проверки старой компоновки воспользуйтесь приватным окном.
