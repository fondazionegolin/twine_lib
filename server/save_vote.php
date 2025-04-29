<?php
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get the JSON data from the request
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Log the received data
error_log("Received vote data: " . print_r($data, true));

// Validate input data
if (!$data || 
    !isset($data['scuola']) || 
    !isset($data['classe']) || 
    !isset($data['nome_progetto']) || 
    !isset($data['voto']) || 
    !isset($data['nome_utente'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required fields'
    ]);
    exit;
}

// Validate vote value
$vote = intval($data['voto']);
if ($vote < 1 || $vote > 5) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Vote must be between 1 and 5'
    ]);
    exit;
}

// Path to the votes file
$votes_file = __DIR__ . '/votes.json';

// Load existing votes or create new file
$votes = [];
if (file_exists($votes_file)) {
    $votes_json = file_get_contents($votes_file);
    $votes = json_decode($votes_json, true) ?: [];
}

// Create a unique key for the vote
$vote_key = sprintf(
    '%s_%s_%s_%s',
    strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $data['scuola'])),
    strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $data['classe'])),
    strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $data['nome_progetto'])),
    strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $data['nome_utente']))
);

// Save or update the vote
$votes[$vote_key] = [
    'scuola' => $data['scuola'],
    'classe' => $data['classe'],
    'nome_progetto' => $data['nome_progetto'],
    'voto' => $vote,
    'nome_utente' => $data['nome_utente'],
    'timestamp' => time()
];

// Save votes to file
if (file_put_contents($votes_file, json_encode($votes, JSON_PRETTY_PRINT))) {
    // Calculate average vote for the project
    $project_votes = array_filter($votes, function($v) use ($data) {
        return $v['scuola'] === $data['scuola'] &&
               $v['classe'] === $data['classe'] &&
               $v['nome_progetto'] === $data['nome_progetto'];
    });
    
    $avg_vote = array_sum(array_column($project_votes, 'voto')) / count($project_votes);
    
    echo json_encode([
        'success' => true,
        'message' => 'Vote saved successfully',
        'average' => round($avg_vote, 1)
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save vote'
    ]);
}
?> 