# Installation Guide - Stash Auto Tagger Plugin

Denna guide hjälper dig att installera och konfigurera Auto Tagger för Stash App.

## Förutsättningar

### 1. Stash App
- Stash App installerat och fungerande.
- Tillgång till Stash plugins-katalog.

### 2. JoyTag API (Backend)
- En fungerande JoyTag-instans (t.ex. via HipCrop-projektet).
- Python-miljö med `flask` och `joytag` installerat.

## Steg 1: Starta Backend-API

Se till att din backend-tjänst är igång innan du använder pluginet i Stash.

```bash
cd /home/marqs/Programmering/Python/3.11/HipCrop/
python auto_tagger_api.py
```

Verifiera att tjänsten svarar på `http://localhost:5001/api/tag`.

## Steg 2: Installera Plugin

### 2.1 Hitta din plugins-katalog
Standardplatser:
- **Linux**: `~/.stash/plugins/`
- **Windows**: `%APPDATA%\stash\plugins\`

### 2.2 Kopiera filer
Skapa en mapp som heter `auto-tagger` i din `plugins`-katalog och kopiera följande filer dit:
- `auto-tagger.yml`
- `auto-tagger.js`
- `auto-tagger.css`

Alternativt, extrahera innehållet från `auto-tagger.zip` direkt till mappen.

## Steg 3: Konfigurera Stash

1. Starta om Stash App.
2. Gå till **Settings > Plugins**.
3. Klicka på **Reload Plugins**.
4. Aktivera "Auto Tagger".

## Steg 4: Inställningar

Öppna en scen i Stash och högerklicka på plugin-knappen för att ställa in:
- **API URL**: Adressen till din backend (t.ex. `http://localhost:5001`).
- **Min Confidence**: Tröskelvärde för taggar (förvalt `0.4`).
- **Auto Create**: Om nya taggar ska skapas automatiskt i Stash.

## Felsökning

### Anslutningsproblem
Om pluginet inte kan kontakta backend, kontrollera webbläsarens konsol (F12) för felmeddelanden som "Refused to connect". Detta beror ofta på Content Security Policy (CSP). Se till att `auto-tagger.yml` har korrekta CSP-inställningar.

### Inga taggar hittas
1. Kontrollera att din JoyTag-modell är korrekt laddad i backend.
2. Sänk "Minimum konfidensgrad" i inställningarna om du får för få förslag.
