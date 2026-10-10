Phone Office 0.7.5 macht Notizbücher zum Hauptarbeitsbereich. Word und LibreOffice bleiben als Office-Zusatz zum Importieren, Bearbeiten und Exportieren verfügbar; die bekannten Formatgrenzen bleiben bestehen.

Neu:

- Notizbibliothek als Standard-Startseite, mit eigener Gestaltung für Handy, Tablet und iPad. Große Aktion „Neues Notizbuch“, Dateiimport und Samsung-Übernahme stehen im Mittelpunkt. Office hat einen separaten Bereich.
- Favoriten, Titelverwaltung, Gruppierung nach Ordner/Fach, Coverfarben, alphabetische Sortierung und Suche über Titel, Seitentitel, Fach und getippten Text.
- Papierkorb mit Wiederherstellung. Endgültiges Löschen erfordert Bestätigung und entfernt ausschließlich die lokale App-Kopie, niemals die importierte Originaldatei. Kein automatisches Leeren.
- Unabhängige Notizbuchkopien mit neuen IDs für alle Seiten und Striche.
- Punktpapier zusätzlich zu kariertem, liniertem und leerem Papier. Neue Seiten übernehmen die Papierart der aktuellen Seite. Seitentitel lassen sich in der Seitenübersicht suchen.
- Rechtecke und Ellipsen als geometrische Handschrift-Striche: zeichnen, auswählen, verschieben, radieren, rückgängig machen und sichern.
- PNG/JPEG als neue lokale Bildnotiz: passend auf eine Seite verkleinert, als JPEG-Hintergrund gespeichert und mit Handschrift beschriftbar. Bild selbst ist als Hintergrund unbeweglich. Maximal 20 MB/24 Megapixel; Original bleibt erhalten.

Bereits vorhandene Werkzeuge bleiben erhalten: Füller, Kugelschreiber, Bleistift, Marker, Ganzstrich-/Teilradierer, lokale Stylustasten, Lasso, Live-Verschieben, Kopieren/Einfügen, Halten zum Begradigen, Zwei-Finger-Zoom, PDF-Arbeitsblätter, Seitenübersicht/Lesezeichen, Wiederherstellung und lokale Sicherung.

`.pnote`-Sicherungen verwenden jetzt Version 4 und erhalten Coverfarbe, Fach/Ordner, Favorit, Punktpapier, Bilder, Handschrift und getippten Text. Dateien aus den Versionen 1–3 werden weiterhin importiert. Neue Sicherungen benötigen Phone Office 0.7.5 oder neuer. Löschmarkierungen werden nicht exportiert.

Android: **phone-office-android.apk** als Update installieren. App-Name **Phone Office**, Version **0.7.5**, kein Debug-/Testmodus; bisherige Paketkennung und Update-Signatur bleiben erhalten. Wichtige Notizen vor Updates separat als `.pnote` sichern; nicht vorher deinstallieren.

iPad: **phone-office-ios-unsigned.ipa**, native arm64-Geräte-App für iPhone/iPad. Lokal z. B. mit Sideloadly oder xtool signieren/installieren.

Phone Office erreicht damit keine vollständige Funktionsgleichheit mit Samsung Notes oder Goodnotes. Handschrifterkennung/OCR, Audioaufzeichnung mit Wiedergabe, frei positionierbare Text-/Bildobjekte, echte Zusammenarbeit/Cloud-Synchronisation, verschachtelte Ordner und passwortgeschützte Notizen sind noch nicht implementiert. [Funktionsstand und weitere Schritte](https://github.com/Lyvt-Dev/Phone-Office/blob/v0.7.5/docs/NOTES-FEATURES.md). Keine Platzhalter für diese Funktionen in der App. Vorhandene Samsung `.sdoc/.sdocx` bleiben nur über einen ausdrücklich exportierten PDF-/Notiz-Umweg übertragbar; private Samsung-Datenbanken werden nicht ausgelesen.

Die Release-Pipeline prüft Import, Bearbeitung, Speicherung/Wiederöffnung und die neuen Organisationsfunktionen auf Chromium und iPad-WebKit sowie beide nativen Geräte-Builds. Physische Stift-/Geräteprüfungen sind dadurch nicht ersetzt.
