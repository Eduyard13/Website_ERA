<?php

declare(strict_types=1);

function loadSettings(string $privateDir): array
{
    $path = $privateDir . '/config.json';
    if (is_link($path) || !is_file($path) || (fileperms($path) & 0077) !== 0 || filesize($path) > 8192) {
        throw new RuntimeException('Private configuration is missing or its permissions are incorrect');
    }
    $settings = json_decode(file_get_contents($path), true, 16, JSON_THROW_ON_ERROR);
    if (!is_array($settings)) {
        throw new RuntimeException('Invalid private configuration');
    }
    return $settings;
}

function stateDirectory(string $privateDir): string
{
    $path = $privateDir . '/state';
    if (!is_dir($path) && !@mkdir($path, 0700) && !is_dir($path)) {
        throw new RuntimeException('Private state directory is unavailable');
    }
    if (is_link($path) || (fileperms($path) & 0077) !== 0) {
        throw new RuntimeException('Private state directory permissions are incorrect');
    }
    return $path;
}

function replaceFile(string $output, string $contents, int $permissions): void
{
    $temporary = tempnam(dirname($output), '.era-');
    if ($temporary === false) {
        throw new RuntimeException('Cannot stage update');
    }
    try {
        if (dirname($temporary) !== dirname($output) || file_put_contents($temporary, $contents) !== strlen($contents)
            || !chmod($temporary, $permissions) || !rename($temporary, $output)) {
            throw new RuntimeException('Cannot publish update');
        }
    } finally {
        if (is_file($temporary)) {
            unlink($temporary);
        }
    }
}

function logServerEvent(string $directory, string $event): void
{
    $log = $directory . '/events.log';
    // Only fixed event codes and UTC timestamps. Rotate at 256 KiB.
    clearstatcache(true, $log);
    if (is_file($log) && filesize($log) > 262144) {
        @rename($log, $directory . '/events.previous.log');
    }
    @file_put_contents($log, gmdate('c') . ' ' . $event . "\n", FILE_APPEND | LOCK_EX);
}
