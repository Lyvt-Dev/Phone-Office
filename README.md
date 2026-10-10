# Phone Office

Lokale Notiz-App für Handschrift, Arbeitsblätter und getippten Text. Word-/LibreOffice-Dateien gehören zum zusätzlichen Office-Arbeitsbereich. Capacitor stellt Projekte für **Android und iOS** bereit; Electron ist die **Desktop-Hülle** und läuft selbst nicht auf diesen Mobilplattformen.

**0.7.6:** Haftnotizen auf dem Blatt, eigene Coverbilder, persönliche Akzente/Schriften/Größen und überarbeitete Dialoge. [Release](docs/RELEASE-0.7.6.md).

**0.7.5:** Notizbücher und Handschrift sind der Kern, Word/LibreOffice der Zusatz. Neue Bibliothek mit Favoriten, Coverfarben, Fach-/Ordnergruppen und Papierkorb; Punktpapier, geometrische Striche und Bildnotizen. [Release](docs/RELEASE-0.7.5.md) · [Funktionsstand und weitere Schritte](docs/NOTES-FEATURES.md).

## Start

Node 24 und npm 11 (hier validiert):

```sh
npm ci --cache /tmp/phone-office-npm
npm run dev
```

```sh
npm test
npm run build
PHONE_OFFICE_CHROMIUM=/usr/bin/chromium npm run test:e2e
npm run native:sync
```

Für E2E kann alternativ `npx playwright install chromium` einen Browser installieren; hierfür müssen die offiziellen Browser-Download-Domains freigegeben sein. Im Cloud-System wird der vorhandene Chromium verwendet.

Desktop:

```sh
NODE_USE_ENV_PROXY=1 electron_config_cache=/workspace/.cache/electron node node_modules/electron/install.js
npm run desktop
```

Electron benötigt eine grafische Sitzung und einen funktionsfähigen Betriebssystem-Sandboxmechanismus. Keine `--no-sandbox`-Startoption in der App verwenden. In dieser Cloud wurde der Desktop-Start durch die Linux-Sandboxkonfiguration blockiert; ein erfolgreicher Desktop-Lauf ist noch nicht nachgewiesen.

Mobil:

```sh
npm run native:sync
npx cap open android
npx cap open ios
```

Android: Android Studio, SDK 36 und JDK 21. iOS: macOS, passende Xcode-Version und Signing. Die Android-Debug-APK wurde lokal gebaut und ihre Signatur geprüft. iOS-Kompilierung, Gerätespeicherung, native Datei-Downloads und Tastaturverhalten müssen auf echten Geräten geprüft und ergänzt werden. Ein erfolgreicher Build beweist keinen Gerätetest.

## Aktueller Stand (0.2)

- Responsive Startseite, Suche, Kachel-/Listenansicht, Hell-/Dunkelmodus.
- Rich-Text mit Schrift, Größe, Farbe, Auszeichnung, Überschriften, Absatz-Ausrichtung und Zeilenabstand, Listen samt Listeneinzügen, Tabellen, lokalen Bildern und Links.
- Rückgängig/Wiederholen, Wortzählung, Suchen/Ersetzen; Gerätebrowser stellt Rechtschreibprüfung bereit, sofern verfügbar.
- Automatische lokale Speicherung nach Änderungen und Wiederherstellung nach Neuladen. Browser-Speicher ist keine dauerhafte Dateisicherung: regelmäßig exportieren. Speicherausfälle werden angezeigt, beschädigte Wiederherstellungsdaten nicht überschrieben.
- ODT/OTT/FODT importieren und exportieren; SXW/STW importieren. TXT/HTML importieren und als neue Datei exportieren. Eingeschränkter DOCX-Import mit Verlustwarnung. Druckvorschau und Browser-Druckdialog.

