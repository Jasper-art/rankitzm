import { getGradeLabel, getGradeStandard, getOverallPerformance, calculatePercentage } from './grading';
import type { LearnerEntity, SubjectEntity, TestScoreEntity, SchoolSettingsEntity } from '../db';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqKey(): string {
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface LearnerReportData {
  learnerId: number;
  learnerName: string;
  gender: string;
  scores: { subjectName: string; score: number; maxMark: number }[];
  totalScore: number;
  totalMaxMark: number;
  averagePercent: number;
  overallGrade: string;
  overallStandard: string;
  performance: string;
  rank: number;
  totalLearners: number;
}

export interface GeneratedReport {
  learnerId: number;
  learnerName: string;
  comment: string;
  overallGrade: string;
  performance: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface ClassSummary {
  summary: string;
  recommendations: string[];
  topPerformers: string[];
  needsSupport: string[];
}

// ─── DATA PREPARATION ─────────────────────────────────────────────────────────

export function prepareLearnerData(
  learners: LearnerEntity[],
  subjects: SubjectEntity[],
  scores: TestScoreEntity[],
  educationLevel: string,
  ranked: Map<number, number>
): LearnerReportData[] {
  return learners
    .map((learner) => {
      if (!learner.id) return null;

      const learnerScores = subjects.map((subject) => {
        const scoreEntry = scores.find(
          (s) => s.learnerId === learner.id && s.subjectId === subject.id
        );
        return {
          subjectName: subject.subjectName,
          score: scoreEntry?.score ?? 0,
          maxMark: subject.maxMark ?? 100,
        };
      });

      const totalScore = learnerScores.reduce((sum, s) => sum + s.score, 0);
      const totalMaxMark = learnerScores.reduce((sum, s) => sum + s.maxMark, 0);
      const averagePercent = totalMaxMark > 0 ? (totalScore / totalMaxMark) * 100 : 0;

      const scoreValues = learnerScores.map((s) => s.score);
      const maxValues = learnerScores.map((s) => s.maxMark);

      return {
        learnerId: learner.id,
        learnerName: learner.name,
        gender: learner.gender,
        scores: learnerScores,
        totalScore,
        totalMaxMark,
        averagePercent: Math.round(averagePercent * 10) / 10,
        overallGrade: getGradeLabel(totalScore, totalMaxMark, educationLevel),
        overallStandard: getGradeStandard(totalScore, totalMaxMark, educationLevel),
        performance: getOverallPerformance(scoreValues, maxValues, educationLevel),
        rank: ranked.get(learner.id) ?? 0,
        totalLearners: learners.length,
      };
    })
    .filter(Boolean) as LearnerReportData[];
}

// ─── SINGLE LEARNER REPORT ────────────────────────────────────────────────────

export async function generateLearnerReport(
  learner: LearnerReportData,
  className: string,
  term: string,
  year: number,
  educationLevel: string
): Promise<GeneratedReport> {
  const pronoun = learner.gender === 'F' ? 'She' : 'He';
  const possessive = learner.gender === 'F' ? 'Her' : 'His';

  const subjectBreakdown = learner.scores
    .map((s) => {
      const pct = Math.round(calculatePercentage(s.score, s.maxMark));
      const grade = getGradeLabel(s.score, s.maxMark, educationLevel);
      return `${s.subjectName}: ${s.score}/${s.maxMark} (${pct}%, Grade ${grade})`;
    })
    .join('\n');

  const prompt = `You are a professional Zambian school teacher writing end-of-term report comments.

Write a professional, encouraging, and honest report card comment for this learner.

LEARNER: ${learner.learnerName}
CLASS: ${className}
TERM: ${term} ${year}
EDUCATION LEVEL: ${educationLevel}
OVERALL GRADE: Grade ${learner.overallGrade} (${learner.overallStandard})
AVERAGE: ${learner.averagePercent}%
CLASS POSITION: ${learner.rank} out of ${learner.totalLearners}

SUBJECT RESULTS:
${subjectBreakdown}

INSTRUCTIONS:
- Write 3-4 sentences as a professional teacher's comment
- Use "${pronoun}" and "${possessive}" pronouns
- Mention 1-2 strongest subjects by name
- Mention 1 subject that needs improvement
- Be encouraging but honest
- Match tone to performance: excellent (75%+), good (60-74%), needs improvement (below 50%)
- Do NOT use generic phrases like "hard worker" without evidence
- Use formal Zambian school English
- Do NOT include the learner's name in the comment (it will be shown separately)
- Return ONLY the comment text, no labels or formatting

Also provide:
STRENGTHS: (comma-separated list of 2-3 strong subjects)
IMPROVEMENT: (comma-separated list of 1-2 subjects needing work)`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGroqKey()}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';

  // Parse structured response
  const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const strengthsLine = lines.find((l: string) => l.startsWith('STRENGTHS:'));
  const improvementLine = lines.find((l: string) => l.startsWith('IMPROVEMENT:'));
  const commentLines = lines.filter(
    (l: string) => !l.startsWith('STRENGTHS:') && !l.startsWith('IMPROVEMENT:')
  );

  const comment = commentLines.join(' ').trim();
  const strengths = strengthsLine
    ? strengthsLine.replace('STRENGTHS:', '').split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const areasForImprovement = improvementLine
    ? improvementLine.replace('IMPROVEMENT:', '').split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    learnerId: learner.learnerId,
    learnerName: learner.learnerName,
    comment: comment || `${pronoun} has completed the term with an overall grade of ${learner.overallGrade}.`,
    overallGrade: learner.overallGrade,
    performance: learner.performance,
    strengths,
    areasForImprovement,
  };
}

