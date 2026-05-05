import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  db,
  LearnerEntity,
  ClassEntity,
  SubjectEntity,
  TestScoreEntity,
} from "../db";
import { LIGHT, DARK, Theme } from "../styles/rankitz-colors";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type Trend = "improving" | "stable" | "declining" | "insufficient";

interface LearnerInsight {
  learnerId: number;
  name: string;
  trend: Trend;
  latestAvg: number;
  prevAvg: number;
  change: number;
  termHistory: { term: string; year: number; avg: number }[];
  weakSubjects: string[];
  strongSubjects: string[];
  aiInsight: string;
  aiLoading: boolean;
  aiError: string;
}

function TrendBadge({
  trend,
  change,
  t,
}: {
  trend: Trend;
  change: number;
  t: any;
}) {
  const config = {
    improving: {
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#10B981",
      label: "Improving",
      icon: "↑",
    },
    stable: {
      bg: "#EFF6FF",
      text: "#1E40AF",
      border: "#3B82F6",
      label: "Stable",
      icon: "→",
    },
    declining: {
      bg: "#FEF2F2",
      text: "#991B1B",
      border: "#EF4444",
      label: "Declining",
      icon: "↓",
    },
    insufficient: {
      bg: "#F9FAFB",
      text: "#6B7280",
      border: "#D1D5DB",
      label: "New",
      icon: "•",
    },
  };
  const c = config[trend];
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 13 }}>{c.icon}</span>
      {c.label}
      {trend !== "insufficient" && change !== 0 && (
        <span style={{ opacity: 0.8 }}>
          {change > 0 ? `+${change}` : change}%
        </span>
      )}
    </span>
  );
}

