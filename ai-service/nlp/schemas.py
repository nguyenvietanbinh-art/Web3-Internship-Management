from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')

class Document(Strict):
    id: str = Field(min_length=1, max_length=100)
    text: str = Field(max_length=50000)
    skills: list[str] = Field(default_factory=list, max_length=100)

    @field_validator('skills')
    @classmethod
    def valid_skills(cls, value):
        if any(not s.strip() or len(s) > 120 for s in value):
            raise ValueError('Invalid skill')
        return value

class RankingRequest(Strict):
    query: Document
    candidates: list[Document] = Field(max_length=50)
    engine: Literal['tfidf', 'sbert'] = 'sbert'
    top_k: int = Field(default=5, ge=1, le=20, strict=True)

class ReportRequest(Strict):
    content: str = Field(min_length=1, max_length=50000)
    criteria: str = Field(max_length=20000)
    engine: Literal['tfidf', 'sbert'] = 'sbert'
    overdue_tasks: int = Field(default=0, ge=0, le=100000, strict=True)
    total_tasks: int = Field(default=0, ge=0, le=100000, strict=True)
    done_tasks: int = Field(default=0, ge=0, le=100000, strict=True)
    open_sessions: int = Field(default=0, ge=0, le=100000, strict=True)
    approved_minutes: int = Field(default=0, ge=0, le=100000000, strict=True)
    report_versions: int = Field(default=0, ge=0, le=100000, strict=True)
