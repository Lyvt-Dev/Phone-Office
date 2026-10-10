# Phone Office 0.7.0 – Prüfumfang

Erforderliche Prüfungen vor dem Release:

- Unit-Tests für Dokumentkern, ODF, Notizen, Import, Dateispeicherung und Teilradierer-Geometrie.
- Produktions-Browser-Szenarien auf Smartphone, Desktop und Tablet in beiden Ausrichtungen: Werkzeugdialoge, Teilradieren, Rückgängig, Wiederholen, erneutes Öffnen, Pointer-Stiftknopf und Android-Ereignisweiterleitung, Bibliotheksfilter sowie bestehende Import-/Export-/Wiederherstellungsfälle.
- iPad-WebKit-Szenarien einschließlich neuer Werkzeug- und Radiererfälle.
- Native Android-Release-Kompilierung; APK-Signatur, gespeicherte Update-Identität, Version, Name, keine Debug-/testOnly-Markierung.
- Native iPhoneOS-arm64-Kompilierung, iPhone/iPad-Gerätefamilie und IPA-Metadatenprüfung.
- OpenDocument-Exporte gegen unabhängiges ODF-1.3-Schema.

Die Ergebnisse werden nach tatsächlicher Ausführung festgehalten. Neue Stiftknopf-Hardwaretests stehen aus. Der Nutzer hat Installation der vorherigen iPad-Version bestätigt; das validiert die neuen 0.7-Werkzeugänderungen nicht.

## Ausgeführt in dieser Umgebung

- 66 Unit-Tests bestanden (8 Dateien), einschließlich exaktem Segment-Schnitt, Druckinterpolation, vollständig entfernten Strichen/Punkten und ungültigen Radiererpräferenzen.
- 120 Produktions-Chromium-Szenarien bestanden (Smartphone, Desktop, Tablet quer/hoch). Nach der abschließenden Optimierung unberührter Striche erneut alle 12 neuen Werkzeug-/Radierer-/Bibliotheksfälle bestanden sowie alle 66 Unit-Tests und der Produktionsbuild.
- OpenDocument-Exporte unabhängig gegen ODF 1.3 geprüft; beide erzeugten FODT-Prüffälle bestanden.
- Android-Release-Build lokal erfolgreich; Name `Phone Office`, Version `0.7.0`, historische Paketkennung, keine Debug-/testOnly-Markierung; lokale APK-Signaturprüfung erfolgreich. Die lokale Entwicklungs-Signatur wird nicht veröffentlicht.
- GitHub-Hauptbranch-Prüfung des ersten Implementierungscommits: iPad-WebKit und native arm64-Geräte-Kompilierung einschließlich IPA-Prüfung erfolgreich.

Die Veröffentlichungspipeline prüft den finalen Tag erneut mit 66 Unit-, 120 Chromium- und 8 iPad-WebKit-Szenarien und beiden nativen Builds. Sie verweigert die Android-Veröffentlichung bei abweichender Update-Signatur, falschem Namen/Version, Debug- oder testOnly-Markierung. Die Release-Assets entstehen ausschließlich aus diesem geprüften Tag.
