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

// Load existing users or create new file
$users = [];
if (file_exists($users_file)) {
    $users = json_decode(file_get_contents($users_file), true) ?: [];
}

// Check if username already exists
if (isset($users[$data['username']])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Username already exists'
    ]);
    exit;
}

// Create new user
$users[$data['username']] = [
    'username' => $data['username'],
    'password' => password_hash($data['password'], PASSWORD_DEFAULT),
    'nome' => $data['nome'] ?? '',
    'cognome' => $data['cognome'] ?? '',
    'avatar' => $data['avatar'] ?? '',
    'is_admin' => false,
    'created_at' => time()
];

// Save users to file
if (file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT))) {
    // Registration successful
    echo json_encode([
        'success' => true,
        'user' => [
            'username' => $data['username'],
            'nome' => $data['nome'] ?? '',
            'cognome' => $data['cognome'] ?? '',
            'avatar' => $data['avatar'] ?? '',
            'is_admin' => false,
            'isLoggedIn' => true
        ]
    ]);
} else {
    // Error saving user
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error saving user data'
    ]);
}
?> 