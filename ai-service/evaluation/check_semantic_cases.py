"""Small real inference regressions; no synthetic accuracy claims or DB writes."""
import argparse
import json
import urllib.request
from pathlib import Path

def check(output):
    if output.exists():raise FileExistsError('Preserve previous inference evidence')
    rows=[]
    def call(engine,query,candidates):
        body=dict(engine=engine,top_k=20,query=query,candidates=candidates)
        request=urllib.request.Request('http://127.0.0.1:8003/api/v1/nlp/rank',data=json.dumps(body,ensure_ascii=False).encode('utf8'),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(request,timeout=45) as r:return json.load(r)
    for engine in ['tfidf','sbert']:
        query={'id':'cv','text':'JavaScript React giao diện web','skills':['JS']}
        pool=[{'id':'same-a','text':query['text'],'skills':['JavaScript']},{'id':'same-b','text':query['text'],'skills':['JavaScript']},{'id':'other','text':'Kế toán báo cáo thuế tài chính','skills':[]}]
        a,b=call(engine,query,pool),call(engine,query,pool)
        assert a['inference_performed'] is True and a['engine']==engine
        assert a['results']==b['results'],'Identical input must reproduce scores and ranking'
        assert a['results'][0]['id']=='same-a' and a['results'][1]['id']=='same-b'
        assert a['results'][0]['raw_cosine']==a['results'][1]['raw_cosine']
        assert a['results'][1]['raw_cosine']>a['results'][2]['raw_cosine']
        other=call(engine,{'id':'cv-b','text':pool[2]['text']},pool)
        assert other['results'][0]['id']=='other','Different queries must not reuse the wrong cached embedding'
        aliases=call(engine,{'id':'aliases','text':'API web','skills':['JS','NodeJS','RESTful API']},[{'id':'job','text':'API web','skills':['JavaScript','Node.js','REST API']}])
        assert aliases['results'][0]['matched_skills']==['javascript','node.js','rest api']
        rows.append(dict(engine=engine,status='PASS',tests=['identical input reproduced','duplicate JD vectors/scores identical','clearly unrelated JD below identical JD','different query changes ranking/cache key','controlled aliases normalized'],results=a['results'],changed_query=other['results'],model=a['model']))
    output.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps([dict(engine=r['engine'],status=r['status'],checks=len(r['tests'])) for r in rows]))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();check(Path(a.output))
