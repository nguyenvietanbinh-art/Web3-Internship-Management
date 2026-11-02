"""Run only with independently labeled, consented data. No label generation."""
import argparse
import json
import platform
import statistics
import time
from pathlib import Path
from nlp.metrics import validate_dataset, ranking_metrics
from nlp.engine import rank, encoder
from nlp.schemas import RankingRequest

def evaluate(data,k):
    rows=validate_dataset(data)['test']
    results={'label_provenance':data['provenance'],'test_queries':len(rows),'annotators':data['annotators'],'k':k,'python':platform.python_version(),'model':encoder.status(),'engines':{}}
    for engine in ['tfidf','sbert']:
        samples=[];elapsed=[]
        for row in rows:
            req=RankingRequest(query=row['query'],candidates=row['candidates'],engine=engine,top_k=20)
            # Metrics need the complete ranking; this release bounds each judged pool at20.
            if len(req.candidates)>20:raise ValueError('Evaluation pool must be <=20 for complete AP')
            start=time.perf_counter();out=rank(req);elapsed.append((time.perf_counter()-start)*1000)
            samples.append(ranking_metrics([r['id'] for r in out['results']],row['labels'],k))
        results['engines'][engine]={'precision_at_k':statistics.mean(r['precision_at_k'] for r in samples),'recall_at_k':statistics.mean(r['recall_at_k'] for r in samples),'map':statistics.mean(r['average_precision'] for r in samples),'ndcg_at_k':statistics.mean(r['ndcg_at_k'] for r in samples),'mean_latency_ms':statistics.mean(elapsed)}
    results['model']=encoder.status()
    return results

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--dataset',required=True);p.add_argument('--output',required=True);p.add_argument('--k',type=int,default=5);a=p.parse_args()
    result=evaluate(json.loads(Path(a.dataset).read_text(encoding='utf8')),a.k)
    with Path(a.output).open('x',encoding='utf8') as f:json.dump(result,f,ensure_ascii=False,indent=2)
