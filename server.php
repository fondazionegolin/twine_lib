<?php
// Avvia un server PHP integrato per lo sviluppo
// Esegui questo script con: php -S localhost:8000 server.php

// Imposta l'header per consentire CORS durante lo sviluppo
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestisci la richiesta
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Servi il file richiesto
$file = __DIR__ . $path;

// Debug
error_log("Richiesta: $uri => $file");

// Se il percorso è la root, servi index.html
if ($path === '/') {
    $file = __DIR__ . '/index.html';
}

// Verifica se il file esiste e non è una directory
if (is_file($file)) {
    // Determina il tipo MIME
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    switch ($ext) {
        case 'html':
            header('Content-Type: text/html');
            break;
        case 'css':
            header('Content-Type: text/css');
            break;
        case 'js':
            header('Content-Type: application/javascript');
            break;
        case 'json':
            header('Content-Type: application/json');
            break;
        case 'png':
            header('Content-Type: image/png');
            break;
        case 'jpg':
        case 'jpeg':
            header('Content-Type: image/jpeg');
            break;
        case 'gif':
            header('Content-Type: image/gif');
            break;
    }
    
    readfile($file);
    return true;
}

// Se non è un file esistente, servi index.html (per gestire il routing lato client)
readfile(__DIR__ . '/index.html');
return true;
?>
