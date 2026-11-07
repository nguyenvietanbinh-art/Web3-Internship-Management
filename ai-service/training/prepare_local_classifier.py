"""Package the existing experiment for explicitly approved local demonstration."""
import hashlib
import json
from pathlib import Path
from training.experiment import validate

def main():
    root=Path(__file__).resolve().parents[2]
    dataset=root/'ai-service/datasets/synthetic-internship-v2/reports.jsonl'
    manifest=json.loads(dataset.with_name('manifest.json').read_text(encoding='utf8'))
    digest=hashlib.sha256(dataset.read_bytes()).hexdigest()
    if digest!=manifest['sha256']:
        raise ValueError('Dataset integrity mismatch')
    rows=[json.loads(line) for line in dataset.read_text(encoding='utf8').splitlines()]
    validate(rows,allow_synthetic=True)
    if len(rows)!=1000 or sum(r['split']=='train' for r in rows)!=600:
        raise ValueError('Unexpected dataset size')
    source=root/'contracts/node_modules/.cache/risk-training-20261107/tfidf-1000'
    metrics=json.loads((source/'metrics.json').read_text(encoding='utf8'))
    if metrics['status']!='SYNTHETIC_EXPERIMENT_ONLY' or metrics['engine']!='tfidf' or metrics['acceptance'] is not False:
        raise ValueError('Not the expected experiment')
    params=json.loads((source/'experimental-parameters.json').read_text(encoding='utf8'))
    params.update(training_dataset='synthetic-internship-v2',dataset_reports=1000,fit_reports=600,dataset_sha256=digest,
                  use='explicit-local-demonstration-only',real_world_validated=False)
    target=source/'local-classifier.json'
    raw=json.dumps(params,ensure_ascii=False).encode('utf8')
    with target.open('xb') as file:
        file.write(raw)
    print(json.dumps({'path':str(target),'sha256':hashlib.sha256(raw).hexdigest(),'synthetic':True}))

if __name__=='__main__':
    main()
