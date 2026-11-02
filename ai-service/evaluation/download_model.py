"""Explicit, operator-approved download of two public artifacts. Never imports inference code."""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request
import shutil
import os

MODEL='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
REVISION='e8f8c211226b894fcb81acc59f3b34ba3efd5f42'
ARTIFACTS={
 'model.onnx':('onnx/model_qint8_avx512.onnx',118412398,'783fea82d71a58179b830a4dbd2d58447e640609e98eedf9ffa12622d375a672'),
 'tokenizer.json':('tokenizer.json',9081518,'2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8'),
}

def download(target,approved=False):
    if not approved:raise ValueError('Explicit --approved-public-artifacts required after resource and user approval')
    target=Path(target).resolve()
    # Keep artifacts in the ignored workspace staging, never repository source or a shared cache.
    staging=Path(__file__).resolve().parents[2]/'contracts/node_modules/.cache/phase4-20261031'
    if not target.is_relative_to(staging.resolve()):raise ValueError('Target must remain in Phase4 isolated staging')
    if shutil.disk_usage(staging).free<500*1024**2:raise ValueError('Download requires500MiB disk free')
    if os.name=='nt':
        import ctypes
        class Memory(ctypes.Structure):
            _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong)]+[(n,ctypes.c_ulonglong) for n in ['total','available','total_page','available_page','total_virtual','available_virtual','extended']]
        memory=Memory();memory.length=ctypes.sizeof(memory)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(memory)) or memory.available<256*1024**2:raise ValueError('Streaming download requires256MiB RAM free; loading requires1024MiB separately')
    if target.exists():raise ValueError('Refuse to overwrite existing model directory')
    target.mkdir(parents=True)
    hashes={}
    for name,(remote,size,expected) in ARTIFACTS.items():
        digest=hashlib.sha256();written=0;part=target/(name+'.part')
        with urllib.request.urlopen(f'https://huggingface.co/{MODEL}/resolve/{REVISION}/{remote}',timeout=60) as r,part.open('xb') as f:
            while block:=r.read(1024*1024):
                written+=len(block)
                if written>size:raise ValueError('Unexpected artifact size; partial file retained')
                f.write(block);digest.update(block)
        if written!=size or digest.hexdigest()!=expected:raise ValueError('Artifact size/hash mismatch; partial file retained')
        part.rename(target/name);hashes[name]=expected
    manifest={'model_id':MODEL,'revision':REVISION,'format':'onnx-int8','source':'official sentence-transformers repository','sha256':hashes,'license':'Apache-2.0','bytes':sum(v[1] for v in ARTIFACTS.values())}
    with (target/'manifest.json').open('x',encoding='utf8') as f:json.dump(manifest,f,indent=2)
    return manifest

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--target',required=True);p.add_argument('--approved-public-artifacts',action='store_true');a=p.parse_args()
    print(json.dumps(download(a.target,a.approved_public_artifacts),indent=2))
