# Phone Office 0.5.0

Erster regulärer Projekt-Release mit einer erweiterten Schulnotizen-App. Android wird weiterhin als **signierte Test-APK** ausgeliefert, nicht über den Play Store. Die iPad-Auslieferung wurde auf Nutzerwunsch zurückgestellt; es gibt keine signierte IPA. Die vorbereitete Web-Ausgabe liegt separat bei. Der GoodNotes-Funktionsumfang ist noch nicht vollständig umgesetzt.

## Neu

- Zwei-Finger-Zoom (50–300 %) und Verschieben der Schreibseite; Stift- und Fingerzeichnung getrennt. Zoom bleibt gespeichert.
- Tablet-Oberfläche, große Icon-Werkzeuge und eigenes App-Logo auf Android, iOS und im Browser.
- Seitenübersicht mit Vorschauen, Titeln, Lesezeichen, Duplizieren, Sortieren und bestätigtem Löschen.
- Rechteckige Handschrift-Auswahl: kopieren, einfügen, verschieben, löschen; Rückgängig. Gerade Linien.
- Lokaler PDF-Import als Bildhintergrund einer neuen Schulnotiz. Neue Handschrift darüber zeichnen; alle Handschriftseiten als flache PDF ausgeben.
- Samsung-Notes-Import-Assistent: mehrere PDF-Exporte prüfen, auswählen und als getrennte Notizbücher übernehmen. `.pnote` ebenfalls möglich. Keine Originaldatei überschreiben.
- Eigene Schulnotizen-Ansicht; Suche nach Notizbuch, Fach und Seitentitel. Tatsächliche App-Version in der Seitenleiste.
- Atomare lokale IndexedDB-Snapshots mit zusammengefassten Schreibvorgängen; vorhandene 0.4-Daten übernehmen. Offline-App-Shell für die Browser-Version.
- Vorhandene Word-/Writer-Funktionen und ehrliche Formatwarnungen bleiben erhalten.

## Herunterladen / testen

**Android:** `phone-office-android-test.apk`. Version 0.5.0-test, Paket `dev.lyvt.phoneoffice.debug`. Der Workflow verwendet den bisherigen Test-Schlüssel und veröffentlicht Zertifikat und Prüfsummen. Bei gleichem Zertifikat ist ein Update über 0.3.1/0.4.0 möglich; vor notwendigen Neuinstallationen alle eigenen Dokumente sichern. Die APK braucht keine kostenpflichtige Entwicklerlizenz. Sie ist weiterhin ein Gerätetest, kein Nachweis für Store-Zulassung.

**Web-Ausgabe:** `phone-office-web-ipad.zip` für statisches HTTPS-Hosting, keine installierbare IPA. Die iPad-Veröffentlichung ist zunächst zurückgestellt. WebKit-Funktionstests haben bestanden, aber GitHub Pages konnte mit dem Workflow-Token nicht aktiviert werden. Bei einer späteren Freigabe siehe `docs/IPAD.md`.

Eine native iPad-Installation erfordert Apple-Signierung. Kostenlos auf dem eigenen Gerät mit Mac/Xcode und Apple-ID (üblicherweise sieben Tage); TestFlight benötigt das kostenpflichtige Developer-Programm. Der Simulator-Build ist nicht auf einem physischen iPad installierbar.

## Grenzen

Samsung `.sdoc/.sdocx` nicht direkt unterstützt: in Samsung Notes zuerst als PDF exportieren. ZIP-Dateien vorher entpacken. Bis zu 50 Dateien / 50 MB pro Übertragung; größere Sammlungen in mehreren Durchgängen. PDF: bis zu 20 MB / 30 Seiten; große Bildhintergründe werden begrenzt. Sichtbare Seiten erhalten, aber keine ursprünglichen bearbeitbaren Samsung-Striche, Audioaufnahmen, interaktiven Formulare oder Links. Darstellung mit dem Original vergleichen.

PDF-Ausgabe enthält ausschließlich die Handschriftseiten, als Bilder; keine durchsuchbare Handschrift. Getippter Text gehört zum separaten Textbereich und fehlt in dieser PDF – bei vorhandenem Text erscheint eine Warnung. `.pnote` sichert Seiten, Hintergründe, Druckdaten, Metadaten, Einstellungen und getippten Text als bearbeitbares Notizbuch.

Nicht implementiert: Handschrift-/Formelerkennung, OCR-Suche, Audioaufzeichnung/-Transkription, Zusammenarbeit, Cloud-Synchronisierung, native PencilKit-/Samsung-SDK-Funktionen und vollständige GoodNotes-Parität. Lokale Daten können durch App-Deinstallation oder Löschen von Browserdaten verschwinden; regelmäßig exportieren. „Lokal gespeichert“ bedeutet eine abgeschlossene Speicherung, nicht eine externe Sicherung. Geräteabnahme für neue Gesten, Apple Pencil und Systemdialoge steht aus.

SHA256SUMS.txt umfasst APK und Web-ZIP. `signature.txt` und `signing-identity.txt` dokumentieren die APK-Signatur. Testnachweise stehen in `docs/VALIDATION.md`.
