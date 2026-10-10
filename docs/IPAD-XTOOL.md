# iPad mit xtool testen (0.7.0)

Die Release-Datei `phone-office-ios-unsigned.ipa` enthält die native **arm64-Geräte-App** für iPhone und iPad. Sie ist noch nicht persönlich signiert und kann nicht allein durch Antippen in Safari installiert werden. Der GitHub-Build benutzt Xcode für die vorhandene Capacitor-App; **auf deinem Rechner übernimmt xtool Signierung und Installation**. Eine vollständige Umstellung des Capacitor-Projekts auf xtool/SwiftPM ist nicht implementiert.

## Installation auf deinem Rechner

1. xtool nach der [offiziellen Anleitung](https://xtool.sh/documentation/xtooldocs/installation-linux) installieren (Linux, Windows über WSL; [macOS](https://xtool.sh/documentation/xtooldocs/installation-macos)). Auf Windows zusätzlich USB-Weiterleitung einrichten. Linux benötigt usbmuxd. Die lokale CLI wurde mit **xtool 1.21.0** geprüft.
2. `xtool auth login` lokal ausführen. Ein kostenloser Apple-Account ist für persönliche Tests möglich; kostenpflichtige Mitgliedschaft ist nicht grundsätzlich erforderlich. Kostenlose Profile laufen üblicherweise nach sieben Tagen ab und müssen erneuert werden. Apple-/xtool-Limits gelten weiter. Keine Zugangsdaten in GitHub, diese App oder Chats eingeben. `xtool setup` wird nur zusätzlich gebraucht, wenn du selbst SwiftPM-Apps bauen willst: dafür verlangt xtool eine Apple-SDK/Xcode-Installation.
3. iPad per USB verbinden, entsperren, dem Computer vertrauen und den Entwicklermodus aktivieren, falls iPadOS dies verlangt.
4. Aus dem Release IPA und `SHA256SUMS-ios.txt` herunterladen. Im Downloadordner prüfen:

   ```sh
   sha256sum -c SHA256SUMS-ios.txt
   xtool devices
   xtool install --usb phone-office-ios-unsigned.ipa
   ```

   Bei mehreren Geräten: `xtool install --usb --udid DEINE_GERAETE_ID phone-office-ios-unsigned.ipa`.
5. Falls verlangt, dem persönlichen Entwicklerprofil unter Einstellungen → Allgemein → VPN & Geräteverwaltung vertrauen. Phone Office öffnen.

xtool signiert die IPA mit deinem Apple-Zugang und dem Geräteprofil. Kein fremdes Zertifikat, öffentliches Passwort oder privater Signierschlüssel wird mitgeliefert. Ein Wechsel des Apple-Teams/Bundle-Identifier kann eine unabhängige App installieren; vorher Notizen als `.pnote` sichern.

## Was getestet ist

Die CI kompiliert die Geräte-App, prüft Architektur, Version, iPhone/iPad-Gerätefamilien, Offline-Inhalte und verpackt die IPA. Die Editorlogik wird mit Browser-Eingaben geprüft. Eine erfolgreiche xtool-Installation auf einem physischen iPad und Apple-Pencil-Druck/Handballenerkennung bleiben **Gerätetests**, bis sie tatsächlich durchgeführt wurden. Die Cloud hat keinen Zugriff auf dein iPad oder deine Apple-Signierung.

PDFs und Notizen werden lokal verarbeitet. Fotos, Audio, OCR und proprietäre Samsung-Striche sind keine neu implementierten Funktionen dieses Releases.
