# Technisches Konzept – Phone Office 0.2

React 19, TypeScript und Tiptap/ProseMirror bilden den gemeinsamen lokalen Texteditor. Capacitor 8 stellt Android-/iOS-Hüllen bereit; Electron ist ausschließlich für Desktop-Systeme vorgesehen. Der Android-Testbuild wurde kompiliert. iOS-Kompilierung und Electron-Laufzeit sind weiterhin nicht bestätigt.

## Module

- `src/core`: Dokumentidentität, echte Änderungszeiten und Wortzählung mit Absatz-/Zellgrenzen.
- `src/formats`: Bereinigung, TXT/HTML/DOCX-Import und separate OpenDocument-Adapter. ODT, OTT und FODT werden gelesen und geschrieben; SXW/STW werden als Legacy-Kopie gelesen.
- `src/storage`: lokale Wiederherstellung und separate Dateiausgabe. Auf Android schreiben Filesystem/Share die Exportdatei lokal und öffnen die ausdrückliche Geräteauswahl.
- `src/App.tsx`: Startseite, Editor, kontextabhängige Werkzeugbereiche und zugängliche Dialoge. Auf mobilen Geräten mindestens 48 Pixel große Touch-Flächen und lesbare Schrift.

Das interne Dokument ist eine versionierte HTML-Kopie mit ID, Titel, Quellformat und Änderungszeit. Dieses Schema kann erweiterte Writer-Funktionen nicht vollständig abbilden. Daher sind Originaldateien von der Bearbeitung getrennt und Formatverluste werden vor Import und Writer-Export gemeldet. Die aktuelle [Formatmatrix](WRITER-SUPPORT.md) unterscheidet implementierte Funktionen von Grenzen und unimplementierten Formaten.

## Datenschutz und Speicherung

Dokumentverarbeitung erfolgt auf dem Gerät. Es gibt keine Serverkonvertierung oder automatische Cloud-Verbindung. Externe Bildquellen, aktive HTML-Inhalte und XML-Entitäten werden entfernt oder abgelehnt. ZIP-Import prüft CRCs und begrenzt Einträge sowie entpackte Größen.

Die App speichert HTML-Dokumente im lokalen Browser-/WebView-Profil und stellt sie nach erneutem Öffnen wieder her. Das ist keine dauerhaft garantierte Dateisicherung oder zusätzliche Verschlüsselung. Speicherfehler werden sichtbar angezeigt; beschädigte Wiederherstellungsdaten werden nicht automatisch überschrieben. Eigene Dokumente regelmäßig als Datei sichern. Android-Dateiausgabe verwendet App-Cache und Systemauswahl; nur der Nutzer entscheidet über ein Ziel oder einen Empfänger.

## Ehrlicher Funktionsumfang

Auf der Startseite erscheinen ausschließlich vom Nutzer erstellte und importierte Dokumente. Keine vorbefüllten Projektdokumente, Beispielvorlagen, erfundenen Benutzerkonten oder Textimitate in Vorschauen. Bereits erstellte Dateien bleiben erhalten.

Writer-Grundformatierung, Text, Überschriften, Listen, Tabellen, Links und eingebettete Bilddaten sind implementiert und mit Rundlauftests geprüft. ODF-1.3-Exporte werden unabhängig mit dem ODF Toolkit Validator und den offiziellen Relax-NG-Schemas geprüft. Kein Nachweis vollständiger LibreOffice-Funktions- oder Layoutkompatibilität. Calc/Impress/Draw/Base brauchen eigene Dokumentkerne.

Seitenansicht ist eine Sitzungsansicht und keine echte Pagination. Noten und Kommentare werden beim Import beschrifteter Text; Änderungsverfolgung und Office-Objekte gehen verloren. Native Druck-/PDF-Ausgabe, große-Dokument-Leistung und reale Screenreader-/Tastatur-/Dateidialogtests sind noch ausstehend. Die Rechtschreibprüfung hängt vom Gerätebrowser und seinen Wörterbüchern ab.
