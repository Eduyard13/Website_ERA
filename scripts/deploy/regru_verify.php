<?php

declare(strict_types=1);

// Run from era-staging on the host. This verifier never writes into the site root.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function canonicalPath(string $path): bool
{
    return preg_match('~^/[A-Za-z0-9][A-Za-z0-9_.-]*(?:/[A-Za-z0-9][A-Za-z0-9_.-]*)*/www/era-cycle\.ru$~D', $path) === 1
        || $path === '/www/era-cycle.ru';
}

function managedPath(string $path): bool
{
    if (!preg_match('~^[A-Za-z0-9][A-Za-z0-9_.-]*(?:/[A-Za-z0-9][A-Za-z0-9_.-]*)*$~D', $path)) {
        return false;
    }
    if (in_array(strtolower($path), ['api/request.php', 'data/cbr.json', 'privacy/index.html', 'privacy/consent/index.html'], true)
        || preg_match('~(?:secret|credential|token|password|smtp|private[-_.]?key)s?(?:[-_.]|$)~i', basename($path))
        || preg_match('~(?:^|/)(?:(?:mail-)?config[^/]*\.(?:json|php)|phpinfo\.php|package(?:-lock)?\.json|composer\.json|(?:era-private|era-deploy|era-staging|cgi-bin|logs|node_modules|scripts|server|test|docs)(?:/|$))~i', $path)) {
        return false;
    }
    return preg_match('~\.(?:html|css|js|mjs|webp|png|jpg|jpeg|gif|avif|svg|ico|mp4|webm|pdf|woff|woff2|ttf|wasm|bcmap|pfb|json|txt|xml|map|vtt)$~iD', $path)
        || preg_match('~^vendor/pdfjs/(?:[^/]+/)*LICENSE(?:_[A-Za-z0-9_]+)?$~iD', $path)
        || $path === 'assets/brands/README.md';
}

$lock = null;
$hasLock = false;
try {
    if ($argc !== 3 && $argc !== 4) {
        throw new RuntimeException('Usage: php regru_verify.php WEB_ROOT MANIFEST.json [--record]');
    }
    $root = rtrim($argv[1], '/');
    if (!canonicalPath($root) || realpath($root) !== $root || ($argc === 4 && $argv[3] !== '--record')) {
        throw new RuntimeException('Use the actual absolute path of www/era-cycle.ru');
    }
    if (!is_file($argv[2]) || filesize($argv[2]) > 4_000_000) {
        throw new RuntimeException('Manifest is missing or too large');
    }
    $manifest = json_decode(file_get_contents($argv[2]), true, 32, JSON_THROW_ON_ERROR);
    if (($manifest['schema'] ?? null) !== 1 || ($manifest['domain'] ?? null) !== 'https://era-cycle.ru'
        || !preg_match('/^[a-f0-9]{40}$/D', $manifest['commit'] ?? '')
        || !preg_match('/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/D', $manifest['release'] ?? '')
        || !is_array($manifest['files'] ?? null) || !isset($manifest['files']['index.html'])) {
        throw new RuntimeException('Invalid ERA production manifest');
    }
    if ($argc === 4) {
        $state = dirname($root, 2) . '/era-deploy';
        if (!is_dir($state) || realpath($state) !== $state || (fileperms($state) & 0077) !== 0) {
            throw new RuntimeException('Create the private era-deploy directory with permissions 0700');
        }
        $lock = $state . '/release.lock';
        if (!@mkdir($lock, 0700)) {
            throw new RuntimeException('Release state is locked. Check the last run before recording a baseline');
        }
        $hasLock = true;
    }
    $different = [];
    foreach ($manifest['files'] as $path => $item) {
        if (!is_string($path) || !managedPath($path) || !is_int($item['size'] ?? null) || $item['size'] < 0
            || !preg_match('/^[a-f0-9]{64}$/D', $item['sha256'] ?? '')) {
            throw new RuntimeException('Disallowed file or checksum in manifest');
        }
        $target = $root . '/' . $path;
        if (realpath($target) !== $target || !is_file($target) || filesize($target) !== $item['size']
            || hash_file('sha256', $target) !== $item['sha256']) {
            $different[] = $path;
        }
    }
    if ($different) {
        foreach ($different as $path) {
            fwrite(STDERR, 'MISMATCH ' . $path . PHP_EOL);
        }
        throw new RuntimeException('The live files do not yet match this manifest');
    }
    if ($argc === 4) {
        $temporary = null;
        try {
            $record = $state . '/transaction.json';
            if (is_file($record)) {
                if (is_link($record)) {
                    throw new RuntimeException('Invalid private transaction file');
                }
                $transaction = json_decode(file_get_contents($record), true, 16, JSON_THROW_ON_ERROR);
                if (in_array($transaction['status'] ?? '', ['pending', 'rolling-back'], true)) {
                    throw new RuntimeException('Finish the active release or rollback before recording another baseline');
                }
            }
            $temporary = tempnam($state, '.manifest-');
            $json = json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
            if ($temporary === false || dirname($temporary) !== $state || !chmod($temporary, 0600)
                || file_put_contents($temporary, $json) !== strlen($json)
                || !rename($temporary, $state . '/live-manifest.json')) {
                throw new RuntimeException('Cannot record the verified manifest');
            }
        } finally {
            if (is_string($temporary) && is_file($temporary)) {
                unlink($temporary);
            }
        }
    }
    printf("Verified %s (%s), %d public files.\n", $manifest['release'], $manifest['commit'], count($manifest['files']));
} catch (Throwable $error) {
    fwrite(STDERR, 'Verification stopped. ' . ($error instanceof RuntimeException ? $error->getMessage() : 'Invalid manifest or filesystem error.') . PHP_EOL);
    $failure = true;
} finally {
    if ($hasLock) {
        rmdir($lock);
    }
}
if (isset($failure)) {
    exit(1);
}
