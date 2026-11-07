"""Read-only pairwise audit using real local SBERT inference; no database writes."""
import argparse
import csv
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

def audit(source,output):
    data=json.loads(source.read_text(encoding='utf8'));docs=data['documents']
    if output.exists():raise FileExistsError('Preserve existing audit evidence')
    output.mkdir(parents=True);scores={};errors=[];coverage={};started=time.perf_counter()
    for i,query in enumerate(docs):
        for start in range(0,len(docs),20):
            candidates=docs[start:start+20]
            payload=dict(query={k:query[k] for k in ['id','text','skills']},candidates=[{k:d[k] for k in ['id','text','skills']} for d in candidates],engine='sbert',top_k=20)
            try:
                request=urllib.request.Request('http://127.0.0.1:8003/api/v1/nlp/rank',data=json.dumps(payload,ensure_ascii=False).encode('utf8'),headers={'Content-Type':'application/json'})
                with urllib.request.urlopen(request,timeout=45) as reply:result=json.load(reply)
                if result.get('engine')!='sbert' or not result.get('inference_performed'):raise ValueError('No actual SBERT inference')
                coverage[query['id']]=result.get('query_coverage')
                for row in result['results']:
                    if row['id']==query['id']:continue
                    key=tuple(sorted([query['id'],row['id']]))
                    value=row.get('raw_cosine',row['cosine'])
                    if key in scores and abs(scores[key]-value)>1e-5:raise ValueError('Asymmetric/reused embedding inconsistency')
                    scores[key]=value
            except Exception as e:
                errors.append(dict(query=query['id'],offset=start,error=e.read().decode('utf8') if isinstance(e,urllib.error.HTTPError) else str(e)))
                if len(errors)>=3:break
        if (i+1)%10==0:print(f'Audited {i+1}/{len(docs)} unique inputs, {len(scores)} pairs',flush=True)
        if len(errors)>=3:break
    members={d['id']:d['members'] for d in docs}
    with (output/'pairs.csv').open('x',encoding='utf-8-sig',newline='') as f:
        writer=csv.writer(f);writer.writerow(['left_id','right_id','sbert_raw_cosine','left_title','right_title','same_period'])
        for (a,b),value in sorted(scores.items(),key=lambda r:-r[1]):writer.writerow([a,b,value,members[a][0]['title'],members[b][0]['title'],bool({m['batchId'] for m in members[a]}&{m['batchId'] for m in members[b]})])
    summary=dict(status='PASS_EXECUTION' if not errors and len(scores)==len(docs)*(len(docs)-1)//2 else 'PARTIAL' if scores else 'BLOCKED',open_opportunities=data['openOpportunities'],unique_model_inputs=len(docs),pairs=len(scores),near_threshold=.95,near_pairs=sum(v>=.95 for v in scores.values()) if scores else None,very_near_pairs=sum(v>=.99 for v in scores.values()) if scores else None,errors=errors,elapsed_seconds=time.perf_counter()-started,truncated_documents=sum(bool(c and c.get('truncated')) for c in coverage.values()),exact_description_groups=data['exactDescriptionAndSkillsGroups'],same_skill_groups=data['sameSkillGroups'],notes=data['notes'])
    (output/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({k:v for k,v in summary.items() if k not in ['exact_description_groups','same_skill_groups','notes']},ensure_ascii=False),flush=True)
    return summary

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--input',required=True);parser.add_argument('--output',required=True);args=parser.parse_args();audit(Path(args.input),Path(args.output))
