# Validierungsstand 0.2.0

Am 9. Oktober 2026 in der Cloud ausgeführt:

- `npm test`: **37 bestanden**, keine übersprungen. Dokumentkern, TXT/HTML/DOCX, ODT/OTT/FODT-Rundläufe mit Formatierung, Tabellen, Bildern und Listen, SXW/STW-Import, ungültige XML-/ZIP-Dateien, Entpacklimits und native Export-Schnittstelle mit gemockten Plugins.
- `npm run build`: TypeScript und Vite-Produktion erfolgreich. Haupt-Chunk etwa 772 kB unkomprimiert; weitere Ladezeitoptimierung steht aus.
- Produktions-Browsertests: **18 bestanden**, jeweils neun Szenarien auf Desktop und mobiler Chromium-Ansicht. Bearbeiten, Speichern, Wiederöffnen, Suchen/Ersetzen, DOCX, HTML sowie ODT/OTT/FODT-Export und erneuter Import; keine Beispieldokumente, größere mobile Bedienelemente, Formatierung und Speicherfehler.
- Unabhängige ODF-1.3-Schemaprüfung: vier ODT-/OTT-Dateien mit ODF Toolkit 0.13.0 sowie zwei FODT-Dateien mit dessen Relax-NG-Schema und lxml gültig. Schemakonformität garantiert keinen vollständigen Erhalt des Writer-Layouts.
- `npx cap sync`: Android und iOS erfolgreich. Android `assembleDebug` einschließlich Filesystem-/Share-Plugins erfolgreich; APK-Version `0.2.0-test`, gültige v2-Signatur, Paket `dev.lyvt.phoneoffice.debug`, minSdk 24, targetSdk 36. GitHub-Veröffentlichung wird separat durch den Release-Workflow geprüft.

Mobile Chromium-Emulation beweist keine iOS-WebKit-Kompatibilität. Physische Touch-Auswahl, Systemtastatur, VoiceOver/TalkBack, native Dateiauswahl und Speichern-/Teilen-Dialog brauchen Gerätetests. Die native Export-Schnittstelle wurde mit Mocks geprüft; ein echter Samsung-Test steht aus. Kein iOS-Compile-Test, kein Großdokument-Benchmark und keine unabhängige visuelle LibreOffice-Vergleichsprüfung.

Browser-Druck ist vorhanden; nativer PDF-/Druckexport ist noch nicht implementiert. Komplexe Writer-Seitenlayouts, Kommentare, Änderungsverfolgung und weitere Office-Objekte werden nicht als vollständig unterstützt bezeichnet. Siehe `WRITER-SUPPORT.md`.

Electron ist installiert; Syntaxprüfung erfolgreich. Desktop-Laufzeit blockiert durch den Linux-SUID-Sandbox-Helper und bleibt unvalidiert. Die Sandbox wurde nicht abgeschaltet.

Cloud-Installationsskript und Startanleitung sind als Konfigurationsentwurf gespeichert. Veröffentlichung der Umgebung und ein neuer Task sind kein Ergebnis dieser lokalen Tests.
