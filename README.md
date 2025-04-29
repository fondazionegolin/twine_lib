# Biblioteca Twine

Un'applicazione web mobile-friendly per sfogliare progetti Twine organizzati per classi, con funzionalità di votazione.

## Descrizione

Questa applicazione web è progettata come un libro sfogliabile di progetti Twine, organizzati per classi e progetti. Gli utenti possono navigare attraverso le classi, visualizzare i progetti disponibili e aprirli in modalità a schermo intero. È possibile esprimere apprezzamento per i progetti con un "like", che viene registrato sul server.

## Struttura del Progetto

```
TwineLibrary/
├── css/                  # Fogli di stile
│   └── style.css
├── img/                  # Immagini (copertina, ecc.)
├── js/                   # JavaScript
│   └── app.js
├── progetti/             # File HTML dei progetti Twine
│   └── classe1A/         # Progetti della classe 1A
├── server/               # File lato server
│   ├── classes.json      # Dati delle classi
│   ├── likes.json        # Dati dei like in formato JSON
│   ├── likes.csv         # CSV dei like (generato automaticamente)
│   └── projects.json     # Dati dei progetti
├── index.html            # Pagina principale
├── scan_projects.py      # Script Python per scansionare i progetti
├── scan_projects_py.html # Interfaccia web per scansionare i progetti
└── server.py             # Server Python per l'applicazione
```

## Come Aggiungere Progetti

1. **Aggiungi i file HTML dei progetti Twine**:
   - Crea una cartella per la classe all'interno della directory `progetti/` (es. `progetti/classe2B/`)
   - Inserisci i file HTML generati da Twine nella cartella della classe

2. **Aggiorna il file `projects.json`**:
   - **Automaticamente**: Usa lo script `scan_projects.py` o la pagina web `scan_projects_py.html`
   - **Manualmente**: Modifica direttamente il file JSON

Per ogni progetto, specifica:
- `id`: identificatore univoco del progetto (es. `classe2B_prog1`)
- `name`: nome del progetto
- `description`: breve descrizione
- `file`: percorso relativo al file HTML (es. `classe2B/nome_file.html`)

Esempio:
```json
"classe2B": [
  {
    "id": "classe2B_prog1",
    "name": "Nome del Progetto",
    "description": "Descrizione del progetto",
    "file": "classe2B/nome_file.html"
  }
]
```

## Estrazione Automatica dei Metadati

L'applicazione supporta l'estrazione automatica dei metadati dai file HTML dei progetti Twine. Per utilizzare questa funzionalità:

1. Aggiungi metadati ai tuoi file HTML Twine utilizzando:
   - Tag `<title>` per il titolo del progetto
   - Meta tag `description` per la descrizione
   - Commenti HTML per autori: `<!-- authors: Nome1, Nome2 -->`
   - Commenti HTML per tag: `<!-- tags: tag1, tag2 -->`

2. Scansiona i progetti in uno dei seguenti modi:
   - **Via interfaccia web**: Accedi alla pagina `scan_projects_py.html` e clicca su "Avvia scansione"
   - **Via riga di comando**: Esegui `python scan_projects.py --verbose`

## Requisiti per l'Esecuzione

Per eseguire l'applicazione è necessario Python 3.6 o superiore.

## Avvio Rapido

1. Clona o scarica questo repository
2. Avvia il server Python con il comando:
   ```
   python server.py
   ```
3. Accedi all'applicazione tramite browser all'indirizzo: `http://localhost:8000`

## Note per lo Sviluppo

- L'applicazione è progettata per essere responsive e funzionare bene su dispositivi mobili
- I like vengono salvati sia in formato JSON che CSV per facilitare l'analisi dei dati
- Il file CSV può essere facilmente importato in Excel o altri software per l'analisi
