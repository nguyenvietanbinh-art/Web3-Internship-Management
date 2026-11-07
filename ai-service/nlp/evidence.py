"""Retrieve verbatim passages. Retrieval is never proof that work functions."""
import hashlib
import re
import time
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from .engine import encoder, normalize, NotReady

def passages(text, source):
    # Preserve offsets into the original text, including long paragraphs.
    for block in re.finditer(r'[^\n]+', text):
        for start in range(block.start(), block.end(), 1000):
            end = min(start + 1000, block.end())
            if text[start:end].strip():
                yield {'source': source, 'start': start, 'end': end, 'quote': text[start:end]}

def analyze_evidence(req):
    started = time.perf_counter()
    if not req.content.strip():
        raise ValueError('Nội dung bài nộp trống')
    if len({c.id for c in req.criteria}) != len(req.criteria):
        raise ValueError('Trùng mã tiêu chí')
    if len({a.id for a in req.attachments}) != len(req.attachments) or any(a.id == 'submission' for a in req.attachments):
        raise ValueError('Trùng mã tài liệu')
    documents = [('submission', req.content)] + [(a.id, a.text) for a in req.attachments]
    all_passages = [p for source, text in documents for p in passages(text, source)]
    # Round-robin source selection prevents an attachment being silently crowded out.
    pools = [[p for p in all_passages if p['source'] == source] for source, _ in documents]
    selected = []
    for index in range(max((len(p) for p in pools), default=0)):
        for pool in pools:
            if index < len(pool) and len(selected) < 40:
                selected.append(pool[index])
    texts = [normalize(c.text) for c in req.criteria] + [normalize(p['quote']) for p in selected]
    if not selected:
        raise ValueError('Không tìm thấy nội dung để đối chiếu')
    coverage = None
    if req.engine == 'sbert':
        vectors, coverage = encoder.encode(texts)
        scores = vectors[:len(req.criteria)] @ vectors[len(req.criteria):].T
        model = encoder.status()
    else:
        try:
            vectors = TfidfVectorizer(ngram_range=(1, 2), token_pattern=r'(?u)\b\w+\b').fit_transform(texts)
            scores = (vectors[:len(req.criteria)] @ vectors[len(req.criteria):].T).toarray()
        except ValueError:
            scores = np.zeros((len(req.criteria), len(selected)))
        model = {'name': 'TF-IDF word unigram/bigram'}
    threshold = 0.35 if req.engine == 'sbert' else 0.1
    results = []
    for i, criterion in enumerate(req.criteria):
        matches = []
        for j in sorted(range(len(selected)), key=lambda j: (-float(scores[i, j]), j))[:3]:
            score = float(np.clip(scores[i, j], -1, 1))
            if not np.isfinite(score):
                raise NotReady('NONFINITE_MODEL_OUTPUT')
            if score >= threshold:
                matches.append({**selected[j], 'similarity': score, 'verified': False})
        attached = any(m['source'] != 'submission' for m in matches)
        results.append({'id': criterion.id, 'matches': matches,
                        'evidence_state': 'related_evidence' if attached else 'mentioned' if matches else 'insufficient',
                        'verified': False, 'proposed_status': 'pending_review' if matches else 'need_revision',
                        'comment': 'Có đoạn nội dung liên quan; cần kiểm tra sản phẩm và tiêu chí.' if matches else 'Chưa tìm thấy đoạn nội dung phù hợp trong phần đã xử lý.'})
    return {'engine': req.engine, 'model': model, 'criteria': results,
            'content_sha256': hashlib.sha256(req.content.encode()).hexdigest(),
            'retrieval_threshold': threshold, 'threshold_is_acceptance_rule': False,
            'verified': False, 'official_progress': None, 'score': None,
            'coverage': {'passages_used': len(selected), 'passages_total': len(all_passages),
                         'truncated': len(selected) < len(all_passages) or any(c['truncated'] for c in coverage or [])},
            'elapsed_ms': round((time.perf_counter() - started) * 1000, 2)}
