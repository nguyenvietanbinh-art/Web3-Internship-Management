const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

async function matchStudentWithTopic({ studentSkills, studentBio, topicTitle, topicDescription, requiredSkills }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/match`,
      {
        student_skills: studentSkills || [],
        student_bio: studentBio || "",
        topic_title: topicTitle || "",
        topic_description: topicDescription || "",
        required_skills: requiredSkills || [],
      },
      { timeout: 5000 }
    );
    return response.data;
  } catch (err) {
    console.warn("AI Service unavailable, using internal fallback matching:", err.message);
    
    // Fallback heuristic matching
    const sSkills = (studentSkills || []).map((s) => s.toLowerCase().trim());
    const rSkills = (requiredSkills || []).map((s) => s.toLowerCase().trim());
    const matched = rSkills.filter((s) => sSkills.includes(s));
    const missing = rSkills.filter((s) => !sSkills.includes(s));
    const ratio = rSkills.length > 0 ? (matched.length / rSkills.length) * 100 : 70;
    const finalScore = Math.min(Math.max(Math.round(ratio), 20), 95);

    return {
      similarity_score: finalScore,
      semantic_affinity: finalScore,
      skill_match_ratio: Math.round(ratio),
      matched_skills: matched,
      missing_skills: missing,
      recommendation: finalScore >= 75 ? "Rất phù hợp" : finalScore >= 50 ? "Phù hợp" : "Cần bổ sung kỹ năng",
    };
  }
}

async function analyzeKpiReport({ kpiTitle, kpiCriteria, reportContent, expectedKeywords }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/analyze-report`,
      {
        kpi_title: kpiTitle || "",
        kpi_criteria: kpiCriteria || "",
        report_content: reportContent || "",
        expected_keywords: expectedKeywords || [],
      },
      { timeout: 5000 }
    );
    const data = response.data;
    return {
      relevanceScore: data.relevance_score ?? data.relevanceScore ?? 0,
      suggestedScore: data.suggested_score ?? data.suggestedScore ?? 0,
      foundKeywords: data.found_keywords ?? data.foundKeywords ?? [],
      missingKeywords: data.missing_keywords ?? data.missingKeywords ?? [],
      feedbackSummary: data.feedback_summary ?? data.feedbackSummary ?? "",
      engine: data.engine || "nlp-service",
    };
  } catch (err) {
    console.warn("AI Service unavailable, using internal fallback report review:", err.message);
    const content = (reportContent || "").toLowerCase();
    const criteria = `${kpiTitle || ""} ${kpiCriteria || ""}`.toLowerCase();
    const keywords = expectedKeywords || [];
    const found = keywords.filter((keyword) => content.includes(keyword.toLowerCase()));
    const relevance = criteria.trim() ? Math.round((found.length / Math.max(keywords.length, 1)) * 100) : 0;
    return {
      relevanceScore: relevance,
      suggestedScore: relevance,
      foundKeywords: found,
      missingKeywords: keywords.filter((keyword) => !found.includes(keyword)),
      feedbackSummary: "AI service không khả dụng; đây là đối chiếu từ khóa dự phòng, không phải đánh giá ngữ nghĩa.",
      engine: "keyword-fallback",
    };
  }
}

module.exports = {
  matchStudentWithTopic,
  analyzeKpiReport,
};
