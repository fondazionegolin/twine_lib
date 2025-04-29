<?php
header('Content-Type: application/json');

// Verifica il metodo della richiesta
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Metodo non consentito']);
    exit;
}

// Leggi il corpo della richiesta
$input = json_decode(file_get_contents('php://input'), true);

// Verifica i dati ricevuti
if (!isset($input['projectId']) || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dati mancanti']);
    exit;
}

$projectId = $input['projectId'];
$action = $input['action'];

// Percorso del file dei like
$likesFile = __DIR__ . '/likes.json';

// Carica i like esistenti
$likes = [];
if (file_exists($likesFile)) {
    $likesContent = file_get_contents($likesFile);
    $likes = json_decode($likesContent, true) ?: [];
}

// Aggiorna i like
if ($action === 'add') {
    $likes[$projectId] = isset($likes[$projectId]) ? $likes[$projectId] + 1 : 1;
} elseif ($action === 'remove') {
    $likes[$projectId] = isset($likes[$projectId]) && $likes[$projectId] > 0 ? $likes[$projectId] - 1 : 0;
}

// Salva i like aggiornati
if (file_put_contents($likesFile, json_encode($likes, JSON_PRETTY_PRINT))) {
    // Aggiorna anche il CSV per facilità di analisi
    updateCsv($likes);
    
    echo json_encode(['success' => true, 'likes' => $likes[$projectId]]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Impossibile salvare i like']);
}

/**
 * Aggiorna il file CSV con i dati dei like
 * @param array $likes Array associativo di like (projectId => count)
 */
function updateCsv($likes) {
    // Percorso del file CSV
    $csvFile = __DIR__ . '/likes.csv';
    
    // Carica i progetti per ottenere i nomi
    $projectsFile = __DIR__ . '/projects.json';
    $projects = [];
    $projectNames = [];
    
    if (file_exists($projectsFile)) {
        $projectsContent = file_get_contents($projectsFile);
        $projects = json_decode($projectsContent, true) ?: [];
        
        // Crea un mapping projectId => projectName
        foreach ($projects as $classProjects) {
            foreach ($classProjects as $project) {
                $projectNames[$project['id']] = $project['name'];
            }
        }
    }
    
    // Prepara i dati per il CSV
    $csvData = [['ID Progetto', 'Nome Progetto', 'Numero di Like']];
    
    foreach ($likes as $projectId => $likeCount) {
        $projectName = $projectNames[$projectId] ?? 'Progetto sconosciuto';
        $csvData[] = [$projectId, $projectName, $likeCount];
    }
    
    // Scrivi il file CSV
    $fp = fopen($csvFile, 'w');
    
    foreach ($csvData as $row) {
        fputcsv($fp, $row);
    }
    
    fclose($fp);
}
?>
