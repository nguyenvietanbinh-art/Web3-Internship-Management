"""Ranking metrics; binary relevance >0, graded NDCG, macro average over queries."""
import math

def ranking_metrics(ranking, labels, k):
    if not isinstance(k,int) or isinstance(k,bool) or k < 1:
        raise ValueError('k must be positive integer')
    if len(ranking)!=len(set(ranking)) or any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or v<0 or v>3 for v in labels.values()):
        raise ValueError('Duplicate rank or invalid relevance')
    if any(doc not in labels for doc in ranking):
        raise ValueError('Unjudged candidate cannot be assumed irrelevant')
    relevant = sum(v>0 for v in labels.values())
    if not relevant:
        raise ValueError('Query has no judged relevant documents')
    hits=0; ap=0
    for i,doc in enumerate(ranking,1):
        if labels[doc]>0:
            hits+=1;ap+=hits/i
    top=ranking[:k]; top_hits=sum(labels[d]>0 for d in top)
    dcg=sum((2**labels[d]-1)/math.log2(i+2) for i,d in enumerate(top))
    ideal=sorted(labels.values(),reverse=True)[:k]
    idcg=sum((2**grade-1)/math.log2(i+2) for i,grade in enumerate(ideal))
    return {'precision_at_k':top_hits/k,'recall_at_k':top_hits/relevant,'average_precision':ap/relevant,'ndcg_at_k':dcg/idcg if idcg else 0}

def validate_dataset(data):
    if data.get('provenance')!='independent-human-judgments' or not data.get('annotators') or not data.get('consent'):
        raise ValueError('Independent human labeling provenance/consent required')
    splits=data.get('splits',{}); seen_ids=set(); seen_text=set(); seen_groups=set()
    for split in ['train','validation','test']:
        rows=splits.get(split,[]); ids=set(); texts=set(); groups=set()
        for q in rows:
            if q['group_id'] in seen_groups or q['id'] in seen_ids:
                raise ValueError('Group/query leakage across splits')
            groups.add(q['group_id']);ids.add(q['id'])
            for d in [q['query']]+q['candidates']:
                import hashlib
                from .engine import normalize
                digest=hashlib.sha256(normalize(d['text']).casefold().encode()).hexdigest()
                if digest in seen_text:raise ValueError('Text leakage across splits')
                texts.add(digest)
            if set(q['labels'])!={d['id'] for d in q['candidates']}:
                raise ValueError('All candidates must be independently judged')
            ranking_metrics([d['id'] for d in q['candidates']],q['labels'],1)
        if len(ids)!=len(rows):raise ValueError('Duplicate query id')
        seen_ids|=ids;seen_text|=texts;seen_groups|=groups
    if not splits.get('test'):raise ValueError('No labeled test queries')
    return splits
