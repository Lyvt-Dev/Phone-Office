# Veröffentlichung auf GitHub

Creator: **Lyvt**. Der aktuell gewählte Veröffentlichungsweg ist ein kostenlos herunterladbarer GitHub-Release; es wird keine Store-Zulassung behauptet.

## Vorhandener GitHub-Kanal

`.github/workflows/android-test-release.yml` prüft Unit-Tests, vier Chromium-Layouts, ODF-Schemata und WebKit auf macOS, baut Android und iOS und veröffentlicht erst nach erfolgreichem Abschluss beider Build-Jobs. Der Android-Download ist nicht debuggbar, verwendet aber zur Update-Kompatibilität den bisherigen Testschlüssel. Die IPA ist unsigniert und erfordert individuelle Signierung. Release-Tags nicht nachträglich überschreiben. Versionsnummern in npm, Android und iOS gemeinsam erhöhen.

Ein öffentlicher Download bedeutet nicht vollständige Funktionsparität oder eine Garantie für beliebig große Dokumente. Veröffentlichte Grenzen stehen in den Release-Notizen. Reale Stiftgeräte und Wiederherstellung aus .pnote sollten vor der Bewerbung eines Releases zusätzlich geprüft werden.

## Eigene Produktionssignatur für spätere Distribution

`PHONE_OFFICE_CHANNEL=production` erstellt Android mit `dev.lyvt.phoneoffice` und verlangt einen eigenen Schlüssel statt eines stillen Rückfalls auf Testsignierung. Erforderliche Variablen:

- `PHONE_OFFICE_RELEASE_KEYSTORE`: absoluter lokaler Pfad zu deinem sicher hinterlegten JKS/PKCS12.
- `PHONE_OFFICE_RELEASE_STORE_PASSWORD`, `PHONE_OFFICE_RELEASE_KEY_ALIAS`, `PHONE_OFFICE_RELEASE_KEY_PASSWORD`: ausschließlich sichere Secret-Eingabe.
- `PHONE_OFFICE_VERSION_CODE`: positive, monoton steigende Buildnummer.

`android/gradlew assembleRelease bundleRelease` erzeugt APK und AAB. Dieser separate Paketname übernimmt den Speicher der historischen APK nicht automatisch. Vorher .pnote exportieren und in der neuen App importieren. Der Schlüssel und seine Passwörter gehören nicht ins Repository, Chat, öffentliche Artefakte oder Actions-Caches. Ein eigener sicherer Backup-Ort für den Schlüssel ist zwingend für spätere Updates. Kein Schlüssel wurde für Lyvt erfunden oder öffentlich hinterlegt.

## Daten, Lizenzen und Anbieter

Die App enthält keine Registrierung, Werbung, Analytics oder automatische Dokument-Uploads. Die lokale Datenschutzbeschreibung ist in „Über Phone Office“ verfügbar. Hosting, Android/iCloud-Backups, Geräte-Rechtschreibung und vom Nutzer gewählte Cloud-/Teilen-Apps müssen gesondert berücksichtigt werden. Ein gehosteter Webserver kann Zugriffsdaten verarbeiten.

`npm run build` erzeugt die installierten Drittanbieter-Lizenztexte plus Manrope-Lizenz. Diese Hinweise erteilen keine Lizenz für Phone Office selbst. Für den eigenen Code wurde keine neue Open-Source-Lizenz ohne Entscheidung des Creators eingeführt.

Öffentliche GitHub-Downloads sind technisch ohne Firmenangaben oder Store-Konto möglich. Ob rechtliche Anbieter-/Datenschutzinformationen nötig sind, hängt von Anbieter, Land und tatsächlichem geschäftlichem Einsatz ab. Die App erfindet keine Anschrift, Firma oder Kontaktadresse. Projekt-Support erfolgt über GitHub Issues; dort keine privaten Dokumente veröffentlichen.

## Bekannter Abhängigkeitsbefund

Audit vom 10.10.2026: drei moderate Meldungen in der Kette Mammoth → argparse → sprintf-js, keine hohe/kritische Produktionsmeldung. Upstream bietet aktuell keinen korrigierten sprintf-js-Release. Argparse wird in Mammoths CLI verwendet; Phone Office nutzt die JavaScript-Konvertierungs-API, nicht diese CLI. Der Befund bleibt dokumentiert und wird nicht durch das Abschalten des Audits versteckt. Bei neuen Abhängigkeiten erneut prüfen.
