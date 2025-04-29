<?php
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get the JSON data from the request
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Validate input
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing username or password'
    ]);
    exit;
}

// Path to the users file
$users_file = __DIR__ . '/users.json';

// Load existing users
if (!file_exists($users_file)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid username or password'
    ]);
    exit;
}

$users = json_decode(file_get_contents($users_file), true) ?: [];

// Check if user exists and password matches
$username = $data['username'];
if (isset($users[$username]) && password_verify($data['password'], $users[$username]['password'])) {
    // Login successful
    echo json_encode([
        'success' => true,
        'user' => [
            'username' => $username,
            'nome' => $users[$username]['nome'] ?? '',
            'cognome' => $users[$username]['cognome'] ?? '',
            'avatar' => $users[$username]['avatar'] ?? '',
            'is_admin' => $users[$username]['is_admin'] ?? false,
            'isLoggedIn' => true
        ]
    ]);
} else {
    // Login failed
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid username or password'
    ]);
}
?> 