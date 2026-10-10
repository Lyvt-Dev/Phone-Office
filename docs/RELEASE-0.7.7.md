# Phone Office 0.7.7 — öffentlicher GitHub-Release

Phone Office, erstellt von **Lyvt**, ist eine lokale Notizen-App mit Handschrift, Haftnotizen, eigenen Notizbuch-Covern, anpassbarer Oberfläche und ergänzender Textverarbeitung.

## Neu

- Creator **Lyvt** dauerhaft in der Seitenleiste und unter „Über Phone Office“.
- App-Info mit Version, Hinweisen zur lokalen Speicherung, Sicherung und Projekt-Support.
- Offline verfügbare Drittanbieter-Lizenztexte einschließlich der Manrope-Schrift. Der umfangreiche Lizenzdialog wird erst beim Öffnen geladen.
- Separater vorbereiteter Android-Produktionskanal mit verpflichtender eigener Signierung für eine zukünftige Store-Veröffentlichung. Die GitHub-APK behält ihren bisherigen Updatepfad.

## Android installieren oder aktualisieren

Lade **phone-office-android.apk** unten herunter und öffne sie auf deinem Gerät. Erlaube die Installation aus dieser Quelle, wenn Android danach fragt. Die App heißt **Phone Office**. Sie benötigt kein Play-Store-Konto und keine Registrierung.

Die APK ist ein nicht debuggbarer Release-Build. Zur Kompatibilität mit bestehenden Installationen verwendet sie weiterhin die bisherige Testsignierung und Paketkennung `dev.lyvt.phoneoffice.debug`. Sie ist **kein für Google Play signierter Store-Build**. Vor dem Update wichtige Notizbücher als `.pnote` sichern. Ein Update mit derselben Signatur erhält normalerweise den App-Speicher; die App nicht zuerst deinstallieren.

Prüfsummen stehen in `SHA256SUMS.txt`, der Signatur-Fingerabdruck in `signature.txt`.

## iPad / iPhone und Web

`phone-office-ios-unsigned.ipa` ist ein echter iOS-Gerätebuild, der vor der Installation selbst signiert werden muss, etwa mit Sideloadly. Er ist keine App-Store- oder TestFlight-Version. `phone-office-web-ipad.zip` enthält die offlinefähige Webversion zum Hosten über HTTPS; es ist kein iPad-Installer.

## Bewusste Grenzen

Phone Office bietet keine vollständige Samsung-Notes-/Goodnotes-Parität. OCR, Handschrifterkennung, Audioaufnahmen, Zusammenarbeit, automatische Cloud-Synchronisierung und Passwortschutz sind nicht implementiert. Samsung Notes wird über ausdrücklich exportierte Dateien importiert; private Samsung-Datenbanken werden nicht ausgelesen.

Notizbücher haben bis zu 50 Seiten. PDF-Import: maximal 30 Seiten und 20 MB. PDF-Export bildet Notizseiten als Ansicht ab; `.pnote` bewahrt ihre Bearbeitbarkeit. Office-Import/-Export unterstützt nur die dokumentierten Teilfunktionen. `.doc` benötigt vorherige Konvertierung; komplexe Office-Dokumente können Formatverluste haben. Details: `docs/NOTES-FEATURES.md`, `docs/WRITER-SUPPORT.md`.

Dokumente liegen lokal. Regelmäßige `.pnote`-Sicherungen auf einem selbst gewählten Speicherort sind erforderlich, um Geräteverlust, Deinstallation oder gelöschtem Browserspeicher vorzubeugen. Betriebssystem-Backups und externe Speicher-/Teilen-Apps haben eigene Datenschutzregeln.
