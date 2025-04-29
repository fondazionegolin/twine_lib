<?php
require_once 'db_config.php';
header('Content-Type: application/json');

try {
    $stmt = $conn->query("SELECT scuola, classe, nome_progetto, voto FROM votes");
    $votes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($votes);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 