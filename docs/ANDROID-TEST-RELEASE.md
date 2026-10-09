# Phone Office – Android-Test

Diese APK ist ein **mit einem Android-Debug-Schlüssel signierter Testbuild**, keine Store-Veröffentlichung. Eine kostenpflichtige Entwicklerlizenz ist für die Installation einer solchen APK nicht erforderlich.

- Paket: `dev.lyvt.phoneoffice.debug`, App-Name: **Phone Office Test**.
- Mindestversion: Android 7.0 (API 24). Android System WebView sollte aktuell sein.
- Lokaler Editor mit TXT-/HTML-Import, begrenztem DOCX-Import, Vorlagen und Wiederherstellung. Formatgrenzen stehen in der App und in `docs/CONCEPT.md`.
- Native Datei-Downloads, Druck/PDF und System-Integration sind noch nicht auf Samsung-Geräten geprüft. Dieser Build dient dem ersten Gerätetest, nicht der zuverlässigen Dokumentarchivierung. Zum Testen Kopien verwenden.

## Installation auf Samsung

1. Unter „Assets“ die Datei **phone-office-android-test.apk** herunterladen.
2. Die APK in „Eigene Dateien“ öffnen.
3. Falls Android danach fragt, die Installation für die verwendete Quelle erlauben. Samsung kann sie zusätzlich mit dem „Automatischen Blocker“ verhindern; das liegt nicht an einer fehlenden Lizenz. Nur eine bewusst gewählte, vertrauenswürdige Quelle freigeben und die Einstellung anschließend wieder einschränken. Ein Firmengerät kann Installation generell untersagen.
4. **Phone Office Test** starten, eine Vorlage öffnen, bearbeiten, zurückgehen und die App neu starten. Prüfen, ob Änderungen erhalten bleiben; außerdem Tastatur, Auswahl, Drehung und Dateiimport testen.

Die veröffentlichte Datei enthält ausschließlich einen Testbuild. SHA256SUMS.txt und signature.txt dokumentieren Dateiprüfsumme und Signatur. Die Signatur belegt Integrität und Installierbarkeit, keinen durchgeführten Samsung-Gerätetest.

Der Workflow cached den Debug-Schlüssel für Folgebuilds. Wird dieser Cache entfernt oder läuft er ab, kann sich die Signatur ändern. Android akzeptiert dann kein Update über eine ältere Testinstallation. Vor Deinstallation Daten exportieren; Deinstallation löscht lokale App-Daten. Für dauerhafte Update-Kompatibilität ist später ein gesicherter, beständiger Signierschlüssel nötig.

## Reproduzieren

Node 24, JDK 21, Android SDK 36 und Build-Tools 36.0.0:

```sh
npm ci
npm test
npm run build
npx cap sync android
cd android
bash gradlew --no-daemon --max-workers=2 assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

GitHub Actions erstellt bei Tags `v*-android-test*` automatisch die APK, verifiziert Signatur und Debug-Paketkennung und veröffentlicht ein Vorab-Release. Manuelles Starten des Workflows erzeugt nur ein herunterladbares Actions-Artefakt. Veröffentlichung erfordert aktivierte Actions und Schreibrechte für das Repository-Token; Organisationsrichtlinien können dies sperren.
