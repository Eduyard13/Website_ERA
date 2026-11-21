<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

try {
    if ($argc !== 4) {
        throw new RuntimeException('Usage: php regru_verify_0481_protected.php MANIFEST.json PUBLIC_ROOT PRIVATE_ROOT');
    }
    [$script, $manifestPath, $public, $private] = $argv;
    foreach ([$public, $private] as $root) {
        if ($root === '/' || !is_dir($root) || realpath($root) !== $root) {
            throw new RuntimeException('Use absolute, canonical root paths without symbolic links');
        }
    }
    if ($private === $public || str_starts_with($private, $public . '/')) {
        throw new RuntimeException('The private directory must be outside the public root');
    }
    if (!is_file($manifestPath) || filesize($manifestPath) > 4096) {
        throw new RuntimeException('Invalid protected manifest file');
    }
    $manifest = json_decode(file_get_contents($manifestPath), true, 8, JSON_THROW_ON_ERROR);
    $paths = [
        'public/privacy/index.html' => $public . '/privacy/index.html',
        'public/privacy/consent/index.html' => $public . '/privacy/consent/index.html',
        'private/request-handler.php' => $private . '/request-handler.php',
    ];
    $files = $manifest['files'] ?? null;
    if (($manifest['schema'] ?? null) !== 1 || ($manifest['release'] ?? '') !== '0.48.1'
        || ($manifest['base_commit'] ?? '') !== 'ca9b8f6ee4a08e82dce65cafa8a80569bf3dd680'
        || !preg_match('/^[a-f0-9]{40}$/D', $manifest['commit'] ?? '')
        || !is_array($files) || count($files) !== count($paths) || array_diff_key($paths, $files)) {
        throw new RuntimeException('Unexpected protected release or files');
    }
    foreach ($paths as $name => $target) {
        $item = $files[$name];
        if (!is_int($item['size'] ?? null) || $item['size'] < 0 || !preg_match('/^[a-f0-9]{64}$/D', $item['sha256'] ?? '')) {
            throw new RuntimeException('Invalid protected checksum metadata');
        }
        if (realpath($target) !== $target || !is_file($target) || filesize($target) !== $item['size']
            || hash_file('sha256', $target) !== $item['sha256']) {
            throw new RuntimeException('MISMATCH ' . $name);
        }
    }
    printf("Verified ERA 0.48.1 protected files (%s), %d files.\n", $manifest['commit'], count($paths));
} catch (Throwable $error) {
    fwrite(STDERR, 'Verification stopped. ' . ($error instanceof RuntimeException ? $error->getMessage() : 'Invalid manifest or filesystem error.') . PHP_EOL);
    exit(1);
}
