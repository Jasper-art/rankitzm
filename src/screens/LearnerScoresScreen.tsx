import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useLearners,
  useTestScores,
  useSubjects,
} from "../hooks/useClassManager";
import { TestScoreEntity } from "@/db";
import { LIGHT, DARK, Theme } from "../styles/rankitz-colors";

export default function LearnerScoresScreen() {
  const navigate = useNavigate();
  const { learnerId } = useParams();
  const { learners } = useLearners();
  const { scores, loading } = useTestScores();
  const { subjects } = useSubjects();

  const [filterTestType, setFilterTestType] = useState<string>("all");
  const [filterTerm, setFilterTerm] = useState<string>("all");
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const t: Theme = dark ? DARK : LIGHT;

  const learner = learners.find((l) => l.id === parseInt(learnerId || "0"));

  const learnerClassSubjects = subjects.filter(
    (s) => s.classId === learner?.classId,
  );
  const learnerClassSubjectIds = new Set(learnerClassSubjects.map((s) => s.id));

  const learnerScores = scores.filter(
    (score: TestScoreEntity) =>
      score.learnerId === parseInt(learnerId || "0") &&
      learnerClassSubjectIds.has(score.subjectId),
  );

  const testTypes = ["all", "weekly", "midterm", "endofterm"];
  const terms = ["all", "Term 1", "Term 2", "Term 3"];

  const filteredScores = learnerScores.filter((score: TestScoreEntity) => {
    const matchesTestType =
      filterTestType === "all" || score.testType === filterTestType;
    const matchesTerm = filterTerm === "all" || score.term === filterTerm;
    return matchesTestType && matchesTerm;
  });

  const getSubjectName = (subjectId: number) => {
    const subject = learnerClassSubjects.find((s) => s.id === subjectId);
    return subject?.subjectName || `Subject ${subjectId}`;
  };

  const getTestTypeLabel = (testType: string) => {
    const labels: { [key: string]: string } = {
      weekly: "Weekly Test",
      midterm: "Mid-Term Exam",
      endofterm: "End of Term",
    };
    return labels[testType] || testType;
  };

  const calculateAverage = () => {
    if (filteredScores.length === 0) return 0;
    const total = filteredScores.reduce((sum, score) => sum + score.score, 0);
    return Math.round(total / filteredScores.length);
  };

  const calculateHighest = () => {
    if (filteredScores.length === 0) return 0;
    return Math.max(...filteredScores.map((s) => s.score));
  };

  const calculatePassRate = () => {
    if (filteredScores.length === 0) return 0;
    const passCount = filteredScores.filter((s) => s.score >= 50).length;
    return Math.round((passCount / filteredScores.length) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return t.accent;
    if (score >= 50) return t.orange;
    return t.red;
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: t.bg,
        fontFamily: "'Inter', sans-serif",
        color: t.text,
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "12px 16px" : "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/learners")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.textMuted,
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width={18}
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              {learner?.name || "Learner Scores"}
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>
              Class Performance Record
            </div>
          </div>
        </div>
        <button
          onClick={() => setDark(!dark)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      <main
        style={{
          flex: 1,
          padding: isMobile ? "20px 16px" : "32px 40px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Statistics Dashboard */}
        {!loading && filteredScores.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <QuickStat
              label="Average Score"
              value={`${calculateAverage()}%`}
              icon="📊"
              color={t.accent}
              t={t}
            />
            <QuickStat
              label="Highest Score"
              value={`${calculateHighest()}%`}
              icon="🏆"
              color={t.orange}
              t={t}
            />
            <QuickStat
              label="Pass Rate"
              value={`${calculatePassRate()}%`}
              icon="🎯"
              color={t.accent}
              t={t}
            />
          </div>
        )}

        {/* Toolbar - Segmented Filters */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: 4,
            }}
          >
            {testTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterTestType(type)}
                style={filterButtonStyle(filterTestType === type, t)}
              >
                {type === "all" ? "All Tests" : getTestTypeLabel(type)}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: 4,
            }}
          >
            {terms.map((term) => (
              <button
                key={term}
                onClick={() => setFilterTerm(term)}
                style={filterButtonStyle(filterTerm === term, t)}
              >
                {term === "all" ? "All Terms" : term}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: `3px solid ${t.border}`,
                borderTopColor: t.accent,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: t.textMuted, fontWeight: 600 }}>
              Loading performance data...
            </p>
          </div>
        ) : filteredScores.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredScores.map((score, idx) => (
              <ScoreListItem
                key={idx}
                score={score}
                subjectName={getSubjectName(score.subjectId)}
                t={t}
                color={getScoreColor(score.score)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: t.surface,
              borderRadius: 16,
              border: `1px dashed ${t.border}`,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>No Results</h3>
            <p style={{ color: t.textMuted }}>
              Adjust your filters to see more scores.
            </p>
          </div>
        )}

        {/* Action Bar */}
        {!loading && filteredScores.length > 0 && (
          <div
            style={{ marginTop: 32, display: "flex", justifyContent: "center" }}
          >
            <button
              onClick={() => navigate(`/learners/${learnerId}/statement`)}
              style={{
                background: t.accent,
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 4px 12px ${t.shadowMd}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Generate Statement
            </button>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

function QuickStat({ label, value, icon, color, t }: any) {
  return (
    <div
      style={{
        background: t.surface,
        padding: "20px",
        borderRadius: 16,
        border: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: `0 2px 6px ${t.shadow}`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${color}15`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: t.text,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 12,
            color: t.textMuted,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {label.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function ScoreListItem({ score, subjectName, t, color }: any) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${color}15`,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          {score.score}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{subjectName}</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            {score.testType} • {score.term}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
          {score.year}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted }}>Year</div>
      </div>
    </div>
  );
}

const filterButtonStyle = (active: boolean, t: Theme): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  background: active ? t.surface : "transparent",
  color: active ? t.text : t.textMuted,
  boxShadow: active ? `0 1px 3px ${t.shadow}` : "none",
  transition: "all 0.2s",
});
