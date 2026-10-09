# Phone Office

Lokaler mobiler Texteditor als klickbarer React-Prototyp und erste Implementierungsstufe. Electron ist die **Desktop-Hülle**; Capacitor stellt separate Projekte für **Android und iOS** bereit. Electron selbst läuft nicht auf diesen Mobilplattformen.

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
