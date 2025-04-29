#!/usr/bin/env python3
import json
import hashlib
import os
from datetime import datetime

# Percorso del file degli utenti
USERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server', 'users.json')

def reset_admin_password():
    """Reimposta la password dell'utente admin"""
    # Carica gli utenti esistenti
    try:
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        users = {}
    
    # Password fissa per l'admin: 1mkoNJI
    admin_password = '1mkoNJI'
    salt = 'XYZ123abcDEF456'  # Salt fisso per l'admin
    password_hash = hashlib.sha256((admin_password + salt).encode()).hexdigest()
    
    # Aggiorna o crea l'utente admin
    users['admin'] = {
        'password_hash': password_hash,
        'salt': salt,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'is_admin': True
    }
    
    # Salva gli utenti aggiornati
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)
    
    print(f"Utente admin reimpostato con successo.")
    print(f"Username: admin")
    print(f"Password: 1mkoNJI")
    print(f"Hash generato: {password_hash}")

if __name__ == "__main__":
    reset_admin_password()
