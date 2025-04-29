#!/usr/bin/env python3
import sqlite3
import json
import os
import sys
from datetime import datetime

# Percorso del database
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'twinelibrary.db')

def connect_db():
    """Connessione al database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Per ottenere i risultati come dizionari
    return conn, conn.cursor()

def save_vote(username, project_id, vote_value):
    """Salva il voto di un utente per un progetto nel database"""
    if not username or not project_id:
        return {"success": False, "message": "Username e project_id sono obbligatori"}
    
    try:
        # Converti il voto in intero
        vote_value = int(vote_value)
        if vote_value < 1 or vote_value > 5:
            return {"success": False, "message": "Il voto deve essere compreso tra 1 e 5"}
    except ValueError:
        return {"success": False, "message": "Il voto deve essere un numero"}
    
    try:
        conn, cursor = connect_db()
        
        # Inserisci o aggiorna il voto
        cursor.execute('''
        INSERT OR REPLACE INTO votes (username, project_id, vote_value, timestamp)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (username, project_id, vote_value))
        
        # Aggiorna le statistiche per questo progetto
        update_project_stats(cursor, project_id)
        
        conn.commit()
        
        # Aggiorna anche il file JSON per retrocompatibilità
        update_json_files(cursor)
        
        return {"success": True, "message": "Voto salvato con successo"}
    except Exception as e:
        return {"success": False, "message": f"Errore nel salvataggio del voto: {str(e)}"}
    finally:
        if conn:
            conn.close()

def update_project_stats(cursor, project_id):
    """Aggiorna le statistiche per un progetto specifico"""
    # Calcola la media e il numero totale di voti
    cursor.execute('''
    SELECT COUNT(*) as total_votes, AVG(vote_value) as average_rating
    FROM votes
    WHERE project_id = ?
    ''', (project_id,))
    
    stats = cursor.fetchone()
    
    # Aggiorna o inserisci le statistiche
    cursor.execute('''
    INSERT OR REPLACE INTO stats (project_id, total_votes, average_rating, last_updated)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ''', (project_id, stats['total_votes'], stats['average_rating']))

def get_project_stats(project_id=None):
    """Ottiene le statistiche di voto per un progetto o per tutti i progetti"""
    try:
        conn, cursor = connect_db()
        
        if project_id:
            # Statistiche per un progetto specifico
            cursor.execute('''
            SELECT p.id, p.name, p.school, p.class, 
                   COALESCE(s.total_votes, 0) as total_votes, 
                   COALESCE(s.average_rating, 0) as average_rating
            FROM projects p
            LEFT JOIN stats s ON p.id = s.project_id
            WHERE p.id = ?
            ''', (project_id,))
            
            result = cursor.fetchone()
            if result:
                return {
                    "success": True,
                    "project": dict(result)
                }
            else:
                return {"success": False, "message": "Progetto non trovato"}
        else:
            # Statistiche per tutti i progetti
            cursor.execute('''
            SELECT p.id, p.name, p.school, p.class, 
                   COALESCE(s.total_votes, 0) as total_votes, 
                   COALESCE(s.average_rating, 0) as average_rating
            FROM projects p
            LEFT JOIN stats s ON p.id = s.project_id
            ORDER BY s.total_votes DESC, s.average_rating DESC
            ''')
            
            projects = [dict(row) for row in cursor.fetchall()]
            
            # Calcola statistiche generali
            cursor.execute('''
            SELECT COUNT(*) as total_votes, 
                   COUNT(DISTINCT project_id) as voted_stories,
                   AVG(vote_value) as average_rating
            FROM votes
            ''')
            
            general_stats = dict(cursor.fetchone())
            
            return {
                "success": True,
                "projects": projects,
                "stats": general_stats
            }
    except Exception as e:
        return {"success": False, "message": f"Errore nel recupero delle statistiche: {str(e)}"}
    finally:
        if conn:
            conn.close()

def get_user_votes(username):
    """Ottiene tutti i voti di un utente specifico"""
    if not username:
        return {"success": False, "message": "Username obbligatorio"}
    
    try:
        conn, cursor = connect_db()
        
        cursor.execute('''
        SELECT v.project_id, v.vote_value, v.timestamp,
               p.name as project_name, p.school, p.class
        FROM votes v
        JOIN projects p ON v.project_id = p.id
        WHERE v.username = ?
        ORDER BY v.timestamp DESC
        ''', (username,))
        
        votes = [dict(row) for row in cursor.fetchall()]
        
        return {
            "success": True,
            "username": username,
            "votes": votes
        }
    except Exception as e:
        return {"success": False, "message": f"Errore nel recupero dei voti: {str(e)}"}
    finally:
        if conn:
            conn.close()

def update_json_files(cursor):
    """Aggiorna i file JSON per retrocompatibilità con il vecchio sistema"""
    VOTES_FILE = os.path.join(os.path.dirname(__file__), 'votes.json')
    LIKES_FILE = os.path.join(os.path.dirname(__file__), 'likes.json')
    
    # Aggiorna votes.json
    cursor.execute('''
    SELECT username, project_id, vote_value
    FROM votes
    ''')
    
    votes_data = {}
    for row in cursor.fetchall():
        username = row['username']
        project_id = row['project_id']
        vote_value = row['vote_value']
        
        if username not in votes_data:
            votes_data[username] = {}
        
        votes_data[username][project_id] = vote_value
    
    with open(VOTES_FILE, 'w') as f:
        json.dump(votes_data, f, indent=2)
    
    # Aggiorna likes.json (che contiene le medie dei voti)
    cursor.execute('''
    SELECT project_id, average_rating
    FROM stats
    ''')
    
    likes_data = {}
    for row in cursor.fetchall():
        project_id = row['project_id']
        average_rating = row['average_rating']
        
        likes_data[project_id] = round(average_rating, 1)
    
    with open(LIKES_FILE, 'w') as f:
        json.dump(likes_data, f, indent=2)

# Funzioni per l'API
def handle_request(request_data):
    """Gestisce le richieste API"""
    action = request_data.get('action')
    
    if action == 'vote':
        return save_vote(
            request_data.get('username'),
            request_data.get('projectId'),
            request_data.get('vote')
        )
    elif action == 'get_stats':
        return get_project_stats(request_data.get('projectId'))
    elif action == 'get_user_votes':
        return get_user_votes(request_data.get('username'))
    else:
        return {"success": False, "message": "Azione non valida"}

# Funzione per test
if __name__ == "__main__":
    # Test di funzionamento
    if len(sys.argv) > 1:
        if sys.argv[1] == "vote" and len(sys.argv) >= 5:
            result = save_vote(sys.argv[2], sys.argv[3], sys.argv[4])
            print(json.dumps(result, indent=2))
        elif sys.argv[1] == "stats":
            project_id = sys.argv[2] if len(sys.argv) > 2 else None
            result = get_project_stats(project_id)
            print(json.dumps(result, indent=2))
        elif sys.argv[1] == "user_votes" and len(sys.argv) > 2:
            result = get_user_votes(sys.argv[2])
            print(json.dumps(result, indent=2))
        else:
            print("Uso: vote_api.py [vote username project_id vote_value | stats [project_id] | user_votes username]")
    else:
        print("Uso: vote_api.py [vote username project_id vote_value | stats [project_id] | user_votes username]")
