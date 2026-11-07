from fastapi import APIRouter, HTTPException
from .engine import encoder, rank, NotReady
from .schemas import RankingRequest, ReportRequest, EvidenceRequest
from .evidence import analyze_evidence
from .risk import analyze
from .risk_classifier import status as classifier_status

router=APIRouter(prefix='/api/v1/nlp')

@router.get('/status')
def status():
    classifier=classifier_status()
    return {'sbert':encoder.status(),'baseline':'tfidf','risk_classifier':classifier['status'],'classifier':classifier,'quality_metrics':None,'data_leaves_machine':False}

def invoke(fn,req):
    try:return fn(req)
    except NotReady as error:raise HTTPException(status_code=503,detail=str(error)) from None
    except ValueError as error:raise HTTPException(status_code=422,detail=str(error)) from None

@router.post('/rank')
def ranking(req:RankingRequest):return invoke(rank,req)

@router.post('/report')
def report(req:ReportRequest):return invoke(analyze,req)

@router.post('/evidence')
def evidence(req:EvidenceRequest):return invoke(analyze_evidence,req)
