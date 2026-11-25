<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/runtime.php';
require_once __DIR__ . '/uploads.php';

const ERA_ORIGIN = 'https://era-cycle.ru';
const REQUEST_RECIPIENT = 'info@era-cycle.ru';
const REQUEST_SENDER = 'noreply@era-cycle.ru';
const REQUEST_CONSENT_REVISION = 'ERA-PD-1.3';
const PRIVACY_POLICY_REVISION = 'ERA-PRIVACY-1.3';
const THROTTLE_SECONDS = 600;

final class RequestFailure extends RuntimeException
{
    public function __construct(int $status, string $message, public readonly int $retryAfter = 0)
    {
        parent::__construct($message, $status);
    }
}

function requestText(mixed $value, int $limit, bool $multiline = false): string
{
    if (!is_string($value) || strlen($value) > $limit * 4 || !preg_match('//u', $value)) {
        throw new RequestFailure(422, 'Проверьте длину и содержание полей заявки.');
    }
    $value = $multiline ? str_replace(["\r\n", "\r"], "\n", $value) : $value;
    $controls = $multiline ? '/[\x00-\x08\x0B-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';
    if (preg_match($controls, $value) || preg_match_all('/./su', $value) > $limit) {
        throw new RequestFailure(422, 'Проверьте длину и содержание полей заявки.');
    }
    return trim($value);
}

function localPath(string $path): string
{
    if (str_starts_with($path, ERA_ORIGIN . '/')) {
        $path = substr($path, strlen(ERA_ORIGIN));
    }
    if (str_starts_with($path, '/') && !str_starts_with($path, '//') && !str_contains($path, '\\')) {
        $path = explode('?', explode('#', $path, 2)[0], 2)[0];
        if (preg_match('~^/[a-zA-Z0-9_/-]*$~D', $path)) {
            return $path;
        }
    }
    return '';
}

function formContext(): array
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if (($origin !== '' && $origin !== ERA_ORIGIN)
        || ($referer !== '' && !str_starts_with($referer, ERA_ORIGIN . '/'))) {
        throw new RequestFailure(403, 'Откройте форму заявки на era-cycle.ru.');
    }
    $parameters = [];
    if ($referer !== '' && rtrim(localPath($referer), '/') === '/contacts') {
        parse_str(parse_url($referer, PHP_URL_QUERY) ?: '', $parameters);
    }
    $topic = requestText($_POST['Интересует'] ?? '', 200);
    $source = localPath(requestText($_POST['Страница_обращения'] ?? '', 512));
    if ($source === '') {
        $source = localPath(requestText($parameters['source'] ?? '', 512)) ?: (localPath($referer) ?: '/contacts/');
    }
    return [$topic !== '' ? $topic : requestText($parameters['topic'] ?? '', 200), ERA_ORIGIN . $source];
}

function limitRequests(string $directory, string $visitor, ?string $fingerprint = null): void
{
    $lock = fopen($directory . '/requests.lock', 'c');
    if ($lock === false) {
        throw new RuntimeException('Cannot open rate limit lock');
    }
    try {
        if (!flock($lock, LOCK_EX)) {
            throw new RuntimeException('Cannot lock request state');
        }
        $file = $directory . '/requests.json';
        $state = is_file($file) ? json_decode(file_get_contents($file), true, 8, JSON_THROW_ON_ERROR) : [];
        $now = time();
        $attempts = array_values(array_filter($state['attempts'] ?? [], fn (array $record) => $record[1] > $now - THROTTLE_SECONDS));
        $seen = array_filter($state['seen'] ?? [], fn (int $expires) => $expires > $now);
        if ($fingerprint !== null) {
            if (isset($seen[$fingerprint])) {
                throw new RequestFailure(409, 'Похожая заявка уже обрабатывается или была отправлена. Дождитесь ответа или обновите материалы.', $seen[$fingerprint] - $now);
            }
            // Reserve before SMTP. An interrupted SMTP acknowledgement is not retried automatically.
            $seen[$fingerprint] = $now + THROTTLE_SECONDS;
        } else {
            $perVisitor = count(array_filter($attempts, fn (array $record) => $record[0] === $visitor));
            if ($perVisitor >= 6 || count($attempts) >= 120) {
                throw new RequestFailure(429, 'Слишком много попыток. Попробуйте через несколько минут или напишите на почту.', THROTTLE_SECONDS);
            }
            $attempts[] = [$visitor, $now];
        }
        replaceFile($file, json_encode(['attempts' => $attempts, 'seen' => $seen], JSON_THROW_ON_ERROR), 0600);
    } finally {
        fclose($lock);
    }
}

function hasApprovedLegalDocument(string $file, string $revision): bool
{
    return is_readable($file) && str_contains((string)file_get_contents($file),
        'data-policy-status="approved" data-pd-revision="' . $revision . '"');
}

// Use a fixed, server-controlled line name derived from the validated source path.
function requestMailSubject(string $source): string
{
    $line = match (rtrim(localPath($source), '/')) {
        '/catalog/lines/separatsiya-01' => 'Сухая сепарация · BASE',
        '/catalog/lines/separatsiya-02' => 'Сухая сепарация · PRO',
        '/catalog/lines/separatsiya-03' => 'Сухая сепарация и сушка · PREMIUM',
        '/catalog/lines/moyka-plenki' => 'Линия горячей мойки плёнок и пакетов',
        default => '',
    };
    return 'Заявка с сайта ЭРА' . ($line !== '' ? ' — ' . $line : '');
}

