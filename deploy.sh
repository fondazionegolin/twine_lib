#!/bin/bash

# Script di deployment per Twine Library
# Questo script configura il servizio Twine Library su una VPS Debian

# Variabili di configurazione
APP_NAME="twine_lib"
APP_DIR="/var/www/$APP_NAME"
PYTHON_VERSION="3.9"
PORT="8000"
DOMAIN="twine.yourdomain.com"  # Sostituisci con il tuo dominio

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniziando il deployment di $APP_NAME...${NC}"

# Crea directory dell'applicazione se non esiste
echo -e "${YELLOW}Creazione directory dell'applicazione...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs

# Installa dipendenze di sistema se necessario
echo -e "${YELLOW}Installazione dipendenze di sistema...${NC}"
apt-get update
apt-get install -y python$PYTHON_VERSION python$PYTHON_VERSION-venv python3-pip nginx supervisor

# Crea e attiva ambiente virtuale
echo -e "${YELLOW}Configurazione ambiente Python...${NC}"
if [ ! -d "$APP_DIR/venv" ]; then
    python$PYTHON_VERSION -m venv $APP_DIR/venv
fi
source $APP_DIR/venv/bin/activate

# Installa dipendenze Python
echo -e "${YELLOW}Installazione dipendenze Python...${NC}"
pip install -r $APP_DIR/requirements.txt

# Crea file di configurazione per Supervisor
echo -e "${YELLOW}Configurazione Supervisor...${NC}"
cat > /etc/supervisor/conf.d/$APP_NAME.conf << EOF
[program:$APP_NAME]
directory=$APP_DIR
command=$APP_DIR/venv/bin/python $APP_DIR/server.py
autostart=true
autorestart=true
stderr_logfile=$APP_DIR/logs/supervisor.err.log
stdout_logfile=$APP_DIR/logs/supervisor.out.log
environment=PYTHONUNBUFFERED=1
user=www-data
EOF

# Crea configurazione Nginx
echo -e "${YELLOW}Configurazione Nginx...${NC}"
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN;

    access_log /var/log/nginx/$APP_NAME.access.log;
    error_log /var/log/nginx/$APP_NAME.error.log;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Abilita il sito in Nginx
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Riavvia i servizi
echo -e "${YELLOW}Riavvio dei servizi...${NC}"
supervisorctl reread
supervisorctl update
supervisorctl restart $APP_NAME
nginx -t && systemctl reload nginx

echo -e "${GREEN}Deployment completato!${NC}"
echo -e "L'applicazione dovrebbe essere disponibile su http://$DOMAIN"
