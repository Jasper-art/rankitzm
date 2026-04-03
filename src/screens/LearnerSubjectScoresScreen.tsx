import React, { useState, useEffect } from "react";

// ============================================================================
// ZAMBIAN EDUCATION SYSTEM GRADING UTILITIES
// ============================================================================
export type EducationLevel = "primary" | "secondary" | string;

export function isPrimaryEducation(level: EducationLevel): boolean {
  return level?.toString().toLowerCase() === "primary";
}

export function isSecondaryEducation(level: EducationLevel): boolean {
  const normalized = level?.toString().toLowerCase();
  return normalized === "secondary" || normalized === "senior";
}

export function calculatePercentage(score: number, outOf: number): number {
  if (outOf <= 0) return 0;
  return (score / outOf) * 100;
}

export function getPassThreshold(level: EducationLevel): number {
  return isPrimaryEducation(level) ? 50 : 40;
}

export function isPassingGrade(
  score: number,
  maxMark: number,
  level: EducationLevel,
): boolean {
  const percent = calculatePercentage(score, maxMark);
  return percent >= getPassThreshold(level);
}

export function getGradeLabel(
  score: number,
  maxMark: number,
  level: EducationLevel = "secondary",
): string {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    if (percentage >= 75) return "One";
    if (percentage >= 70) return "Two";
    if (percentage >= 65) return "Three";
    if (percentage >= 60) return "Four";
    if (percentage >= 55) return "Five";
    if (percentage >= 50) return "Six";
    if (percentage >= 45) return "Seven";
    if (percentage >= 40) return "Eight";
    return "Nine";
  }

  // SECONDARY GRADES (JSSLC)
  if (percentage >= 75) return "1";
  if (percentage >= 60) return "2";
  if (percentage >= 50) return "3";
  if (percentage >= 40) return "4";
  return "5";
}

export function getGradeStandard(
  score: number,
  maxMark: number,
  level: EducationLevel = "secondary",
): string {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    if (percentage >= 75) return "Distinction";
    if (percentage >= 70) return "Distinction";
    if (percentage >= 65) return "Merit";
    if (percentage >= 60) return "Merit";
    if (percentage >= 55) return "Credit";
    if (percentage >= 50) return "Credit";
    if (percentage >= 45) return "Satisfactory";
    if (percentage >= 40) return "Satisfactory";
    return "Unsatisfactory";
  }

  // SECONDARY STANDARDS
  if (percentage >= 75) return "Distinction";
  if (percentage >= 60) return "Merit";
  if (percentage >= 50) return "Credit";
  if (percentage >= 40) return "Satisfactory"; // Note: Adjusted to 'Satisfactory' or 'Credit/Pass' based on your specs
  return "Fail";
}

// Adapted to use our Theme objects for dark mode support
export function getThemeGradeColor(
  score: number,
  maxMark: number,
  level: EducationLevel = "secondary",
  theme: Theme,
) {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    if (percentage >= 70)
      return {
        bg: theme.accentBg,
        text: theme.accentDark,
        border: theme.accent,
      }; // Distinction
    if (percentage >= 60)
      return { bg: theme.blueBg, text: theme.blueText, border: theme.blue }; // Merit
    if (percentage >= 50)
      return {
        bg: theme.orangeBg,
        text: theme.orangeText,
        border: theme.orange,
      }; // Credit
    if (percentage >= 40)
      return { bg: theme.amberBg, text: theme.amberText, border: theme.amber }; // Satisfactory
    return { bg: theme.redBg, text: theme.redText, border: theme.red }; // Unsatisfactory
  }

  // SECONDARY COLORS
  if (percentage >= 75)
    return { bg: theme.accentBg, text: theme.accentDark, border: theme.accent }; // Distinction
  if (percentage >= 60)
    return { bg: theme.blueBg, text: theme.blueText, border: theme.blue }; // Merit
  if (percentage >= 50)
    return { bg: theme.orangeBg, text: theme.orangeText, border: theme.orange }; // Credit
  if (percentage >= 40)
    return { bg: theme.amberBg, text: theme.amberText, border: theme.amber }; // Satisfactory/Pass
  return { bg: theme.redBg, text: theme.redText, border: theme.red }; // Fail
}

