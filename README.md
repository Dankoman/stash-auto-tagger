# Stash Auto Tagger Plugin v1.1

Ett avancerat plugin för Stash App som använder JoyTag (via ett Go/Python-API) för att automatiskt identifiera och föreslå taggar för scener baserat på bildanalys. Pluginet kan pausa scener, extrahera bilder, visa förslag på taggar och automatiskt lägga till dem i Stash.

## Funktioner

### Grundläggande funktioner
- **Pausning och bildextraktion**: Pausa video och extrahera aktuell frame för analys.
- **AI-baserad taggning**: Skicka bild till din lokala JoyTag-instans för träffsäker taggning av kläder, miljöer och annat.
- **Automatisk tagg-skapande**: Skapa automatiskt nya taggar i Stash om de som föreslås inte redan finns.
- **Konfigurerbar**: Anpassningsbara inställningar för API-URL, timeout och konfidensgrad.

### Användargränssnitt
- **Interaktiv popup**: Visa resultat i en snygg popup där du kan välja vilka taggar som ska sparas.
- **Bulk-val**: Välj alla föreslagna taggar med en knapp.
- **Statusmeddelanden**: Tydlig feedback om analysstatus och resultat.
- **Responsiv design**: Fungerar på både desktop och mobila enheter.

## Installation

### 1. Förbered din Auto-Tagger API

Se till att din backend-tjänst (JoyTag API) körs.

```bash
# Exempel: Starta din backend (beroende på din setup)
python auto_tagger_api.py
```

Servern bör starta på `http://localhost:5001` eller din konfigurerade adress.

### 2. Installera Plugin i Stash

1. Ladda ner `auto-tagger.zip`.
2. Kopiera zip-filen eller dess innehåll till din Stash `plugins`-katalog.
3. Starta om Stash eller ladda om plugins från inställningarna.
4. Gå till **Settings > Plugins** och verifiera att "Auto Tagger" är aktiverad.

### 3. Konfigurera Plugin

1. Gå till en video i Stash.
2. Högerklicka på "Auto Tag"-knappen för att öppna inställningar.
3. Konfigurera följande inställningar:
   - **API URL**: `http://localhost:5001`
   - **Minimum konfidensgrad**: `0.4` (rekommenderat)
   - **Skapa taggar automatiskt**: På

## Användning

1. Öppna en video i Stash.
2. Pausa videon vid en representativ bildruta.
3. Klicka på "Auto Tag"-knappen.
4. Granska de föreslagna taggarna i listan.
5. Klicka på "Spara valda taggar" för att uppdatera scenen.

## Felsökning

### Plugin visas inte i Stash
1. Kontrollera att `auto-tagger.yml` har korrekt syntax.
2. Verifiera att filerna ligger i en undermapp i `plugins/`.
3. Starta om Stash helt.

### API-anslutningsfel
1. Kontrollera att din JoyTag-server körs på rätt port.
2. Verifiera API-URL i plugin-inställningar.
3. Kontrollera Stash-loggar för CSP-blockeringar.

## Changelog

### v1.1.0
- ✨ Ny: Förbättrat UI med bättre feedback.
- ✨ Ny: Stöd för att skapa taggar automatiskt om de saknas.
- 🎨 Förbättrat: Modernare popup-design.
- 🐛 Fixat: Problem med vissa specialtecken i taggnamn.

### v1.0.0
- 🎉 Initial release med grundläggande JoyTag-integration.
- 🎯 Bildextraktion från videospelaren.
- ⚙️ Grundläggande inställningar för API.

## Licens

Detta plugin är fritt att använda och modifiera.
