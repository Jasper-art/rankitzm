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
  isPassingGrade,
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
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
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
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
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
          db.getAllScores(),
          db.getAllSubjects(),
          db.getAllClasses(),
        ]);

      // Filter to only this learner's scores — same logic as BaseReportScreen
      const learnerScores = scoresData.filter((s) => s.learnerId === id);
      setLearner(learnerData || null);
      setScores(learnerScores);
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

      // Load school settings for pass rates
      const currentYear = new Date().getFullYear();
      const termsToTry = ["Term1", "Term2", "Term3"];
      let schoolSettings = null;
      for (const term of termsToTry) {
        schoolSettings = await db.getSchoolSettings(term, currentYear);
        if (schoolSettings) break;
      }
      if (schoolSettings) {
        setSchoolSettings(schoolSettings);
      }
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

    // Apply term filter using same normalisation as BaseReportScreen
    const filteredScores = selectedTerm
      ? classScores.filter(
          (s) =>
            s.term?.replace(/\s+/g, "") === selectedTerm.replace(/\s+/g, ""),
        )
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
      const subjectEntity = learnerClassSubjects.find(
        (s) => s.id === subjectId,
      );
      const subjectName = subjectEntity?.subjectName || `Subject ${subjectId}`;
      const maxMark = subjectEntity?.maxMark || 100;
      const scoresArray = subjectScores.map((s) => s.score);
      const passThreshold = maxMark * getPassThresholdRate();
      const passCount = scoresArray.filter((s) => s >= passThreshold).length;

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
    if (educationLevel.toLowerCase() === "primary") {
      let total = 0;
      scoresBySubject.forEach((summary) => {
        total += summary.average;
      });
      return Math.round(total * 10) / 10;
    }
    let total = 0;
    let count = 0;
    scoresBySubject.forEach((summary) => {
      total += summary.average;
      count += 1;
    });
    return Math.round((total / count) * 10) / 10;
  };

  // For primary: compute average percentage across subjects for grading
  const getOverallAveragePercent = () => {
    if (scoresBySubject.size === 0) return 0;
    if (educationLevel.toLowerCase() !== "primary") return getOverallAverage();
    let totalPct = 0;
    let count = 0;
    scoresBySubject.forEach((summary, subjectId) => {
      const subjectEntity = subjects.find((s) => s.id === subjectId);
      const maxMark = subjectEntity?.maxMark || 100;
      totalPct += (summary.average / maxMark) * 100;
      count += 1;
    });
    return Math.round((totalPct / count) * 10) / 10;
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
    const passCount = classScores.filter((s) => {
      const subjectEntity = learnerClassSubjects.find(
        (sub) => sub.id === s.subjectId,
      );
      const maxMark = subjectEntity?.maxMark || 100;
      return s.score >= maxMark * getPassThresholdRate();
    }).length;
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

  const educationLevel = classData?.educationLevel || "secondary";

  const getPassThresholdRate = () => {
    if (educationLevel.toLowerCase() === "primary") {
      return (schoolSettings?.primaryPassingRate || 50) / 100;
    }
    return (schoolSettings?.secondaryPassingRate || 40) / 100;
  };

  const getGrade = (score: number, maxMark: number = 100) => {
    return getGradeLabel(score, maxMark, educationLevel);
  };

  const getRemark = (score: number, maxMark: number = 100) => {
    return getGradeStandard(score, maxMark, educationLevel);
  };

  const getPerformanceMsg = () => {
    const avg = getOverallAverage();
    const fullMsg = getPerformanceMessage(avg, 100, educationLevel);
    return fullMsg.split(" - ")[0];
  };

  const getPerformanceSummary = () => {
    const avg = getOverallAveragePercent();
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
            onClick={async () => {
              if (!learner) return;
              try {
                const { default: jsPDF } = await import("jspdf");
                const { default: autoTable } = await import("jspdf-autotable");

                let exportSchoolName = schoolName;
                try {
                  const schoolData = await db.getSchool(1);
                  const cached = localStorage.getItem(
                    "rankitz-school-settings",
                  );
                  if (schoolData?.schoolName) {
                    exportSchoolName = schoolData.schoolName;
                  } else if (cached) {
                    const parsed = JSON.parse(cached);
                    exportSchoolName = parsed.schoolName || schoolName;
                  }
                } catch (e) {}

                const pdf = new jsPDF({
                  orientation: "p",
                  unit: "mm",
                  format: "a4",
                });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 15;
                const contentWidth = pageWidth - margin * 2;

                // ── HEADER ──
                pdf.setFillColor(16, 185, 129);
                pdf.roundedRect(margin, 12, contentWidth, 24, 2, 2, "F");
                pdf.setTextColor(255, 255, 255);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(14);
                pdf.text(exportSchoolName.toUpperCase(), pageWidth / 2, 20, {
                  align: "center",
                });
                pdf.setFontSize(9);
                pdf.text("STATEMENT OF RESULTS", pageWidth / 2, 26, {
                  align: "center",
                });
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7);
                pdf.text(
                  `Official Academic Performance Report • ${selectedTerm || "All Terms Combined"}`,
                  pageWidth / 2,
                  32,
                  { align: "center" },
                );

                // Zambia flag strip
                const stripY = 38;
                const pW = contentWidth / 7;
                pdf.setFillColor(25, 138, 0);
                pdf.rect(margin, stripY, pW * 4, 1.2, "F");
                pdf.setFillColor(222, 32, 16);
                pdf.rect(margin + pW * 4, stripY, pW, 1.2, "F");
                pdf.setFillColor(0, 0, 0);
                pdf.rect(margin + pW * 5, stripY, pW, 1.2, "F");
                pdf.setFillColor(239, 125, 0);
                pdf.rect(margin + pW * 6, stripY, pW, 1.2, "F");

                let y = 46;

                // ── LEARNER DETAILS ──
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(17, 24, 39);
                pdf.text("LEARNER DETAILS", margin, y);
                pdf.setDrawColor(229, 231, 235);
                pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
                y += 5;

                const detailBoxW = (contentWidth - 4) / 2;
                const details = [
                  { l: "LEARNER NAME", v: learner.name },
                  { l: "CLASS", v: classData?.className || "N/A" },
                  {
                    l: "GENDER",
                    v: learner.gender
                      ? learner.gender.charAt(0).toUpperCase() +
                        learner.gender.slice(1).toLowerCase()
                      : "N/A",
                  },
                  { l: "EDUCATION LEVEL", v: educationLevel.toUpperCase() },
                  { l: "EXAM / ID", v: learner.id?.toString() || "N/A" },
                  {
                    l: "ACADEMIC TERM",
                    v: selectedTerm || "All Terms Combined",
                  },
                ];
                details.forEach((d, i) => {
                  const bx = margin + (i % 2) * (detailBoxW + 4);
                  if (i % 2 === 0) {
                    if (i > 0) y += 14;
                    pdf.setFillColor(249, 250, 251);
                    pdf.setDrawColor(229, 231, 235);
                    pdf.roundedRect(bx, y, detailBoxW, 12, 1.5, 1.5, "FD");
                    pdf.roundedRect(
                      bx + detailBoxW + 4,
                      y,
                      detailBoxW,
                      12,
                      1.5,
                      1.5,
                      "FD",
                    );
                  }
                  pdf.setFontSize(6);
                  pdf.setTextColor(107, 114, 128);
                  pdf.setFont("helvetica", "bold");
                  pdf.text(d.l, bx + 4, y + 4.5);
                  pdf.setFontSize(9);
                  pdf.setTextColor(17, 24, 39);
                  pdf.setFont("helvetica", "bold");
                  pdf.text(d.v, bx + 4, y + 9.5);
                });
                y += 20;

                // ── RESULTS TABLE ──
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(17, 24, 39);
                pdf.text("SUBJECT RESULTS", margin, y);
                pdf.setDrawColor(229, 231, 235);
                pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
                y += 4;
                const isPrimaryLevel =
                  educationLevel.toLowerCase() === "primary";
                const tableBody = Array.from(scoresBySubject.entries()).map(
                  ([subjectId, summary]) => {
                    const subjectEntity = subjects.find(
                      (s) => s.id === subjectId,
                    );
                    const maxMark = subjectEntity?.maxMark || 100;
                    return isPrimaryLevel
                      ? [
                          summary.subjectName,
                          Math.round(summary.average).toString(),
                          maxMark.toString(),
                          getGrade(summary.average, maxMark),
                          getRemark(summary.average, maxMark),
                        ]
                      : [
                          summary.subjectName,
                          `${summary.average}%`,
                          getGrade(summary.average),
                          getRemark(summary.average),
                        ];
                  },
                );

                autoTable(pdf, {
                  startY: y,
                  margin: { left: margin, right: margin },
                  head: [
                    educationLevel.toLowerCase() === "primary"
                      ? ["Subject", "Score", "Out of", "Grade", "Remark"]
                      : ["Subject", "Score (%)", "Grade", "Remark"],
                  ],
                  body: tableBody,
                  theme: "grid",
                  headStyles: {
                    fillColor: [16, 185, 129],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8,
                    halign: "center",
                  },
                  bodyStyles: { fontSize: 8, textColor: [17, 24, 39] },
                  alternateRowStyles: { fillColor: [248, 250, 252] },
                  columnStyles: {
                    0: { halign: "left", fontStyle: "bold" },
                    1: { halign: "center" },
                    2: { halign: "center", fontStyle: "bold" },
                    3: { halign: "left" },
                  },
                });

                y = (pdf as any).lastAutoTable.finalY + 8;

                // ── OVERALL SUMMARY ──
                if (y > pageHeight - 50) {
                  pdf.addPage();
                  y = margin;
                }

                pdf.setFontSize(9);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(17, 24, 39);
                pdf.text("OVERALL PERFORMANCE SUMMARY", margin, y);
                pdf.setDrawColor(229, 231, 235);
                pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
                y += 5;

                const avg = getOverallAverage();
                const summaryBoxW = (contentWidth - 9) / 4;
                const summaryItems = [
                  { l: "SUBJECTS TAKEN", v: scoresBySubject.size.toString() },
                  {
                    l: isPrimaryLevel ? "TOTAL MARKS" : "OVERALL AVERAGE",
                    v: isPrimaryLevel ? avg.toString() : `${avg}%`,
                  },
                  {
                    l: "OVERALL GRADE",
                    v: getGrade(getOverallAveragePercent()),
                  },
                  { l: "PERFORMANCE", v: getPerformanceSummary() },
                ];
                summaryItems.forEach((item, i) => {
                  const bx = margin + i * (summaryBoxW + 3);
                  pdf.setFillColor(209, 250, 229);
                  pdf.setDrawColor(16, 185, 129);
                  pdf.roundedRect(bx, y, summaryBoxW, 14, 1.5, 1.5, "FD");
                  pdf.setFontSize(6);
                  pdf.setTextColor(107, 114, 128);
                  pdf.setFont("helvetica", "bold");
                  pdf.text(item.l, bx + summaryBoxW / 2, y + 5, {
                    align: "center",
                  });
                  pdf.setFontSize(i === 3 ? 7 : 10);
                  pdf.setTextColor(5, 150, 105);
                  pdf.text(item.v, bx + summaryBoxW / 2, y + 11, {
                    align: "center",
                  });
                });
                y += 22;

                // ── SIGNATURES ──
                pdf.setDrawColor(17, 24, 39);
                pdf.line(margin, y + 10, margin + 50, y + 10);
                pdf.setFontSize(7);
                pdf.setTextColor(107, 114, 128);
                pdf.text("Teacher's Signature", margin, y + 14);

                pdf.line(
                  pageWidth - margin - 50,
                  y + 10,
                  pageWidth - margin,
                  y + 10,
                );
                pdf.text(
                  new Date().toLocaleDateString(),
                  pageWidth - margin - 50,
                  y + 14,
                );
                pdf.text("Date Issued", pageWidth - margin - 25, y + 18, {
                  align: "center",
                });

                // ── FOOTER on every page ──
                const totalPages = (pdf as any).internal.pages.length - 1;
                for (let i = 1; i <= totalPages; i++) {
                  pdf.setPage(i);
                  pdf.setFontSize(7);
                  pdf.setTextColor(156, 163, 175);
                  pdf.setDrawColor(229, 231, 235);
                  (pdf as any).setLineDash([1, 1], 0);
                  pdf.line(
                    margin,
                    pageHeight - 12,
                    pageWidth - margin,
                    pageHeight - 12,
                  );
                  (pdf as any).setLineDash([], 0);
                  pdf.text(
                    "Generated by RankItZM School Management System",
                    margin,
                    pageHeight - 8,
                  );
                  pdf.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 8,
                    { align: "right" } as any,
                  );
                }

                pdf.save(
                  `Statement_${learner.name.replace(/\s+/g, "_")}_${selectedTerm || "AllTerms"}.pdf`,
                );
              } catch (err) {
                console.error("PDF export error:", err);
                alert("Failed to export PDF: " + (err as any).message);
              }
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
                  label="Gender"
                  value={
                    learner.gender
                      ? learner.gender.charAt(0).toUpperCase() +
                        learner.gender.slice(1).toLowerCase()
                      : "N/A"
                  }
                  t={t}
                />
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
                  label="Education Level"
                  value={
                    educationLevel.charAt(0).toUpperCase() +
                    educationLevel.slice(1)
                  }
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
                      Score
                    </th>
                    {educationLevel.toLowerCase() === "primary" && (
                      <th
                        style={{
                          padding: "12px",
                          border: `1px solid ${t.border}`,
                          textAlign: "center",
                          width: "12%",
                        }}
                      >
                        Out of
                      </th>
                    )}
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
                      ([subjectId, summary]) => {
                        const subjectEntity = subjects.find(
                          (s) => s.id === subjectId,
                        );
                        const maxMark = subjectEntity?.maxMark || 100;
                        const isPrimaryLevel =
                          educationLevel.toLowerCase() === "primary";
                        const displayScore = isPrimaryLevel
                          ? summary.average
                          : summary.average;
                        const gradeColor =
                          summary.average >= maxMark * getPassThresholdRate()
                            ? t.text
                            : t.red;
                        return (
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
                              {isPrimaryLevel
                                ? Math.round(summary.average)
                                : `${summary.average}%`}
                            </td>
                            {isPrimaryLevel && (
                              <td
                                style={{
                                  padding: "8px",
                                  border: `1px solid ${t.border}`,
                                  textAlign: "center",
                                  fontWeight: 600,
                                  color: t.textMuted,
                                }}
                              >
                                {maxMark}
                              </td>
                            )}
                            <td
                              style={{
                                padding: "8px",
                                border: `1px solid ${t.border}`,
                                textAlign: "center",
                                fontWeight: 700,
                                color: gradeColor,
                              }}
                            >
                              {getGrade(summary.average, maxMark)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                border: `1px solid ${t.border}`,
                                textAlign: "left",
                                color: t.textMuted,
                              }}
                            >
                              {getRemark(summary.average, maxMark)}
                            </td>
                          </tr>
                        );
                      },
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
                label={
                  educationLevel.toLowerCase() === "primary"
                    ? "Total Marks"
                    : "Overall Average"
                }
                value={
                  educationLevel.toLowerCase() === "primary"
                    ? getOverallAverage().toString()
                    : `${getOverallAverage()}%`
                }
                t={t}
              />
              <SummaryMetric
                label="Overall Grade"
                value={getGrade(getOverallAveragePercent())}
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
