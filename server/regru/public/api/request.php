<?php

declare(strict_types=1);

ini_set('display_errors', '0');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');

function requestError(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    $message = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo <<<HTML
<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Статус заявки — ЭРА</title><link rel="stylesheet" href="/style.css"></head>
<body><main class="section"><h1>Заявка не подтверждена.</h1><p role="alert">{$message}</p>
<p>Используйте кнопку браузера «Назад», чтобы вернуться к введённым данным, или <a href="/contacts/#project-form">откройте форму</a>.</p>
</main></body></html>
HTML;
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    requestError(405, 'Заявки отправляются через форму на сайте.');
}
if (!preg_match('/^multipart\/form-data\s*;\s*boundary\s*=/i', $_SERVER['CONTENT_TYPE'] ?? '')) {
    requestError(415, 'Откройте форму сайта и отправьте заявку ещё раз.');
}
// Five million bytes for files and room for multipart headers and UTF-8 fields.
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 5_131_072) {
    requestError(413, 'Общий размер вложений превышает 5 МБ. Передайте крупные материалы ссылкой.');
}

$webRoot = dirname(__DIR__);
$sitesRoot = dirname($webRoot);
$configuredPrivateDir = getenv('ERA_PRIVATE_DIR') ?: dirname($sitesRoot) . '/era-private';
$privateDir = realpath($configuredPrivateDir);
$publicBoundary = basename($sitesRoot) === 'www' ? $sitesRoot : $webRoot;
if ($privateDir === false || $privateDir === $publicBoundary
    || str_starts_with($privateDir . '/', $publicBoundary . '/')
    || !is_file($privateDir . '/request-handler.php')) {
    requestError(503, 'Приём заявок через форму временно недоступен. Свяжитесь с ЭРА через раздел «Контакты».');
}

try {
    require $privateDir . '/request-handler.php';
    receiveRequest($privateDir, $webRoot);
    header('Location: /contacts/sent/', true, 303);
} catch (RequestFailure $failure) {
    if ($failure->retryAfter > 0) {
        header('Retry-After: ' . $failure->retryAfter);
    }
    requestError($failure->getCode(), $failure->getMessage());
} catch (Throwable) {
    error_log('ERA request: service initialization or storage failure');
    requestError(503, 'Сервис временно недоступен. Попробуйте позже или свяжитесь с ЭРА через раздел «Контакты».');
}
