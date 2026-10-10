# Phone Office 0.7.6 – Prüfumfang

- Unit-Tests prüfen Haftnotiz-Geometrie/Umbruch, Größen- und Objektgrenzen, eindeutige Kopien, sichere SVG-Textausgabe, `.pnote` Version 5 mit Cover/Haftnotizen, Import älterer Versionen und die getrennte Gestaltungskonfiguration.
- Chromium prüft fünf neue Szenarien auf Handy, Desktop und Tablet hoch/quer: Live-Verschieben ohne vorzeitiges Speichern, Abbruch, Rückgängig und Wiederöffnung; Bearbeiten/Löschen/Suche; Coverimport, Sicherung, erneuter Import, beschädigte Bilder und Entfernen; dauerhaft gespeicherte Gestaltung und Standardpapier; tatsächliche PDF-Ausgabe mit anschließendem Import und Farbprüfung der Haftnotiz.
- iPad-WebKit führt diese fünf Szenarien und die bisherigen Tablet-/Stiftfälle aus. Die bisherige Suite für Office, Writer, Samsung-Übernahme, Offlinebetrieb und Speicherung bleibt aktiv.
- Native Release-Builds: Android-APK mit bekannter Update-Signatur, Name/Version und ohne Debug-/testOnly-Markierung; iPhoneOS-arm64-App für iPhone/iPad, als unsignierte IPA verpackt.
- Writer-Exporte werden unabhängig gegen ODF 1.3 geprüft. Nach Veröffentlichung werden echte Release-Downloads auf Prüfsummen, Android-Update-Identität, iOS-Gerätearchitektur und identische Web-Inhalte überprüft.

Die Tag-Pipeline veröffentlicht nur nach erfolgreichen Tests und beiden Geräte-Builds. Physisches Samsung-/iPad-Stiftverhalten wurde durch diese automatisierten Prüfungen nicht getestet.

Lokal erfolgreich vor dem Release: 80 Unit-Tests in zehn Dateien, 160 Chromium-Produktionsfälle auf Handy/Tablet/Desktop, TypeScript-/Offline-Webbuild, Android-Release-Kompilierung und unabhängige ODF-1.3-Validierung. Der erste iPad-Lauf bestätigte alle fünf neuen Szenarien; ein alter Testselektor für die umbenannte PDF-Aktion wurde korrigiert. Der finale Tag muss sämtliche 18 WebKit-Fälle und beide nativen Geräte-Builds bestehen.
