"""Actual model smoke/performance checks, not relevance benchmark or labeled evaluation."""
import json
import os
import platform
import time
from pathlib import Path
from nlp.engine import encoder, rank, available_mib
from nlp.schemas import RankingRequest

def run():
    started=time.perf_counter();before=available_mib();encoder.load();load_ms=(time.perf_counter()-started)*1000
    texts=['Sinh viên lập trình ứng dụng React và hợp đồng thông minh Solidity.','React developer developing web applications and Solidity smart contracts.','Nhân viên kế toán làm báo cáo tài chính và thuế.']
    start=time.perf_counter();vectors,coverage=encoder.encode(texts);elapsed=(time.perf_counter()-start)*1000
    assert vectors.shape==(3,384)
    out=rank(RankingRequest(query={'id':'q','text':texts[0]},candidates=[{'id':'related','text':texts[1]},{'id':'different','text':texts[2]}],engine='sbert',top_k=2))
    assert out['engine']=='sbert' and out['model']['ready']
    import importlib.metadata as meta
    return {'type':'synthetic inference smoke, not quality metrics','model':encoder.status(),'python':platform.python_version(),'onnxruntime':meta.version('onnxruntime'),'tokenizers':meta.version('tokenizers'),'available_mib_before':before,'available_mib_after':available_mib(),'load_ms':load_ms,'three_sentence_inference_ms':elapsed,'shape':list(vectors.shape),'coverage':coverage,'ranking':out,'quality_metrics':None}

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();result=run()
    with Path(a.output).open('x',encoding='utf8') as f:json.dump(result,f,ensure_ascii=False,indent=2)
