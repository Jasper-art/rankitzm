import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  db,
  TestScoreEntity,
  LearnerEntity,
  ClassEntity,
  SubjectEntity,
} from "../db";
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from "../styles/rankitz-colors";
import {
  isPassingGrade,
  isPrimaryEducation,
  isSecondaryEducation,
} from "../lib/grading";

interface ConsolidatedData {
  className: string;
  totalLearners: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  subjectPerformance: { name: string; avg: number; passRate: number }[];
}

export default function ConsolidatedCustomReportScreen() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [scores, setScores] = useState<TestScoreEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<ConsolidatedData[]>([]);
  const [showReport, setShowReport] = useState(false);

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, learnersData, scoresData, subjectsData] =
        await Promise.all([
          db.getAllClasses(),
          db.getAllLearners(),
          db.getAllScores(),
          db.getAllSubjects(),
        ]);
      setClasses(classesData);
      setLearners(learnersData);
      setScores(scoresData);
      setSubjects(subjectsData);
      if (classesData.length > 0) {
        setSelectedClasses([classesData[0].id || 0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const consolidated: ConsolidatedData[] = selectedClasses.map((classId) => {
      const classData = classes.find((c) => c.id === classId);
      const classLearners = learners.filter((l) => l.classId === classId);
      let classScores = scores.filter((s) =>
        classLearners.some((l) => l.id === s.learnerId),
      );

      if (selectedTerm) {
        classScores = classScores.filter((s) => s.term === selectedTerm);
      }
      classScores = classScores.filter((s) => s.year === selectedYear);

      if (classScores.length === 0) {
        return {
          className: classData?.className || "Unknown",
          totalLearners: classLearners.length,
          averageScore: 0,
          passRate: 0,
          highestScore: 0,
          lowestScore: 0,
          subjectPerformance: [],
        };
      }

      const scoresArray = classScores.map((s) => s.score);
      const avgScore =
        Math.round(
          (scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) * 10,
        ) / 10;

      // Get education level for proper grading
      const educationLevel = classData?.educationLevel || "primary";
      const passRate = Math.round(
        (classScores.filter((s) => {
          const subject = subjects.find((sb) => sb.id === s.subjectId);
          const maxMark = subject?.maxMark ?? 100;
          return isPassingGrade(s.score, maxMark, educationLevel);
        }).length /
          classScores.length) *
          100,
      );

      // Subject performance
      const subjectStats = new Map<
        number,
        { count: number; sum: number; passes: number }
      >();
      classScores.forEach((s) => {
        if (!subjectStats.has(s.subjectId)) {
          subjectStats.set(s.subjectId, { count: 0, sum: 0, passes: 0 });
        }
        const data = subjectStats.get(s.subjectId)!;
        data.count += 1;
        data.sum += s.score;
        const subject = subjects.find((sb) => sb.id === s.subjectId);
        const maxMark = subject?.maxMark ?? 100;
        if (isPassingGrade(s.score, maxMark, educationLevel)) data.passes += 1;
      });

      const subjectPerformance = Array.from(subjectStats.entries())
        .map(([subjectId, data]) => ({
          name:
            subjects.find((s) => s.id === subjectId)?.subjectName ||
            `Subject ${subjectId}`,
          avg: Math.round((data.sum / data.count) * 10) / 10,
          passRate: Math.round((data.passes / data.count) * 100),
        }))
        .sort((a, b) => b.avg - a.avg);

      return {
        className: classData?.className || "Unknown",
        totalLearners: classLearners.length,
        averageScore: avgScore,
        passRate,
        highestScore: Math.max(...scoresArray),
        lowestScore: Math.min(...scoresArray),
        subjectPerformance,
      };
    });

    setReportData(consolidated);
    setShowReport(true);
  };

  const exportToCSV = () => {
    let csv = "Consolidated Report\n";
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Term: ${selectedTerm || "All"}, Year: ${selectedYear}\n\n`;

    csv += "CLASS,LEARNERS,AVG SCORE,PASS RATE (%),HIGHEST,LOWEST\n";
    reportData.forEach((r) => {
      csv += `"${r.className}",${r.totalLearners},${r.averageScore},${r.passRate},${r.highestScore},${r.lowestScore}\n`;
    });

    csv += "\n\nSUBJECT PERFORMANCE\n";
    reportData.forEach((r) => {
      csv += `\n${r.className}\n`;
      csv += "SUBJECT,AVERAGE,PASS RATE (%)\n";
      r.subjectPerformance.forEach((s) => {
        csv += `"${s.name}",${s.avg},${s.passRate}\n`;
      });
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    element.setAttribute(
      "download",
      `consolidated_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const icons = {
    back: (
      <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
        <path
          fillRule="evenodd"
          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
    download: (
      <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
    sun: (
      <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    moon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    ),
  };

  return (
    <div
      style={
        {
          display: "flex",
          minHeight: "100dvh",
          background: t.bg,
          color: t.text,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          flexDirection: "column",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <header
        style={
          {
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
            flexShrink: 0,
          } as React.CSSProperties
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/reports")}
            style={{
              background: "none",
              border: "none",
              color: t.textSub,
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            {icons.back}
          </button>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "-0.01em",
              }}
            >
              Consolidated Report
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
              Multi-class analysis
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showReport && (
            <button
              onClick={exportToCSV}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: `1px solid ${t.border}`,
                background: t.surfaceAlt,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: t.textSub,
              }}
              title="Export CSV"
            >
              {icons.download}
            </button>
          )}
          <button
            onClick={() => setDark((v) => !v)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.textSub,
            }}
          >
            {dark ? icons.sun : icons.moon}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={
          {
            flex: 1,
            padding: isMobile ? "14px 14px" : "22px 24px",
            overflowY: "auto",
          } as React.CSSProperties
        }
      >
        {/* Zambia Flag */}
        <div
          style={{
            display: "flex",
            height: 4,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          {ZAMBIA_FLAG.map((c: string) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {!showReport ? (
          /* Filters Section */
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.text,
                marginBottom: 16,
              }}
            >
              📊 Report Filters
            </div>

            {/* Classes Selection */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  fontWeight: 700,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Select Classes ({selectedClasses.length} selected)
              </label>
              <div
                style={{
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {classes.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderBottom: `1px solid ${t.borderSub}`,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(c.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, c.id!]);
                        } else {
                          setSelectedClasses(
                            selectedClasses.filter((id) => id !== c.id),
                          );
                        }
                      }}
                      style={{ marginRight: 8, cursor: "pointer" }}
                    />
                    {c.className}
                  </label>
                ))}
              </div>
            </div>

            {/* Term & Year */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    fontWeight: 700,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.bg,
                    color: t.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="">All Terms</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    fontWeight: 700,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(parseInt(e.target.value, 10))
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.bg,
                    color: t.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={generateReport}
              disabled={selectedClasses.length === 0}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background:
                  selectedClasses.length === 0 ? t.surfaceAlt : t.accent,
                color: selectedClasses.length === 0 ? t.textMuted : "#fff",
                border: "none",
                cursor:
                  selectedClasses.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Generate Report
            </button>
          </div>
        ) : (
          /* Report Display */
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
                  Report Results
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                  {reportData.length} classes analyzed
                </div>
              </div>
              <button
                onClick={() => setShowReport(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: t.surfaceAlt,
                  color: t.text,
                  border: `1px solid ${t.border}`,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                ← Back
              </button>
            </div>

            {/* Summary Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: t.textMuted,
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  Classes
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.accent }}>
                  {reportData.length}
                </div>
              </div>

              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: t.textMuted,
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  Total Learners
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.accent }}>
                  {reportData.reduce((sum, r) => sum + r.totalLearners, 0)}
                </div>
              </div>

              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: t.textMuted,
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  Avg Score
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.accent }}>
                  {Math.round(
                    (reportData.reduce((sum, r) => sum + r.averageScore, 0) /
                      reportData.length) *
                      10,
                  ) / 10}
                </div>
              </div>

              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: t.textMuted,
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  Avg Pass Rate
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.accent }}>
                  {Math.round(
                    reportData.reduce((sum, r) => sum + r.passRate, 0) /
                      reportData.length,
                  )}
                  %
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 14,
                overflow: "hidden",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 600,
                }}
              >
                <thead style={{ background: t.surfaceAlt }}>
                  <tr>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      Class
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      Learners
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      Avg
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      Pass Rate
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      High
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      Low
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((data, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: `1px solid ${t.borderSub}` }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          color: t.text,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {data.className}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: 13,
                          color: t.textSub,
                        }}
                      >
                        {data.totalLearners}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: t.accent,
                        }}
                      >
                        {data.averageScore}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            data.passRate >= 75
                              ? t.accent
                              : data.passRate >= 50
                                ? t.orange
                                : t.red,
                        }}
                      >
                        {data.passRate}%
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: t.accent,
                        }}
                      >
                        {data.highestScore}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: data.lowestScore >= 50 ? t.orange : t.red,
                        }}
                      >
                        {data.lowestScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
