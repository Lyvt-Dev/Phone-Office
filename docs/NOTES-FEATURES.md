# Notizen als Kern von Phone Office

0.7.6 priorisiert Notizbücher, Handschrift und Arbeitsblätter. Office-Formate erweitern diese App um einen zusätzlichen Arbeitsbereich. Die Oberfläche enthält nur vorhandene Aktionen; andere Funktionen werden hier als weitere Entwicklung beschrieben.

| Bereich | Stand in 0.7.6 | Grenzen |
|---|---|---|
| Notizbibliothek | Notizbücher, Favoriten, Coverfarben/-bilder, Ordner/Fach, Suche und Sortierung | Ordner sind Gruppierungen bestehender Notizbücher nach Namen; keine leeren/verschachtelten Ordnerbäume |
| Handschrift | Drei Stiftarten, Druck, Marker, Radierer mit Größen/Modus, Halten zur Geraden | Neigung, native Bluetooth-Fernaktionen und Pencil-Doppeltipp nicht implementiert; Stylustasten abhängig von Gerätesignalen |
| Geometrie | Gerade, Rechteck, Ellipse | Als Handschriftstriche gespeichert; keine eigenständigen parametrischen Formobjekte oder Größenanfasser |
| Auswahl | Rechteck/Lasso, Live-Verschieben, Kopieren/Einfügen, Farbe, Löschen | Keine Skalierung/Rotation der Auswahl |
| Seiten | Vier Papierarten, Lesezeichen, Titel, Titel-Suche, Duplizieren/Reihenfolge | Maximal 50 Seiten pro Notizbuch; bestehende Strich-/Punktgrenzen |
| PDF | Lokaler Import als Bildhintergrund, Handschrift darüber, PDF-/SVG-Ausgabe | Kein direktes Bearbeiten bestehender PDF-Texte/Formulare; Ausgabe der Notizseiten inklusive Haftnotizen wird gerastert |
| Fotos | PNG/JPEG als beschriftbare Bildseite | Herunterskalierter JPEG-Hintergrund; kein frei bewegliches Bildobjekt; kein HEIC-Import |
| Haftnotizen | Freie Position, Text, fünf Farben, drei Breiten, Live-Verschieben, Rückgängig und Suche | Maximal 30 pro Seite, 300 Zeichen/20 angezeigte Zeilen; kein frei skalierter Rich-Text-Rahmen |
| Gestaltung | Akzentfarben, lokale Schriften, UI-Schriftgröße, Bibliotheksdichte, Hintergrund und Standardpapier | Geräteeinstellungen; kein Cloud-Profil, keine Umformatierung vorhandener Inhalte |
| Getippte Notizen | Rich-Text-Bereich im Notizbuch, Suche im getippten Text | Rich-Text liegt separat von Handschriftseiten; Haftnotizen enthalten einfachen Text, keine frei positionierten Rich-Text-Rahmen |
| Aufbewahrung | Atomare lokale Speicherung, eigene Sicherung, Papierkorb/Wiederherstellung | Keine automatische Cloud-Synchronisation oder automatische Geräteübertragung |
| Samsung-Übernahme | PDF/.pnote-Mehrfachimport, ausdrücklich freigegebener Android-Exportordner | Keine private Samsung-Datenbank; proprietäre editierbare Samsung-Handschrift bleibt unzugänglich |
| Office-Zusatz | Word-/Writer-/Text-Dateien wie zuvor | Formatabhängige Verluste/Warnungen bleiben; keine vollständige Word-/Writer-Parität |
| OCR/Handschriftsuche/-umwandlung | Noch nicht implementiert | Erfordert echte lokale Erkennungsengine und Sprach-/Geräteprüfung |
| Audio und Zeitbezug | Noch nicht implementiert | Aufnahme, Berechtigungen, lokale Mediendaten, Wiedergabe und Synchronisation fehlen |
| Zusammenarbeit, Verschlüsselung und Cloud | Noch nicht implementiert | Keine scheinbaren Login-/Schloss-/Synchronisationsknöpfe |

## Weitere Implementierungsschritte

1. Einen versionierten Notizkern für frei positionierte Text-, Bild- und Formobjekte ergänzen; Auswahl, Skalierung und Rotation, Sicherung und Verlustwarnungen gemeinsam testen. Bestehende Striche und Bildseiten unverändert importieren.
2. Lokale OCR und Handschriftumwandlung mit echten Android-/iPad-Erkennungsdiensten verbinden; Sprachen, Offline-Verfügbarkeit, Fehlerraten und Suchindex testen. Originalhandschrift bei jeder Umwandlung behalten.
3. Lokale Audioaufnahme und Wiedergabe mit erforderlichen Geräteberechtigungen und robuster Wiederherstellung ergänzen; Notiz-Zeitmarken erst nach tatsächlicher Medienimplementierung anbieten.
4. Eigenständige, verschachtelte Ordner und sichere Medienspeicherung ergänzen. Passwortschutz erst mit geprüfter Verschlüsselung, Schlüsselverwaltung und dokumentierter Wiederherstellung anbieten.
5. Cloud-Schnittstellen und Versionskonflikte implementieren; Inhalte nur nach ausdrücklicher Zustimmung übertragen. Zusammenarbeit erfordert zusätzlichen Server-/Konfliktkern und eigene Tests.

Dieser Plan beschreibt weitere Arbeit. Keine dieser noch offenen Funktionen wird als Bestandteil von 0.7.6 verkauft.
