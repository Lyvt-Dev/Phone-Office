# Phone Office 0.7.5 – Prüfumfang

- Unit-Tests prüfen Notizbibliothek, Trennung von Office, Favoriten/Papierkorb, Ordnergruppen, Suche in getipptem Text, unabhängige Kopien, Cover/Punktpapier/Favorit im Sicherungsrundlauf und ältere Notizdateien. Bildabmessungen werden vor der Dekodierung geprüft; Formgeometrie und Coverkontrast haben eigene Fälle.
- Produktions-Chromium prüft Handy, Desktop, Tablet hoch/quer: neue Bibliothek, Cover, Ordner, Favorit, Papierkorb/Wiederherstellung, bestätigtes endgültiges Löschen, getippte Suche, Duplizieren, Punktpapier-Vererbung, Rechteck/Ellipse, PNG-Notizseite und erneutes Öffnen. Bestehende Word-/Writer-/PDF-/Samsung-/Stift-/Speicherfälle bleiben aktiv.
- iPad-WebKit führt die bisherigen iPad-/Werkzeugfälle und die fünf neuen Bibliotheks-/Form-/Bildszenarien aus.
- Native Android-Release-Kompilierung; APK-Signatur, bekannte Update-Identität, Name/Version, keine Debug-/testOnly-Markierung. Native iPhoneOS-arm64-Kompilierung, iPhone/iPad-Gerätefamilie und IPA-Metadatenprüfung.
- ODF-Exporte werden unabhängig gegen ODF 1.3 geprüft. Release-APK, IPA und Web-Paket werden nach Veröffentlichung heruntergeladen und auf Prüfsummen und identische Web-Inhalte überprüft.

Die Release-Pipeline veröffentlicht nur, wenn die Prüfungen auf dem finalen Tag erfolgreich sind. Die Ausführung ersetzt keine physischen Samsung-/iPad-Stifttests. OCR, Audio und Zusammenarbeit haben keine Implementierung und werden nicht als getestete Funktionen ausgewiesen.

Lokal vor dem Release-Tag erfolgreich: 74 Unit-Tests in neun Dateien; 140 Chromium-Produktionsfälle auf Handy, Desktop und Tablet hoch/quer; TypeScript-/Web-Produktionsbuild; Android-Release-Kompilierung; ODF-Validator und unabhängige ODF-1.3-Schemaprüfung für aktuelle Text-/Bildexporte. Die finalen nativen Pakete und 13 iPad-WebKit-Fälle werden zusätzlich durch die Tag-Pipeline geprüft.
