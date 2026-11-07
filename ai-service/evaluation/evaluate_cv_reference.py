"""Benchmark synthetic rubric labels via the actual local API; never expert acceptance."""
import argparse
import hashlib
import json
import statistics
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse
from nlp.metrics import ranking_metrics
from .build_cv_reference import PROVENANCE

def metrics_for(ranking,judgments,k):
    if len(ranking)!=len(set(ranking)) or set(ranking)!=set(judgments):raise ValueError('Need full ranking of every judged candidate exactly once')
    grades={key:r['grade'] for key,r in judgments.items()}
    binary={key:int(grade>=2) for key,grade in grades.items()}
    if not any(binary.values()):return None
    result=ranking_metrics(ranking,binary,k)
    result['ndcg_at_k']=ranking_metrics(ranking,grades,k)['ndcg_at_k']
    return result

def load_dataset(root):
    manifest=json.loads((root/'manifest.json').read_text(encoding='utf8'))
    if manifest.get('provenance')!=PROVENANCE or manifest.get('expert_confirmed') is not False:raise ValueError('Only explicit unconfirmed synthetic references allowed')
    for name,digest in manifest['sha256'].items():
        p=(root/name).resolve()
        if root.resolve() not in p.parents or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:raise ValueError('Dataset hash/path mismatch: '+name)
    read=lambda name:[json.loads(line) for line in (root/name).read_text(encoding='utf8').splitlines() if line.strip()]
    cvs,jobs,labels=read('cvs.jsonl'),read('jobs.jsonl'),read('reference-judgments.jsonl')
    if len(cvs)!=200 or len(jobs)!=20 or len(labels)!=4000:raise ValueError('Expected exactly 200 CVs, 20 jobs and 4000 judgments')
    if len({x['id'] for x in cvs})!=200 or len({x['id'] for x in jobs})!=20:raise ValueError('Duplicate IDs')
    if len({(r['cv_id'],r['jd_id']) for r in labels})!=4000:raise ValueError('Duplicate judgment')
    for r in labels:
        if r['label_source']!=PROVENANCE or r['human_confirmed'] is not False:raise ValueError('Misrepresented label source')
    return manifest,cvs,jobs,labels

def evaluate(root,output,base,k):
    url=urlparse(base)
    if url.scheme!='http' or url.hostname!='127.0.0.1' or not url.port or url.username or url.password or url.query or url.fragment or url.path not in ('','/'):raise ValueError('Use explicit loopback AI service only')
    manifest,cvs,jobs,labels=load_dataset(root)
    if output.exists():raise FileExistsError('Refuse to replace evaluation evidence')
    output.mkdir(parents=True)
    def call(path,payload=None):
        body=None if payload is None else json.dumps(payload,ensure_ascii=False).encode('utf8')
        request=urllib.request.Request(base.rstrip('/')+'/api/v1/nlp'+path,data=body,headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(request,timeout=45) as reply:return json.load(reply)
    try:status=call('/status')
    except Exception as e:status={'error':str(e)}
    indexed={(r['cv_id'],r['jd_id']):r for r in labels}
    report=dict(dataset=manifest['dataset'],provenance=PROVENANCE,expert_confirmed=False,real_world_quality_established=False,
                corpus_cv_count=200,job_count=20,judgment_count=4000,k=k,binary_relevant_min_grade=2,
                model_status_before=status,engines={},limitations=manifest['limitations'],training_performed=False)
    with (output/'predictions.jsonl').open('x',encoding='utf8') as log:
        for engine in ['tfidf','sbert']:
            records=[];errors=[];consecutive_errors=0
            for i,cv in enumerate(cvs):
                started=time.perf_counter()
                try:
                    payload=dict(query={key:cv[key] for key in ['id','text','skills']},candidates=[dict(id=j['id'],text=j['text'],skills=j['required_skills']) for j in jobs],engine=engine,top_k=20)
                    result=call('/rank',payload)
                    if result.get('engine')!=engine or result.get('inference_performed') is not True or result.get('score_is_probability') is not False:raise ValueError('Unexpected inference evidence')
                    ranking=[r['id'] for r in result['results']]
                    judgments={j['id']:indexed[(cv['id'],j['id'])] for j in jobs}
                    metrics=metrics_for(ranking,judgments,k)
                    record=dict(engine=engine,cv_id=cv['id'],split=cv['split'],metrics=metrics,no_suitable_job=metrics is None,latency_ms=(time.perf_counter()-started)*1000,
                                ranking=result['results'],query_coverage=result.get('query_coverage'),model=result.get('model'))
                    records.append(record);consecutive_errors=0
                except (urllib.error.URLError,TimeoutError,ValueError,KeyError) as e:
                    detail=e.read().decode('utf8')[:1000] if isinstance(e,urllib.error.HTTPError) else str(e)
                    record=dict(engine=engine,cv_id=cv['id'],split=cv['split'],error=detail);errors.append(record);consecutive_errors+=1
                log.write(json.dumps(record,ensure_ascii=False)+'\n');log.flush()
                if (i+1)%20==0:print(f'{engine}: {i+1}/200, successful={len(records)}, errors={len(errors)}',flush=True)
                if consecutive_errors>=3:break
            groups={}
            for split in ['all','train','validation','test']:
                part=[r for r in records if split=='all' or r['split']==split];scored=[r for r in part if r['metrics'] is not None]
                groups[split]=dict(successful_queries=len(part),metric_queries=len(scored),no_suitable_job_queries=len(part)-len(scored),
                                   metrics={key:statistics.mean(r['metrics'][key] for r in scored) for key in ['precision_at_k','recall_at_k','average_precision','ndcg_at_k']} if scored else None,
                                   mean_latency_ms=statistics.mean(r['latency_ms'] for r in part) if part else None,
                                   truncated_queries=sum(bool((r['query_coverage'] or {}).get('truncated')) for r in part))
                if groups[split]['metrics']:groups[split]['metrics']['map']=groups[split]['metrics'].pop('average_precision')
            report['engines'][engine]=dict(status='PASS_EXECUTION' if len(records)==200 else 'PARTIAL' if records else 'BLOCKED',not_run=200-len(records)-len(errors),errors=errors,groups=groups)
    try:report['model_status_after']=call('/status')
    except Exception as e:report['model_status_after']={'error':str(e)}
    (output/'metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({e:{'status':r['status'],'all':r['groups']['all'],'test':r['groups']['test']} for e,r in report['engines'].items()},ensure_ascii=False),flush=True)
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--dataset',required=True);parser.add_argument('--output',required=True);parser.add_argument('--base',default='http://127.0.0.1:8003');parser.add_argument('--k',type=int,default=5);args=parser.parse_args()
    if not 1<=args.k<=20:parser.error('k must be between 1 and 20')
    evaluate(Path(args.dataset),Path(args.output),args.base,args.k)
