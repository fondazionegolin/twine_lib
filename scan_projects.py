#!/usr/bin/env python3
"""
Script per scansionare i progetti Twine e generare il file JSON dei progetti.
Supporta la struttura gerarchica: progetti/scuola/classeX/progetti.html
"""

import os
import re
import json
import argparse
from bs4 import BeautifulSoup
import glob

def extract_metadata_from_html(file_path, verbose=False):
    """
    Estrae i metadati da un file HTML Twine.
    Supporta:
    - Titolo (dal tag <title>)
    - Descrizione (dal meta tag description)
    - Autori (da commenti HTML <!-- authors: ... -->)
    - Tag (da commenti HTML <!-- tags: ... -->)
    """
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
        content = file.read()
    
    # Inizializza i metadati
    metadata = {
        'title': os.path.basename(file_path),
        'description': '',
        'authors': [],
        'tags': []
    }
    
    # Usa BeautifulSoup per estrarre i metadati
    try:
        soup = BeautifulSoup(content, 'html.parser')
        
        # Estrai il titolo
        title_tag = soup.find('title')
        if title_tag and title_tag.string:
            metadata['title'] = title_tag.string.strip()
        
        # Estrai la descrizione
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            metadata['description'] = meta_desc.get('content').strip()
        
        # Cerca commenti per autori e tag
        comments = soup.find_all(string=lambda text: isinstance(text, str) and text.strip().startswith('<!--'))
        for comment in comments:
            comment_text = comment.strip()
            
            # Estrai autori
            authors_match = re.search(r'<!--\s*authors:\s*(.*?)\s*-->', comment_text, re.IGNORECASE)
            if authors_match:
                authors = [author.strip() for author in authors_match.group(1).split(',')]
                metadata['authors'] = authors
            
            # Estrai tag
            tags_match = re.search(r'<!--\s*tags:\s*(.*?)\s*-->', comment_text, re.IGNORECASE)
            if tags_match:
                tags = [tag.strip() for tag in tags_match.group(1).split(',')]
                metadata['tags'] = tags
        
    except Exception as e:
        if verbose:
            print(f"Errore nell'estrazione dei metadati da {file_path}: {e}")
    
    # Se non è stata trovata una descrizione, usa il titolo
    if not metadata['description'] and metadata['title'] != os.path.basename(file_path):
        metadata['description'] = metadata['title']
    
    return metadata

def is_valid_school_dir(dir_path):
    """
    Verifica se una directory è una scuola valida.
    Una directory di scuola è valida se contiene almeno una sottodirectory di classe.
    """
    if not os.path.isdir(dir_path):
        return False
    
    # Controlla se ci sono sottodirectory di classe
    for item in os.listdir(dir_path):
        class_path = os.path.join(dir_path, item)
        if os.path.isdir(class_path) and is_valid_class_dir(class_path):
            return True
    
    return False

def is_valid_class_dir(dir_path):
    """
    Verifica se una directory è una classe valida.
    Una directory di classe è valida se:
    1. Il nome inizia con "classe" (case insensitive) oppure
    2. Il nome è composto da un numero seguito da una lettera (es. "3C")
    """
    dir_name = os.path.basename(dir_path)
    
    # Controlla se è una directory
    if not os.path.isdir(dir_path):
        return False
    
    # Controlla se il nome inizia con "classe" (case insensitive)
    if dir_name.lower().startswith('classe'):
        return True
    
    # Controlla se il nome è composto da un numero seguito da una lettera (es. "3C")
    if re.match(r'^\d+[A-Za-z]+$', dir_name):
        return True
    
    return False

def format_project_name(file_name):
    """
    Formatta il nome del progetto a partire dal nome del file.
    Rimuove l'estensione e sostituisce underscore e trattini con spazi.
    """
    # Rimuovi l'estensione
    name = os.path.splitext(file_name)[0]
    
    # Sostituisci underscore e trattini con spazi
    name = name.replace('_', ' ').replace('-', ' ')
    
    return name

