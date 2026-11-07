"""Corpus-wide lexical similarity for diagnosing template duplication, not hiring accuracy."""
import argparse
import csv
import json
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from nlp.engine import normalize,skills

def audit(source,output):
    data=json.loads(source.read_text(encoding='utf8'));docs=data['documents']
    if output.exists():raise FileExistsError('Do not replace audit evidence')
    output.mkdir(parents=True)
    texts=[normalize(d['text']+'\n'+' '.join(skills(d['skills']))) for d in docs]
    matrix=TfidfVectorizer(ngram_range=(1,2),token_pattern=r'(?u)\b\w+\b',lowercase=True).fit_transform(texts)
    cosine=(matrix@matrix.T).toarray();pairs=[]
    for i,a in enumerate(docs):
        for j in range(i+1,len(docs)):
            b=docs[j];pairs.append(dict(left=a['id'],right=b['id'],cosine=float(cosine[i,j]),same_period=bool({m['batchId'] for m in a['members']}&{m['batchId'] for m in b['members']}),left_title=a['members'][0]['title'],right_title=b['members'][0]['title']))
    pairs.sort(key=lambda p:-p['cosine'])
    with (output/'lexical-pairs.csv').open('x',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(pairs[0]));writer.writeheader();writer.writerows(pairs)
    summary=dict(opportunities=data['openOpportunities'],unique_inputs=len(docs),pair_count=len(pairs),lexical_threshold=.95,lexical_near_pairs=sum(p['cosine']>=.95 for p in pairs),same_period_near_pairs=sum(p['cosine']>=.95 and p['same_period'] for p in pairs),exact_description_and_skills_groups=data['exactDescriptionAndSkillsGroups'],top_pairs=pairs[:30],notes=['TF-IDF fit on the entire 80-document audit corpus; scores are not the live CV recommendation scores.','No DB mutation, no model training, no independent expert labels.'])
    (output/'lexical-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({k:v for k,v in summary.items() if k not in ['exact_description_and_skills_groups','top_pairs','notes']}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args();audit(Path(a.input),Path(a.output))
