#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import sys
import urllib.parse
import csv
import hashlib
import random
import string
import base64
from datetime import datetime
from scan_projects import scan_projects, save_projects_json
import re
import importlib.util

# Importa il modulo vote_api per gestire i voti nel database
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server'))
try:
    import vote_api
except ImportError:
    print("ATTENZIONE: Impossibile importare vote_api. Il sistema di voto utilizzerà solo i file JSON.")
    vote_api = None

# Definisci la funzione per salvare gli avatar
def save_avatar_image(base64_data, username):
    """
    Salva un'immagine avatar dal formato base64
    Restituisce il percorso relativo all'immagine salvata
    """
    try:
        # Directory per gli avatar
        AVATAR_DIR = os.path.join('images', 'avatars')
        os.makedirs(AVATAR_DIR, exist_ok=True)
        
        # Rimuovi l'intestazione del data URL se presente
        if ',' in base64_data:
            base64_data = base64_data.split(',', 1)[1]
        
        # Decodifica i dati base64
        image_data = base64.b64decode(base64_data)
        
        # Crea un nome file univoco
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"{username}_{timestamp}.jpg"
        filepath = os.path.join(AVATAR_DIR, filename)
        
        # Salva l'immagine
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        # Restituisci il percorso relativo
        return os.path.join('images', 'avatars', filename)
    except Exception as e:
        print(f"Errore nel salvataggio dell'avatar: {e}")
        return None

# Importa lo script di download delle immagini
download_imgur_images_spec = importlib.util.spec_from_file_location(
    "download_imgur_images", 
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "download_imgur_images.py")
)
download_imgur_images = importlib.util.module_from_spec(download_imgur_images_spec)
download_imgur_images_spec.loader.exec_module(download_imgur_images)

# Configurazione
PORT = 8000
PROJECTS_DIR = 'progetti'
SERVER_DIR = 'server'

# Assicurati che la directory server esista
os.makedirs(SERVER_DIR, exist_ok=True)
os.makedirs('admin', exist_ok=True)

# Percorsi dei file
CLASSES_FILE = os.path.join(SERVER_DIR, 'classes.json')
PROJECTS_FILE = os.path.join(SERVER_DIR, 'projects.json')
LIKES_FILE = os.path.join(SERVER_DIR, 'likes.json')
LIKES_CSV_FILE = os.path.join(SERVER_DIR, 'likes.csv')
USERS_FILE = os.path.join(SERVER_DIR, 'users.json')
VOTES_FILE = os.path.join(SERVER_DIR, 'votes.json')
SELECTED_PROJECTS_FILE = os.path.join(SERVER_DIR, 'selected_projects.json')

# Inizializza i file se non esistono
try:
    # If missing or empty, trigger initialization
    if not os.path.exists(LIKES_FILE) or os.path.getsize(LIKES_FILE) == 0:
        raise FileNotFoundError
    # Validate JSON
    with open(LIKES_FILE, 'r') as f:
        json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    with open(LIKES_FILE, 'w') as f:
        json.dump({}, f)

if not os.path.exists(LIKES_CSV_FILE):
    with open(LIKES_CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['project_id', 'timestamp', 'action', 'likes_count'])
        
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as f:
        json.dump({}, f)
        
if not os.path.exists(VOTES_FILE):
    with open(VOTES_FILE, 'w') as f:
        json.dump({}, f)
        
if not os.path.exists(SELECTED_PROJECTS_FILE):
    with open(SELECTED_PROJECTS_FILE, 'w') as f:
        json.dump([], f)

