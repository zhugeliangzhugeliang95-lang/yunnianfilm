"""Materialize the checksum-pinned vehicle used by the published color studio."""
import hashlib
import os
from pathlib import Path
import shutil
from tempfile import NamedTemporaryFile
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MODEL = 'automotive-studio/models/yunnian-aventador-v3.glb'
SOURCE = 'https://yunnianfilm.com/' + MODEL
DIGEST = '18f616eefdf1c6f73586939b97543c6cbddb5f70cfa565dc87d9de56e10feffd'


def checksum(path):
    with path.open('rb') as handle:
        digest = hashlib.sha256()
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
        return digest.hexdigest()


def main():
    target = ROOT / 'public' / MODEL
    if target.is_file() and checksum(target) == DIGEST:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    supplied = os.environ.get('YUNNIAN_AVENTADOR_FILE')
    temp = None
    try:
        with NamedTemporaryFile(dir=target.parent, delete=False) as output:
            temp = Path(output.name)
            source = Path(supplied).open('rb') if supplied else urlopen(
                Request(SOURCE, headers={'User-Agent': 'YUNNIAN-Website-Build/1.0'}),
                timeout=90,
            )
            with source:
                shutil.copyfileobj(source, output)
        if checksum(temp) != DIGEST:
            raise SystemExit('The studio model does not match its published SHA-256 digest.')
        temp.chmod(0o644)
        temp.replace(target)
    finally:
        if temp is not None:
            temp.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
