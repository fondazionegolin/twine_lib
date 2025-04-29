<?php
/**
 * Script per scansionare automaticamente i progetti Twine e generare il file projects.json
 * Estrae i metadati dai nomi dei file e dalla struttura delle directory
 */

// Directory dei progetti
$projectsDir = __DIR__ . '/../progetti';
$outputFile = __DIR__ . '/projects.json';

// Verifica che la directory esista
if (!is_dir($projectsDir)) {
    die("La directory dei progetti non esiste: $projectsDir\n");
}

// Scansiona le directory delle classi
$classes = [];
$projects = [];

$classDirs = glob($projectsDir . '/*', GLOB_ONLYDIR);
foreach ($classDirs as $classDir) {
    $className = basename($classDir);
    
    // Verifica se è una directory di classe valida (formato: classeXY)
    if (preg_match('/^classe[0-9]+[A-Z]$/', $className)) {
        $classes[] = $className;
        
        // Scansiona i file HTML nella directory della classe
        $htmlFiles = glob($classDir . '/*.html');
        $classProjects = [];
        
        foreach ($htmlFiles as $htmlFile) {
            $fileName = basename($htmlFile);
            $projectId = $className . '_' . pathinfo($fileName, PATHINFO_FILENAME);
            
            // Estrai metadati dal file HTML
            $metadata = extractMetadataFromHtml($htmlFile);
            $projectName = $metadata['title'] ?: formatProjectName(pathinfo($fileName, PATHINFO_FILENAME));
            
            $classProjects[] = [
                'id' => $projectId,
                'name' => $projectName,
                'description' => $metadata['description'] ?: "Progetto Twine della classe " . substr($className, 6),
                'file' => "$className/$fileName",
                'authors' => $metadata['authors'] ?: [],
                'tags' => $metadata['tags'] ?: []
            ];
        }
        
        if (!empty($classProjects)) {
            $projects[$className] = $classProjects;
        }
    }
}

// Salva il file projects.json
if (file_put_contents($outputFile, json_encode($projects, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo "File projects.json generato con successo.\n";
    echo "Classi trovate: " . count($classes) . "\n";
    echo "Progetti totali: " . array_sum(array_map('count', $projects)) . "\n";
} else {
    echo "Errore nella generazione del file projects.json.\n";
}

/**
 * Estrae i metadati da un file HTML di Twine
 * @param string $filePath Percorso del file HTML
 * @return array Array con i metadati estratti
 */
function extractMetadataFromHtml($filePath) {
    $metadata = [
        'title' => '',
        'description' => '',
        'authors' => [],
        'tags' => []
    ];
    
    // Leggi il contenuto del file
    $content = file_get_contents($filePath);
    if (!$content) {
        return $metadata;
    }
    
    // Estrai il titolo
    if (preg_match('/<title>(.*?)<\/title>/i', $content, $matches)) {
        $metadata['title'] = trim($matches[1]);
    }
    
    // Estrai la descrizione dai meta tag
    if (preg_match('/<meta name="description" content="(.*?)"/i', $content, $matches)) {
        $metadata['description'] = trim($matches[1]);
    }
    
    // Cerca informazioni sugli autori
    // Molti progetti Twine potrebbero avere queste informazioni in commenti o in div specifici
    if (preg_match('/<!-- authors?: (.*?) -->/i', $content, $matches)) {
        $authorsStr = trim($matches[1]);
        $metadata['authors'] = array_map('trim', explode(',', $authorsStr));
    }
    
    // Cerca tag o parole chiave
    if (preg_match('/<!-- tags?: (.*?) -->/i', $content, $matches)) {
        $tagsStr = trim($matches[1]);
        $metadata['tags'] = array_map('trim', explode(',', $tagsStr));
    }
    
    // Se non abbiamo trovato una descrizione, proviamo a estrarre il primo paragrafo significativo
    if (empty($metadata['description'])) {
        if (preg_match('/<p>(.*?)<\/p>/i', $content, $matches)) {
            $firstParagraph = strip_tags($matches[1]);
            if (strlen($firstParagraph) > 10) {  // Assicuriamoci che sia un paragrafo significativo
                $metadata['description'] = substr($firstParagraph, 0, 150) . (strlen($firstParagraph) > 150 ? '...' : '');
            }
        }
    }
    
    return $metadata;
}

/**
 * Formatta il nome del progetto a partire dal nome del file
 * @param string $filename Nome del file senza estensione
 * @return string Nome del progetto formattato
 */
function formatProjectName($filename) {
    // Sostituisci underscore e trattini con spazi
    $name = str_replace(['_', '-'], ' ', $filename);
    
    // Capitalizza la prima lettera di ogni parola
    $name = ucwords($name);
    
    return $name;
}
?>