// ─── BATCH REPORT GENERATION ─────────────────────────────────────────────────

export async function generateBatchReports(
  learners: LearnerReportData[],
  className: string,
  term: string,
  year: number,
  educationLevel: string,
  onProgress?: (done: number, total: number, currentName: string) => void
): Promise<GeneratedReport[]> {
  const results: GeneratedReport[] = [];
  const DELAY_MS = 300; // Avoid Groq rate limits

  for (let i = 0; i < learners.length; i++) {
    const learner = learners[i];
    onProgress?.(i, learners.length, learner.learnerName);

    try {
      const report = await generateLearnerReport(learner, className, term, year, educationLevel);
      results.push(report);
    } catch (err) {
      console.error(`Failed to generate report for ${learner.learnerName}:`, err);
      // Fallback comment
      results.push({
        learnerId: learner.learnerId,
        learnerName: learner.learnerName,
        comment: `${learner.gender === 'F' ? 'She' : 'He'} achieved Grade ${learner.overallGrade} this term with an average of ${learner.averagePercent}%.`,
        overallGrade: learner.overallGrade,
        performance: learner.performance,
        strengths: [],
        areasForImprovement: [],
      });
    }

    // Small delay between requests
    if (i < learners.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  onProgress?.(learners.length, learners.length, 'Done');
  return results;
}

// ─── CLASS SUMMARY ────────────────────────────────────────────────────────────

export async function generateClassSummary(
  learners: LearnerReportData[],
  className: string,
  term: string,
  year: number,
  educationLevel: string
): Promise<ClassSummary> {
  const avgPercent = learners.reduce((sum, l) => sum + l.averagePercent, 0) / learners.length;
  const passCount = learners.filter((l) => l.averagePercent >= (educationLevel === 'primary' ? 40 : 40)).length;
  const passRate = Math.round((passCount / learners.length) * 100);
  const top3 = learners.slice(0, 3).map((l) => l.learnerName);
  const bottom3 = learners.slice(-3).map((l) => l.learnerName);

  const prompt = `You are a headteacher writing an end-of-term class performance summary for a Zambian school.

CLASS: ${className}
TERM: ${term} ${year}
EDUCATION LEVEL: ${educationLevel}
TOTAL LEARNERS: ${learners.length}
CLASS AVERAGE: ${Math.round(avgPercent * 10) / 10}%
PASS RATE: ${passRate}%
TOP PERFORMERS: ${top3.join(', ')}
NEEDS SUPPORT: ${bottom3.join(', ')}

Write a 3-4 sentence professional class summary for school records.
Then provide 2-3 specific recommendations for the next term.

Format:
SUMMARY: (3-4 sentences)
RECOMMENDATIONS: (bullet points starting with -)`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGroqKey()}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.6,
    }),
  });

  if (!response.ok) throw new Error('Failed to generate class summary');

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';

  const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
  const recMatch = raw.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/i);

  const summary = summaryMatch?.[1]?.trim() || `Class ${className} completed ${term} ${year} with a ${passRate}% pass rate.`;
  const recommendations = recMatch?.[1]
    ?.split('\n')
    .map((l: string) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean) ?? [];

  return {
    summary,
    recommendations,
    topPerformers: top3,
    needsSupport: bottom3,
  };
}