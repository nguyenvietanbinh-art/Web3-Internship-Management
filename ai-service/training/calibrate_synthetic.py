"""Measure probability calibration on synthetic labels only; never activates runtime confidence."""
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.special import expit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss,log_loss
from nlp.risk_classifier import load,FEATURES
from training.experiment import validate

def calibration_metrics(y,p,bins=10):
    y=np.asarray(y,dtype=float);p=np.asarray(p,dtype=float)
    if y.shape!=p.shape or not len(y) or not np.isfinite(p).all() or ((p<0)|(p>1)).any():
        raise ValueError('Invalid probabilities')
    assignments=np.minimum((p*bins).astype(int),bins-1)
    rows=[];ece=0.
    for i in range(bins):
        mask=assignments==i;n=int(mask.sum())
        if n:
            predicted=float(p[mask].mean());observed=float(y[mask].mean())
            ece+=n/len(y)*abs(predicted-observed)
            rows.append(dict(bin=i,count=n,mean_probability=predicted,observed_fraction=observed))
    return dict(samples=len(y),brier=float(brier_score_loss(y,p)),log_loss=float(log_loss(y,p,labels=[0,1])),ece=ece,bins=rows)

def main():
    root=Path(__file__).resolve().parents[2]
    dataset=root/'ai-service/datasets/synthetic-internship-v2/reports.jsonl'
    manifest=json.loads(dataset.with_name('manifest.json').read_text(encoding='utf8'))
    if hashlib.sha256(dataset.read_bytes()).hexdigest()!=manifest['sha256']:
        raise ValueError('Dataset hash mismatch')
    rows=[json.loads(line) for line in dataset.read_text(encoding='utf8').splitlines()];validate(rows,allow_synthetic=True)
    base=root/'contracts/node_modules/.cache/risk-training-20261107/tfidf-1000'
    file=base/'local-classifier.json';digest=hashlib.sha256(file.read_bytes()).hexdigest()
    vectorizer,w,b,mean,scale,classes=load(str(file),digest)
    splits={s:[r for r in rows if r['split']==s] for s in ['validation','test']}
    def features(part):
        x=vectorizer.transform([r['report_text'] for r in part])
        numeric=(np.array([[r['features'][f] for f in FEATURES] for r in part])-mean)/scale
        margin=np.asarray(x@w[:x.shape[1]]).ravel()+numeric@w[x.shape[1]:]+b
        y=np.array([int(r['label']==classes[1]) for r in part]);return margin,y
    validation,yv=features(splits['validation']);test,yt=features(splits['test'])
    # Fit sigmoid only on validation groups; test is never used to fit or choose parameters.
    calibrator=LogisticRegression(C=1e6,max_iter=1000,random_state=20261107)
    calibrator.fit(validation.reshape(-1,1),yv)
    after=calibrator.predict_proba(test.reshape(-1,1))[:,1]
    result=dict(status='SYNTHETIC_CALIBRATION_EXPERIMENT_ONLY',synthetic=True,positive_class=classes[1],
                validation_samples=len(validation),test_samples=len(test),source_model_sha256=digest,
                before=calibration_metrics(yt,expit(test)),after=calibration_metrics(yt,after),
                probability_layer=dict(coefficient=float(calibrator.coef_[0,0]),intercept=float(calibrator.intercept_[0])),
                activated_in_service=False,real_world_confidence_available=False,
                limitations=['Labels generated from scenarios, not independent human judgments.',
                             'Student groups isolated but templates overlap.',
                             'Binary support classifier experiment does not calibrate CV ranking, administrative allocations or report grades.'])
    output=root/'contracts/node_modules/.cache/risk-training-20261107/calibration-1000'
    output.mkdir(exist_ok=False)
    (output/'calibration.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({k:result[k] for k in ['status','validation_samples','test_samples','before','after','activated_in_service']}))

if __name__=='__main__':
    main()
