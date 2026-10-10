# Prüfnachweise 0.6.0

Lokaler Stand der Implementierung:

- 64 Unit-Tests: Dokumentkern, ODF-Import/Export, Notizdateien einschließlich Stiftarten, Begradigung, Lasso-Geometrie, Ordnerübertragung mit Duplikaten/fehlenden Zeitstempeln, atomare Speicherung und native Dateiausgabe.
- 108 Chromium-Tests mit Produktions-Build: Handy, Tablet hoch/quer und Desktop. Import, Bearbeiten, Sichern und erneutes Öffnen, Stift-/Finger-Eingabe, Palm-Abweisung, Zoom, Auswahlvorschau/Abbruch/Rückgängig, PDF-Inhalte nach Export, Samsung-Mehrfachimport, Offline-Wiederherstellung und Oberflächenmaße.
- TypeScript und Web-Build bestanden. Android-Geräte-APK lokal kompiliert. Screenshots in vier Ausrichtungen visuell geprüft.
- xtool 1.21.0 unter Linux heruntergeladen, gegen den offiziellen GitHub-SHA256 geprüft und CLI/Installationsargumente geprüft. Kein Apple-Zugang eingerichtet und kein iPad mit dieser Cloud verbunden.

GitHub prüft vor Veröffentlichung zusätzlich fünf iPad-WebKit-Szenarien, ODF 1.3 mit unabhängigem Schema-Validator, die signierte Android-APK sowie eine native arm64-iPhone/iPad-Geräte-App. Der Verpackungsschritt verweigert Simulatoren, falsche Versionen, falsche Gerätefamilien, fehlende Offline-Ressourcen und fremde Provisionierungsprofile.

Die CI-Ausführung und Prüfungen der veröffentlichten Binärdateien werden über den Release/Actions-Lauf nachvollziehbar. Nicht als getestet ausgegeben werden: persönliche xtool-Signierung/Installation auf einem echten iPad, physischer Apple Pencil und Android-Systemordnerfreigaben auf einem Samsung. Proprietäre .sdoc/.sdocx-Striche, OCR und Audioaufnahme sind nicht implementiert.
