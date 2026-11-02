import hashlib
import json
import math
import os
import re
import threading
import time
import unicodedata
from collections import OrderedDict
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

MODEL_ID = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
MODEL_REVISION = 'e8f8c211226b894fcb81acc59f3b34ba3efd5f42'
ARTIFACT_HASHES = {'model.onnx':'783fea82d71a58179b830a4dbd2d58447e640609e98eedf9ffa12622d375a672','tokenizer.json':'2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8'}
ALIASES = {'nodejs': 'node.js', 'reactjs': 'react', 'javascript': 'javascript', 'js': 'javascript', 'ts': 'typescript'}

class NotReady(Exception):
    pass

def normalize(text):
    return ' '.join(unicodedata.normalize('NFC', text).replace('\x00', '').split())

def skills(values):
    return sorted({ALIASES.get(normalize(s).lower(), normalize(s).lower()) for s in values if normalize(s)})

def content(doc):
    return normalize(doc.text + '\n' + ' '.join(skills(doc.skills)))

def available_mib():
    if os.name == 'nt':
        import ctypes
        class Memory(ctypes.Structure):
            _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong)] + [(n, ctypes.c_ulonglong) for n in ['total', 'available', 'total_page', 'available_page', 'total_virtual', 'available_virtual', 'extended']]
        data = Memory(); data.length = ctypes.sizeof(data)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(data)):
            return data.available / 1048576
    try:
        return int(Path('/proc/meminfo').read_text().split('MemAvailable:')[1].split()[0]) / 1024
    except (OSError, IndexError):
        return None

