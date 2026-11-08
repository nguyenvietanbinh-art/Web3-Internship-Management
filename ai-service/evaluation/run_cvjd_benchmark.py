"""Frozen TEST corpus -> rule labels -> actual TF-IDF/SBERT -> versioned metrics.
Run from ai-service: python -m evaluation.run_cvjd_benchmark [label|evaluate|all]
No DB writes, training, dependency installation, model download or cloud calls.
"""
import csv,hashlib,json,math,statistics,sys,time,unicodedata,urllib.request,urllib.error
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
from .cvjd_rubric import RUBRIC,WEIGHTS,VERSION,grade_pair,canonical
from .cvjd_metrics import metrics
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/INTERNOVA_PRODUCTION_READINESS/AI_EVALUATION';FROZEN=OUT/'frozen'
def sha(data):return hashlib.sha256(data).hexdigest()
def write_json(path,obj,exclusive=False):
 text=json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
 if exclusive and path.exists():
  if json.loads(path.read_text(encoding='utf-8'))!=obj:raise ValueError('Refuse to overwrite different frozen artifact: '+str(path))
  return
 path.write_text(text,encoding='utf-8')
def csv_file(name,fields,rows):
 with (OUT/name).open('w',encoding='utf-8-sig',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=fields,extrasaction='raise');writer.writeheader();writer.writerows(rows)
def load():
 manifest=json.loads((FROZEN/'manifest.json').read_text(encoding='utf-8'));raw=(FROZEN/'documents.json').read_bytes()
 if sha(raw)!=manifest['documentsSha256']:raise ValueError('Frozen document hash mismatch')
 docs=json.loads(raw);assert len(docs['cvs'])==100 and len(docs['jds'])==30 and docs['synthetic'] is True
 assert len({d['id'] for d in docs['cvs']})==100 and len({d['id'] for d in docs['jds']})==30
 assert len({d['samplingTrack'] for d in docs['cvs']})==11 and len({d['samplingTrack'] for d in docs['jds']})==11
 return manifest,docs
def labeling():
 manifest,docs=load();version_file=OUT/'RUBRIC_VERSION.json'
 source_hashes={name:sha((Path(__file__).parent/name).read_bytes()) for name in ['cvjd_rubric.py','cvjd_metrics.py']}
 if version_file.exists():
  version=json.loads(version_file.read_text(encoding='utf-8'))
  if version['rubric']!=RUBRIC or version['sourceHashes']!=source_hashes:raise ValueError('Rubric/code changed after freeze: create an explicit new benchmark version')
 else:
  version={'rubric':RUBRIC,'frozenAt':datetime.now(timezone.utc).isoformat(),'sourceHashes':source_hashes,'documentsSha256':manifest['documentsSha256']};write_json(version_file,version,True)
 rows=[];dataset=[];details=[]
 for jd in docs['jds']:
  for cv in docs['cvs']:
   result=grade_pair(cv,jd);details.append(result)
   rows.append({'cv_id':cv['id'],'jd_id':jd['id'],'cv_title':cv['title'],'jd_title':jd['title'],**{key:result['criteria'][key]['earned'] for key in WEIGHTS},'applicable_weight':result['applicable_weight'],'raw_score':result['raw_score'],'total':result['total'],'label':result['label'],'label_source':'RULE_BASED','human_validated':False,'rubric_version':VERSION,'evaluated_at':version['frozenAt'],'evidence_json':json.dumps(result['criteria'],ensure_ascii=False),'caps_json':json.dumps(result['caps'],ensure_ascii=False),'missing_skills_json':json.dumps(result['missing_required_skills'],ensure_ascii=False)})
   dataset.append({'cv_id':cv['id'],'jd_id':jd['id'],'cv_title':cv['title'],'jd_title':jd['title'],'cv_sha256':sha(json.dumps(cv,ensure_ascii=False,sort_keys=True).encode()),'jd_sha256':sha(json.dumps(jd,ensure_ascii=False,sort_keys=True).encode()),'cv_sampling_track':docs['tracks'][cv['samplingTrack']],'jd_sampling_track':docs['tracks'][jd['samplingTrack']]})
 assert len(rows)==3000 and len({(r['cv_id'],r['jd_id']) for r in rows})==3000
 for row in rows:assert 0<=row['total']<=100 and row['label'] in range(4)
 for jd in docs['jds']:assert sum(r['jd_id']==jd['id'] for r in rows)==100
 csv_file('EVALUATION_DATASET.csv',list(dataset[0]),dataset);csv_file('RULE_BASED_LABELS.csv',list(rows[0]),rows)
 human=[{key:r[key] for key in ['cv_id','jd_id','cv_title','jd_title']}|{'human_label':'','reviewer_id':'','reviewed_at':'','notes':'','label_source':'PENDING_HUMAN_REVIEW'} for r in rows]
 # Blinded human template does not expose model scores, ranks or rule labels.
 if not (OUT/'HUMAN_REVIEW_TEMPLATE.csv').exists():csv_file('HUMAN_REVIEW_TEMPLATE.csv',list(human[0]),human)
 else:
  with (OUT/'HUMAN_REVIEW_TEMPLATE.csv').open(encoding='utf-8-sig',newline='') as reviewed:
   existing=list(csv.DictReader(reviewed));assert {(r['cv_id'],r['jd_id']) for r in existing}=={(r['cv_id'],r['jd_id']) for r in human},'Existing human template belongs to another frozen set; preserve it'
 write_json(OUT/'label-details.json',details)
 distribution=Counter(r['label'] for r in rows)
 sample=[next((r for r in details if r['label']==label),None) for label in range(4)]
 write_json(OUT/'label-validation.json',{'status':'PASS','pairs':3000,'distribution':dict(distribution),'per_jd':{j['id']:100 for j in docs['jds']},'duplicates':0,'missing':0,'out_of_range':0,'source':'RULE_BASED','human_validation':'BLOCKED','samples_by_label':sample,'labelsSha256':sha((OUT/'RULE_BASED_LABELS.csv').read_bytes()),'labelDetailsSha256':sha((OUT/'label-details.json').read_bytes()),'rubricSha256':sha(version_file.read_bytes()),'documentsSha256':manifest['documentsSha256']})
 print('RULE_BASED labeling PASS:',dict(distribution),flush=True)
 return details
