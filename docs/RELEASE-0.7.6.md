Phone Office 0.7.6 ergänzt den Notiz-Arbeitsbereich um Haftnotizen, eigene Coverbilder und persönliche Gestaltung. Word und LibreOffice bleiben der zusätzliche Office-Bereich.

- **Haftnotizen direkt auf dem Blatt:** eigener Werkzeugknopf, Text, fünf Farben und drei Breiten. Im Haftnotiz-Modus mit Live-Vorschau ziehen; Änderungen erst beim Loslassen übernehmen. Bearbeiten, Löschen und Rückgängig/Wiederholen. Haftnotiztext wird auch von der Bibliothekssuche gefunden.
- **Eigene Coverbilder:** PNG/JPEG auswählen, lokal auf 480×660 Pixel zuschneiden und als JPEG speichern. Vorschau, Entfernen und Sicherung mit dem Notizbuch. Originaldatei bleibt erhalten. Maximal 20 MB/24 Megapixel beim Import.
- **App anpassen:** fünf Akzentfarben, drei Schriftvarianten, drei Schriftgrößen, großzügige/kompakte Bibliothek, warmer/kühler/neutraler Hintergrund und Standardpapier für neue Bücher. Einstellungen bleiben lokal auf diesem Gerät; vorhandene Dokumente werden nicht umformatiert.
- **Neue Typografie und Overlays:** lokal mitgelieferte variable Schrift Manrope, überarbeitete Dialoggestaltung und Tastaturfokus für Textfelder. Kein externer Schriftabruf beim Verwenden der App.

Haftnotizen bleiben beim erneuten Öffnen, Seiten-/Buchkopieren und in `.pnote` erhalten. SVG- und PDF-Seiten enthalten sie sichtbar. PDFs rasterisieren die komplette Notizseite; Haftnotizen und Handschrift sind dort nicht mehr einzeln bearbeitbar oder durchsuchbar. Getippter Text im separaten Textbereich fehlt weiterhin im Seiten-PDF; vor der Ausgabe erscheint eine entsprechende Warnung. Coverbilder gestalten die Bibliothek und werden nicht als zusätzliche PDF-Seite ausgegeben.

Neue `.pnote`-Sicherungen verwenden **Version 5** und benötigen Phone Office 0.7.6 oder neuer. Sicherungen aus Version 1–4 lassen sich weiter importieren. Persönliche App-Gestaltung ist gerätebezogen und nicht Bestandteil der Notizdatei. Haftnotizen haben höchstens 300 Zeichen/20 angezeigte Zeilen, maximal 30 pro Seite. Zum Schreiben über einer Haftnotiz wieder den Stift wählen; zum Verschieben das Haftnotiz-Werkzeug verwenden.

**Android:** `phone-office-android.apk` als Update installieren; nicht vorher deinstallieren. Wichtige Notizen separat sichern. Name Phone Office, Version 0.7.6, keine Debug-/testOnly-Markierung; bisherige Paketkennung und Update-Signatur bleiben erhalten.

**iPad:** `phone-office-ios-unsigned.ipa` ist ein nativer arm64-Geräte-Build für iPhone/iPad; mit deinem bisherigen lokalen Sideload-Verfahren signieren und installieren.

Keine vollständige Samsung-Notes-/Goodnotes-Parität: OCR, Audio, Zusammenarbeit und Cloud-Synchronisation sind weiterhin nicht implementiert. [Aktueller Funktionsstand](https://github.com/Lyvt-Dev/Phone-Office/blob/v0.7.6/docs/NOTES-FEATURES.md). Physische Stift-/Geräteprüfungen ersetzt die Release-Pipeline nicht.