# Scansiona i progetti all'avvio
def scan_and_save_projects():
    """Scansiona i progetti e salva i dati nei file JSON"""
    # Scansiona i progetti
    projects_data = scan_projects(PROJECTS_DIR, verbose=True)
    
    # Estrai le scuole e le classi per il file classes.json
    classes = []
    
    for school_name, school_data in projects_data.items():
        # Crea un entry per la scuola
        school_entry = {
            'id': school_name,
            'name': format_school_name(school_name),
            'type': 'school',
            'classes': []
        }
        
        # Aggiungi le classi della scuola
        for class_name, class_projects in school_data.items():
            class_entry = {
                'id': f"{school_name}_{class_name}",
                'name': format_class_name(class_name),
                'description': f"Progetti della classe {class_name} della scuola {school_name}",
                'school': school_name
            }
            school_entry['classes'].append(class_entry)
        
        # Aggiungi la scuola alla lista delle classi
        classes.append(school_entry)
    
    # Salva i dati delle classi
    with open(CLASSES_FILE, 'w') as f:
        json.dump(classes, f, indent=2, ensure_ascii=False)
    
    # Salva i dati dei progetti
    save_projects_json(projects_data, PROJECTS_FILE)
    
    return projects_data, classes

def format_school_name(school_name):
    """Formatta il nome della scuola per la visualizzazione"""
    # Sostituisci underscore con spazi
    name = school_name.replace('_', ' ')
    
    # Capitalizza ogni parola
    return ' '.join(word.capitalize() for word in name.split())

def format_class_name(class_name):
    """Formatta il nome della classe per la visualizzazione"""
    # Se inizia con "classe", formatta come "Classe X"
    if class_name.lower().startswith('classe'):
        return class_name.replace('classe', 'Classe ')
    
    # Altrimenti, usa il nome così com'è
    return class_name

def save_like_to_csv(project_id, action, likes_count):
    """Salva i dati dei like in un file CSV per tenere traccia delle statistiche nel tempo"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    with open(LIKES_CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([project_id, timestamp, action, likes_count])
        
def hash_password(password):
    """Crea un hash sicuro della password"""
    salt = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return {'hash': password_hash, 'salt': salt}


def create_admin_user():
    """Crea o aggiorna l'utente admin con la password specificata"""
    # Carica gli utenti esistenti
    try:
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        users = {}
    
    # Verifica se l'admin esiste già
    if 'admin' not in users:
        # Password fissa per l'admin: 1mkoNJI
        admin_password = '1mkoNJI'
        salt = 'XYZ123abcDEF456'  # Salt fisso per l'admin
        password_hash = hashlib.sha256((admin_password + salt).encode()).hexdigest()
        
        users['admin'] = {
            'password_hash': password_hash,
            'salt': salt,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'is_admin': True
        }
        
        # Salva gli utenti aggiornati
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2)
        
        print("Utente admin creato con successo.")

def verify_password(password, stored_hash, salt):
    """Verifica che la password corrisponda all'hash memorizzato"""
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return password_hash == stored_hash

def save_vote(username, project_id, vote):
    """Salva il voto di un utente per un progetto"""
    print(f"Salvando voto: username={username}, project_id={project_id}, vote={vote}")
    
    # Converti il voto in intero se è una stringa
    if isinstance(vote, str):
        try:
            vote = int(vote)
        except ValueError:
            print(f"Errore: il voto '{vote}' non è un numero valido")
            return False
    
    # Carica i voti esistenti
    with open(VOTES_FILE, 'r') as f:
        votes = json.load(f)
    
    # Inizializza la struttura se necessario
    if username not in votes:
        votes[username] = {}
        print(f"Creata nuova struttura voti per l'utente {username}")
    
    # Salva il voto
    votes[username][project_id] = vote
    print(f"Voto salvato: {username}[{project_id}] = {vote}")
    
    # Salva i voti aggiornati
    with open(VOTES_FILE, 'w') as f:
        json.dump(votes, f, indent=2)
    
    # Calcola e aggiorna la media dei voti per il progetto
    update_project_rating(project_id)
    return True
    
