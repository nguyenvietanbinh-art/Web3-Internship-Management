"""Train offline classifiers on explicitly synthetic scenarios. Never serves predictions."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

LABELS = {'on_track', 'needs_support'}
FEATURES = ['total_tasks', 'done_tasks', 'overdue_tasks', 'open_sessions', 'approved_minutes', 'report_versions']

def validate(rows, *, allow_synthetic=False):
    if not rows:
        raise ValueError('Empty dataset')
    groups, texts, ids = {}, {}, set()
    for row in rows:
        if row.get('synthetic') is not True or row.get('label_source') != 'scenario-generator-not-expert':
            raise ValueError('This tool only supports declared synthetic experiments; real data needs separate review')
        if not allow_synthetic:
            raise ValueError('Synthetic dataset requires --allow-synthetic-experiment; not acceptance training')
        split = row['split']
        if split not in {'train', 'validation', 'test'} or row['label'] not in LABELS:
            raise ValueError('Invalid split or label')
        if row['id'] in ids:
            raise ValueError('Duplicate report ID')
        ids.add(row['id'])
        key = ' '.join(row['report_text'].casefold().split())
        if not key:
            raise ValueError('Empty report')
        digest = hashlib.sha256(key.encode()).hexdigest()
        for index, value in [(groups, row['student_id']), (texts, digest)]:
            if value in index and index[value] != split:
                raise ValueError('Student or exact-text leakage across splits')
            index[value] = split
        feature = row['features']
        for field in FEATURES:
            if type(feature[field]) is not int or feature[field] < 0:
                raise ValueError('Invalid observed feature')
        if feature['done_tasks'] + feature['overdue_tasks'] > feature['total_tasks']:
            raise ValueError('Inconsistent task counts')
    for split in ['train', 'validation', 'test']:
        if {r['label'] for r in rows if r['split'] == split} != LABELS:
            raise ValueError('Every split must contain both classes')

def experiment(rows, output, *, engine='tfidf'):
    import numpy as np
    from scipy import sparse
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import classification_report, confusion_matrix
    output = Path(output).resolve()
    cache = Path(__file__).resolve().parents[2] / 'contracts/node_modules/.cache'
    if not output.is_relative_to(cache.resolve()):
        raise ValueError('Output must stay in ignored repository cache')
    if output.exists():
        raise ValueError('Never overwrite an existing experiment')
    splits = {s: [r for r in rows if r['split'] == s] for s in ['train', 'validation', 'test']}
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=6000, sublinear_tf=True)
    scaler = StandardScaler()
    train = splits['train']
    scaler.fit([[r['features'][f] for f in FEATURES] for r in train])
    if engine == 'tfidf':
        vectorizer.fit([r['report_text'] for r in train])
    coverage = []
    def transform(part):
        if engine == 'sbert':
            from nlp.engine import encoder
            vectors = []
            for r in part:
                v, c = encoder.encode([r['report_text']])
                vectors.append(v[0]); coverage.extend(c)
            text = sparse.csr_matrix(np.array(vectors))
        else:
            text = vectorizer.transform([r['report_text'] for r in part])
        numeric = scaler.transform([[r['features'][f] for f in FEATURES] for r in part])
        return sparse.hstack([text, sparse.csr_matrix(numeric)]).tocsr()
    model = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=20261107)
    model.fit(transform(train), [r['label'] for r in train])
    metrics = {}
    for split in ['validation', 'test']:
        part = splits[split]
        predicted = model.predict(transform(part))
        metrics[split] = dict(classification_report=classification_report([r['label'] for r in part], predicted, output_dict=True, zero_division=0),
                              confusion_matrix=confusion_matrix([r['label'] for r in part], predicted, labels=model.classes_).tolist())
    result = dict(status='SYNTHETIC_EXPERIMENT_ONLY', engine=engine, model='frozen-embeddings+logistic-regression' if engine=='sbert' else 'tfidf+logistic-regression',
                  synthetic=True, acceptance=False, deployable=False, confidence_calibrated=False,
                  counts={s: dict(Counter(r['label'] for r in p)) for s, p in splits.items()},
                  metrics=metrics, coverage=coverage,
                  limitations=['Metrics measure generated scenarios, not real-student generalization.',
                               'Templates overlap across student-isolated splits.',
                               'Does not change running API classifier status.'])
    output.mkdir(parents=True, exist_ok=False)
    (output/'metrics.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
    # JSON parameters only; no pickle loader or automatic service activation.
    parameters = dict(classes=model.classes_.tolist(), coefficients=model.coef_.tolist(), intercept=model.intercept_.tolist(),
                      numeric_features=FEATURES, scaler_mean=scaler.mean_.tolist(), scaler_scale=scaler.scale_.tolist(),
                      synthetic=True, deployable=False, engine=engine)
    if engine=='tfidf':
        parameters.update(vocabulary={k:int(v) for k,v in vectorizer.vocabulary_.items()}, idf=vectorizer.idf_.tolist())
    (output/'experimental-parameters.json').write_text(json.dumps(parameters), encoding='utf8')
    print(json.dumps(dict(status=result['status'], engine=engine, output=str(output), acceptance=False)))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--dataset', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--engine', choices=['tfidf', 'sbert'], default='tfidf')
    parser.add_argument('--allow-synthetic-experiment', action='store_true')
    args=parser.parse_args()
    rows=[json.loads(line) for line in Path(args.dataset).read_text(encoding='utf8').splitlines() if line.strip()]
    validate(rows, allow_synthetic=args.allow_synthetic_experiment)
    experiment(rows, args.output, engine=args.engine)

if __name__=='__main__':
    main()
