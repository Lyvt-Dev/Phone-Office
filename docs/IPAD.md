# Phone Office auf dem iPad

**0.6: Für die native Geräte-IPA und Installation mit xtool siehe [IPAD-XTOOL.md](IPAD-XTOOL.md).** Der Release-Workflow kompiliert eine echte arm64-iPhone/iPad-App und verpackt sie zur persönlichen Signierung. Eine physische Installation bleibt ein gesonderter Gerätetest.

Die Web-Auslieferung wurde für 0.5 auf Nutzerwunsch zurückgestellt. Die folgenden Schritte sind für später vorbereitet. WebKit-Funktionstests wurden erfolgreich auf GitHub geprüft; die automatische Pages-Aktivierung scheiterte an fehlenden Token-Rechten. Der Web-Workflow startet deshalb vorerst nur manuell.

## Ohne Developer-Konto: Browser-App

Nach erfolgreicher GitHub-Pages-Bereitstellung: https://lyvt-dev.github.io/Phone-Office/ in Safari öffnen. Teilen → Zum Home-Bildschirm hinzufügen. Das Logo wird als Startbildschirm-Icon verwendet. App einmal vollständig online laden, bevor sie offline benötigt wird. Alle Dokumente bleiben in der lokalen IndexedDB dieses App-Ursprungs; weder Notizinhalte noch importierte PDFs werden hochgeladen. Browser/App-Datenlöschung, Speicherbereinigung und Deinstallation können Dokumente entfernen. `.pnote` regelmäßig über die Dateiausgabe sichern.

Der Workflow `web-ipad.yml` baut die Web-App, prüft WebKit-Eingabe, PDF und Offline-Betrieb und veröffentlicht mit GitHub Pages. Falls die automatische Aktivierung vom Repository-Token nicht erlaubt wird: Repository Settings → Pages → Source „GitHub Actions“, danach den Workflow erneut ausführen. Pages kann durch Organisationsrichtlinien oder den Tarif für private Repositories eingeschränkt sein. Eine Alternative ist das Release-Web-ZIP auf einem eigenen statischen HTTPS-Host; Safari kann die ZIP nicht direkt als App installieren.

WebKit auf einem CI-Runner ist kein physischer Apple-Pencil-Test. Auf dem eigenen iPad prüfen: langes Schreiben, aufgelegte Hand, Druck, Zwei-Finger-Zoom/Verschieben, Rotation, Dateiimport, Export und Offline-Neustart. Apple Pencil setzt ein kompatibles iPad voraus.

## Kostenlose native Installation auf dem eigenen Gerät

Benötigt einen Mac mit aktuellem Xcode und eine Apple-ID. Repository herunterladen, Node 24 installieren, dann:

```sh
npm ci
npm run native:sync
npx cap open ios
```

In Xcode: App-Target → Signing & Capabilities → Automatically manage signing aktivieren, eigenen Personal Team auswählen. Falls nötig einen eindeutigen Bundle Identifier verwenden. iPad verbinden, als Ziel wählen und starten; iPad-Entwicklermodus/Vertrauen nach Apples Anleitung aktivieren. Kostenlose Personal-Team-Signierungen sind normalerweise sieben Tage gültig und müssen danach erneuert werden. Das iPad muss zur Signierung verfügbar sein; ein beliebiges unsigniertes GitHub-ZIP reicht nicht.

## Native Verteilung über TestFlight

Erfordert kostenpflichtiges Apple-Developer-Programm, App-Store-Connect-Konfiguration und gültige Signierung. Zertifikate, Profile und Zugangsschlüssel ausschließlich in sicherer Build-Konfiguration hinterlegen, niemals im Chat oder Repository. Diese Voraussetzungen sind im aktuellen Projekt nicht konfiguriert; es wird daher keine installierbare IPA oder TestFlight-Einladung behauptet.

`ios-simulator.yml` kompiliert auf macOS eine universelle iPhone-/iPad-Simulator-App ohne Gerätesignierung. Dieses Artefakt dient der Buildprüfung und läuft nicht auf einem physischen iPad.