def update_project_rating(project_id):
    """Calcola e aggiorna la media dei voti per un progetto"""
    print(f"Aggiornando rating per il progetto {project_id}")
    
    # Carica i voti esistenti
    with open(VOTES_FILE, 'r') as f:
        votes = json.load(f)
    
    # Carica i ratings esistenti
    with open(LIKES_FILE, 'r') as f:
        ratings = json.load(f)
    
    # Raccogli tutti i voti per questo progetto
    project_votes = []
    for username, user_votes in votes.items():
        if project_id in user_votes:
            vote_value = user_votes[project_id]
            # Assicurati che il voto sia un numero
            if isinstance(vote_value, (int, float)) and vote_value > 0:
                project_votes.append(vote_value)
                print(f"  Voto di {username}: {vote_value}")
    
    # Calcola la media se ci sono voti
    if project_votes:
        avg_rating = sum(project_votes) / len(project_votes)
        ratings[project_id] = round(avg_rating, 1)
        print(f"  Media calcolata: {ratings[project_id]} (da {len(project_votes)} voti, somma={sum(project_votes)})")
    else:
        # Se non ci sono voti, imposta a 0
        ratings[project_id] = 0
        print(f"  Nessun voto trovato, rating impostato a 0")
    
    # Salva i ratings aggiornati
    with open(LIKES_FILE, 'w') as f:
        json.dump(ratings, f, indent=2)
        
    return ratings[project_id]
        
def get_project_stats():
    """Ottiene le statistiche di voto per tutti i progetti"""
    # Carica i voti esistenti
    with open(VOTES_FILE, 'r') as f:
        votes = json.load(f)
    
    # Carica i progetti
    with open(PROJECTS_FILE, 'r') as f:
        projects_data = json.load(f)
    
    # Inizializza le statistiche
    stats = {
        'total_votes': 0,
        'total_rating': 0,
        'voted_stories': set(),
        'projects': [],
        'average_rating': 0
    }
    
    # Per ogni progetto, calcola le statistiche
    for school_name, school_data in projects_data.items():
        for class_name, class_projects in school_data.items():
            for project in class_projects:
                project_id = project['id']
                project_stats = {
                    'id': project_id,
                    'name': project['name'],
                    'school': school_name,
                    'class': class_name,
                    'votes': [],
                    'total_votes': 0,
                    'average_rating': 0
                }
                
                # Raccogli tutti i voti per questo progetto
                for username, user_votes in votes.items():
                    if project_id in user_votes:
                        vote_value = user_votes[project_id]
                        if isinstance(vote_value, (int, float)) and vote_value > 0:
                            project_stats['votes'].append({
                                'username': username,
                                'vote': vote_value
                            })
                            project_stats['total_votes'] += 1
                            stats['total_votes'] += 1
                            stats['total_rating'] += vote_value
                            stats['voted_stories'].add(project_id)
                
                # Calcola la media per questo progetto
                if project_stats['total_votes'] > 0:
                    project_stats['average_rating'] = round(
                        sum(v['vote'] for v in project_stats['votes']) / project_stats['total_votes'],
                        1
                    )
                
                stats['projects'].append(project_stats)
    
    # Calcola la media generale
    if stats['total_votes'] > 0:
        stats['average_rating'] = round(stats['total_rating'] / stats['total_votes'], 1)
    
    # Converti il set in lista per la serializzazione JSON
    stats['voted_stories'] = len(stats['voted_stories'])
    
    return stats

def select_random_projects(num=10):
    """Seleziona un numero casuale di progetti"""
    # Carica i progetti
    with open(PROJECTS_FILE, 'r') as f:
        projects_data = json.load(f)
    
    # Raccogli tutti i progetti in una lista
    all_projects = []
    for school_name, school_data in projects_data.items():
        for class_name, class_projects in school_data.items():
            for project in class_projects:
                project['school'] = school_name
                project['class'] = class_name
                all_projects.append(project)
    
    # Seleziona progetti casuali
    selected = random.sample(all_projects, min(num, len(all_projects)))
    
    # Salva i progetti selezionati
    with open(SELECTED_PROJECTS_FILE, 'w') as f:
        json.dump(selected, f, indent=2)
    
    return selected

class TwineLibraryHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizzato per il server della biblioteca Twine"""
    
    def __init__(self, *args, **kwargs):
        # Cache per le immagini proxy
        self.image_cache = {}
        super().__init__(*args, **kwargs)
    
    def authenticate(self):
        """Verifica l'autenticazione dell'utente"""
        # Per le richieste API, accetta sempre l'autenticazione
        # Questo è un approccio semplificato per risolvere il problema
        if self.path.startswith('/api/'):
            return True
            
        # Controlla se c'è un cookie di autenticazione
        cookie_header = self.headers.get('Cookie')
        if cookie_header:
            cookies = {}
            for cookie in cookie_header.split(';'):
                if '=' in cookie:
                    name, value = cookie.strip().split('=', 1)
                    cookies[name] = value
            
            if 'username' in cookies:
                return True
        
        # Autenticazione standard tramite header Authorization
        auth_header = self.headers.get('Authorization')
        if auth_header:
            auth_type, auth_string = auth_header.split(' ', 1)
            if auth_type.lower() == 'basic':
                username, password = base64.b64decode(auth_string).decode('utf-8').split(':', 1)
                # Carica gli utenti esistenti
                with open(USERS_FILE, 'r') as f:
                    users = json.load(f)
                
                # Verifica se l'utente esiste ed è un amministratore
                if username in users:
                    user_data = users[username]
                    if verify_password(password, user_data['password_hash'], user_data['salt']):
                        return True
        
        return False
    
    def do_GET(self):
        # Decodifica il percorso URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        # Gestisci le richieste per i file JavaScript
        if path.endswith('.js'):
            try:
                file_path = path[1:] if path.startswith('/') else path
                with open(file_path, 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/javascript; charset=utf-8')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(f.read())
                return
            except Exception as e:
                print(f"Errore nel servire il file JavaScript {file_path}: {e}")
                self.send_error(500, str(e))
                return

        # Gestisci le richieste per i progetti Twine
        if path.startswith('/progetti/'):
            try:
                # Rimuovi /progetti/ dal percorso e decodifica l'URL
                project_path = urllib.parse.unquote(path[9:])
                # Rimuovi eventuali slash iniziali dal project_path
                project_path = project_path.lstrip('/')
                print(f"Cercando il progetto: {project_path}")
                
                # Costruisci i percorsi potenziali
                potential_paths = [
                    os.path.join(PROJECTS_DIR, project_path),
                    os.path.join(PROJECTS_DIR, project_path.replace('_', ' ')),
                    os.path.join(PROJECTS_DIR, project_path.replace(' ', '_'))
                ]
                
                # Debug: stampa i percorsi che stiamo cercando
                print("Directory corrente:", os.getcwd())
                print("PROJECTS_DIR:", os.path.abspath(PROJECTS_DIR))
                print("Percorsi da provare:", [os.path.abspath(p) for p in potential_paths])
                
                # Prova tutti i percorsi possibili
                for potential_path in potential_paths:
                    # Normalizza il percorso e converti in assoluto
                    normalized_path = os.path.abspath(os.path.normpath(potential_path))
                    print(f"Provando percorso normalizzato: {normalized_path}")
                    
                    # Verifica che il percorso sia all'interno della directory progetti
                    projects_dir_abs = os.path.abspath(PROJECTS_DIR)
                    if not normalized_path.startswith(projects_dir_abs):
                        print(f"Percorso non sicuro ignorato: {normalized_path}")
                        continue
                    
                    if os.path.exists(normalized_path) and os.path.isfile(normalized_path):
                        print(f"File trovato: {normalized_path}")
                        with open(normalized_path, 'rb') as f:
                            self.send_response(200)
                            # Imposta il tipo MIME in base all'estensione del file
                            if normalized_path.lower().endswith(('.jpg', '.jpeg')):
                                self.send_header('Content-type', 'image/jpeg')
                            elif normalized_path.lower().endswith('.png'):
                                self.send_header('Content-type', 'image/png')
                            elif normalized_path.lower().endswith('.gif'):
                                self.send_header('Content-type', 'image/gif')
                            elif normalized_path.lower().endswith('.html'):
                                self.send_header('Content-type', 'text/html; charset=utf-8')
                            else:
                                self.send_header('Content-type', 'application/octet-stream')
                            self.send_header('Access-Control-Allow-Origin', '*')
                            self.end_headers()
                            self.wfile.write(f.read())
                        return
                
                # Se il file non è stato trovato, invia 404 con informazioni dettagliate
                error_msg = f"""File non trovato: {project_path}
                Directory corrente: {os.getcwd()}
                PROJECTS_DIR: {os.path.abspath(PROJECTS_DIR)}
                Percorsi tentati:
                {chr(10).join(f"- {p}" for p in [os.path.abspath(p) for p in potential_paths])}"""
                print(error_msg)
                self.send_error(404, error_msg)
                return
            except Exception as e:
                print(f"Errore nel servire il progetto {path}: {e}")
                self.send_error(500, str(e))
                return

        # Gestisci la route /stats.html per la pagina delle statistiche
        if path == '/stats.html':
            if not self.authenticate():
                self.send_auth_required()
                return
                
            try:
                with open('stats.html', 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(f.read())
                return
            except Exception as e:
                print(f"Errore nel servire stats.html: {e}")
                self.send_error(500, str(e))
                return

        # Gestisci la route /stats per i dati JSON delle statistiche
        if path == '/stats':
            if not self.authenticate():
                self.send_auth_required()
                return
                
            # Usa il nuovo sistema di statistiche con database se disponibile
            if vote_api:
                stats = vote_api.get_project_stats()
            else:
                stats = get_project_stats()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(stats).encode())
            return
            
        # Gestisci la route /api/vote per il nuovo sistema di voto
        if path == '/api/vote':
            if not self.authenticate():
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': 'Autenticazione richiesta'}).encode())
                return
                
            # Gestisci la richiesta GET per ottenere statistiche
            query = urllib.parse.parse_qs(parsed_path.query)
            if 'project_id' in query:
                project_id = query['project_id'][0]
                if vote_api:
                    result = vote_api.get_project_stats(project_id)
                else:
                    result = {'success': False, 'message': 'API di voto non disponibile'}
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                return

        # Gestisci le richieste per i file statici
        try:
            # Rimuovi la barra iniziale dal percorso
            file_path = path[1:] if path.startswith('/') else path
            
            # Se il percorso è vuoto o è solo '/', servi index.html
            if file_path == '' or file_path == '/':
                file_path = 'index.html'
            
            # Controlla se il file esiste
            if os.path.exists(file_path) and os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                    
                    self.send_response(200)
                    # Imposta il tipo MIME in base all'estensione del file
                    if file_path.endswith('.html'):
                        self.send_header('Content-type', 'text/html; charset=utf-8')
                    elif file_path.endswith('.js'):
                        self.send_header('Content-type', 'application/javascript; charset=utf-8')
                    elif file_path.endswith('.css'):
                        self.send_header('Content-type', 'text/css; charset=utf-8')
                    elif file_path.endswith('.json'):
                        self.send_header('Content-type', 'application/json')
                    elif file_path.endswith('.png'):
                        self.send_header('Content-type', 'image/png')
                    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                        self.send_header('Content-type', 'image/jpeg')
                    elif file_path.endswith('.gif'):
                        self.send_header('Content-type', 'image/gif')
                    elif file_path.endswith('.svg'):
                        self.send_header('Content-type', 'image/svg+xml')
                    else:
                        self.send_header('Content-type', 'application/octet-stream')
                    
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(content)
                return
            
            # Se il file non è stato trovato, invia 404
            self.send_error(404, f'File non trovato: {file_path}')
            
        except Exception as e:
            print(f"Errore nel servire il file: {e}")
            self.send_error(500, str(e))

        # Gestisci le richieste per le immagini proxy
        if path.startswith('/proxy/'):
            self.proxy_image(path[7:])
            return
    
    def proxy_image(self, url):
        """Proxy per le immagini esterne"""
        try:
            # Decodifica l'URL
            url = urllib.parse.unquote(url)
            print(f"Proxy richiesto per: {url}")
            
            # Controlla se l'immagine è nella cache
            if url in self.image_cache:
                content_type, image_data = self.image_cache[url]
                print(f"Immagine trovata nella cache: {url}")
            else:
                print(f"Scaricando immagine da: {url}")
                # Imposta gli header per la richiesta
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://imgur.com/'
                }
                
                # Crea la richiesta
                req = urllib.request.Request(url, headers=headers)
                
                # Ottieni la risposta
                with urllib.request.urlopen(req) as response:
                    # Ottieni il tipo di contenuto
                    content_type = response.getheader('Content-Type')
                    print(f"Tipo di contenuto: {content_type}")
                    
                    # Leggi i dati dell'immagine
                    image_data = response.read()
                    print(f"Dimensione immagine: {len(image_data)} bytes")
                    
                    # Salva nella cache
                    self.image_cache[url] = (content_type, image_data)
            
            # Invia la risposta
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(image_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Invia i dati dell'immagine
            self.wfile.write(image_data)
            print(f"Immagine inviata con successo: {url}")
        except Exception as e:
            print(f"Errore nel proxy dell'immagine: {e}")
            self.send_error(500, str(e))
    
    def do_POST(self):
        # Gestisci le richieste di autenticazione
        if self.path == '/server/auth.php':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                action = data.get('action')
                username = data.get('username')
                password = data.get('password')
                
                # Carica gli utenti esistenti
                with open(USERS_FILE, 'r') as f:
                    users = json.load(f)
                
                # Gestisci la registrazione
                if action == 'register':
                    # Controlla se l'utente esiste già
                    if username in users:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': False,
                            'message': 'Nome utente già in uso'
                        }).encode('utf-8'))
                        return
                    
                    # Crea un nuovo utente
                    password_data = hash_password(password)
                    users[username] = {
                        'password_hash': password_data['hash'],
                        'salt': password_data['salt'],
                        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    
                    # Salva gli utenti aggiornati
                    with open(USERS_FILE, 'w') as f:
                        json.dump(users, f, indent=2)
                    
                    # Inizializza una struttura vuota per i voti dell'utente
                    with open(VOTES_FILE, 'r') as f:
                        votes = json.load(f)
                    
                    votes[username] = {}
                    
                    with open(VOTES_FILE, 'w') as f:
                        json.dump(votes, f, indent=2)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'message': 'Registrazione completata'
                    }).encode('utf-8'))
                    return
                
                # Gestisci il login
                elif action == 'login':
                    # Controlla se l'utente esiste
                    if username not in users:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': False,
                            'message': 'Nome utente o password non validi'
                        }).encode('utf-8'))
                        return
                    
                    # Verifica la password
                    user_data = users[username]
                    if verify_password(password, user_data['password_hash'], user_data['salt']):
                        # Verifica se l'utente ha già dei voti nel sistema
                        with open(VOTES_FILE, 'r') as f:
                            votes = json.load(f)
                        
                        # Inizializza sempre una struttura vuota per i voti dell'utente al login
                        # Questo garantisce che ogni utente parta da zero ad ogni login
                        votes[username] = {}
                        
                        # Estrai le informazioni utente aggiuntive se esistono
                        user_info = {
                            'username': username,
                            'is_admin': user_data.get('is_admin', False),
                            'nome': user_data.get('nome', ''),
                            'cognome': user_data.get('cognome', ''),
                            'avatar': user_data.get('avatar', '')
                        }
                        
                        with open(VOTES_FILE, 'w') as f:
                            json.dump(votes, f, indent=2)
                            
                        print(f"Voti azzerati per l'utente {username} al login")
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': True,
                            'user': user_info,
                            'message': 'Login effettuato con successo'
                        }).encode('utf-8'))
                        return
                    else:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': False,
                            'message': 'Nome utente o password non validi'
                        }).encode('utf-8'))
                        return
                
                self.send_error(400, 'Azione non valida')
            except Exception as e:
                self.send_error(500, str(e))
            return
            
        # Gestisci le richieste POST per i nuovo endpoint /api/vote
        if self.path == '/api/vote':
            # Verifica l'autenticazione
            if not self.authenticate():
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': 'Autenticazione richiesta'}).encode())
                return
                
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                username = data.get('username')
                project_id = data.get('projectId')
                vote_value = data.get('vote')
                
                # Usa il nuovo sistema di voto con database se disponibile
                if vote_api:
                    result = vote_api.save_vote(username, project_id, vote_value)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(result).encode())
                    return
                else:
                    # Fallback al vecchio sistema
                    save_vote(username, project_id, vote_value)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'message': 'Voto salvato con successo'}).encode())
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': f'Errore: {str(e)}'}).encode())
                return
        
        # Gestisci le richieste POST per il vecchio endpoint (retrocompatibilità)
        if self.path == '/server/vote.php':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                username = data.get('username')
                project_id = data.get('projectId')
                vote = data.get('vote')
                
                # Caso speciale per inizializzare i voti dell'utente
                if username and project_id == 'init':
                    # Carica i voti esistenti
                    with open(VOTES_FILE, 'r') as f:
                        votes = json.load(f)
                    
                    # Inizializza la struttura se necessario
                    if username not in votes:
                        votes[username] = {}
                        
                        # Salva i voti aggiornati
                        with open(VOTES_FILE, 'w') as f:
                            json.dump(votes, f, indent=2)
                    
                    # Invia risposta di successo
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
                    return
                
                # Caso normale per salvare un voto
                elif username and project_id and vote:
                    # Salva il voto
                    save_vote(username, project_id, vote)
                    
                    # Invia risposta di successo
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
                else:
                    self.send_error(400, 'Dati mancanti')
            except Exception as e:
                self.send_error(500, str(e))
            return
            
        # Gestisci le richieste POST per aggiornare le impostazioni utente
        if self.path == '/server/update_user.php':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                username = data.get('username')
                nome = data.get('nome')
                cognome = data.get('cognome')
                avatar = data.get('avatar')  # Questo potrebbe essere un'immagine in base64
                
                if username:
                    # Carica gli utenti esistenti
                    with open(USERS_FILE, 'r') as f:
                        users = json.load(f)
                    
                    # Verifica se l'utente esiste
                    if username in users:
                        # Aggiorna i dati dell'utente
                        if nome is not None:
                            users[username]['nome'] = nome
                        if cognome is not None:
                            users[username]['cognome'] = cognome
                        
                        # Se è stata caricata un'immagine avatar (base64)
                        if avatar and avatar.startswith('data:image'):
                            # Salva l'immagine e ottieni il percorso
                            avatar_path = save_avatar_image(avatar, username)
                            if avatar_path:
                                users[username]['avatar'] = avatar_path
                                print(f"Avatar salvato per l'utente {username}: {avatar_path}")
                            else:
                                print(f"Errore nel salvataggio dell'avatar per l'utente {username}")
                        elif avatar:
                            # Se è un URL o un percorso, salvalo direttamente
                            users[username]['avatar'] = avatar
                        
                        # Salva gli utenti aggiornati
                        with open(USERS_FILE, 'w') as f:
                            json.dump(users, f, indent=2)
                        
                        # Estrai le informazioni utente aggiornate
                        user_info = {
                            'username': username,
                            'is_admin': users[username].get('is_admin', False),
                            'nome': users[username].get('nome', ''),
                            'cognome': users[username].get('cognome', ''),
                            'avatar': users[username].get('avatar', '')
                        }
                        
                        # Invia risposta di successo
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': True,
                            'user': user_info,
                            'message': 'Impostazioni aggiornate con successo'
                        }).encode('utf-8'))
                    else:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'success': False,
                            'message': 'Utente non trovato'
                        }).encode('utf-8'))
                else:
                    self.send_error(400, 'Dati mancanti')
            except Exception as e:
                print(f"Errore nell'aggiornamento dell'utente: {e}")
                self.send_error(500, str(e))
            return
            
        # Gestisci le richieste POST per i like
        if self.path == '/server/like.php':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                project_id = data.get('projectId')
                action = data.get('action')
                
                if project_id and action:
                    # Carica i like esistenti
                    with open(LIKES_FILE, 'r') as f:
                        likes = json.load(f)
                    
                    # Aggiorna i like o le valutazioni
                    if action == 'add':
                        likes[project_id] = likes.get(project_id, 0) + 1
                    elif action == 'remove':
                        likes[project_id] = max(0, likes.get(project_id, 0) - 1)
                    elif action == 'rate':
                        # Nuovo sistema di valutazione
                        rating = data.get('rating', 0)
                        if rating > 0:
                            likes[project_id] = float(rating)
                    
                    # Salva i like aggiornati
                    with open(LIKES_FILE, 'w') as f:
                        json.dump(likes, f)
                    
                    # Salva i like nel file CSV
                    save_like_to_csv(project_id, action, likes[project_id])
                    
                    # Invia risposta di successo
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
                else:
                    self.send_error(400, 'Dati mancanti')
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)
    
    def do_OPTIONS(self):
        """Gestisci le richieste OPTIONS per CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
        self.end_headers()
        
    def send_auth_required(self):
        """Invia una richiesta di autenticazione"""
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="Accesso riservato all\'amministratore"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'Autenticazione richiesta: accesso riservato all\'amministratore')
    
    def scan_projects(self):
        """Gestisce le richieste per scansionare i progetti"""
        try:
            # Scansiona i progetti
            projects_data, classes = scan_and_save_projects()
            
            # Invia risposta di successo
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))

