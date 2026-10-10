# Validierung 0.7.7

## Lokale Prüfung

- 80 Unit-Tests erfolgreich, 10 Testdateien.
- 164 Chromium-Tests erfolgreich: Smartphone, Tablet Hochformat, Tablet Querformat und Desktop. Import, Bearbeitung, Speichern/Wiederöffnen, Handschrift, Haftnotizen, Cover und Gestaltung bleiben geprüft.
- Neuer App-Info-Test: Creator/Version, vorhandene Lizenztexte, Öffnen nach Offline-Neustart und Escape zum Schließen.
- TypeScript und Vite-Produktionsbuild erfolgreich. Lizenztexte werden beim Build generiert und im offline verfügbaren, erst beim Öffnen geladenen App-Info-Modul ausgeliefert. Plattformgebundene native Buildwerkzeuge gehören nicht zum mobilen Web-Lizenzpaket.
- Android `assembleRelease` erfolgreich; keine Änderung der historischen GitHub-Paketidentität.
- Separater Android-Produktionskanal: APK und AAB mit einem kurzlebigen, lokalen Validierungsschlüssel erfolgreich gebaut. Paketkennung `dev.lyvt.phoneoffice`, Version 0.7.7, nicht debuggbar, APK-Signatur geprüft. Diese Artefakte werden nicht veröffentlicht; der lokale Validierungsschlüssel wurde verworfen.
- Negative Prüfungen: fehlende Produktionsschlüssel und Android-Debugzertifikate werden mit Fehler abgelehnt.
- ODF-1.3-Schema für Bild- und Rich-Text-FODT erfolgreich geprüft.
- Produktionsabhängigkeits-Audit: keine hohen/kritischen Meldungen; drei moderate Meldungen derselben argparse/sprintf-js-Kette dokumentiert in PUBLIC-RELEASE.md. Kein Downgrade des DOCX-Konverters auf eine veraltete Version durchgeführt.

## Veröffentlichung

Der Release-Workflow prüft auf dem getaggten Commit die vollständigen Chromium-Tests, unabhängige OpenDocument-Validierung, 19 WebKit-Tests, Android-APK und nativen iPhone/iPad-Gerätebuild. Erst erfolgreiche Android- und iPad-Jobs erlauben die Veröffentlichung. Der Status dieser Prüfungen ist im zugehörigen GitHub-Actions-Lauf sichtbar. APK-Signatur und Paketinformationen sowie Prüfsummen sind Release-Artefakte.

Eine echte S-Pen-/Apple-Pencil-Hardwareprüfung und eine App-Store-Zulassung sind damit nicht behauptet. Die veröffentlichte GitHub-APK behält zur Update-Kompatibilität den alten Testschlüssel; sie ist kein Store-signierter Produktionsbuild. Die iOS-IPA ist unsigniert.
