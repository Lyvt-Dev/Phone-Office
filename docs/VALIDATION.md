# Validierungsstand 0.5

58 Unit-Tests bestanden: Notizkern, Auswahl/Seitenoperationen, Grenzen und Kompatibilität, Import-/Exportrundläufe, Samsung-Übertragung, atomare Datenbank-Snapshots und Recovery bei vollem Legacy-Speicher. 96 Produktions-Browserszenarien bestanden auf Chromium/Desktop, Smartphone und Tablets in Hoch-/Querformat. Enthalten sind echte Chromium-Pointer-Eingabe für Stift und Zwei-Finger-Zoom, Seitenverwaltung, Auswahl/Verschieben/Kopieren/Löschen, gerade Linien, Fach-/Seitentitelsuche, PDF-Import → Beschriftung → PDF-Export → erneutes Öffnen mit Pixelprüfung sowie Samsung-PDF-Massenimport und erhaltene bestehende Dokumente. Vor Recovery-Prüfungen wird der abgeschlossene Speichervorgang abgewartet; noch laufende Transaktionen gelten nicht als gespeichert.

Für die neue `.pnote`-Dateiversion 2 wurde der Sicherungs-/Import-Rundlauf nach dem letzten Build gezielt erneut ausgeführt: vier Szenarien bestanden. Version 1 bleibt lesbar. Der Release-Workflow wiederholt alle Unit-/Browserszenarien, die unabhängige ODF-1.3-Schemaprüfung und verifiziert die native Android-APK. Separate Workflows kompilieren iPhone/iPad im Simulator und prüfen zwei iPad-Szenarien mit WebKit vor Web-Bereitstellung. Der lokale WebKit-Download war durch die Netzwerkregel (HTTP 403) blockiert; diese Engineprüfung wird auf dem GitHub-Runner ausgeführt und ist kein lokaler oder physischer iPad-Nachweis.

Offen: physischer Apple Pencil, neue Zoom-/Auswahlgesten auf Samsung/iPad, native Datei-/Share-Dialoge, VoiceOver/TalkBack und Großdokument-Benchmarks. Frühere Nutzer-Rückmeldung: S Pen funktioniert, ohne genaue Geräte-/Versionsangabe. Native iPad-Signierung/TestFlight ist nicht eingerichtet; Simulator-ZIPs sind keine Geräte-IPA. Keine vollständige GoodNotes-Parität. Details: `NOTES.md`, `IPAD.md`, `RELEASE-0.5.0.md`.

## Frühere Validierung

### Validierungsstand 0.4

46 Unit-Tests bestanden; Notizpräferenzen bleiben gespeichert, ungültige Einstellungswerte werden beim Öffnen abgelehnt. 60 Browser-Szenarien für Desktop, Tablet hoch/quer und Smartphone, einschließlich kompakter Handy-Querformatansicht (844 × 390), 48-Pixel-Werkzeuge, sichtbarer Schreibfläche, Einstellungsdialog/Focus/Escape, Präferenzen nach Neustart sowie Sicherung/Import. Der Release-Workflow prüft den endgültigen Stand erneut.

Der iPhone-/iPad-Simulator-Build der Notizfunktion wurde auf macOS erfolgreich kompiliert. Aktuelle Geräteabnahme der neuen Oberfläche, Apple Pencil und Leistungs-Benchmarks sind offen. Nutzer hat zuvor funktionierenden S Pen zurückgemeldet, ohne Gerätemodell/Versionsangabe. Unter `NOTES.md` stehen Umfang und Grenzen.

## Vorherige Validierung

### Stand 0.3.0

- 45 Unit-Tests bestanden: einschließlich Notizkern, Papier/Seiten, Strichdruck, Radierertreffer, Sicherung und erneutem Import, Datengrenzen und HTML-Bereinigung.
- 52 Browser-Szenarien: Dokument-/Writer-Rundläufe sowie Schulnotizen auf Desktop, Smartphone, Tablet hoch/quer. Notiztests prüfen Druckeingabe über Chromium, Rückgängig/Wiederholen, Fingerfilter, abgebrochene Striche, Textmarker, Rotation, SVG sowie vollständige `.pnote`-Sicherung mit erneutem Import als unabhängige Kopie. Keine ungefangenen Browserfehler in den Notizszenarien.
- TypeScript/Vite-Build, Android-/iOS-Synchronisierung und Android-Debug-Build 0.3.0 erfolgreich. Der Haupt-Chunk ist etwa 785 kB unkomprimiert.
- iPhone-/iPad-Simulator-App auf macOS mit Xcode erfolgreich kompiliert und als Simulator-Artefakt gepackt: https://github.com/Lyvt-Dev/Phone-Office/actions/runs/37991115879 . Keine Gerätesignierung/IPA, kein physischer S-Pen-/Apple-Pencil-Test und keine Safari-WebKit-Laufzeitprüfung. Details: `NOTES.md`.

## Vorherige Formatvalidierung 0.2.0

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
