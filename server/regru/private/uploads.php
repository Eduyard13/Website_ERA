<?php

declare(strict_types=1);

const MAX_ATTACHMENT_BYTES = 5_000_000;
const MAX_ATTACHMENTS = 20;

function invalidFile(): never
{
    throw new RequestFailure(422, 'Проверьте имена и типы вложений. Принимаются фотографии, видео и PDF или архив, созданный формой сайта.');
}

function largeUpload(): never
{
    throw new RequestFailure(413, 'Общий размер вложений превышает 5 МБ. Передайте крупные материалы ссылкой.');
}

function attachmentExtension(string $name): string
{
    if (strlen($name) > 180 || !preg_match('/^[^\s.][^\p{C}\/\\\\<>:"|?*]*\.[a-z0-9]+$/iuD', $name)
        || preg_match('/\.(?:php[0-9]*|phtml|phar|exe|dll|com|cmd|bat|ps1|msi|html?|svg|js|sh|zip)(?=\.)/i', $name)) {
        invalidFile();
    }
    return strtolower(pathinfo($name, PATHINFO_EXTENSION));
}

function validateBundle(string $file, array $types): void
{
    $zip = new ZipArchive();
    if ($zip->open($file, ZipArchive::RDONLY | ZipArchive::CHECKCONS) !== true) {
        invalidFile();
    }
    try {
        if ($zip->numFiles < 1 || $zip->numFiles > MAX_ATTACHMENTS) {
            invalidFile();
        }
        $sum = 0;
        $names = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entry = $zip->statIndex($i);
            if ($entry === false || !isset($types[attachmentExtension($entry['name'])])
                || $entry['comp_method'] !== ZipArchive::CM_STORE || $entry['comp_size'] !== $entry['size']
                || $entry['encryption_method'] !== ZipArchive::EM_NONE || $entry['size'] <= 0
                || !$zip->getExternalAttributesIndex($i, $os, $attributes)
                || ($os === ZipArchive::OPSYS_UNIX && !in_array(($attributes >> 16) & 0170000, [0, 0100000], true))) {
                invalidFile();
            }
            $normalized = strtolower($entry['name']);
            if (isset($names[$normalized])) {
                invalidFile();
            }
            $names[$normalized] = true;
            $sum += $entry['size'];
            if ($sum > MAX_ATTACHMENT_BYTES) {
                largeUpload();
            }
        }
    } finally {
        $zip->close();
    }
}

function acceptedUploads(array $files): array
{
    if ($files === []) {
        return [];
    }
    $uploads = $files['attachment'] ?? null;
    if (count($files) !== 1 || !is_array($uploads) || !is_array($uploads['error'] ?? null) || !array_is_list($uploads['error'])) {
        invalidFile();
    }
    if (count($uploads['error']) > MAX_ATTACHMENTS) {
        throw new RequestFailure(422, 'Приложите до 20 файлов. Остальные материалы передайте ссылкой.');
    }
    $types = json_decode(file_get_contents(__DIR__ . '/attachment-types.json'), true, 8, JSON_THROW_ON_ERROR);
    $mimeType = new finfo(FILEINFO_MIME_TYPE);
    $result = [];
    $size = 0;
    foreach ($uploads['error'] as $i => $error) {
        if ($error === UPLOAD_ERR_NO_FILE && count($uploads['error']) === 1) {
            return [];
        }
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            largeUpload();
        }
        $name = $uploads['name'][$i] ?? null;
        $file = $uploads['tmp_name'][$i] ?? null;
        if ($error !== UPLOAD_ERR_OK || !is_string($name) || !is_string($file)
            || ($uploads['full_path'][$i] ?? $name) !== $name || !is_uploaded_file($file)) {
            invalidFile();
        }
        $length = filesize($file);
        if ($length === false || $length < 1) {
            invalidFile();
        }
        $size += $length;
        if ($size > MAX_ATTACHMENT_BYTES) {
            largeUpload();
        }
        $ext = attachmentExtension($name);
        $mime = $mimeType->file($file);
        if ($ext === 'zip' && $mime === 'application/zip' && count($uploads['error']) === 1) {
            validateBundle($file, $types);
        } elseif (!in_array($mime, $types[$ext] ?? [], true)) {
            invalidFile();
        }
        $hash = hash_file('sha256', $file);
        if ($hash === false) {
            invalidFile();
        }
        $result[] = ['file' => $file, 'name' => $name, 'mime' => $mime, 'sha256' => $hash];
    }
    return $result;
}
