# Validierungsstand der ersten Stufe

Am 9. Oktober 2026 in der Cloud ausgeführt:

- Wiederholbare Einrichtung über `npm ci`, offiziellen Electron-Downloader mit Prüfsummenprüfung, Unit-Tests, Build und Capacitor-Synchronisierung: erfolgreich.
- `npm test`: **16 bestanden**, keine übersprungen. Dokumentbearbeitung und Wiederöffnung aus lokalem Speicher; TXT-/HTML-Rundläufe; DOCX-Fixture und HTML-Kopie; aktive Inhalte bereinigen; nicht unterstützte oder ungültige Formate ablehnen.
- `npm run build`: TypeScript und Vite-Produktion erfolgreich. Vite meldet einen großen Haupt-Chunk (etwa 762 kB unkomprimiert); weitergehende Ladezeitoptimierung steht aus. Mammoth wird erst beim DOCX-Import geladen.
- `PHONE_OFFICE_PRODUCTION=1 PHONE_OFFICE_CHROMIUM=/usr/bin/chromium npm run test:e2e`: **10 bestanden**, keine übersprungen. Fünf Szenarien jeweils in Desktop- und mobiler Chromium-Ansicht: Bearbeiten/Ersetzen/Tabelle/Wiederherstellung/Download, DOCX-Import, HTML-Export mit erneutem Import, Fettformatierung/Rückgängig/Wiederholen/Vorschau und Speicherfehler mit weiterhin möglichem Export.
- `npx cap sync`: Android und iOS erfolgreich synchronisiert; kein nativer Compile-/Gerätetest.
- Electron-Binärdatei installiert; `node --check electron/main.cjs` erfolgreich. Laufzeitversuch blockiert durch den nicht passend konfigurierten Linux-SUID-Sandbox-Helper. Die Sandbox wurde nicht abgeschaltet. Desktop-Laufzeit und Paketerstellung sind **nicht validiert**.

Mobile Chromium-Emulation beweist keine iOS-WebKit-Kompatibilität. Im Formatierungstest wird die Textauswahl über die DOM-Selection-API vorbereitet, anschließend die echte Toolbar bedient. Physische Touch-Auswahlgriffe, Systemtastatur, VoiceOver/TalkBack und native Dateiexporte sind noch ungetestet. Browser-PDF-Erzeugung, große Dokumente und vollständiger Office-Formaterhalt wurden nicht validiert.

Installationsskript und Startanleitung wurden als Cloud-Konfigurationsentwurf gespeichert. Ein neuer Task und die Veröffentlichung der Umgebung wurden nicht geprüft; beides ist kein Ergebnis dieser lokalen Tests.