def call(path,payload=None):
 data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode('utf-8')
 req=urllib.request.Request('http://127.0.0.1:8003/api/v1/nlp'+path,data=data,headers={'Content-Type':'application/json'})
 # Never use system proxies for CV data; only the authorized loopback model service.
 with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req,timeout=35) as reply:return json.load(reply)
def content(doc,skill_field):return ' '.join(unicodedata.normalize('NFC',doc['text']+'\n'+' '.join(sorted({canonical(s) for s in doc[skill_field]}))).replace('\x00','').split())
def evaluate():
 manifest,docs=load();validation=json.loads((OUT/'label-validation.json').read_text(encoding='utf-8'))
 if validation['documentsSha256']!=manifest['documentsSha256'] or validation['labelsSha256']!=sha((OUT/'RULE_BASED_LABELS.csv').read_bytes()):raise ValueError('Evaluation inputs drifted')
 if validation.get('labelDetailsSha256')!=sha((OUT/'label-details.json').read_bytes()) or validation['rubricSha256']!=sha((OUT/'RUBRIC_VERSION.json').read_bytes()):raise ValueError('Label details/rubric hash mismatch; run label validation')
 labels=json.loads((OUT/'label-details.json').read_text(encoding='utf-8'));by_jd={j['id']:{r['cv_id']:r['label'] for r in labels if r['jd_id']==j['id']} for j in docs['jds']}
 expected={c['id'] for c in docs['cvs']};rank_file=OUT/'rankings.json';records=json.loads(rank_file.read_text(encoding='utf-8')) if rank_file.exists() else []
 if records and any(r['documentsSha256']!=manifest['documentsSha256'] for r in records):raise ValueError('Cached predictions do not match frozen corpus')
 # Run sklearn in a separate sequential process so BERT does not compete with its RAM.
 if any(not any(r['engine']=='tfidf' and r['jd_id']==jd['id'] for r in records) for jd in docs['jds']):
  import subprocess
  subprocess.run([sys.executable,'-m','evaluation.run_cvjd_benchmark','tfidf'],check=True)
  records=json.loads(rank_file.read_text(encoding='utf-8'))
 status=call('/status');write_json(OUT/'model-status.json',status)
 if not status['sbert']['ready']:raise RuntimeError('BERT service not loaded; preserve guard/resources, do not fabricate predictions')
 if status['sbert']['revision']!='e8f8c211226b894fcb81acc59f3b34ba3efd5f42':raise RuntimeError('Unexpected BERT revision')
 for n,jd in enumerate(docs['jds'],1):
  if any(r['engine']=='sbert' and r['jd_id']==jd['id'] for r in records):continue
  started=time.perf_counter();all_rows=[];coverages=[]
  for start in range(0,100,25):
   candidates=docs['cvs'][start:start+25];response=call('/rank',{'engine':'sbert','top_k':20,'include_all_scores':True,'query':{'id':jd['id'],'text':jd['text'],'skills':jd['requirements']},'candidates':[{'id':cv['id'],'text':cv['text'],'skills':cv['skills']} for cv in candidates]})
   rows=response['all_results'];assert len(rows)==len(candidates) and {r['id'] for r in rows}=={c['id'] for c in candidates};all_rows.extend(rows);coverages.append(response.get('query_coverage'))
  assert {r['id'] for r in all_rows}==expected and len(all_rows)==100
  all_rows.sort(key=lambda r:(-r['raw_cosine'],r['id']));records.append({'engine':'sbert','jd_id':jd['id'],'elapsed_ms':round((time.perf_counter()-started)*1000,3),'documentsSha256':manifest['documentsSha256'],'model':response['model'],'query_coverages':coverages,'results':all_rows});write_json(rank_file,records);print('BERT query',n,'/30 PASS',flush=True)
 if len(records)!=60:raise ValueError('Missing or duplicate query predictions')
 per_query=[]
 for r in records:
  ranking=[x['id'] for x in r['results']];assert len(ranking)==100 and set(ranking)==expected
  for k in [5,10]:per_query.append({'engine':r['engine'],'jd_id':r['jd_id'],'k':k,'elapsed_ms':r['elapsed_ms'],**metrics(ranking,by_jd[r['jd_id']],k)})
 csv_file('PER_QUERY_METRICS.csv',list(per_query[0]),per_query)
 rows=[]
 for k in [5,10]:
  for field,name in [('precision','Precision'),('recall','Recall'),('ap','MAP'),('ndcg','NDCG')]:
   means={e:statistics.mean(r[field] for r in per_query if r['engine']==e and r['k']==k) for e in ['tfidf','sbert']};rows.append({'metric':f'{name}@{k}','TF-IDF':means['tfidf'],'Sentence-BERT':means['sbert'],'delta_sbert_minus_tfidf':means['sbert']-means['tfidf'],'label_source':'RULE_BASED','query_count':30})
 csv_file('METRICS_RESULTS.csv',list(rows[0]),rows)
 report={'inference':'PASS','rule_labeling':'PASS','metric_calculation':'PASS','human_validation':'BLOCKED','source':'RULE_BASED','rubric_version':VERSION,'documentsSha256':manifest['documentsSha256'],'cv_count':100,'jd_count':30,'pair_count':3000,'query_count':30,'no_relevant_queries':sum(not any(g>=2 for g in grades.values()) for grades in by_jd.values()),'metrics':rows,'latencies':{e:{'total_ms':sum(r['elapsed_ms'] for r in records if r['engine']==e),'median_ms':statistics.median(r['elapsed_ms'] for r in records if r['engine']==e)} for e in ['tfidf','sbert']},'evaluatorSha256':sha(Path(__file__).read_bytes()),'completed_at':datetime.now(timezone.utc).isoformat(),'training_performed':False}
 write_json(OUT/'evaluation-result.json',report)
 print('Metric calculation PASS:30queries,3000labels; human validation BLOCKED.',flush=True)

