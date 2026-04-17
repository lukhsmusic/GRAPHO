# GRAPHO — Projekt-Übersicht

GRAPHO ist eine leichtgewichtige Web-App zum Bearbeiten von Markdown-Dateien — als minimalistische Obsidian-Alternative für den Heimserver konzipiert. Der Fokus liegt auf einfacher Bedienung über Browser (Desktop & Mobile) ohne Build-Tooling.

## Tech-Stack

- **Backend:** Python 3.11+ mit FastAPI, Jinja2-Templates, uvicorn
- **Frontend:** HTMX + CodeMirror 6 (alles via CDN, kein Node.js / kein Build-Step)
- **Persistenz:** Direktes Lesen/Schreiben von Markdown-Dateien im konfigurierten Vault-Ordner
- **PWA:** Service-Worker + Web-Manifest für Installation auf Android-Homescreen

## Dateistruktur

```
GRAPHO/
├── .env                     # VAULT_PATH=/pfad/zum/vault
├── .gitignore
├── README.md                # Quickstart / Deployment
├── project-overview.md      # Diese Datei
├── requirements.txt         # fastapi, uvicorn[standard], jinja2, python-dotenv
├── run.py                   # Entry-Point: startet uvicorn mit reload
├── venv/                    # Python virtualenv (gitignored)
└── grapho/                  # Application-Package
    ├── __init__.py
    ├── main.py              # FastAPI-App, Static-Mount, Router-Registrierung
    ├── config.py            # Lädt .env, validiert VAULT_PATH
    ├── templating.py        # Jinja2Templates-Instanz
    ├── routers/
    │   ├── __init__.py
    │   ├── pages.py         # GET /, GET /edit/{file_path} — HTML-Seiten
    │   └── api.py           # /api/* — JSON/HTML für File-CRUD
    ├── services/
    │   ├── __init__.py
    │   └── vault.py         # Datei-Operationen mit Path-Traversal-Schutz
    ├── templates/
    │   ├── base.html        # Layout: Sidebar + Editor-Pane
    │   └── partials/
    │       └── file_tree.html   # Rekursive Tree-Render-Macro
    └── static/
        ├── css/style.css    # Catppuccin-inspiriertes Dark-Theme
        ├── js/
        │   ├── app.js       # Sidebar-Toggle, Create/Filter
        │   └── editor.js    # CodeMirror 6 Setup + Auto-Save
        ├── manifest.json    # PWA-Manifest
        ├── sw.js            # Service-Worker (Cache-First für Static)
        └── icons/           # PWA-Icons (192px / 512px)
```

## Funktionsweise

### Startup
1. `run.py` startet uvicorn mit `grapho.main:app` (reload=True für Dev)
2. `grapho/main.py` erzeugt die FastAPI-App, mountet `/static` und registriert die Router
3. `grapho/config.py` lädt `.env` und löst `VAULT_PATH` zu einem absoluten Pfad auf — bricht beim Start ab, falls der Pfad nicht existiert

### Request-Flow

**`GET /`** → `pages.index`
- Lädt Vault-Tree via `vault.list_tree()` und rendert `base.html` mit Welcome-Screen

**`GET /edit/{file_path}`** → `pages.edit`
- Lädt Tree + Datei-Inhalt, rendert `base.html` mit eingebettetem CodeMirror-Container
- Datei-Inhalt wird als JSON in ein `<script type="application/json">`-Tag gepackt (XSS-sicher) und beim Editor-Init geparst

**`/api/file/{file_path}`**
- `GET` — liefert Plaintext (für externe Clients)
- `PUT` — speichert via `vault.write_file` (atomar via tempfile + `os.replace`)
- `POST` — erstellt leere `.md`-Datei
- `DELETE` — löscht Datei

**`/api/dir/{dir_path}`** `POST` — erstellt Ordner

**`/api/tree`** `GET` — liefert HTML-Fragment des Trees (für HTMX-Refresh)

### Vault-Service (`grapho/services/vault.py`)
- `_safe_path(relative)`: löst Pfad innerhalb des Vaults auf und prüft, dass das Ergebnis tatsächlich unter `VAULT_PATH` liegt → **Path-Traversal-Schutz**
- `list_tree()`: rekursive Auflistung, sortiert (Ordner zuerst, alphabetisch), filtert Dotfiles, zeigt nur `.md`-Dateien
- `write_file()`: schreibt in temporäre Datei und ersetzt das Ziel atomar — verhindert Korruption bei Crashes/Stromausfall

### Frontend

**`base.html`**
- Zwei-Spalten-Layout: Sidebar (Tree, Suche, Action-Buttons) + Editor-Pane
- Lädt HTMX (CDN), eigenes `app.js`, und bei aktiver Datei das Editor-Modul + Service-Worker-Registrierung

**`editor.js`** (ES-Module, importiert CodeMirror 6 via esm.sh)
- Konfiguriert Editor mit: Markdown-Modus, One-Dark-Theme, Zeilennummern, History (Undo/Redo), Bracket-Matching, Such-Funktion, Line-Wrapping, Tab-Indent
- **Auto-Save:** 1.5s nach letzter Eingabe → `PUT /api/file/...`
- **Manueller Save:** `Ctrl/Cmd+S`
- **Status-Anzeige:** "Ungespeichert" / "Speichere..." / "Gespeichert" / "Fehler"
- **Retry:** bei Fehler automatischer Retry nach 3s
- **beforeunload-Warnung** bei ungespeicherten Änderungen

**`app.js`**
- Sidebar-Toggle (Mobile)
- `createFile()` / `createDir()` via `prompt()` → `POST` zum API
- `filterTree()`: client-seitige Live-Suche im Baum

**`sw.js`** (Service Worker)
- Cache-First für statische Assets (CSS, JS, Manifest)
- Network-Only für `/api/*` — Datei-Inhalte müssen immer frisch sein

## Sicherheits-Annahmen

- **Kein Auth** — bewusst, da nur im Heimnetz betrieben
- **Path-Traversal-Schutz** über `_safe_path` in jeder Vault-Operation
- **Vault wird auf Existenz validiert** beim Start — keine impliziten `mkdir`-Operationen
- Für externen Zugriff: HTTPS (z. B. via Caddy/nginx) zwingend für PWA-Install

## Entwicklung

```bash
source venv/bin/activate
python run.py     # läuft auf http://localhost:8000 mit auto-reload
```

CodeMirror- und HTMX-Versionen werden via Major-Range (`@6`, `@2`) von esm.sh / unpkg geladen — Patch-Updates kommen automatisch, Breaking Changes innerhalb der Major-Version werden vermieden.
