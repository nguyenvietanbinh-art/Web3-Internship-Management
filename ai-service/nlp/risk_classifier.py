"""Opt-in local synthetic classifier. Never a calibrated real-student risk model."""
import hashlib
import json
import os
from functools import lru_cache
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

FEATURES = ['total_tasks', 'done_tasks', 'overdue_tasks', 'open_sessions', 'approved_minutes', 'report_versions']
REASON = ('Huấn luyện thử bằng TF-IDF + Logistic Regression trên 1.000 báo cáo tổng hợp; '
          'nhãn theo kịch bản, chưa được giảng viên xác nhận. Chưa đánh giá trên sinh viên thật '
          'hoặc hiệu chuẩn độ tin cậy. Không phải mô hình BERT được fine-tune.')

@lru_cache(maxsize=2)
def load(path, expected_hash):
    file = Path(path).resolve()
    if not file.is_file() or file.stat().st_size > 8 * 1024 * 1024:
        raise ValueError('Missing or oversized artifact')
    raw = file.read_bytes()
    if len(expected_hash) != 64 or hashlib.sha256(raw).hexdigest() != expected_hash:
        raise ValueError('Artifact hash mismatch')
    p = json.loads(raw)
    if p.get('synthetic') is not True or p.get('deployable') is not False or p.get('engine') != 'tfidf':
        raise ValueError('Not an approved synthetic TF-IDF artifact')
    if p.get('training_dataset')!='synthetic-internship-v2' or p.get('dataset_reports')!=1000 or p.get('fit_reports')!=600:
        raise ValueError('Unexpected training provenance')
    if p.get('numeric_features') != FEATURES or set(p.get('classes', [])) != {'needs_support', 'on_track'} or len(p['classes']) != 2:
        raise ValueError('Unexpected feature/class schema')
    vocab = p['vocabulary']
    if not vocab or len(vocab)>6000 or sorted(vocab.values())!=list(range(len(vocab))):
        raise ValueError('Invalid vocabulary')
    idf=np.asarray(p['idf'],dtype=float)
    weights=np.asarray(p['coefficients'],dtype=float)
    intercept=np.asarray(p['intercept'],dtype=float)
    mean=np.asarray(p['scaler_mean'],dtype=float)
    scale=np.asarray(p['scaler_scale'],dtype=float)
    if idf.shape!=(len(vocab),) or weights.shape!=(1,len(vocab)+6) or intercept.shape!=(1,) or mean.shape!=(6,) or scale.shape!=(6,):
        raise ValueError('Invalid parameter dimensions')
    if not all(np.isfinite(x).all() for x in [idf,weights,intercept,mean,scale]) or (scale<=0).any() or (idf<=0).any():
        raise ValueError('Invalid parameter values')
    vectorizer=TfidfVectorizer(vocabulary=vocab,ngram_range=(1,2),sublinear_tf=True)
    vectorizer.idf_=idf
    return vectorizer, weights[0], intercept[0], mean, scale, p['classes']

def configuration():
    return os.getenv('NLP_RISK_MODEL_FILE',''),os.getenv('NLP_RISK_MODEL_SHA256','')

def status():
    path,digest=configuration()
    if os.getenv('NLP_ALLOW_SYNTHETIC_CLASSIFIER')!='true' or not path:
        return {'status':'NOT_TRAINED','risk_prediction':None,'confidence':None,
                'reason':'Chưa bật mô hình thử nghiệm; chưa có classifier được nghiệm thu trên dữ liệu thực tế.'}
    try:
        load(path,digest)
    except (ValueError,KeyError,TypeError,OSError,OverflowError):
        return {'status':'UNAVAILABLE','risk_prediction':None,'confidence':None,
                'reason':'Không xác minh được mô hình thử nghiệm local; không tạo kết quả dự phòng giả.'}
    return {'status':'EXPERIMENTAL_SYNTHETIC','risk_prediction':None,'confidence':None,
            'reason':REASON,'model':'tfidf-logistic-regression','synthetic':True,
            'real_world_validated':False,'confidence_calibrated':False,'automatic_decisions':False}

def predict(req):
    result=status()
    if result['status']!='EXPERIMENTAL_SYNTHETIC':
        return result
    vectorizer,weights,intercept,mean,scale,classes=load(*configuration())
    x=vectorizer.transform([req.content])
    numeric=(np.array([getattr(req,f) for f in FEATURES],dtype=float)-mean)/scale
    margin=float((x @ weights[:x.shape[1]])[0]+numeric @ weights[x.shape[1]:]+intercept)
    if not np.isfinite(margin):
        return {'status':'UNAVAILABLE','risk_prediction':None,'confidence':None,'reason':'Kết quả số không hợp lệ; không tạo dự đoán.'}
    result['risk_prediction']=classes[int(margin>0)]
    result['prediction_scope']='synthetic-trained-experimental-suggestion'
    return result
