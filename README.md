# GRAPHO

Leichtgewichtige Web-App zum Bearbeiten von Markdown-Dateien — eine minimalistische Obsidian-Alternative für den Heimserver.

## Features

- **CodeMirror 6 Editor** mit Markdown-Syntax-Highlighting und Dark Theme
- **Datei-Navigation** via Sidebar mit Verzeichnisbaum und Suche
- **Auto-Save** — automatisches Speichern 1.5s nach letztem Tastendruck
- **Dateiverwaltung** — neue Dateien/Ordner erstellen, Dateien löschen
- **PWA** — als App auf dem Android-Homescreen installierbar
- **Kein Build-Step** — kein Node.js nötig, alles via CDN

## Tech-Stack

- Python 3.11+ / FastAPI / Jinja2 / uvicorn
- HTMX + CodeMirror 6 (via CDN)

## Quickstart

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Vault-Pfad konfigurieren
echo "VAULT_PATH=/pfad/zu/deinem/vault" > .env

python run.py
```

Dann im Browser: `http://localhost:8000`

## Deployment (Heimserver)

```bash
uvicorn grapho.main:app --host 0.0.0.0 --port 8000
```

Für PWA-Funktionalität auf Nicht-Localhost wird HTTPS benötigt (z.B. via Caddy oder nginx mit Let's Encrypt).