def tfidf_only():
 manifest,docs=load();rank_file=OUT/'rankings.json';records=json.loads(rank_file.read_text(encoding='utf-8')) if rank_file.exists() else []
 # TF-IDF is fitted on one JD plus ALL100CVs, not separate incomparable50-document fits.
 import sklearn
 from sklearn.feature_extraction.text import TfidfVectorizer
 for jd in docs['jds']:
  if any(r['engine']=='tfidf' and r['jd_id']==jd['id'] for r in records):continue
  started=time.perf_counter();texts=[content(jd,'requirements')]+[content(cv,'skills') for cv in docs['cvs']]
  matrix=TfidfVectorizer(ngram_range=(1,2),token_pattern=r'(?u)\b\w+\b',lowercase=True).fit_transform(texts);scores=(matrix[1:]@matrix[0].T).toarray().ravel()
  ranked=sorted([{'id':cv['id'],'raw_cosine':float(s)} for cv,s in zip(docs['cvs'],scores)],key=lambda r:(-r['raw_cosine'],r['id']))
  records.append({'engine':'tfidf','jd_id':jd['id'],'elapsed_ms':round((time.perf_counter()-started)*1000,3),'documentsSha256':manifest['documentsSha256'],'model':{'name':'TF-IDF word unigram/bigram','sklearn':sklearn.__version__,'pool':'all100CV plus query'},'results':ranked});write_json(rank_file,records)

if __name__=='__main__':
 mode=sys.argv[1] if len(sys.argv)>1 else 'all'
 if mode not in ['label','evaluate','all','tfidf']:raise SystemExit('Use label|evaluate|all')
 if mode=='tfidf':tfidf_only()
 if mode in ['label','all']:labeling()
 if mode in ['evaluate','all']:evaluate()