Siehe [Konzept und Formatmatrix](docs/CONCEPT.md) sowie [Ausbauplan](docs/ROADMAP.md). Nicht implementierte Funktionen sind dort und in der App gekennzeichnet. Keine behauptete vollständige Word-/Writer-Kompatibilität.

## Android-Test-APK

[GitHub-Releases](https://github.com/Lyvt-Dev/Phone-Office/releases) · [Installations- und Buildhinweise](docs/ANDROID-TEST-RELEASE.md)

Ein Test-Tag (`v*-android-test*`) startet den Workflow für eine signierte Debug-APK und ein Vorab-Release. Die App heißt „Phone Office Test“ und benötigt keine kostenpflichtige Entwicklerlizenz zum Sideloading.

[Writer-Dateiformate, Grenzen und Tests](docs/WRITER-SUPPORT.md): keine vollständige LibreOffice-Kompatibilität.

Schulnotizen (0.3): mehrere Handschriftseiten, Stift/Textmarker/Radierer, getippter Text sowie `.pnote`-Sicherung und SVG-Seitenausgabe. Tablet-Ansichten und Grenzen: [docs/NOTES.md](docs/NOTES.md). Physische S-Pen-/Apple-Pencil-Tests und iOS-Auslieferung stehen aus.

Ab 0.4: kompakte Querformatansicht, Icon-Werkzeuge, separate Notizeinstellungen und gespeicherte Stiftpräferenzen. Der Sichern-Button gibt direkt das vollständige Notizbuch aus.

0.5 ergänzt Zwei-Finger-Zoom, eine Tablet-Seitenübersicht mit Lesezeichen, Handschrift-Auswahl, PDF-Arbeitsblätter und PDF-Ausgabe sowie einen Assistenten für mehrere Samsung-Notes-PDF-Exporte. Speicherung erfolgt atomar in IndexedDB; vorhandene lokale Daten werden übernommen. Eigenes Logo und tatsächliche Versionsanzeige. [Release 0.5](docs/RELEASE-0.5.0.md), [Schulnotizen](docs/NOTES.md), [iPad-Bereitstellung](docs/IPAD.md). Die Browser-App ist für Safari/Home-Bildschirm mit Offline-Shell vorbereitet; eine native IPA benötigt Apple-Signierung. GoodNotes-Parität ist nicht vollständig implementiert.

Die iPad-Auslieferung ist für 0.5 zunächst zurückgestellt; der Pages-Workflow ist manuell startbar, sobald GitHub Pages konfiguriert wurde. Android bleibt der Release-Schwerpunkt.

0.6 ergänzt Kugelschreiber/Füller/Bleistift, Halten-zum-Begradigen, freie Lasso-Auswahl, Live-Vorschau beim Verschieben und einen kompakten Fokusmodus. Android kann einen ausdrücklich freigegebenen Samsung-Exportordner nach neuen PDF/.pnote-Dateien durchsuchen. Die native Geräte-IPA wird für lokale Installation mit xtool bereitgestellt: [Release 0.6](docs/RELEASE-0.6.0.md), [xtool-Anleitung](docs/IPAD-XTOOL.md). Keine private Samsung-Datenbank oder vollständige GoodNotes-Parität.

## Phone Office 0.7.0

Werkzeuge mit eigenen Einstellungen per zweitem Tipp, Teilradierer mit Größenwahl, lokale Stylustasten-Anbindung und eine übersichtlichere Bibliothek. Android wird als nicht debuggbarer Release-Build mit dem Namen Phone Office erstellt; die bisherige Update-Identität bleibt erhalten. [Release und Grenzen](docs/RELEASE-0.7.0.md), [Prüfumfang](docs/VALIDATION-0.7.0.md).

## Schriftlizenz

Manrope wird lokal mitgeliefert (SIL Open Font License 1.1). Copyright und Lizenz: [OFL-Manrope.txt](public/fonts/OFL-Manrope.txt). Quelle: [Google Fonts / Manrope](https://github.com/google/fonts/tree/main/ofl/manrope).
