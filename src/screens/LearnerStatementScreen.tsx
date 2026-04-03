import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  db,
  TestScoreEntity,
  LearnerEntity,
  ClassEntity,
  SubjectEntity,
  LearnerRankingEntity,
} from "../db";
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from "../styles/rankitz-colors";
import {
  getGradeLabel,
  getGradeStandard,
  getPerformanceMessage,
} from "../lib/grading";

interface ScoreSummary {
  subjectName: string;
  scores: number[];
  average: number;
  highest: number;
  lowest: number;
  passCount: number;
}

export default function LearnerStatementScreen() {
  const navigate = useNavigate();
  const { learnerId } = useParams();
  const documentRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [learner, setLearner] = useState<LearnerEntity | null>(null);
  const [classData, setClassData] = useState<ClassEntity | null>(null);
  const [scores, setScores] = useState<TestScoreEntity[]>([]);
  const [scoresBySubject, setScoresBySubject] = useState<
    Map<number, ScoreSummary>
  >(new Map());
  const [rankings, setRankings] = useState<LearnerRankingEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [schoolName, setSchoolName] = useState("RankIT ZM School");
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const fn = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 1024);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    loadData();
  }, [learnerId]);

  useEffect(() => {
    processSummary();
  }, [scores, selectedTerm, subjects, learner]);

  const loadData = async () => {
    try {
      setLoading(true);
      const id = learnerId ? parseInt(learnerId, 10) : null;
      if (!id) return;

      const [learnerData, scoresData, subjectsData, rankingsData] =
        await Promise.all([
          db.getLearner(id),
          db.getScoresByLearner(id),
          db.getAllSubjects(),
          db.getAllClasses(),
        ]);

      setLearner(learnerData || null);
      setScores(scoresData);
      setSubjects(subjectsData);

      // Get class data
      if (learnerData?.classId) {
        const cls = await db.getClass(learnerData.classId);
        setClassData(cls || null);
      }

      // Load school info
      const savedSchool = localStorage.getItem("schoolName");
      const savedLogo = localStorage.getItem("logoUri");
      if (savedSchool) setSchoolName(savedSchool);
      if (savedLogo) setSchoolLogo(savedLogo);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processSummary = () => {
    // Get only subjects from the learner's class
    const learnerClassSubjects = subjects.filter(
      (s) => s.classId === learner?.classId,
    );
    const learnerClassSubjectIds = new Set(
      learnerClassSubjects.map((s) => s.id),
    );

    // Filter scores to only include subjects from the learner's class
    const classScores = scores.filter((s) =>
      learnerClassSubjectIds.has(s.subjectId),
    );

    // Apply term filter if selected
    const filteredScores = selectedTerm
      ? classScores.filter((s) => s.term === selectedTerm)
      : classScores;

    const grouped = new Map<number, TestScoreEntity[]>();
    filteredScores.forEach((s) => {
      if (!grouped.has(s.subjectId)) {
        grouped.set(s.subjectId, []);
      }
      grouped.get(s.subjectId)!.push(s);
    });

    const summary = new Map<number, ScoreSummary>();
    grouped.forEach((subjectScores, subjectId) => {
      const subjectName =
        learnerClassSubjects.find((s) => s.id === subjectId)?.subjectName ||
        `Subject ${subjectId}`;
      const scoresArray = subjectScores.map((s) => s.score);
      const passCount = scoresArray.filter((s) => s >= 50).length;

      summary.set(subjectId, {
        subjectName,
        scores: scoresArray,
        average:
          Math.round(
            (scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) * 10,
          ) / 10,
        highest: Math.max(...scoresArray),
        lowest: Math.min(...scoresArray),
        passCount,
      });
    });

    setScoresBySubject(summary);
  };

  const getOverallAverage = () => {
    if (scoresBySubject.size === 0) return 0;
    let total = 0;
    let count = 0;
    scoresBySubject.forEach((summary) => {
      total += summary.average;
      count += 1;
    });
    return Math.round((total / count) * 10) / 10;
  };

  const getPassRate = () => {
    const learnerClassSubjects = subjects.filter(
      (s) => s.classId === learner?.classId,
    );
    const learnerClassSubjectIds = new Set(
      learnerClassSubjects.map((s) => s.id),
    );
    const classScores = scores.filter((s) =>
      learnerClassSubjectIds.has(s.subjectId),
    );

    if (classScores.length === 0) return 0;
    const passCount = classScores.filter((s) => s.score >= 50).length;
    return Math.round((passCount / classScores.length) * 100);
  };

  const getTotalScores = () => {
    const learnerClassSubjects = subjects.filter(
      (s) => s.classId === learner?.classId,
    );
    const learnerClassSubjectIds = new Set(
      learnerClassSubjects.map((s) => s.id),
    );
    return scores.filter((s) => learnerClassSubjectIds.has(s.subjectId)).length;
  };

  const getGrade = (score: number) => {
    // Using Zambian grading system (1-9 for secondary)
    // Assumes score is already a percentage (0-100)
    return getGradeLabel(score, 100, "secondary");
  };

  const getRemark = (score: number) => {
    // Using Zambian standard/descriptor
    return getGradeStandard(score, 100, "secondary");
  };

  const getPerformanceMsg = () => {
    const avg = getOverallAverage();
    // Using Zambian performance message with emoji
    const fullMsg = getPerformanceMessage(avg, 100, "secondary");
    // Return just the emoji and first part for compact display
    return fullMsg.split(" - ")[0];
  };

  const getPerformanceSummary = () => {
    const avg = getOverallAverage();
    if (avg >= 75) return "Excellent Performance";
    if (avg >= 70) return "Very Good Performance";
    if (avg >= 65) return "Good Performance";
    if (avg >= 60) return "Good Performance";
    if (avg >= 55) return "Satisfactory Performance";
    if (avg >= 50) return "Satisfactory Performance";
    if (avg >= 45) return "Acceptable Performance";
    if (avg >= 40) return "Needs Improvement";
    return "Critical Support Needed";
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
    print: (
      <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
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
      className="screen-container"
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
      {/* Top Toolbar (Hidden on Print) */}
      <header
        className="no-print"
        style={
          {
            background: t.surface,
            borderBottom: `1.5px solid ${t.border}`,
            padding: isMobile ? "12px 14px" : "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
            flexShrink: 0,
            boxShadow: `0 1px 3px ${t.shadow}`,
            flexWrap: "wrap",
            gap: "10px",
          } as React.CSSProperties
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/learners")}
            style={{
              background: "none",
              border: "none",
              color: t.textMuted,
              cursor: "pointer",
              padding: 8,
              display: "flex",
              borderRadius: 8,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.surfaceAlt;
              e.currentTarget.style.color = t.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = t.textMuted;
            }}
          >
            {icons.back}
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
              Statement of Results
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
              Academic performance report
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Term Filter moved to toolbar so it's not printed on the document */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: 13,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Terms Combined</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>

          <button
            onClick={() => {
              // Load html2pdf library dynamically and export
              const script = document.createElement("script");
              script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
              script.onload = () => {
                const element = document.querySelector(".printable-document");
                if (element && learner) {
                  const filename = `Statement_of_Results_${learner.name.replace(/\s+/g, "_")}.pdf`;

                  const opt = {
                    margin: 8,
                    filename: filename,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: {
                      scale: 2,
                      backgroundColor: "#ffffff",
                      useCORS: true,
                      logging: false,
                    },
                    jsPDF: { format: "a4", orientation: "portrait" },
                    pagebreak: { avoid: "css", mode: ["avoid-all"] },
                  };

                  // @ts-ignore
                  html2pdf().set(opt).from(element).save();
                }
              };
              document.head.appendChild(script);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: t.accent,
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            {icons.print} Export PDF
          </button>

          <button
            onClick={() => setDark((v) => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.textMuted,
            }}
          >
            {dark ? icons.sun : icons.moon}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={
          {
            flex: 1,
            padding: isMobile ? "10px" : "30px",
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          } as React.CSSProperties
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 50 }}>Loading...</div>
        ) : !learner ? (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            Learner not found
          </div>
        ) : (
          /* A4 Printable Document Container */
          <div
            ref={documentRef}
            className="printable-document"
            style={
              {
                background: t.surface,
                color: t.text,
                width: "100%",
                maxWidth: "210mm", // A4 width
                margin: "0 auto",
                padding: isMobile ? "15px" : "25px",
                boxShadow: `0 8px 24px ${t.shadow}`,
                borderRadius: isMobile ? 8 : 4,
                border: `1px solid ${t.border}`,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                // Force exact colors for printing
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              } as React.CSSProperties
            }
          >
            {/* Top Zambia Flag Bar */}
            <div
              style={{
                display: "flex",
                height: 6,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 30,
                flexShrink: 0,
              }}
            >
              {ZAMBIA_FLAG.map((c) => (
                <div
                  key={c}
                  style={{
                    flex: 1,
                    background: c,
                    WebkitPrintColorAdjust: "exact",
                  }}
                />
              ))}
            </div>

            {/* Document Header */}
            <div
              style={{
                textAlign: "center",
                borderBottom: `2px solid ${t.text}`,
                paddingBottom: 12,
                marginBottom: 15,
              }}
            >
              {schoolLogo && (
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "contain",
                    marginBottom: 6,
                    WebkitPrintColorAdjust: "exact",
                  }}
                />
              )}
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 3px 0",
                  color: t.text,
                }}
              >
                {schoolName}
              </h1>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: t.textMuted,
                  margin: "0 0 8px 0",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Statement of Results
              </h2>
              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  fontStyle: "italic",
                }}
              >
                Official Academic Performance Report
              </div>
            </div>

            {/* Student Details Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 10,
                marginBottom: 15,
                padding: "10px",
                background: t.surfaceAlt,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                WebkitPrintColorAdjust: "exact",
              }}
            >
              <div>
                <DetailRow label="Learner Name" value={learner.name} t={t} />
                <DetailRow
                  label="Exam/ID Number"
                  value={learner.id?.toString() || "N/A"}
                  t={t}
                />
              </div>
              <div>
                <DetailRow
                  label="Class"
                  value={classData?.className || "N/A"}
                  t={t}
                />
                <DetailRow
                  label="Academic Term"
                  value={selectedTerm || "All Terms Combined"}
                  t={t}
                />
              </div>
            </div>

            {/* Results Table */}
            <div style={{ marginBottom: 15, overflowX: "auto" }}>
              <table
                className="results-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: 12,
                  WebkitPrintColorAdjust: "exact",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: t.border,
                      color: t.text,
                      WebkitPrintColorAdjust: "exact",
                    }}
                  >
                    <th
                      style={{
                        padding: "8px",
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      Subject
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        border: `1px solid ${t.border}`,
                        textAlign: "center",
                        width: "15%",
                      }}
                    >
                      Score (%)
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        border: `1px solid ${t.border}`,
                        textAlign: "center",
                        width: "15%",
                      }}
                    >
                      Grade
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        border: `1px solid ${t.border}`,
                        textAlign: "left",
                        width: "25%",
                      }}
                    >
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scoresBySubject.size === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "30px",
                          textAlign: "center",
                          color: t.textMuted,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        No subject scores recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    Array.from(scoresBySubject.entries()).map(
                      ([subjectId, summary]) => (
                        <tr key={subjectId}>
                          <td
                            style={{
                              padding: "8px",
                              border: `1px solid ${t.border}`,
                              fontWeight: 600,
                            }}
                          >
                            {summary.subjectName}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: `1px solid ${t.border}`,
                              textAlign: "center",
                              fontWeight: 700,
                            }}
                          >
                            {summary.average}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: `1px solid ${t.border}`,
                              textAlign: "center",
                              fontWeight: 700,
                              color: summary.average >= 50 ? t.text : t.red,
                            }}
                          >
                            {getGrade(summary.average)}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: `1px solid ${t.border}`,
                              textAlign: "left",
                              color: t.textMuted,
                            }}
                          >
                            {getRemark(summary.average)}
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Overall Performance Summary block */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 15px",
                border: `2px solid ${t.text}`,
                borderRadius: 8,
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 10,
                WebkitPrintColorAdjust: "exact",
              }}
            >
              <SummaryMetric
                label="Subjects Taken"
                value={scoresBySubject.size}
                t={t}
              />
              <SummaryMetric
                label="Overall Average"
                value={`${getOverallAverage()}%`}
                t={t}
              />
              <SummaryMetric
                label="Overall Grade"
                value={getGrade(getOverallAverage())}
                t={t}
              />
              <SummaryMetric
                label="Overall Remark"
                value={getPerformanceSummary()}
                highlight={true}
                t={t}
              />
            </div>

            {/* Footer / Signatures Area */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                paddingTop: 15,
                marginTop: 10,
              }}
            >
              <div style={{ textAlign: "center", width: "30%" }}>
                <div
                  style={{
                    borderBottom: `1px solid ${t.text}`,
                    height: 20,
                    marginBottom: 3,
                  }}
                />
                <div style={{ fontSize: 10, fontWeight: 600 }}>
                  Teacher's Signature
                </div>
              </div>

              <div style={{ textAlign: "center", width: "30%" }}>
                <div
                  style={{
                    height: 60,
                    width: 60,
                    border: `2px dashed ${t.border}`,
                    borderRadius: "50%",
                    margin: "0 auto 6px auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: t.textMuted,
                    fontSize: 8,
                  }}
                >
                  OFFICIAL STAMP
                </div>
              </div>

              <div style={{ textAlign: "center", width: "30%" }}>
                <div
                  style={{
                    borderBottom: `1px solid ${t.text}`,
                    height: 20,
                    marginBottom: 3,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  {new Date().toLocaleDateString()}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600 }}>Date Issued</div>
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: 15,
                fontSize: 8,
                color: t.textMuted,
              }}
            >
              Generated securely by RankIT ZM School Management System
            </div>
          </div>
        )}
      </main>

      {/* Embedded Styles tailored for Printing */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          .screen-container {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
          }

          .printable-document {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 40px !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            min-height: auto !important;
            page-break-after: avoid !important;
          }

          .printable-document * {
            background-color: transparent !important;
          }

          .results-table {
            width: 100% !important;
            page-break-inside: avoid !important;
          }

          .results-table thead {
            display: table-header-group !important;
            page-break-after: avoid !important;
          }

          .results-table tbody {
            page-break-inside: avoid !important;
          }

          .results-table tr {
            page-break-inside: avoid !important;
          }

          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
          }

          img {
            max-width: 100% !important;
          }
        }

        @media screen {
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Small helper component for the key-value rows in the details block
function DetailRow({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: Theme;
}) {
  return (
    <div style={{ display: "flex", marginBottom: 6, fontSize: 14 }}>
      <span
        style={{
          width: 130,
          fontWeight: 600,
          color: t.textMuted,
        }}
      >
        {label}:
      </span>
      <span style={{ fontWeight: 700, color: t.text }}>{value}</span>
    </div>
  );
}

// Small helper component for the bottom summary section
function SummaryMetric({
  label,
  value,
  highlight = false,
  t,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  t: Theme;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 9,
          color: t.textMuted,
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 2,
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: highlight ? t.accent : t.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}
