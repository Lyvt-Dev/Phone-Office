# Technisches Konzept

## Plattformen und Module

React 19 + TypeScript + Vite bilden die gemeinsame Touch-Oberfläche. Tiptap / ProseMirror stellt Auswahl, Bearbeitung, Historie und Rich-Text-Struktur bereit. Capacitor 8 bindet die Oberfläche in Android und iOS ein; Electron 44 liefert die Desktop-Hülle mit deaktiviertem Node-Zugriff im Renderer, Kontextisolation und Sandbox. Electron ist kein iOS-/Android-Runtime.

`src/core` enthält Dokumentidentität und Wortzählung, `src/formats` Import-/Exportadapter und Bereinigung, `src/storage` die austauschbare lokale Storage-Schnittstelle, `src/App.tsx` Oberfläche und Editorsteuerung. Erste interne Persistenz: versionierte HTML-Dokumente mit ID, Titel, Quellformat und Änderungszeit. Für fortgeschrittene Office-Merkmale ist ein erweitertes strukturiertes Dokumentmodell nötig; HTML kann diese nicht zuverlässig abbilden. Vor deren Umsetzung Schema, Migrationen und Capability-Warnungen einführen.

Importiert wird stets eine neue Kopie. Es gibt keinen Schreibzugriff auf Originaldateien. Externe Bilder, aktive Inhalte und nicht freigegebene Inline-CSS-Eigenschaften werden entfernt. Dateien werden nicht an einen Konvertierungsserver gesendet. Eingefügte Bilder werden als lokale Data-URLs eingebettet. Vor DOCX/HTML-Import und verlustbehaftetem TXT-Export erfolgt ein Hinweis. Explizites Öffnen externer Links kann Internetverkehr auslösen.

## Aktuell unterstützte Formate

| Format     | Import                 | Bearbeitung                  | Export              | Grenzen                                                                                                                                                       |
| ---------- | ---------------------- | ---------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TXT        | Ja, UTF-8              | Text im Rich-Text-Editor     | Ja                  | Beim Export gehen alle Auszeichnungen, Bilder und Tabellenstruktur verloren; andere Textkodierungen nicht erkannt                                             |
| HTML / HTM | Ja, bereinigt          | Unterstützte Editor-Struktur | HTML                | Keine Skripte, externen Bilder, Stylesheets oder originalgetreue Layouts. Erhaltene Inline-Stile auf sichere Textattribute beschränkt                         |
| DOCX       | Eingeschränkt, Mammoth | HTML-Kopie                   | Nein                | Grundlegender Text, Struktur und Auszeichnung. Kein garantierter Erhalt von Layout, Kommentaren, Änderungsverfolgung, Noten und eingebetteten Office-Objekten |
| DOC        | Nein                   | Nein                         | Nein                | Legacy-Binärformat; sichere Alternative: Kopie in Word/LibreOffice als DOCX oder HTML konvertieren                                                            |
| ODT / OTT  | Nein                   | Nein                         | Nein                | Separate ODF-Adapter mit Tests erforderlich; derzeit Kopie außerhalb der App konvertieren                                                                     |
| RTF        | Nein                   | Nein                         | Nein                | Separater Parser/Writer erforderlich; derzeit Kopie außerhalb der App konvertieren                                                                            |
| PDF        | Nein                   | Nein                         | Browser-Druckdialog | PDF-Ausgabe nur wenn Browser/OS diese anbietet. Kein PDF-Viewer, keine Annotationen und keine direkte Inhaltsbearbeitung                                      |

Dateierkennung kombiniert Endung mit HTML-Markup, ZIP-Signatur für DOCX und Ausschluss offensichtlicher Binärdaten. Eine ZIP-Signatur allein beweist kein DOCX: der Parser prüft anschließend das Archiv. Vollständige MIME-Erkennung und Kodierungswahl sind noch ausstehend.

## Speicher, Grenzen und Prüfung

Browser-localStorage wird synchron nach React-Änderungen aktualisiert. Das ist eine erste Wiederherstellung, keine garantierte Transaktion bei abruptem Prozessverlust. Daten sind nicht separat verschlüsselt. Gerätespeicherbereinigung kann sie entfernen. Storage-Quota-Probleme lösen eine Exportaufforderung aus. Noch keine Cloud-Verbindung; Storage-Interface ist der Erweiterungspunkt, kein fertiger Cloud-Adapter. Keine Kamera-/Mikrofonfunktionen oder entsprechenden Berechtigungen.

Importlimit 20 MB, Bilder unter 5 MB. DOCX-Verarbeitung läuft derzeit im Hauptthread; sehr große Archive können mehr entpackten Speicher beanspruchen. Stabilität großer Dokumente ist **nicht nachgewiesen**. Worker-Verarbeitung, Archivlimits, IndexedDB und messbare Leistungstests sind vor Produktion erforderlich.

Seitenansicht steuert Breite und Rand der aktuellen Sitzung. Sie erzeugt keine echten paginierten Dokumente und keine im Dateiformat erhaltenen Seiteneinstellungen. Browserdruck bestimmt Seitenformat und Umbrüche. Suchen/Ersetzen arbeitet exakt und innerhalb einzelner Textknoten, nicht über Formatgrenzen. Rechtschreibprüfung hängt vom Gerätebrowser und installierten Wörterbüchern ab.

Screenreader-Namen, Tastaturfokus im Dialog, Escape, responsive Layout, System-Schrift und Hell-/Dunkelmodus sind vorhanden; vollständige WCAG-Prüfung, Skalierung und reale VoiceOver/TalkBack-Tests stehen aus. VisualViewport berücksichtigt Tastaturhöhe; reale mobile Tastaturtests sind ausstehend.