// ============================================================================
// MOCK DATA & HOOKS
// ============================================================================
const useNavigate = () => (path: string) => console.log("Navigated to", path);
const useParams = <T extends Record<string, string | undefined>>() =>
  ({ learnerId: "1", subjectId: "101" }) as unknown as T;

export interface LearnerEntity {
  id: number;
  name: string;
  educationLevel: EducationLevel;
}

export interface SubjectEntity {
  id: number;
  subjectName: string;
}

export interface TestScoreEntity {
  id?: number;
  learnerId: number;
  subjectId: number;
  testType: string;
  score: number;
  maxMark: number;
  term: string;
  year: number;
}

const mockScores: TestScoreEntity[] = [
  {
    learnerId: 1,
    subjectId: 101,
    testType: "Mid-Term",
    score: 38,
    maxMark: 100,
    term: "Term 1",
    year: 2024,
  }, // Fail
  {
    learnerId: 1,
    subjectId: 101,
    testType: "End of Term",
    score: 45,
    maxMark: 100,
    term: "Term 1",
    year: 2024,
  }, // Satisfactory (Sec)
  {
    learnerId: 1,
    subjectId: 101,
    testType: "Mid-Term",
    score: 55,
    maxMark: 100,
    term: "Term 2",
    year: 2024,
  }, // Credit
  {
    learnerId: 1,
    subjectId: 101,
    testType: "End of Term",
    score: 68,
    maxMark: 100,
    term: "Term 2",
    year: 2024,
  }, // Merit
  {
    learnerId: 1,
    subjectId: 101,
    testType: "Mid-Term",
    score: 82,
    maxMark: 100,
    term: "Term 3",
    year: 2024,
  }, // Distinction
  {
    learnerId: 1,
    subjectId: 101,
    testType: "Final Exam",
    score: 88,
    maxMark: 100,
    term: "Term 3",
    year: 2024,
  }, // Distinction
];

const db = {
  getLearner: async (id: number): Promise<LearnerEntity | null> => {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({ id: 1, name: "Alice Mwila", educationLevel: "secondary" }),
        800,
      ),
    );
  },
  getSubject: async (id: number): Promise<SubjectEntity | null> => {
    return new Promise((resolve) =>
      resolve({ id: 101, subjectName: "Mathematics" }),
    );
  },
  getScoresByLearner: async (id: number): Promise<TestScoreEntity[]> => {
    return new Promise((resolve) => resolve(mockScores));
  },
};

// --- Updated Professional Theme Palette ---
const LIGHT = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F4F6",
  border: "#E5E7EB",
  borderSub: "#F3F4F6",
  text: "#111827",
  textSub: "#4B5563",
  textMuted: "#6B7280",

  accent: "#0F766E", // Teal (Distinction)
  accentBg: "#F0FDFA",
  accentText: "#0F766E",
  accentDark: "#115E59",

  blue: "#3B82F6", // Blue (Merit)
  blueBg: "#DBEAFE",
  blueText: "#1D4ED8",

  orange: "#D97706", // Orange (Credit)
  orangeBg: "#FEF3C7",
  orangeText: "#B45309",

  amber: "#F59E0B", // Amber (Satisfactory)
  amberBg: "#FEF3C7", // Reusing orange bg for amber
  amberText: "#B45309",

  red: "#DC2626", // Red (Fail)
  redBg: "#FEF2F2",
  redText: "#991B1B",

  shadow: "rgba(0, 0, 0, 0.05)",
  shadowMd: "rgba(0, 0, 0, 0.08)",
  shadowLg: "rgba(0, 0, 0, 0.12)",
};

const DARK = {
  bg: "#0B0F19",
  surface: "#111827",
  surfaceAlt: "#1F2937",
  border: "#374151",
  borderSub: "#1F2937",
  text: "#F9FAFB",
  textSub: "#D1D5DB",
  textMuted: "#9CA3AF",

  accent: "#14B8A6",
  accentBg: "rgba(20, 184, 166, 0.1)",
  accentText: "#5EEAD4",
  accentDark: "#2DD4BF",

  blue: "#60A5FA",
  blueBg: "rgba(59, 130, 246, 0.1)",
  blueText: "#93C5FD",

  orange: "#F59E0B",
  orangeBg: "rgba(245, 158, 11, 0.1)",
  orangeText: "#FCD34D",

  amber: "#FBBF24",
  amberBg: "rgba(245, 158, 11, 0.1)",
  amberText: "#FDE68A",

  red: "#EF4444",
  redBg: "rgba(239, 68, 68, 0.1)",
  redText: "#FCA5A5",

  shadow: "rgba(0, 0, 0, 0.3)",
  shadowMd: "rgba(0, 0, 0, 0.4)",
  shadowLg: "rgba(0, 0, 0, 0.5)",
};

