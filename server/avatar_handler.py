#!/usr/bin/env python3
import os
import base64
import json
import uuid
from datetime import datetime

# Directory per gli avatar
AVATAR_DIR = os.path.join('images', 'avatars')
os.makedirs(AVATAR_DIR, exist_ok=True)

def save_avatar_image(base64_data, username):
    """
    Salva un'immagine avatar dal formato base64
    Restituisce il percorso relativo all'immagine salvata
    """
    try:
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