export default function StudentInsightsScreen() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("rankitz-theme") === "dark",
  );
  const t: Theme = dark ? DARK : LIGHT;

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [insights, setInsights] = useState<LearnerInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLearner, setExpandedLearner] = useState<number | null>(null);
  const [filterTrend, setFilterTrend] = useState<Trend | "all">("all");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    db.getAllClasses().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClass) loadInsights(selectedClass);
  }, [selectedClass]);

  const loadInsights = async (classId: number) => {
    setLoading(true);
    setInsights([]);
    setExpandedLearner(null);

    const [allLearners, allSubjects, allScores] = await Promise.all([
      db.getAllLearners(),
      db.getAllSubjects(),
      db.getAllScores(),
    ]);

    const classLearners = allLearners.filter((l) => l.classId === classId);
    const classSubjects = allSubjects.filter((s) => s.classId === classId);

    const built: LearnerInsight[] = classLearners.map((learner) => {
      const lScores = allScores.filter((s) => s.learnerId === learner.id);

      // Group by term+year
      const termMap: Record<string, number[]> = {};
      lScores.forEach((s) => {
        const key = `${s.term}_${s.year}`;
        if (!termMap[key]) termMap[key] = [];
        termMap[key].push(s.score);
      });

      const termHistory = Object.entries(termMap)
        .map(([key, scores]) => {
          const [term, year] = key.split("_");
          const avg = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length,
          );
          return { term, year: parseInt(year), avg };
        })
        .sort((a, b) => a.year - b.year || a.term.localeCompare(b.term));

      const latestAvg = termHistory[termHistory.length - 1]?.avg ?? 0;
      const prevAvg = termHistory[termHistory.length - 2]?.avg ?? 0;
      const change = termHistory.length >= 2 ? latestAvg - prevAvg : 0;

      let trend: Trend = "insufficient";
      if (termHistory.length >= 2) {
        if (change >= 5) trend = "improving";
        else if (change <= -5) trend = "declining";
        else trend = "stable";
      }

      // Per subject averages
      const subjectAvgs = classSubjects
        .map((sub) => {
          const subScores = lScores.filter((s) => s.subjectId === sub.id);
          const avg = subScores.length
            ? Math.round(
                subScores.reduce((a, b) => a + b.score, 0) / subScores.length,
              )
            : 0;
          return { name: sub.subjectName, avg };
        })
        .filter((s) => s.avg > 0)
        .sort((a, b) => b.avg - a.avg);

      const strongSubjects = subjectAvgs.slice(0, 2).map((s) => s.name);
      const weakSubjects = subjectAvgs
        .slice(-2)
        .reverse()
        .map((s) => s.name);

      return {
        learnerId: learner.id!,
        name: learner.name,
        trend,
        latestAvg,
        prevAvg,
        change,
        termHistory,
        strongSubjects,
        weakSubjects,
        aiInsight: "",
        aiLoading: false,
        aiError: "",
      };
    });

    setInsights(built);
    setLoading(false);
  };

  const generateInsight = async (learnerId: number) => {
    const insight = insights.find((i) => i.learnerId === learnerId);
    if (!insight || insight.aiInsight || insight.aiLoading) return;

    setInsights((prev) =>
      prev.map((i) =>
        i.learnerId === learnerId ? { ...i, aiLoading: true, aiError: "" } : i,
      ),
    );

    const prompt = `You are an expert Zambian school teacher advisor.

Analyze this student's academic data and give 2-3 sentences of actionable insight:

Student: ${insight.name}
Trend: ${insight.trend}
Latest average: ${insight.latestAvg}%
Previous average: ${insight.prevAvg}%
Change: ${insight.change > 0 ? "+" : ""}${insight.change}%
Term history: ${insight.termHistory.map((t) => `${t.term} ${t.year}: ${t.avg}%`).join(", ")}
Strong subjects: ${insight.strongSubjects.join(", ") || "N/A"}
Weak subjects: ${insight.weakSubjects.join(", ") || "N/A"}

Give ONE specific action the teacher should take next term. Be direct and practical. No fluff.`;

    try {
      const res = await fetch(GROQ_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.6,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      setInsights((prev) =>
        prev.map((i) =>
          i.learnerId === learnerId
            ? { ...i, aiInsight: text, aiLoading: false }
            : i,
        ),
      );
    } catch {
      setInsights((prev) =>
        prev.map((i) =>
          i.learnerId === learnerId
            ? { ...i, aiError: "Failed to generate insight", aiLoading: false }
            : i,
        ),
      );
    }
  };

  const handleExpand = (learnerId: number) => {
    const isExpanding = expandedLearner !== learnerId;
    setExpandedLearner(isExpanding ? learnerId : null);
    if (isExpanding) generateInsight(learnerId);
  };

  const filtered =
    filterTrend === "all"
      ? insights
      : insights.filter((i) => i.trend === filterTrend);
  const counts = {
    improving: insights.filter((i) => i.trend === "improving").length,
    declining: insights.filter((i) => i.trend === "declining").length,
    stable: insights.filter((i) => i.trend === "stable").length,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: t.bg,
        color: t.text,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "0 14px" : "0 24px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/reports")}
            style={{
              background: "none",
              border: "none",
              color: t.textMuted,
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
              Student Insights
            </div>
            <div style={{ fontSize: 12, color: t.textMuted }}>
              AI-powered trend detection
            </div>
          </div>
        </div>
        <button
          onClick={() => setDark((v) => !v)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            background: t.surfaceAlt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: t.textSub,
          }}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      <main style={{ flex: 1, padding: isMobile ? 14 : 24, overflowY: "auto" }}>
        {/* Class Selector */}
        <div style={{ marginBottom: 20 }}>
          <select
            value={selectedClass || ""}
            onChange={(e) =>
              setSelectedClass(e.target.value ? parseInt(e.target.value) : null)
            }
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              fontSize: 13,
              outline: "none",
              width: isMobile ? "100%" : 280,
            }}
          >
            <option value="">Select a class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        {insights.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Improving",
                count: counts.improving,
                color: "#10B981",
                bg: "#ECFDF5",
                icon: "📈",
              },
              {
                label: "Stable",
                count: counts.stable,
                color: "#3B82F6",
                bg: "#EFF6FF",
                icon: "➡️",
              },
              {
                label: "Declining",
                count: counts.declining,
                color: "#EF4444",
                bg: "#FEF2F2",
                icon: "📉",
              },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() =>
                  setFilterTrend(
                    filterTrend === (s.label.toLowerCase() as Trend)
                      ? "all"
                      : (s.label.toLowerCase() as Trend),
                  )
                }
                style={{
                  background:
                    filterTrend === s.label.toLowerCase() ? s.bg : t.surface,
                  border: `1.5px solid ${filterTrend === s.label.toLowerCase() ? s.color : t.border}`,
                  borderRadius: 12,
                  padding: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>
                  {s.count}
                </div>
                <div
                  style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}
                >
                  {s.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: t.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Analyzing learner data...
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !selectedClass && (
          <div style={{ textAlign: "center", padding: 60, color: t.textMuted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: t.text,
                marginBottom: 6,
              }}
            >
              Select a class to begin
            </div>
            <div style={{ fontSize: 13 }}>
              AI will analyze every learner's trend and flag who needs attention
            </div>
          </div>
        )}

        {/* Learner Cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((insight) => {
              const isExpanded = expandedLearner === insight.learnerId;
              return (
                <div
                  key={insight.learnerId}
                  style={{
                    background: t.surface,
                    border: `1.5px solid ${isExpanded ? t.accent : t.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Row */}
                  <button
                    onClick={() => handleExpand(insight.learnerId)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background:
                            insight.trend === "improving"
                              ? "#ECFDF5"
                              : insight.trend === "declining"
                                ? "#FEF2F2"
                                : t.surfaceAlt,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {insight.trend === "improving"
                          ? "📈"
                          : insight.trend === "declining"
                            ? "📉"
                            : insight.trend === "stable"
                              ? "➡️"
                              : "🆕"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: t.text,
                          }}
                        >
                          {insight.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: t.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {insight.termHistory.length > 0
                            ? `Latest: ${insight.latestAvg}%`
                            : "No scores yet"}
                          {insight.termHistory.length >= 2 &&
                            ` • ${insight.change > 0 ? "+" : ""}${insight.change}% from last term`}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <TrendBadge
                        trend={insight.trend}
                        change={insight.change}
                        t={t}
                      />
                      <span style={{ color: t.textMuted, fontSize: 14 }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 16px 16px",
                        borderTop: `1px solid ${t.border}`,
                      }}
                    >
                      {/* Term History */}
                      {insight.termHistory.length > 0 && (
                        <div style={{ marginTop: 14, marginBottom: 14 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: t.textMuted,
                              textTransform: "uppercase",
                              marginBottom: 8,
                            }}
                          >
                            Term History
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {insight.termHistory.map((h, i) => (
                              <div
                                key={i}
                                style={{
                                  background: t.surfaceAlt,
                                  borderRadius: 8,
                                  padding: "6px 12px",
                                  textAlign: "center",
                                  border: `1px solid ${t.border}`,
                                }}
                              >
                                <div
                                  style={{ fontSize: 10, color: t.textMuted }}
                                >
                                  {h.term} {h.year}
                                </div>
                                <div
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: h.avg >= 50 ? t.accent : "#EF4444",
                                  }}
                                >
                                  {h.avg}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subjects */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                          marginBottom: 14,
                        }}
                      >
                        <div
                          style={{
                            background: "#ECFDF5",
                            borderRadius: 8,
                            padding: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#065F46",
                              textTransform: "uppercase",
                              marginBottom: 6,
                            }}
                          >
                            Strong
                          </div>
                          {insight.strongSubjects.length > 0 ? (
                            insight.strongSubjects.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: 12,
                                  color: "#065F46",
                                  fontWeight: 600,
                                }}
                              >
                                ✓ {s}
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: 12, color: "#065F46" }}>
                              —
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            background: "#FEF2F2",
                            borderRadius: 8,
                            padding: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#991B1B",
                              textTransform: "uppercase",
                              marginBottom: 6,
                            }}
                          >
                            Needs Work
                          </div>
                          {insight.weakSubjects.length > 0 ? (
                            insight.weakSubjects.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: 12,
                                  color: "#991B1B",
                                  fontWeight: 600,
                                }}
                              >
                                ⚠ {s}
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: 12, color: "#991B1B" }}>
                              —
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Insight */}
                      <div
                        style={{
                          background: t.surfaceAlt,
                          borderRadius: 10,
                          padding: 12,
                          borderLeft: `3px solid ${t.accent}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: t.accent,
                            marginBottom: 6,
                          }}
                        >
                          🤖 AI Recommendation
                        </div>
                        {insight.aiLoading && (
                          <div style={{ fontSize: 12, color: t.textMuted }}>
                            Analyzing...
                          </div>
                        )}
                        {insight.aiError && (
                          <div style={{ fontSize: 12, color: "#EF4444" }}>
                            {insight.aiError}
                          </div>
                        )}
                        {insight.aiInsight && (
                          <div
                            style={{
                              fontSize: 13,
                              color: t.text,
                              lineHeight: 1.6,
                            }}
                          >
                            {insight.aiInsight}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  );
}
