<?php

declare(strict_types=1);

require __DIR__ . '/../../server/regru/private/cbr.php';

function verify(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$clock = new DateTimeImmutable('2026-11-01 00:05:00', new DateTimeZone('Europe/Moscow'));
$fetched = new DateTimeImmutable('2026-10-31T21:05:00Z');
$xml = '<?xml version="1.0" encoding="windows-1251"?>'
    . '<ValCurs Date="31.10.2026">'
    . '<Valute><CharCode>USD</CharCode><Nominal>1</Nominal><Value>90,1234</Value></Valute>'
    . '<Valute><CharCode>EUR</CharCode><Nominal>1</Nominal><Value>100,5678</Value></Valute>'
    . '<Valute><CharCode>CNY</CharCode><Nominal>10</Nominal><Value>125</Value></Valute>'
    . '</ValCurs>';
$data = readCbrRates($xml, $clock, $fetched);
verify($data['requestedDate'] === '2026-11-01', 'CBR request date must use Moscow time');
verify($data['effectiveDate'] === '2026-10-31', 'Effective date must be preserved');
verify($data['fetchedAt'] === '2026-10-31T21:05:00+00:00', 'UTC timestamp');
verify($data['rates']['CNY'] === ['nominal' => 10, 'value' => 125.0, 'rate' => 12.5], 'CNY nominal');
verify($data['sourceUrl'] === 'https://www.cbr.ru/scripts/XML_daily.asp?date_req=01%2F11%2F2026', 'Official URL');
verify($data['sourceSha256'] === hash('sha256', $xml), 'Source provenance');
foreach ([str_replace('31.10.2026', '31.11.2026', $xml), str_replace('31.10.2026', '05.11.2026', $xml),
         str_replace('CNY', 'JPY', $xml), str_replace('CNY', 'EUR', $xml), str_replace('Nominal>10', 'Nominal>0', $xml),
         str_replace('125</Value>', '<foo>125</foo></Value>', $xml), '<!DOCTYPE x><x/>', '<html>Invalid</html>'] as $invalid) {
    $rejected = false;
    try {
        readCbrRates($invalid, $clock, $fetched);
    } catch (RuntimeException) {
        $rejected = true;
    }
    verify($rejected, 'Invalid XML accepted');
}
$directory = sys_get_temp_dir() . '/era-cbr-' . bin2hex(random_bytes(8));
mkdir($directory, 0700);
$file = $directory . '/cbr.json';
try {
    updateCbrSnapshot($file, $clock, fn (string $url): string => $xml);
    $snapshot = file_get_contents($file);
    verify((fileperms($file) & 0777) === 0644, 'Public JSON must not be writable by visitors');
    $rejected = false;
    try {
        updateCbrSnapshot($file, $clock, static function (): string {
            throw new RuntimeException('CBR unavailable');
        });
    } catch (RuntimeException) {
        $rejected = true;
    }
    verify($rejected && file_get_contents($file) === $snapshot, 'A failed fetch must preserve the snapshot');
    $changed = str_replace('125</Value>', '130</Value>', $xml);
    updateCbrSnapshot($file, $clock, fn (): string => $changed);
    verify($snapshot !== file_get_contents($file), 'Successful update must replace the snapshot');
    verify(scandir($directory) === ['.', '..', 'cbr.json'], 'No temporary data should remain');
} finally {
    if (is_file($file)) {
        unlink($file);
    }
    rmdir($directory);
}
echo "CBR: Moscow date, Nominal, malformed XML, atomic update and failure retention verified\n";
