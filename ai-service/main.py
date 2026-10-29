import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI(
    title="Web3 Internship NLP Matching & Analysis Service",
    description="Microservice NLP dùng Sentence-BERT nếu được bật, nếu không sẽ dùng TF-IDF để phân tích mức độ phù hợp và báo cáo KPI.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional Sentence-BERT model loader
import os
bert_model = None
try:
    if os.getenv('AI_ENGINE', 'tfidf').lower() in ['sbert', 'bert', 'sentence-transformers']:
        from sentence_transformers import SentenceTransformer
        print('[AI Service] Loading SentenceTransformer model...')
        bert_model = SentenceTransformer('all-MiniLM-L6-v2')
        print('[AI Service] SentenceTransformer model loaded successfully!')
except Exception as e:
    print(f'[AI Service] Falling back to TF-IDF ({e})')
    bert_model = None

# Input schemas
class MatchRequest(BaseModel):
    student_skills: List[str]
    student_bio: Optional[str] = ""
    topic_title: str
    topic_description: str
    required_skills: List[str]

class BatchMatchRequest(BaseModel):
    student_skills: List[str]
    student_bio: Optional[str] = ""
    topics: List[dict]

class ReportAnalysisRequest(BaseModel):
    kpi_title: str
    kpi_criteria: str
    report_content: str
    expected_keywords: Optional[List[str]] = []

def clean_text(text: str) -> str:
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    return ' '.join(text.split())

def compute_similarity(text1: str, text2: str) -> float:
    if bert_model is not None:
        emb1 = bert_model.encode([text1])
        emb2 = bert_model.encode([text2])
        return float(cosine_similarity(emb1, emb2)[0][0])
    
    # High-accuracy TF-IDF N-Gram fallback
    corpus = [clean_text(text1), clean_text(text2)]
    if not corpus[0] or not corpus[1]:
        return 0.0
    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    try:
        tfidf = vectorizer.fit_transform(corpus)
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(sim)
    except Exception:
        return 0.0

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "engine": "Sentence-BERT" if bert_model is not None else "TF-IDF fallback",
        "bert_active": bert_model is not None
    }

@app.post("/api/match")
def match_student_topic(req: MatchRequest):
    """
    Phân tích độ tương thích giữa hồ sơ sinh viên và yêu cầu đề tài
    """
    student_text = f"{' '.join(req.student_skills)} {req.student_bio}"
    topic_text = f"{req.topic_title} {req.topic_description} {' '.join(req.required_skills)}"
    
    # 1. Semantic Similarity
    semantic_score = compute_similarity(student_text, topic_text)
    
    # 2. Skill Overlap Analysis
    student_skills_lower = {s.lower().strip() for s in req.student_skills}
    required_skills_lower = {s.lower().strip() for s in req.required_skills}
    
    matched_skills = [s for s in req.required_skills if s.lower().strip() in student_skills_lower]
    missing_skills = [s for s in req.required_skills if s.lower().strip() not in student_skills_lower]
    
    skill_ratio = len(matched_skills) / max(len(req.required_skills), 1)
    
    # Composite Score (0 - 100)
    final_score = round((semantic_score * 0.4 + skill_ratio * 0.6) * 100, 1)
    final_score = min(max(final_score, 0.0), 100.0)
    
    recommendation = "Rất phù hợp" if final_score >= 80 else "Phù hợp" if final_score >= 60 else "Cần bổ sung kỹ năng"

    return {
        "similarity_score": final_score,
        "semantic_affinity": round(semantic_score * 100, 1),
        "skill_match_ratio": round(skill_ratio * 100, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendation": recommendation
    }

@app.post("/api/analyze-report")
def analyze_kpi_report(req: ReportAnalysisRequest):
    """
    Phân tích báo cáo nộp bài của sinh viên đối chiếu với tiêu chí KPI
    """
    criteria_text = f"{req.kpi_title} {req.kpi_criteria}"
    report_text = req.report_content
    
    relevance_sim = compute_similarity(criteria_text, report_text)
    
    # Keyword detection
    found_keywords = []
    missing_keywords = []
    report_lower = report_text.lower()
    for kw in (req.expected_keywords or []):
        if kw.lower() in report_lower:
            found_keywords.append(kw)
        else:
            missing_keywords.append(kw)
            
    relevance_score = round(relevance_sim * 100, 1)
    suggested_score = int(min(max(relevance_score * 0.8 + (len(found_keywords) * 5), 50), 98))
    
    return {
        "relevance_score": relevance_score,
        "suggested_score": suggested_score,
        "found_keywords": found_keywords,
        "missing_keywords": missing_keywords,
        "feedback_summary": (
            "Báo cáo bám sát yêu cầu KPI đặt ra."
            if relevance_score >= 65
            else "Báo cáo còn sơ sài hoặc chưa tập trung vào trọng tâm tiêu chí KPI."
        ),
        "engine": "Sentence-BERT" if bert_model is not None else "TF-IDF",
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
