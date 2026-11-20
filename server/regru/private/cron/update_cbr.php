<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/cbr.php';

$privateDir = dirname(__DIR__);
$state = null;
$lock = null;
try {
    $settings = loadSettings($privateDir);
    $root = realpath((string)($settings['web_root'] ?? ''));
    if ($root === false || !is_file($root . '/index.html') || realpath($root . '/data') !== $root . '/data'
        || is_link($root . '/data/cbr.json')) {
        throw new RuntimeException('Invalid document root or data directory');
    }
    $state = stateDirectory($privateDir);
    $lock = fopen($state . '/cbr.lock', 'c');
    if ($lock === false) {
        throw new RuntimeException('Cannot lock exchange-rate updater');
    }
    if (!flock($lock, LOCK_EX | LOCK_NB, $wouldBlock)) {
        if (!$wouldBlock) {
            throw new RuntimeException('Cannot lock exchange-rate updater');
        }
        exit(0);
    }
    $today = new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow'));
    $data = updateCbrSnapshot($root . '/data/cbr.json', $today);
    logServerEvent($state, 'cbr-updated');
    echo 'CBR: requested ' . $data['requestedDate'] . '; effective ' . $data['effectiveDate'] . "\n";
} catch (Throwable) {
    if ($state !== null) {
        logServerEvent($state, 'cbr-unavailable');
    }
    fwrite(STDERR, "CBR update failed. Previous data were preserved. Check config permissions, PHP cURL and SimpleXML, and outbound HTTPS.\n");
    exit(1);
} finally {
    if (is_resource($lock)) {
        fclose($lock);
    }
}