function receiveRequest(string $privateDir, string $webRoot): void
{
    [$topic, $source] = formContext();
    if (($_POST['_honey'] ?? '') !== '') {
        throw new RequestFailure(422, 'Откройте форму сайта и проверьте поля заявки.');
    }
    if (($_POST['Согласие'] ?? '') !== '1') {
        throw new RequestFailure(422, 'Для отправки подтвердите согласие на обработку персональных данных.');
    }
    if (($_POST['consent_revision'] ?? '') !== REQUEST_CONSENT_REVISION) {
        throw new RequestFailure(422, 'Обновите страницу и подтвердите действующую редакцию согласия.');
    }
    $name = requestText($_POST['Имя'] ?? '', 100);
    $email = requestText($_POST['email'] ?? '', 254);
    $task = requestText($_POST['Задача'] ?? '', 6000, true);
    if ($name === '' || $task === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RequestFailure(422, 'Укажите имя, корректный адрес электронной почты и опишите задачу.');
    }
    $fields = [
        'Имя' => $name,
        'Электронная почта' => $email,
        'Телефон' => requestText($_POST['Телефон'] ?? '', 40),
        'Компания' => requestText($_POST['Компания'] ?? '', 160),
        'Интересует' => $topic,
        'Задача' => $task,
        'Ссылки' => requestText($_POST['Ссылки'] ?? '', 4000, true),
    ];
    $settings = loadSettings($privateDir);
    if (($settings['requests_enabled'] ?? false) !== true
        || ($settings['privacy_version'] ?? '') !== REQUEST_CONSENT_REVISION
        || !hasApprovedLegalDocument($webRoot . '/privacy/index.html', PRIVACY_POLICY_REVISION)
        || !hasApprovedLegalDocument($webRoot . '/privacy/consent/index.html', REQUEST_CONSENT_REVISION)) {
        throw new RequestFailure(503, 'Приём заявок через форму пока недоступен. Свяжитесь с ЭРА через раздел «Контакты».');
    }
    $secret = $settings['rate_secret'] ?? '';
    $smtp = $settings['smtp'] ?? [];
    if (realpath((string)($settings['web_root'] ?? '')) !== realpath($webRoot)
        || !is_string($secret) || !preg_match('/^[0-9a-f]{64}$/iD', $secret)
        || !is_string($smtp['host'] ?? null) || !preg_match('/^[a-zA-Z0-9.-]+$/D', $smtp['host'])
        || !is_int($smtp['port'] ?? null) || $smtp['port'] < 1 || $smtp['port'] > 65535
        || !is_string($smtp['password'] ?? null) || $smtp['password'] === '') {
        throw new RuntimeException('Incomplete mail settings');
    }
    $state = stateDirectory($privateDir);
    $visitor = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $secret);
    limitRequests($state, $visitor);
    $attachments = acceptedUploads($_FILES);
    $material = array_column($attachments, 'sha256');
    sort($material);
    $fingerprint = hash_hmac('sha256', json_encode([$fields, $material], JSON_THROW_ON_ERROR), $secret);
    limitRequests($state, $visitor, $fingerprint);

    $fields['Страница обращения'] = $source;
    $fields['Согласие на обработку данных'] = 'Подтверждено отдельной галочкой · ' . REQUEST_CONSENT_REVISION . ' · ' . gmdate('c');
    if ($attachments) {
        $fields['Вложения'] = implode(', ', array_column($attachments, 'name'));
    }
    $body = [];
    foreach ($fields as $label => $value) {
        if ($value !== '') {
            $body[] = $label . ":\n" . $value;
        }
    }
    try {
        foreach (['Exception', 'PHPMailer', 'SMTP'] as $class) {
            require_once __DIR__ . '/vendor/phpmailer/src/' . $class . '.php';
        }
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $smtp['host'];
        $mail->Port = $smtp['port'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->SMTPAuth = true;
        $mail->Username = REQUEST_SENDER;
        $mail->Password = $smtp['password'];
        $mail->SMTPOptions = ['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false]];
        $mail->Timeout = 8;
        $mail->getSMTPInstance()->Timelimit = 8;
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_BASE64;
        $mail->setFrom(REQUEST_SENDER, 'ЭРА');
        $mail->addAddress(REQUEST_RECIPIENT);
        $mail->addReplyTo($email);
        $mail->Subject = requestMailSubject($source);
        $mail->Body = implode("\n\n", $body);
        foreach ($attachments as $item) {
            $mail->addAttachment($item['file'], $item['name'], PHPMailer::ENCODING_BASE64, $item['mime']);
        }
        if (!$mail->send()) {
            throw new RuntimeException('SMTP did not acknowledge the request');
        }
    } catch (Throwable) {
        logServerEvent($state, 'smtp-unconfirmed');
        throw new RequestFailure(502, 'Не удалось подтвердить отправку. Свяжитесь с ЭРА по почте или повторите попытку позже.');
    }
    logServerEvent($state, 'smtp-accepted');
}
