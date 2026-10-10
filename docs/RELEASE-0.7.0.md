Phone Office 0.7.0 vereinfacht die Bibliothek und die Bedienung der Schreibwerkzeuge.

- Zweiter Tipp auf den bereits gewählten Stift, Textmarker oder Radierer öffnet ausschließlich dessen Einstellungen. Farbe bleibt direkt in der Werkzeugleiste erreichbar. Stiftart, Strichstärke und Begradigen liegen im Stiftdialog; Papier, Zoom und Ausgabe bleiben getrennt.
- Radierer: ganze Striche oder nur berührte Stellen; drei Größen. Teilradieren schneidet auch lange Strichsegmente zwischen Messpunkten und bewahrt die übrige Handschrift. Vorschau, Rückgängig/Wiederholen und Speicherung bleiben erhalten.
- Stiftknopf: während Blattkontakt gedrückt halten zum vorübergehenden Radieren, anschließend mit dem ausgewählten Werkzeug weiterschreiben. Android leitet die lokalen Stylustasten weiter; Web-Pointer-Signale werden ebenfalls verarbeitet. Funktion hängt von den Signalen des jeweiligen Geräts ab. Bluetooth-Fernaktionen und Apple-Pencil-Doppeltipp sind nicht implementiert. Hardwaretest des neuen S-Pen-Knopfverhaltens steht aus.
- Aufgeräumte Startseite mit drei Startaktionen, klaren Filtern für echte Schulnotizen/Textdokumente, Suche und passendem Dateizähler. Keine Beispieldaten.
- Android heißt jetzt **Phone Office**, Version **0.7.0**, ohne Testzusatz. Die APK ist ein nicht debuggbarer Release-Build. Historische Paketkennung `dev.lyvt.phoneoffice.debug` und bisherige Signatur bleiben für Updates und gespeicherte Notizen erhalten; kein Datenumzug notwendig.

Android: `phone-office-android.apk` über die bisherige Installation installieren. Vor Updates empfiehlt sich eine eigene `.pnote`-Sicherung wichtiger Notizen. Nicht deinstallieren, wenn du die lokalen Daten behalten möchtest.

iPad: `phone-office-ios-unsigned.ipa` lokal signieren/installieren, z. B. mit Sideloadly unter Windows oder xtool. Die IPA enthält eine native arm64-Geräte-App für iPhone/iPad, kein Simulator. Apple-Anmeldung und Provisionierung passieren auf deinem Computer.

Die bisherigen Office- und PDF-Formatgrenzen gelten weiterhin. PDF-Hintergründe werden beim Radieren nicht verändert; radiert wird eigene Handschrift. Teilradieren erhält Druckwerte durch Interpolation; an neuen Schnittenden können leichte Unterschiede bei der Stiftkontur entstehen. Bei der bestehenden Notizgrenze wird eine zusätzliche Aufteilung abgelehnt, ohne gespeicherte Striche zu entfernen.

Vor Veröffentlichung werden Unit-, Chromium- und iPad-WebKit-Tests sowie native Android- und iOS-Geräte-Builds ausgeführt. Automatisierte Eingabeszenarien ersetzen keinen physischen S-Pen-Test.