class LocalEncoder:
    def __init__(self):
        self.session = self.tokenizer = None
        self.manifest = None
        self.lock = threading.Lock()
        self.cache = OrderedDict()
        self.error = 'LOCAL_MODEL_NOT_CONFIGURED'

    def status(self):
        configured = bool(os.environ.get('NLP_MODEL_DIR'))
        reason = 'NOT_LOADED' if configured and self.error=='LOCAL_MODEL_NOT_CONFIGURED' else self.error
        return {'ready': self.session is not None, 'configured': configured, 'model_id': MODEL_ID, 'revision': (self.manifest or {}).get('revision'), 'expected_revision': MODEL_REVISION, 'backend': 'onnx-cpu-int8', 'reason': None if self.session else reason, 'available_memory_mib': available_mib(), 'network_inference': False}

    def load(self):
        if self.session is not None:
            return
        directory = os.environ.get('NLP_MODEL_DIR')
        if not directory:
            raise NotReady(self.error)
        free = available_mib()
        if free is None or free < 1024:
            self.error = 'INSUFFICIENT_MEMORY_REQUIRE_1024_MIB'; raise NotReady(self.error)
        try:
            import onnxruntime as ort
            from tokenizers import Tokenizer
            base = Path(directory).resolve()
            manifest = json.loads((base / 'manifest.json').read_text(encoding='utf8'))
            if manifest['model_id'] != MODEL_ID or manifest['revision'] != MODEL_REVISION:
                raise ValueError('Invalid model provenance')
            if manifest['sha256'] != ARTIFACT_HASHES:
                raise ValueError('Unexpected artifact set')
            for name, digest in manifest['sha256'].items():
                with (base/name).open('rb') as artifact:
                    actual = hashlib.file_digest(artifact, 'sha256').hexdigest()
                if actual != digest:
                    raise ValueError('Artifact hash mismatch')
            tokenizer = Tokenizer.from_file(str(base/'tokenizer.json'))
            # The pinned multilingual tokenizer has its own special-token template
            # and a saved128-token truncation setting. Disable implicit truncation
            # before counting/chunking; derive prefix/suffix from the real template.
            tokenizer.no_truncation()
            tokenizer.no_padding()
            options = ort.SessionOptions(); options.intra_op_num_threads = 2; options.inter_op_num_threads = 1
            options.enable_cpu_mem_arena = False; options.enable_mem_pattern = False
            session = ort.InferenceSession(str(base/'model.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
            self.tokenizer, self.session, self.manifest = tokenizer, session, manifest
            self.error = None
        except Exception:
            self.error = 'LOCAL_MODEL_LOAD_FAILED'; raise NotReady(self.error) from None

    def encode(self, texts):
        if not self.lock.acquire(blocking=False):
            raise NotReady('MODEL_BUSY_RETRY')
        try:
            self.load()
            deadline = time.monotonic()+12
            free = available_mib()
            if free is None or free < 256:
                raise NotReady('INSUFFICIENT_INFERENCE_MEMORY')
            vectors, coverage = [], []
            for text in texts:
                if time.monotonic()>deadline:
                    raise NotReady('INFERENCE_BUDGET_EXCEEDED_REDUCE_CANDIDATES')
                key = hashlib.sha256(text.encode()).hexdigest()
                cached = self.cache.get(key)
                if cached and time.monotonic()-cached[0] < 600:
                    self.cache.move_to_end(key); vectors.append(cached[1]); coverage.append(cached[2]); continue
                encoded = self.tokenizer.encode(text, add_special_tokens=False).ids
                # The model card specifies a 128-token maximum. Bounded chunks make truncation explicit.
                chunks = [encoded[i:i+126] for i in range(0, min(len(encoded), 126*8), 126)] or [[]]
                special = self.tokenizer.encode('', add_special_tokens=True).ids
                if len(special) != 2:
                    raise NotReady('UNEXPECTED_TOKENIZER')
                cls_id, sep_id = special
                pooled = []
                for chunk in chunks:
                    if time.monotonic()>deadline:
                        raise NotReady('INFERENCE_BUDGET_EXCEEDED_REDUCE_CANDIDATES')
                    ids = np.array([[cls_id]+chunk+[sep_id]], dtype=np.int64)
                    mask = np.ones_like(ids)
                    inputs = {'input_ids': ids, 'attention_mask': mask, 'token_type_ids': np.zeros_like(ids)}
                    hidden = self.session.run(None, {i.name: inputs[i.name] for i in self.session.get_inputs()})[0]
                    if hidden.ndim != 3 or hidden.shape[-1] != 384:
                        raise NotReady('UNEXPECTED_MODEL_OUTPUT')
                    pooled.append((hidden * mask[...,None]).sum(1)[0] / mask.sum())
                vector = np.mean(pooled, axis=0); vector = vector / max(float(np.linalg.norm(vector)), 1e-12)
                detail = {'total_tokens': len(encoded), 'used_tokens': min(len(encoded), 1008), 'chunks': len(chunks), 'truncated': len(encoded)>1008}
                self.cache[key] = (time.monotonic(), vector, detail)
                while len(self.cache)>128:
                    self.cache.popitem(last=False)
                vectors.append(vector); coverage.append(detail)
            return np.array(vectors), coverage
        finally:
            self.lock.release()

encoder = LocalEncoder()

def rank(req):
    started = time.perf_counter()
    query = content(req.query)
    if not query or not re.search(r'\w', query):
        raise ValueError('CV/query is empty')
    ids = [d.id for d in req.candidates]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate candidate ids')
    candidates = [d for d in req.candidates if content(d) and re.search(r'\w',content(d))]
    if not candidates:
        return {'engine': req.engine, 'inference_performed': False, 'results': [], 'candidate_count': 0, 'excluded_empty': len(ids), 'model': encoder.status() if req.engine=='sbert' else None, 'confidence': None, 'elapsed_ms': 0}
    texts = [query] + [content(d) for d in candidates]
    coverage = None
    if req.engine == 'sbert':
        embeddings, coverage = encoder.encode(texts)
        similarities = embeddings[1:] @ embeddings[0]
    else:
        try:
            matrix = TfidfVectorizer(ngram_range=(1,2), token_pattern=r'(?u)\b\w+\b', lowercase=True).fit_transform(texts)
            similarities = (matrix[1:] @ matrix[0].T).toarray().ravel()
        except ValueError:
            similarities = np.zeros(len(candidates))
    required = set(skills(req.query.skills))
    results = []
    for i, (doc, raw) in enumerate(zip(candidates, similarities)):
        score = float(np.clip(raw, -1, 1))
        if not math.isfinite(score):
            raise NotReady('NONFINITE_MODEL_OUTPUT')
        candidate_skills = set(skills(doc.skills))
        results.append({'id': doc.id, 'cosine': round(score, 6), 'matched_skills': sorted(required & candidate_skills), 'missing_query_skills': sorted(required-candidate_skills), 'coverage': coverage[i+1] if coverage else None, 'explanation': 'Cosine của embedding cục bộ; kỹ năng giao nhau lấy từ trường khai báo, không phải lý do nhân quả hoặc xác suất trúng tuyển.' if req.engine=='sbert' else 'Cosine TF-IDF trên cùng tập ứng viên; kỹ năng giao nhau đối chiếu trực tiếp.'})
    results.sort(key=lambda x:(-x['cosine'],x['id']))
    return {'engine': req.engine, 'inference_performed': True, 'model': encoder.status() if req.engine=='sbert' else {'name':'TF-IDF word unigram/bigram'}, 'results': results[:req.top_k], 'candidate_count': len(candidates), 'excluded_empty': len(ids)-len(candidates), 'query_coverage': coverage[0] if coverage else None, 'confidence': None, 'score_is_probability': False, 'elapsed_ms': round((time.perf_counter()-started)*1000,2)}
