"""Check exported Writer XML against the independent OASIS ODF 1.3 schemas.
Usage: python scripts/validate-odf.py <verified-odfvalidator.jar> <export-directory>
Requires lxml; the validator jar must have been checksum-verified first.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
import zipfile
from lxml import etree

jar, directory = map(Path, sys.argv[1:])
with TemporaryDirectory() as folder:
    root = Path(folder)
    with zipfile.ZipFile(jar) as archive:
        for name in archive.namelist():
            if name.startswith("schema/") and not name.endswith("/"):
                archive.extract(name, root)
    schema = etree.RelaxNG(etree.parse(str(root / "schema/odf1.3/OpenDocument-v1.3-schema.rng")))
    files = list(directory.glob("*.fodt"))
    if not files:
        raise SystemExit("No current FODT exports to validate")
    for path in files:
        schema.assertValid(etree.parse(str(path)))
        print(f"ODF 1.3 schema passed: {path.name}")
