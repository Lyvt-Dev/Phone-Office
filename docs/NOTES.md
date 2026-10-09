# Schulnotizen und Tablets – 0.3

Eine neue Schulnotiz startet leer. Das Notizbuch enthält einen gemeinsamen Bereich für getippten Rich-Text sowie bis zu 50 Handschriftseiten. Fach, Titel und Papierart bleiben lokal gespeichert. Es gibt keine Beispieldaten oder automatischen Uploads.

## Implementierte Bedienung

- Stift, Textmarker, Farbe, drei Strichstärken, Radierer für ganze Striche.
- Druckwerte von Pointer Events beeinflussen die Stiftkontur, falls die Geräte-WebView sie liefert. Bei fehlendem Druck gilt eine mittlere Stärke. Zusammengefasste Pointer-Events werden verarbeitet; Pointer Capture hält die Eingabe auch am Rand der Schreibfläche.
- Standardmäßig zeichnet nur ein Stift oder eine Maus. Finger verschiebt die Seite; Fingerzeichnen lässt sich ausdrücklich einschalten. Während eines Stiftstrichs werden weitere Pointer ignoriert. Das ist eine Eingabefilterung, keine nachgewiesene native Handballenerkennung für alle Geräte.
- Kariertes, liniertes oder leeres Papier; Seiten hinzufügen und wechseln; 80–150 Prozent Zoom über Auswahl. Finger verschiebt auch vergrößerte Seiten. Native Zwei-Finger-Zoomgesten sind nicht implementiert.
- Rückgängig/Wiederholen für die aktuelle Schreibseite (bis zu 30 Schritte). Der Verlauf beginnt nach Wechsel der Seite/Ansicht oder Neustart neu; die gespeicherten Striche bleiben bestehen.
- Abgebrochene Striche werden verworfen. Fertige Striche werden über die bestehende lokale Speicherung gesichert; Fehler werden angezeigt. Kein unbegrenzt belastbarer Recovery-Journal-/Dateisystemkern.
- Der Editor nutzt auf mittelgroßen Tablets die Bildschirmbreite, mit ausklappbarer Navigation. Android/iOS-Projekte bleiben für Quer- und Hochformat vorgesehen; iOS-Gerätefamilien iPhone/iPad sind konfiguriert.

## Sicherung und Austausch

**`.pnote`** ist ein versioniertes Phone-Office-JSON-Format mit Text, Fach und sämtlichen Seiten/Strichen. Export und erneuter Import erhalten bearbeitbare Handschrift. Import erstellt eine neue Kopie und bereinigt aktive Inhalte im Text. Höchstens 20 MB pro Import-/Exportdatei, 2.000 Striche je Seite, 3.000 Messpunkte je Strich und 200.000 insgesamt; die Schreiboberfläche stoppt mit Hinweis vor der Gesamtgrenze. Für längere Projekte mehrere Notizbücher verwenden.

**SVG** enthält ausschließlich die gewählte Handschriftseite mit ihrem Papierhintergrund. Es ist eine sichtbare Vektorkopie, keine vollständige Notizbuchsicherung; SVG-Reimport als bearbeitbare Handschrift ist nicht implementiert. Text ist im separaten Notizbereich. Office-/HTML-/TXT-Exporte enthalten diesen getippten Text; vor Export weist eine Bestätigung auf die fehlende Handschrift hin. Die Vorschau zeigt sämtliche Schreibseiten und den Text. Auf Android ist nativer PDF-Export weiterhin offen.

## Geräte und Prüfung

S Pen und Apple Pencil sind über standardisierte Pointer Events vorgesehen. **Apple Pencil funktioniert nur mit kompatiblen iPads, nicht mit iPhones.** Nicht jeder S Pen und jedes Samsung-Gerät unterstützt identische Stiftfunktionen. Bluetooth-Tasten, Hover-/Neigungsgesten und native PencilKit-/Samsung-SDK-Integration sind nicht implementiert. Keine Handschrift-zu-Text-Erkennung, Formelerkennung oder PDF-Anmerkungen.

Automatisierte Tests prüfen lokalen Speicher, Notizsicherung mit erneutem Import/Bearbeiten, Papier/Druckdaten, Eraser-Segmenttreffer, Datenlimits, SVG-Struktur und aktive Inhalte. Browsertests laufen auf Desktop, Smartphone, Tablet in Hoch- und Querformat; Stifteingaben werden in Chromium über dessen Eingabeschnittstelle sowie synthetische Pointer-Events erzeugt. Diese Tests ersetzen keinen physischen Stifttest.

Vor einer Zusage für den Unterricht auf echten Geräten prüfen: langes Schreiben mit aufgelegter Hand, Seitenwechsel, Druck, Radieren, Systemtastatur, Rotation, Offline-Neustart und Export über die Geräteauswahl. iOS-Build und Apple-Pencil-Gerätetest benötigen macOS/Xcode, Signierung und ein kompatibles iPad; in dieser Linux-Umgebung nicht möglich.

Der zusätzliche GitHub-Workflow `ios-simulator.yml` kompiliert die gemeinsame iPhone-/iPad-App auf einem macOS-Runner ohne Gerätesignierung. Sein ZIP ist ausschließlich für den Simulator, keine auf einem iPad installierbare IPA und kein Apple-Pencil-Gerätetest. Kompilierung, Verpackung und Artefakt-Upload erfolgreich geprüft: https://github.com/Lyvt-Dev/Phone-Office/actions/runs/37991115879 .

## Vereinfachte Oberfläche 0.4

Querformat verwendet eine kompakte Titelzeile mit Zurück, Handschrift/Text und Sichern. Eine Icon-Leiste bietet Stift, Textmarker, Radierer, Rückgängig/Wiederholen und das Zahnrad. Die Seitenwahl bleibt direkt erreichbar; die Schreibfläche füllt den verbleibenden Bildschirm. Auch große Tablets verwenden diese Ansicht. Safe-Area-Abstände berücksichtigen Aussparungen und Systemleisten, sofern die WebView sie meldet.

Das Zahnrad öffnet rechts im Querformat bzw. unten auf dem Handy die Notizeinstellungen: Farbpalette/eigene Farbe, Strichstärke, Papier, Zoom, Fingerzeichnen, Fach, Farbschema und zusätzliche Ausgaben. Die Einstellungen für Farbe, Stärke, Zoom und Fingerzeichnen bleiben pro Notizbuch erhalten und werden in `.pnote` mitgesichert. Ältere Notizsicherungen ohne diese Werte verwenden Standardwerte. Die primäre Aktion „Sichern“ gibt unmittelbar das komplette Notizbuch aus; Office-Formate sind als zusätzliche Ausgabe in den Einstellungen erreichbar. SVG und Vorschau stehen ebenfalls dort bereit.

Weitere Pointer-/Druckverarbeitung bleibt unverändert; bereits gezeichnete Konturen werden beim nächsten Strich über React-Memoisierung wiederverwendet. Kein Gerät-Benchmark wird daraus abgeleitet. Nutzer-Rückmeldung vor dem Oberflächenumbau: S Pen funktioniert; Gerätemodell und genaue Testversion wurden nicht erfasst. Die neue Querformatansicht sowie Apple Pencil benötigen weiterhin Geräteabnahme.
