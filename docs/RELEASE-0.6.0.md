# Phone Office 0.6.0

Mehr Platz fürs Blatt und direkter erreichbare Schreibwerkzeuge, inspiriert von der bereitgestellten Tablet-Aufnahme und gestaltet im Phone-Office-Design.

- Kugelschreiber mit gleichmäßiger Breite, druckabhängiger Füller und weicher, halbtransparenter Bleistift. Stiftart, Farben und Strichstärken direkt in der scrollbaren Werkzeugleiste.
- Halten am Strichende für 650 ms begradigt den Strich; deaktivierbar. Rückgängig erhält den vorherigen Zustand.
- Auswahl folgt beim Ziehen als Live-Vorschau; erst Loslassen speichert. Abbruch lässt die ursprüngliche Position bestehen. Neue freie Lasso-Auswahl und Einfärben ausgewählter Striche.
- Kompaktere Dokument- und Werkzeugleiste, Fokusmodus, weiter nutzbare Zwei-Finger-Zoomfunktion, Seitenübersicht, Lesezeichen, PDF-Notizen und lokale Wiederherstellung.
- Android: Exportordner über die System-Dateiauswahl freigeben und neue PDF/.pnote-Exporte gesammelt erkennen. Beim Öffnen des Assistenten wird der verbundene Ordner automatisch geprüft. Unterordner werden geprüft, bereits übernommene Inhalte übersprungen; vor Übernahme gibt es eine Vorschau/Auswahl. Keine private Samsung-Notes-Datenbank, keine automatische Samsung-Konvertierung und keine Hintergrundüberwachung. Samsung Notes muss weiterhin exportieren. Ordnerfreigabe ist widerrufbar.
- Native iPhone/iPad-Geräte-IPA für persönliche Signierung und Installation mit **xtool**. Sie ist unsigniert; Apple-Zugang und Gerät sind für die lokale Installation erforderlich. [Anleitung](https://github.com/Lyvt-Dev/Phone-Office/blob/main/docs/IPAD-XTOOL.md).

## Downloads

`phone-office-android-test.apk`: signierte Android-Test-App; die bestehende Test-Signatur wird weiterverwendet. Samsung lässt lokale Installation nach der normalen Gerätefreigabe zu. Kein `testOnly`-Flag.

`phone-office-ios-unsigned.ipa`: echte arm64-Geräte-App, kein Simulator; ohne eigene Signierung nicht direkt installierbar. Physische iPad-Installation/Pencil-Tests stehen aus.

`phone-office-web-ipad.zip`: Offline-Web-Build, keine native Installationsdatei.

## Grenzen und Datensicherheit

Kein vollständiger Ersatz aller GoodNotes-/Samsung-Notes-Funktionen: OCR, Audioaufnahme, Stickerbibliothek, Handschrift-zu-Text und vollständige proprietäre Dateiformate sind nicht implementiert. PDF-Import übernimmt sichtbare Bildseiten, keine einzeln editierbaren Originalstriche/Audio. PDF-Export der Notizseiten ist rasterisiert. Keine Beispielnotizen oder heimlichen Server-Uploads.

Neue `.pnote`-Sicherungen verwenden Version 3, damit ältere Apps neue Stiftarten nicht unbemerkt verlieren. Sicherungen der Versionen 1 und 2 bleiben lesbar. Vor Update zusätzlich sichern; Dateien werden als neue Kopien importiert.

Die Veröffentlichung setzt Unit-, Produktions-Browser-, ODF-Schema-, Android-Build- und iOS-Geräte-Build-Prüfungen voraus. Geräteabhängige Ordnerberechtigungen und Stiftverhalten bitte auf deinem Samsung/iPad testen.