type Theme = typeof LIGHT;
// ============================================================================

interface ScoreDetail {
  testType: string;
  score: number;
  maxMark: number;
  term: string;
  year: number;
  gradeLabel: string;
  gradeStandard: string;
  status: "Pass" | "Fail";
}

export default function App() {
  const navigate = useNavigate();
  const { learnerId, subjectId } = useParams<{
    learnerId: string;
    subjectId: string;
  }>();

  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [learner, setLearner] = useState<LearnerEntity | null>(null);
  const [subject, setSubject] = useState<SubjectEntity | null>(null);
  const [scores, setScores] = useState<ScoreDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const theme: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, [learnerId, subjectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const lId = learnerId ? parseInt(learnerId, 10) : null;
      const sId = subjectId ? parseInt(subjectId, 10) : null;

      if (!lId || !sId || isNaN(lId) || isNaN(sId)) {
        setLoading(false);
        return;
      }

      const [learnerData, subjectData, scoresData] = await Promise.all([
        db.getLearner(lId),
        db.getSubject(sId),
        db.getScoresByLearner(lId),
      ]);

      setLearner(learnerData ?? null);
      setSubject(subjectData ?? null);

      const level = learnerData?.educationLevel || "secondary";

      const filteredScores = scoresData
        .filter((s) => s.subjectId === sId)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.term.localeCompare(b.term);
        })
        .map((s) => ({
          testType: s.testType,
          score: s.score,
          maxMark: s.maxMark || 100,
          term: s.term,
          year: s.year,
          gradeLabel: getGradeLabel(s.score, s.maxMark || 100, level),
          gradeStandard: getGradeStandard(s.score, s.maxMark || 100, level),
          status: isPassingGrade(s.score, s.maxMark || 100, level)
            ? ("Pass" as const)
            : ("Fail" as const),
        }));

      setScores(filteredScores);
    } catch (error) {
      console.error("Error loading learner subject scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (scores.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        passCount: 0,
        totalCount: 0,
        trend: 0,
      };
    }

    const scoresArray = scores.map((s) =>
      calculatePercentage(s.score, s.maxMark),
    );
    const average =
      Math.round(
        (scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) * 10,
      ) / 10;
    const highest = Math.max(...scoresArray);
    const lowest = Math.min(...scoresArray);
    const passCount = scores.filter((s) => s.status === "Pass").length;
    const totalCount = scores.length;

    let trend = 0;
    if (scores.length >= 3) {
      const firstThreeAvg =
        scoresArray.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const lastThreeAvg = scoresArray.slice(-3).reduce((a, b) => a + b, 0) / 3;
      trend = Math.round((lastThreeAvg - firstThreeAvg) * 10) / 10;
    }

    return { average, highest, lowest, passCount, totalCount, trend };
  };

  const stats = calculateStats();
  const passThreshold = learner ? getPassThreshold(learner.educationLevel) : 40;

  const icons = {
    back: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={20}
        height={20}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    ),
    print: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={18}
        height={18}
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    sun: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
        <circle cx="12" cy="12" r="5" />
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="3"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="12"
          y1="21"
          x2="12"
          y2="23"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="4.22"
          y1="4.22"
          x2="5.64"
          y2="5.64"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="18.36"
          y1="18.36"
          x2="19.78"
          y2="19.78"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="1"
          y1="12"
          x2="3"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="21"
          y1="12"
          x2="23"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="4.22"
          y1="19.78"
          x2="5.64"
          y2="18.36"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="18.36"
          y1="5.64"
          x2="19.78"
          y2="4.22"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    moon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    trendUp: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        width={16}
        height={16}
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 17" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    trendDown: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        width={16}
        height={16}
      >
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
      </svg>
    ),
    user: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={16}
        height={16}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    book: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={16}
        height={16}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        flexDirection: "column",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Refined Minimalist Header */}
      <header
        style={{
          background: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
          padding: isMobile ? "12px 20px" : "16px 32px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => navigate("/learners")}
              style={{
                background: "transparent",
                border: `1px solid ${theme.border}`,
                color: theme.textSub,
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                width: 36,
                height: 36,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceAlt;
                e.currentTarget.style.color = theme.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = theme.textSub;
              }}
              title="Back to Learners"
            >
              {icons.back}
            </button>

            <div>
              <div
                style={{
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: 700,
                  color: theme.text,
                  letterSpacing: "-0.3px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Score History
              </div>

              {/* Breadcrumb-style subtitle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: 13,
                  color: theme.textMuted,
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {icons.user} {learner?.name || "Loading..."}
                </span>
                <span style={{ color: theme.border }}>|</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {icons.book} {subject?.subjectName || "Loading..."}
                  {learner &&
                    ` (${learner.educationLevel.charAt(0).toUpperCase() + learner.educationLevel.slice(1)})`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => window.print()}
              title="Print Record"
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                color: theme.textSub,
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceAlt;
                e.currentTarget.style.color = theme.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.surface;
                e.currentTarget.style.color = theme.textSub;
              }}
            >
              {icons.print}
              {!isMobile && <span>Print</span>}
            </button>

            <button
              onClick={() => {
                const newDark = !dark;
                setDark(newDark);
                localStorage.setItem(
                  "rankitz-theme",
                  newDark ? "dark" : "light",
                );
              }}
              title="Toggle Theme"
              style={{
                width: 36,
                height: 36,
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: theme.textSub,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceAlt;
                e.currentTarget.style.color = theme.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.surface;
                e.currentTarget.style.color = theme.textSub;
              }}
            >
              {dark ? icons.sun : icons.moon}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "24px 16px" : "32px 40px",
          overflowY: "auto",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 20px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `3px solid ${theme.border}`,
                  borderTopColor: theme.accent,
                  animation: "spin 0.8s linear infinite",
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  color: theme.textMuted,
                  fontWeight: 500,
                }}
              >
                Retrieving academic records…
              </div>
            </div>
          ) : !learner || !subject ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>
                📂
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: theme.text,
                  marginBottom: 8,
                }}
              >
                Record Not Found
              </div>
              <div style={{ fontSize: 14, color: theme.textMuted }}>
                Unable to locate the specified score information.
              </div>
            </div>
          ) : (
            <>
              {/* Section Header */}
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: theme.text,
                    margin: 0,
                    letterSpacing: "-0.2px",
                  }}
                >
                  Performance Overview
                </h2>
              </div>

              {/* Professional Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                <StatCard
                  title="Average (%)"
                  value={stats.average}
                  color={theme.text}
                  theme={theme}
                />
                <StatCard
                  title="Highest (%)"
                  value={stats.highest}
                  color={theme.text}
                  theme={theme}
                />
                <StatCard
                  title="Lowest (%)"
                  value={stats.lowest}
                  color={stats.lowest >= passThreshold ? theme.text : theme.red}
                  theme={theme}
                />
                <StatCard
                  title={`Pass Rate (>${passThreshold}%)`}
                  value={`${stats.totalCount > 0 ? Math.round((stats.passCount / stats.totalCount) * 100) : 0}%`}
                  color={
                    stats.passCount >= stats.totalCount / 2
                      ? theme.text
                      : theme.orange
                  }
                  theme={theme}
                />

                {/* Refined Trend Card */}
                <div
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    padding: "20px",
                    gridColumn: isMobile ? "1 / -1" : "auto",
                    boxShadow: theme.shadow,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 4,
                      height: "100%",
                      background:
                        stats.trend > 0
                          ? theme.accent
                          : stats.trend < 0
                            ? theme.red
                            : theme.border,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      marginBottom: 8,
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    SCORE TREND
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color:
                        stats.trend > 0
                          ? theme.accent
                          : stats.trend < 0
                            ? theme.red
                            : theme.textMuted,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {stats.trend > 0
                      ? icons.trendUp
                      : stats.trend < 0
                        ? icons.trendDown
                        : "—"}
                    <span>
                      {stats.trend > 0 ? "+" : ""}
                      {stats.trend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Section Header */}
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: theme.text,
                    margin: 0,
                    letterSpacing: "-0.2px",
                  }}
                >
                  Detailed Scores
                </h2>
                <span
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {scores.length} Records found
                </span>
              </div>

              {/* Professional Table */}
              {scores.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    background: theme.surface,
                    borderRadius: "10px",
                    border: `1px dashed ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: theme.textSub,
                      marginBottom: 4,
                    }}
                  >
                    No assessments recorded
                  </div>
                  <div style={{ fontSize: 13, color: theme.textMuted }}>
                    Scores will populate here once entered by a teacher.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: theme.shadow,
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: isMobile ? 600 : undefined,
                      }}
                    >
                      <thead
                        style={{
                          background: theme.surfaceAlt,
                          borderBottom: `1px solid ${theme.border}`,
                        }}
                      >
                        <tr>
                          <th style={{ ...thStyle, color: theme.textSub }}>
                            Assessment Type
                          </th>
                          <th style={{ ...thStyle, color: theme.textSub }}>
                            Academic Term
                          </th>
                          <th
                            style={{
                              ...thStyle,
                              color: theme.textSub,
                              textAlign: "center",
                            }}
                          >
                            Score
                          </th>
                          <th
                            style={{
                              ...thStyle,
                              color: theme.textSub,
                              textAlign: "center",
                            }}
                          >
                            Zambian Grade
                          </th>
                          <th
                            style={{
                              ...thStyle,
                              color: theme.textSub,
                              textAlign: "right",
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, idx) => {
                          const scoreColor = getThemeGradeColor(
                            score.score,
                            score.maxMark,
                            learner.educationLevel,
                            theme,
                          );
                          return (
                            <tr
                              key={idx}
                              style={{
                                borderBottom:
                                  idx === scores.length - 1
                                    ? "none"
                                    : `1px solid ${theme.borderSub}`,
                                transition: "background 0.2s ease",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = dark
                                  ? "rgba(255,255,255,0.02)"
                                  : "#F9FAFB")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              {/* Test Type */}
                              <td
                                style={{
                                  ...tdStyle,
                                  color: theme.text,
                                  fontWeight: 600,
                                }}
                              >
                                {score.testType}
                              </td>

                              {/* Term & Year */}
                              <td
                                style={{
                                  ...tdStyle,
                                  color: theme.textSub,
                                  fontWeight: 500,
                                }}
                              >
                                {score.term}{" "}
                                <span style={{ color: theme.textMuted }}>
                                  {score.year}
                                </span>
                              </td>

                              {/* Score */}
                              <td style={{ ...tdStyle, textAlign: "center" }}>
                                <span
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: theme.text,
                                  }}
                                >
                                  {score.score}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: theme.textMuted,
                                    fontWeight: 500,
                                  }}
                                >
                                  /{score.maxMark}
                                </span>
                              </td>

                              {/* Zambian Grade */}
                              <td style={{ ...tdStyle, textAlign: "center" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      padding: "2px 12px",
                                      borderRadius: 6,
                                      background: scoreColor.bg,
                                      color: scoreColor.text,
                                      border: `1px solid ${scoreColor.border}`,
                                      fontSize: 14,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Grade {score.gradeLabel}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: theme.textSub,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {score.gradeStandard}
                                  </div>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td style={{ ...tdStyle, textAlign: "right" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    background:
                                      score.status === "Pass"
                                        ? theme.accentBg
                                        : theme.redBg,
                                    color:
                                      score.status === "Pass"
                                        ? theme.accentText
                                        : theme.redText,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  {score.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Print & Scroll Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media print {
          header { display: none !important; }
          main { padding: 0 !important; background: white !important; }
          body { background: white !important; color: black !important; }
          * { box-shadow: none !important; border-color: #ddd !important; }
          table { width: 100% !important; border: 1px solid #ddd !important; }
          th { background: #f9f9f9 !important; -webkit-print-color-adjust: exact; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.textMuted}; }
      `}</style>
    </div>
  );
}

// Refined Minimalist Stat Card component
function StatCard({
  title,
  value,
  color,
  theme,
}: {
  title: string;
  value: number | string;
  color: string;
  theme: Theme;
}) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: "10px",
        padding: "20px",
        boxShadow: theme.shadow,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadowMd;
        e.currentTarget.style.borderColor = theme.textMuted;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.shadow;
        e.currentTarget.style.borderColor = theme.border;
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: theme.textMuted,
          marginBottom: 8,
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        {title.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: color,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Table Styles
const thStyle: React.CSSProperties = {
  padding: "14px 20px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "16px 20px",
  fontSize: 14,
};
