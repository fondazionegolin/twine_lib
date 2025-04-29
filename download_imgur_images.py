#!/usr/bin/env python3
"""
Script per scaricare le immagini da imgur.com e modificare i file HTML per utilizzare le immagini locali.
Specifico per i file Twine che usano il formato {embed image: 'URL'}.
"""

import os
import re
import urllib.request
import urllib.parse
import glob
import time
import json
from pathlib import Path
import html

# Configurazione
PROJECTS_DIR = 'progetti'
IMAGES_DIR = 'immagini_imgur'
COVERS_FILE = 'server/project_covers.json'
# Pattern per trovare tag img nei file HTML
IMGUR_PATTERN = r"<img[^>]*src=['\"]?(https?://i\.imgur\.com/[^'\"\s>]+)['\"]?[^>]*>"

def ensure_dir(directory):
    """Assicura che la directory esista"""
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Creata directory: {directory}")

def download_image(url, save_path):
    """Scarica un'immagine da un URL e la salva nel percorso specificato"""
    if os.path.exists(save_path):
        print(f"L'immagine esiste già: {save_path}")
        return True
    
    try:
        # Imposta gli header per la richiesta
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://imgur.com/'
        }
        
        # Crea la richiesta
        req = urllib.request.Request(url, headers=headers)
        
        # Scarica l'immagine
        with urllib.request.urlopen(req) as response, open(save_path, 'wb') as out_file:
            out_file.write(response.read())
        
        print(f"Immagine scaricata: {url} -> {save_path}")
        return True
    except Exception as e:
        print(f"Errore nel download dell'immagine {url}: {e}")
        return False

def process_html_file(html_file):
    """Processa un file HTML per trovare e scaricare le immagini da imgur.com"""
    print(f"\nProcessing file: {html_file}")
    
    try:
        # Leggi il contenuto del file HTML
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Cerca anche qualsiasi tag img nel file
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(content, 'html.parser')
        img_tags = soup.find_all('img')
        
        # Se non ci sono tag img, cerca con il pattern regex
        if not img_tags:
            matches = re.findall(IMGUR_PATTERN, content)
            if not matches:
                print(f"Nessuna immagine trovata in: {html_file}")
                return None
        else:
            print(f"Trovati {len(img_tags)} tag img in: {html_file}")
        
        modified = False
        first_image_path = None
        
        # Prima processa i tag img trovati con BeautifulSoup
        for img in img_tags:
            img_url = img.get('src')
            if not img_url or not img_url.startswith('http'):
                continue
                
            # Crea un nome file univoco basato sull'URL
            img_id = img_url.split('/')[-1]
            local_filename = img_id
            
            # Percorso completo per salvare l'immagine
            save_path = os.path.join(IMAGES_DIR, local_filename)
            
            # Scarica l'immagine
            if download_image(img_url, save_path):
                # Percorso relativo per l'HTML - usa il percorso del server
                relative_path = f"/immagini_imgur/{local_filename}"
                
                # Salva il percorso della prima immagine come copertina
                if first_image_path is None:
                    first_image_path = relative_path
                    print(f"Immagine di copertina trovata: {relative_path}")
                
                # Aggiorna il tag img nel soup
                img['src'] = relative_path
                modified = True
                print(f"Sostituito: {img_url} -> {relative_path}")
        
        # Salva il file HTML modificato se è stato modificato
        if modified:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            print(f"File HTML aggiornato: {html_file}")
        
        return first_image_path
    
    except Exception as e:
        print(f"Errore nel processare il file {html_file}: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Funzione principale"""
    # Assicurati che la directory per le immagini esista
    ensure_dir(IMAGES_DIR)
    ensure_dir(os.path.dirname(COVERS_FILE))
    
    # Trova tutti i file HTML nei progetti
    html_files = []
    
    for root, dirs, files in os.walk(PROJECTS_DIR):
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    print(f"Trovati {len(html_files)} file HTML da processare")
    
    # Dizionario per memorizzare le copertine dei progetti
    project_covers = {}
    
    # Carica le copertine esistenti se il file esiste
    if os.path.exists(COVERS_FILE):
        try:
            with open(COVERS_FILE, 'r') as f:
                project_covers = json.load(f)
            print(f"Caricate {len(project_covers)} copertine esistenti")
        except json.JSONDecodeError:
            print(f"Errore nel caricamento del file {COVERS_FILE}, verrà creato un nuovo file")
    
    # Processa ogni file HTML
    for html_file in html_files:
        # Crea un ID progetto dal percorso del file
        rel_path = os.path.relpath(html_file, PROJECTS_DIR)
        parts = rel_path.split(os.sep)
        if len(parts) >= 3:  # scuola/classe/file.html
            school = parts[0]
            class_name = parts[1]
            file_name = os.path.splitext(parts[2])[0]
            project_id = f"{school}_{class_name}_{file_name}".replace(' ', '_')
            
            # Processa il file e ottieni la copertina
            cover_image = process_html_file(html_file)
            
            # Salva la copertina se trovata
            if cover_image:
                project_covers[project_id] = cover_image
                print(f"Copertina salvata per il progetto {project_id}: {cover_image}")
    
    # Salva il dizionario delle copertine
    with open(COVERS_FILE, 'w') as f:
        json.dump(project_covers, f, indent=2)
    
    print(f"\nSalvate {len(project_covers)} copertine nel file {COVERS_FILE}")
    print("\nProcesso completato!")

if __name__ == "__main__":
    main()
