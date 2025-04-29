<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "twine_library";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crea la tabella dei voti se non esiste
    $sql = "CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        scuola VARCHAR(255) NOT NULL,
        classe VARCHAR(255) NOT NULL,
        nome_progetto VARCHAR(255) NOT NULL,
        voto INT NOT NULL CHECK (voto >= 1 AND voto <= 5),
        nome_utente VARCHAR(255) NOT NULL,
        data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vote (nome_utente, nome_progetto)
    )";
    
    $conn->exec($sql);
    
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?> 