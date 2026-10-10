"""Package a compiled device .app for personal signing with xtool, never a simulator."""
import hashlib, json, pathlib, plistlib, subprocess, sys, zipfile
app, destination = map(pathlib.Path, sys.argv[1:])
info = plistlib.loads((app / 'Info.plist').read_bytes())
version = json.loads(pathlib.Path('package.json').read_text())['version']
assert info['CFBundleSupportedPlatforms'] == ['iPhoneOS'], 'Refusing a simulator build'
assert info['CFBundleShortVersionString'] == version, 'Wrong app version'
assert {1, 2}.issubset(set(info['UIDeviceFamily'])), 'Missing iPhone/iPad support'
executable = app / info['CFBundleExecutable']
subprocess.run(['lipo', '-verify_arch', 'arm64', str(executable)], check=True)
assert (app / 'public/index.html').is_file(), 'Missing offline editor'
assert (app / 'public/pdfjs/standard_fonts').is_dir(), 'Missing local PDF fonts'
assert not (app / 'embedded.mobileprovision').exists(), 'Personal provisioning must happen locally'
destination.mkdir(parents=True, exist_ok=True)
ipa = destination / 'phone-office-ios-unsigned.ipa'
with zipfile.ZipFile(ipa, 'w', zipfile.ZIP_DEFLATED) as archive:
    for source in sorted(app.rglob('*')):
        if source.is_file(): archive.write(source, pathlib.Path('Payload') / app.name / source.relative_to(app))
(destination / 'SHA256SUMS-ios.txt').write_text(f'{hashlib.sha256(ipa.read_bytes()).hexdigest()}  {ipa.name}\n')
(destination / 'ios-build-info.txt').write_text(f'Phone Office {version}\nNative arm64 iPhoneOS build; iPhone and iPad.\nUnsigned: requires local Apple provisioning/signing, e.g. xtool install.\nPhysical iPad installation and Pencil input not validated by CI.\n')
print(ipa)
