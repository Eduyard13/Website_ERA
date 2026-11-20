<?php

declare(strict_types=1);

require_once __DIR__ . '/runtime.php';

const CBR_SOURCE = 'https://www.cbr.ru/scripts/XML_daily.asp';
const CBR_CODES = ['USD', 'EUR', 'CNY'];
const CBR_MAX_BYTES = 262144;

function cbrRequestUrl(DateTimeImmutable $date): string
{
    return CBR_SOURCE . '?date_req=' . rawurlencode($date->format('d/m/Y'));
}

function fetchCbrXml(string $url): string
{
    $xml = '';
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT => 18,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => ['Accept: application/xml,text/xml;q=0.9'],
        CURLOPT_USERAGENT => 'ERA-Website/1.0 (+https://era-cycle.ru/)',
        CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$xml): int {
            if (strlen($xml) + strlen($chunk) > CBR_MAX_BYTES) {
                return 0;
            }
            $xml .= $chunk;
            return strlen($chunk);
        },
    ]);
    try {
        if (curl_exec($curl) !== true || curl_getinfo($curl, CURLINFO_RESPONSE_CODE) !== 200) {
            throw new RuntimeException('CBR response unavailable');
        }
        return $xml;
    } finally {
        curl_close($curl);
    }
}

function readCbrRates(string $xml, DateTimeImmutable $requested, DateTimeImmutable $fetched): array
{
    if ($xml === '' || strlen($xml) > CBR_MAX_BYTES || preg_match('/<!DOCTYPE|<!ENTITY/i', $xml)) {
        throw new RuntimeException('Invalid CBR XML');
    }
    $previous = libxml_use_internal_errors(true);
    try {
        $root = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NONET);
    } finally {
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
    }
    if ($root === false || $root->getName() !== 'ValCurs' || $root->getDocNamespaces() !== []
        || !preg_match('/^(\d{2})\.(\d{2})\.(\d{4})$/D', (string)$root['Date'], $parts)
        || !checkdate((int)$parts[2], (int)$parts[1], (int)$parts[3])) {
        throw new RuntimeException('Invalid CBR rate date');
    }
    $effectiveDate = $parts[3] . '-' . $parts[2] . '-' . $parts[1];
    $requestedDate = $requested->format('Y-m-d');
    if ($effectiveDate > $requestedDate) {
        throw new RuntimeException('CBR effective date is later than the request date');
    }
    $rates = [];
    foreach ($root->Valute as $item) {
        $code = trim((string)$item->CharCode);
        if (!in_array($code, CBR_CODES, true)) {
            continue;
        }
        $nominal = trim((string)$item->Nominal);
        $value = preg_replace('/[\s\x{00A0}]+/u', '', (string)$item->Value);
        if (isset($rates[$code]) || count($item->CharCode) !== 1 || count($item->Nominal) !== 1 || count($item->Value) !== 1
            || !preg_match('/^\d{1,9}$/D', $nominal) || (int)$nominal < 1
            || $value === null || !preg_match('/^\d{1,12}(?:[,.]\d{1,10})?$/D', $value)) {
            throw new RuntimeException('Invalid CBR currency entry');
        }
        $amount = (float)str_replace(',', '.', $value);
        if (!is_finite($amount) || $amount <= 0) {
            throw new RuntimeException('Invalid CBR rate');
        }
        $rates[$code] = ['nominal' => (int)$nominal, 'value' => $amount, 'rate' => $amount / (int)$nominal];
    }
    if (count($rates) !== count(CBR_CODES)) {
        throw new RuntimeException('Missing CBR currencies');
    }
    return [
        'schemaVersion' => 1,
        'source' => 'CBR',
        'sourceUrl' => cbrRequestUrl($requested),
        'requestedDate' => $requestedDate,
        'effectiveDate' => $effectiveDate,
        'fetchedAt' => $fetched->setTimezone(new DateTimeZone('UTC'))->format(DATE_ATOM),
        'rates' => $rates,
        'sourceSha256' => hash('sha256', $xml),
    ];
}

function updateCbrSnapshot(string $output, DateTimeImmutable $requested, ?callable $fetcher = null): array
{
    $xml = ($fetcher ?? 'fetchCbrXml')(cbrRequestUrl($requested));
    $data = readCbrRates($xml, $requested, new DateTimeImmutable());
    replaceFile($output, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n", 0644);
    return $data;
}
