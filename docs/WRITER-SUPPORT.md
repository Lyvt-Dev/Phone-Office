# Writer-Dateien in Phone Office 0.2

## Implementiert

| Format           | Öffnen und bearbeiten                                  | Ausgabe                         |
| ---------------- | ------------------------------------------------------ | ------------------------------- |
| ODT              | Als neue lokale Kopie                                  | Neue ODT-Datei                  |
| OTT              | Als neue lokale Kopie aus einer Vorlage                | Neue OTT-Vorlage                |
| FODT             | Flaches Writer-XML als neue lokale Kopie               | Neue FODT-Datei                 |
| SXW / STW        | Alte OpenOffice-/Writer-ZIP-Dokumente als lokale Kopie | Modernes ODT, OTT oder FODT     |
| DOCX             | Bisheriger eingeschränkter Import                      | ODT, OTT, FODT, HTML oder TXT   |
| HTML / HTM / TXT | Bisheriger Import                                      | HTML / TXT sowie Writer-Formate |

Der zentrale Editor erhält Text, Überschriften, Fett/Kursiv/Unterstrichen/Durchgestrichen, Schrift/Farbe/Größe, Absatzausrichtung und Zeilenabstand, einfache Listen, Tabellen, Links und eingebettete PNG/JPEG/GIF/WebP-Bilddaten. Writer-Stile werden auf die unterstützten Textattribute abgebildet. Benannte Formatvorlagen, Bildgrößen/-positionen und Seitenlayout werden nicht originalgetreu erhalten.

## Konkrete Grenzen

- Kopf-/Fußzeilen und echte Pagination werden nicht übernommen.
- Fuß-/Endnoten und Kommentare werden beim Import als beschrifteter Text übernommen; ihre ursprünglichen Beziehungen und Bearbeitungsfunktionen gehen verloren.
- Änderungsverfolgung, eingebettete Office-Objekte und Formen werden nicht erhalten. Der Import zeigt Hinweise, bevor eine Kopie geöffnet wird.
- ODT/OTT/FODT-Export benötigt eine Bestätigung der Formatgrenzen und erstellt eine neue Datei. Bilder erhalten derzeit ein vereinfachtes Exportlayout; GIF/WebP-Unterstützung hängt auch von der verwendeten LibreOffice-Version ab.
- Passwortgeschützte Dokumente sind nicht unterstützt. In LibreOffice zuerst eine unverschlüsselte Kopie erstellen.
- DOC und RTF benötigen eigene Adapter. ODS/OTS (Calc), ODP/OTP (Impress), ODG (Draw) und ODB (Base) benötigen andere Dokumentkerne; diese App ist ein Texteditor. Diese Formate werden nicht als bearbeitbare Writer-Dateien ausgegeben.
- Externe Bilder werden nicht geladen. XML-DTD/Entitäten, beschädigte ZIPs und zu große entpackte Archive werden abgelehnt. Grenze: 20 MB Datei, 16 MB je ZIP-Eintrag, 64 MB insgesamt, 2.000 ZIP-Einträge; begrenzte Tabellenwiederholungen und XML-Tiefe. Große-Dokument-Leistung ist noch nicht auf Geräten gemessen.

## Android-Dateiausgabe

Auf Android schreibt die App die Exportdatei lokal in den App-Cache und öffnet mit Capacitor Share die Geräteauswahl zum Speichern oder Teilen. Die Auswahl eines Cloud- oder Empfänger-Apps erfolgt ausdrücklich durch den Nutzer. Es gibt keinen automatischen Upload. Je nach Samsung-Apps muss zum dauerhaften Speichern eine passende Datei-App in der Auswahl verwendet werden; der temporäre App-Cache ist keine dauerhafte Sicherung. Der Dateiausgabecode ist mit Plugin-Mocks getestet, die Android-Integration kompiliert; der reale Dialog benötigt noch einen Gerätetest.

## Prüfung

Automatisierte Rundläufe für ODT, OTT und FODT prüfen Text, Formatierung, Tabellen, Listen, Links, eingebettete Bilder sowie Änderung und erneutes Öffnen. Unabhängiger ODF Toolkit Validator 0.13.0 prüft exportierte ODT/OTT-Pakete gegen ODF 1.3; FODT wird direkt gegen dieselbe offizielle Relax-NG-Spezifikation geprüft. Diese Prüfungen bestätigen die getesteten Exportfälle und gültige Dateistrukturen, keine vollständige LibreOffice-Funktionskompatibilität und keinen visuellen Vergleich mit einer laufenden Writer-Anwendung.

Die Startseite enthält nur tatsächlich erstellte oder importierte Dokumente. Es gibt keine Beispielvorlagen, vorbereiteten Projektdateien, erfundenen Benutzerkonten oder dekorativen Textzeilen in Dokumentvorschauen. Bereits vom Nutzer erstellte Dokumente werden nicht automatisch entfernt.