def scan_projects(projects_dir, verbose=False):
    """
    Scansiona la directory dei progetti con la struttura:
    progetti/scuola/classeX/progetti.html
    
    Restituisce un dizionario con la struttura:
    {
        "scuola1": {
            "classe1A": [
                {
                    "id": "scuola1_classe1A_progetto1",
                    "name": "Nome del progetto 1",
                    "description": "Descrizione del progetto 1",
                    "file": "progetti/scuola1/classe1A/progetto1.html",
                    "authors": ["Autore 1", "Autore 2"],
                    "tags": ["tag1", "tag2"],
                    "cover_image": "/immagini_imgur/abc123.jpg"
                },
                ...
            ],
            ...
        },
        ...
    }
    """
    if verbose:
        print(f"Scansione dei progetti nella directory: {projects_dir}")
    
    # Inizializza il dizionario dei progetti
    projects_data = {}
    
    # Carica le copertine dei progetti se esistono
    covers = {}
    covers_file = 'server/project_covers.json'
    if os.path.exists(covers_file):
        try:
            with open(covers_file, 'r') as f:
                covers = json.load(f)
            if verbose:
                print(f"Caricate {len(covers)} copertine di progetti")
        except Exception as e:
            if verbose:
                print(f"Errore nel caricamento delle copertine: {e}")
    
    # Verifica che la directory dei progetti esista
    if not os.path.exists(projects_dir):
        if verbose:
            print(f"La directory {projects_dir} non esiste.")
        return projects_data
    
    # Scansiona le scuole
    for school_name in os.listdir(projects_dir):
        school_path = os.path.join(projects_dir, school_name)
        
        # Verifica che sia una directory di scuola valida
        if not is_valid_school_dir(school_path):
            if verbose:
                print(f"Saltata directory non valida: {school_path}")
            continue
        
        # Inizializza il dizionario della scuola
        school_data = {}
        
        # Scansiona le classi
        for class_name in os.listdir(school_path):
            class_path = os.path.join(school_path, class_name)
            
            # Verifica che sia una directory di classe valida
            if not is_valid_class_dir(class_path):
                if verbose:
                    print(f"Saltata directory non valida: {class_path}")
                continue
            
            # Inizializza la lista dei progetti per questa classe
            class_projects = []
            
            # Cerca i file HTML nella directory della classe
            html_files = glob.glob(os.path.join(class_path, "*.html"))
            
            for html_file in html_files:
                file_name = os.path.basename(html_file)
                
                # Crea l'ID del progetto
                project_id = f"{school_name}_{class_name}_{os.path.splitext(file_name)[0]}"
                project_id = project_id.replace(' ', '_')
                
                # Estrai i metadati dal file HTML
                metadata = extract_metadata_from_html(html_file, verbose)
                
                # Crea il progetto
                project = {
                    'id': project_id,
                    'name': metadata['title'] or format_project_name(file_name),
                    'description': metadata['description'],
                    'file': html_file,
                    'authors': metadata['authors'],
                    'tags': metadata['tags'],
                    'cover_image': covers.get(project_id, '')
                }
                
                # Aggiungi il progetto alla lista dei progetti della classe
                class_projects.append(project)
            
            # Se ci sono progetti, aggiungi la classe al dizionario della scuola
            if class_projects:
                # Ordina i progetti per nome
                class_projects.sort(key=lambda p: p['name'])
                school_data[class_name] = class_projects
        
        # Se ci sono classi, aggiungi la scuola al dizionario dei progetti
        if school_data:
            projects_data[school_name] = school_data
    
    return projects_data

def save_projects_json(projects_data, output_file):
    """
    Salva i dati dei progetti in un file JSON.
    
    Args:
        projects_data (dict): Dizionario con i dati dei progetti.
        output_file (str): Percorso del file JSON di output.
    """
    # Assicurati che la directory di output esista
    output_dir = os.path.dirname(output_file)
    os.makedirs(output_dir, exist_ok=True)
    
    # Salva i dati in formato JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(projects_data, f, indent=2, ensure_ascii=False)

def main():
    """
    Funzione principale dello script.
    """
    # Configura l'argparse
    parser = argparse.ArgumentParser(description='Scansiona i progetti Twine e genera il file JSON dei progetti.')
    parser.add_argument('--projects-dir', default='progetti', help='Directory dei progetti')
    parser.add_argument('--output', default='server/projects.json', help='File JSON di output')
    parser.add_argument('--verbose', action='store_true', help='Mostra informazioni dettagliate')
    args = parser.parse_args()
    
    # Scansiona i progetti
    projects_data = scan_projects(args.projects_dir, args.verbose)
    
    # Salva i dati in formato JSON
    save_projects_json(projects_data, args.output)
    
    # Stampa un riepilogo
    total_schools = len(projects_data)
    total_classes = sum(len(school_data) for school_data in projects_data.values())
    total_projects = sum(sum(len(class_projects) for class_projects in school_data.values()) for school_data in projects_data.values())
    
    print(f"Trovate {total_schools} scuole, {total_classes} classi e {total_projects} progetti")
    print(f"Dati salvati in {args.output}")

if __name__ == "__main__":
    main()