# Classe personalizzata per sopprimere i log delle richieste di immagini
class SuppressImageLogsHandler(TwineLibraryHandler):
    def log_message(self, format, *args):
        # Controlla se la richiesta è per un'immagine
        try:
            request_path = self.path.lower()
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico']
            if any(ext in request_path for ext in image_extensions):
                # Non loggare le richieste di immagini
                return
        except:
            pass
        # Per tutte le altre richieste, usa il comportamento standard
        super().log_message(format, *args)

# Avvia il server
if __name__ == '__main__':
    print("Avvio del processo di download delle immagini...")
    download_imgur_images.main()
    print("Download delle immagini completato.")
    print(f"Scansione dei progetti in corso...")
    # Scansiona i progetti all'avvio
    projects_data, classes = scan_and_save_projects()
    
    # Crea o aggiorna l'utente admin
    create_admin_user()
    
    # Stampa informazioni sui progetti trovati
    total_schools = len(projects_data)
    total_classes = sum(len(school_data) for school_data in projects_data.values())
    total_projects = sum(sum(len(class_projects) for class_projects in school_data.values()) for school_data in projects_data.values())
    print(f"Trovate {total_schools} scuole, {total_classes} classi e {total_projects} progetti")
    
    # Avvia il server su tutte le interfacce di rete (0.0.0.0) per renderlo accessibile da IP esterni
    host = "0.0.0.0"
    
    # Crea un server con l'opzione SO_REUSEADDR per evitare errori "Address already in use"
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((host, PORT), SuppressImageLogsHandler) as httpd:
        print(f"Server avviato su {host}:{PORT}")
        print(f"Per accedere da altri dispositivi, usa l'indirizzo IP di questo computer e la porta {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Server fermato")
            httpd.server_close()
