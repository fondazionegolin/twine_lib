# Guida al Deployment di Twine Library su VPS Debian

Questa guida ti aiuterà a deployare l'applicazione Twine Library su una VPS Debian dove hai già altri siti attivi.

## Prerequisiti

- VPS con Debian (o Ubuntu)
- Accesso SSH con privilegi sudo
- Un dominio o sottodominio puntato alla tua VPS (opzionale, ma consigliato)

## Passaggi per il Deployment

### 1. Trasferimento dei file

Trasferisci tutti i file dell'applicazione sulla tua VPS. Puoi usare `scp`, `rsync` o qualsiasi altro metodo di trasferimento file:

```bash
# Da eseguire sul tuo computer locale
rsync -avz --exclude 'node_modules' --exclude '.git' ./twine_lib/ utente@tuo-server:/var/www/twine_lib/
```

Oppure puoi clonare direttamente il repository sulla VPS:

```bash
# Da eseguire sulla VPS
cd /var/www
git clone https://github.com/tuousername/twine_lib.git
```

### 2. Configurazione del Deployment

1. Accedi alla tua VPS tramite SSH:
   ```bash
   ssh utente@tuo-server
   ```

2. Naviga nella directory dell'applicazione:
   ```bash
   cd /var/www/twine_lib
   ```

3. Modifica il file `deploy.sh` per personalizzare le configurazioni:
   ```bash
   nano deploy.sh
   ```
   
   Modifica le seguenti variabili:
   - `DOMAIN`: inserisci il tuo dominio o sottodominio
   - `PORT`: cambia la porta se 8000 è già in uso
   - `APP_NAME`: puoi lasciarlo come "twine_lib" o cambiarlo

4. Rendi lo script eseguibile e avvialo:
   ```bash
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

### 3. Configurazione SSL (opzionale ma consigliato)

Per abilitare HTTPS, puoi utilizzare Certbot:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tuo-dominio.com
```

### 4. Verifica del Deployment

1. Controlla che il servizio sia in esecuzione:
   ```bash
   sudo supervisorctl status twine_lib
   ```

2. Verifica che Nginx stia servendo correttamente l'applicazione:
   ```bash
   sudo nginx -t
   ```

3. Apri il browser e visita il tuo dominio per verificare che l'applicazione sia accessibile.

## Risoluzione dei Problemi

### Controlla i log

Se l'applicazione non funziona correttamente, controlla i log:

```bash
# Log di Supervisor
cat /var/www/twine_lib/logs/supervisor.err.log
cat /var/www/twine_lib/logs/supervisor.out.log

# Log di Nginx
cat /var/log/nginx/twine_lib.error.log
```

### Riavvia i servizi

Se necessario, riavvia i servizi:

```bash
sudo supervisorctl restart twine_lib
sudo systemctl reload nginx
```

## Aggiornamenti

Per aggiornare l'applicazione in futuro:

1. Trasferisci i nuovi file sulla VPS
2. Riavvia il servizio:
   ```bash
   sudo supervisorctl restart twine_lib
   ```

## Backup

È consigliabile eseguire regolarmente il backup dei dati:

```bash
# Backup dei file di dati
sudo cp -r /var/www/twine_lib/server /path/to/backup/
```

---

Per qualsiasi assistenza, contatta l'amministratore del sistema.
