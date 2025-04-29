#!/usr/bin/env python3
import sqlite3
import os
import json
import sys

# Percorso del database
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'twinelibrary.db')
SERVER_DIR = os.path.dirname(__file__)
VOTES_FILE = os.path.join(SERVER_DIR, 'votes.json')
PROJECTS_FILE = os.path.join(SERVER_DIR, 'projects.json')

def init_database():
    """Inizializza il database con le tabelle necessarie"""
    print(f"Inizializzazione del database in {DB_PATH}")
    
    # Crea la directory del database se non esiste
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    # Connessione al database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Crea la tabella votes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        project_id TEXT NOT NULL,
        vote_value INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, project_id)
    )
    ''')
    
    # Crea la tabella projects per memorizzare i dettagli dei progetti
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school TEXT NOT NULL,
        class TEXT NOT NULL,
        description TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Crea la tabella stats per memorizzare statistiche aggregate
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        total_votes INTEGER DEFAULT 0,
        average_rating REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    ''')
    
    # Crea indici per migliorare le performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_votes_project_id ON votes(project_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_votes_username ON votes(username)')
    
    conn.commit()
    print("Database inizializzato con successo")
    
    return conn, cursor

def import_existing_data(conn, cursor):
    """Importa i dati esistenti dai file JSON al database"""
    # Importa progetti
    if os.path.exists(PROJECTS_FILE):
        print(f"Importazione progetti da {PROJECTS_FILE}")
        try:
            with open(PROJECTS_FILE, 'r') as f:
                projects_data = json.load(f)
            
            # Estrai i progetti e inseriscili nel database
            for school_name, school_data in projects_data.items():
                for class_name, class_projects in school_data.items():
                    for project in class_projects:
                        cursor.execute('''
                        INSERT OR REPLACE INTO projects (id, name, school, class, description)
                        VALUES (?, ?, ?, ?, ?)
                        ''', (
                            project['id'],
                            project['name'],
                            school_name,
                            class_name,
                            project.get('description', '')
                        ))
            
            conn.commit()
            print(f"Progetti importati con successo")
        except Exception as e:
            print(f"Errore nell'importazione dei progetti: {e}")
    
    # Importa voti
    if os.path.exists(VOTES_FILE):
        print(f"Importazione voti da {VOTES_FILE}")
        try:
            with open(VOTES_FILE, 'r') as f:
                votes_data = json.load(f)
            
            # Estrai i voti e inseriscili nel database
            for username, user_votes in votes_data.items():
                for project_id, vote_value in user_votes.items():
                    if isinstance(vote_value, (int, float)) and vote_value > 0:
                        cursor.execute('''
                        INSERT OR REPLACE INTO votes (username, project_id, vote_value)
                        VALUES (?, ?, ?)
                        ''', (username, project_id, vote_value))
            
            conn.commit()
            print(f"Voti importati con successo")
        except Exception as e:
            print(f"Errore nell'importazione dei voti: {e}")
    
    # Aggiorna le statistiche
    update_stats(conn, cursor)

def update_stats(conn, cursor):
    """Aggiorna le statistiche aggregate per tutti i progetti"""
    print("Aggiornamento statistiche...")
    
    # Elimina le statistiche esistenti
    cursor.execute('DELETE FROM stats')
    
    # Calcola le nuove statistiche
    cursor.execute('''
    INSERT INTO stats (project_id, total_votes, average_rating)
    SELECT 
        project_id,
        COUNT(*) as total_votes,
        AVG(vote_value) as average_rating
    FROM votes
    GROUP BY project_id
    ''')
    
    conn.commit()
    print("Statistiche aggiornate con successo")

if __name__ == "__main__":
    # Inizializza il database
    conn, cursor = init_database()
    
    # Importa i dati esistenti
    if len(sys.argv) > 1 and sys.argv[1] == "--import":
        import_existing_data(conn, cursor)
    
    # Chiudi la connessione
    conn.close()
    print("Operazione completata")
