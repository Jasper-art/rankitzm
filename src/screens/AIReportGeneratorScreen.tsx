import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, ClassEntity, LearnerEntity, SubjectEntity } from "../db";
import { saveAIReport, getAIReports, AIReportRecord } from "../firebase";
import {
  prepareLearnerData,
  generateBatchReports,
  generateClassSummary,
  GeneratedReport,
  ClassSummary,
  LearnerReportData,
} from "../lib/aiReportService";
import { LIGHT, DARK, Theme } from "../styles/rankitz-colors";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Timestamp } from "firebase/firestore";

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile };
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icons = {
  back: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
        clipRule="evenodd"
      />
    </svg>
  ),
  ai: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      width={18}
      height={18}
    >
      <path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2z" />
      <path d="M12 16a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2v-2a2 2 0 012-2z" />
      <path d="M2 12a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2z" />
      <path d="M16 12a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
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
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
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

// ─── GRADE COLOR ──────────────────────────────────────────────────────────────
function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    One: "#10B981",
    Two: "#3B82F6",
    Three: "#8B5CF6",
    Four: "#F59E0B",
    Five: "#F97316",
    Six: "#EF4444",
    Seven: "#DC2626",
    Eight: "#B91C1C",
    Nine: "#7F1D1D",
    Fail: "#7F1D1D",
  };
  return map[grade] || "#6B7280";
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AIReportGeneratorScreen() {
  const navigate = useNavigate();
  const { classId, term, year, testType } = useParams();
  const { isMobile } = useResponsive();
  const [dark, setDark] = useState(
    () => localStorage.getItem("rankitz-theme") === "dark",
  );
  const t: Theme = dark ? DARK : LIGHT;

  // Data
  const [classData, setClassData] = useState<ClassEntity | null>(null);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [preparedData, setPreparedData] = useState<LearnerReportData[]>([]);

  // Generation state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [savedReports, setSavedReports] = useState<AIReportRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "history">(
    "generate",
  );
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const isPrimary = classData?.educationLevel?.toLowerCase() === "primary";

  // ─── LOAD DATA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const cId = parseInt(classId || "0");
        const cls = await db.getClass(cId);
        setClassData(cls || null);

        const allLearners = await db.getAllLearners();
        const allSubjects = await db.getAllSubjects();
        const allScores = await db.getAllScores();

        const classLearners = allLearners.filter((l) => l.classId === cId);
        const classSubjects = allSubjects.filter((s) => s.classId === cId);

        const termStr = term || "Term 1";
        const yearNum = parseInt(year || String(new Date().getFullYear()));
        const testTypeStr = testType || "endofterm";

        const filteredScores = allScores.filter(
          (s) =>
            s.testType?.toLowerCase() === testTypeStr.toLowerCase() &&
            s.term?.replace(/\s+/g, "") === termStr.replace(/\s+/g, "") &&
            s.year === yearNum,
        );

        setLearners(classLearners);
        setSubjects(classSubjects);

        // Build ranked map (simple total-based for now)
        const ranked = new Map<number, number>();
        const totals = classLearners
          .map((l) => {
            if (!l.id) return null;
            const total = classSubjects.reduce((sum, sub) => {
              const sc = filteredScores.find(
                (s) => s.learnerId === l.id && s.subjectId === sub.id,
              );
              return sum + (sc?.score ?? 0);
            }, 0);
            return { id: l.id, total };
          })
          .filter(Boolean) as { id: number; total: number }[];

        totals.sort((a, b) => b.total - a.total);
        totals.forEach((entry, i) => ranked.set(entry.id, i + 1));

        const prepared = prepareLearnerData(
          classLearners,
          classSubjects,
          filteredScores,
          cls?.educationLevel || "secondary",
          ranked,
        );
        setPreparedData(prepared);

        // Load saved reports
        const saved = await getAIReports(cId).catch(() => []);
        setSavedReports(saved);
      } catch (err) {
        setError("Failed to load class data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId, term, year, testType]);

  // ─── GENERATE ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (preparedData.length === 0) return;
    setGenerating(true);
    setReports([]);
    setSummary(null);
    setError(null);
    abortRef.current = false;

    try {
      const generated = await generateBatchReports(
        preparedData,
        classData?.className || "Class",
        term || "Term 1",
        parseInt(year || String(new Date().getFullYear())),
        classData?.educationLevel || "secondary",
        (done, total, current) => setProgress({ done, total, current }),
      );
      setReports(generated);

      // Generate class summary
      const classSummary = await generateClassSummary(
        preparedData,
        classData?.className || "Class",
        term || "Term 1",
        parseInt(year || String(new Date().getFullYear())),
        classData?.educationLevel || "secondary",
      );
      setSummary(classSummary);
    } catch (err: any) {
      setError(err.message || "Generation failed. Check your Groq API key.");
    } finally {
      setGenerating(false);
    }
  }, [preparedData, classData, term, year]);

  // ─── SAVE TO FIREBASE ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (reports.length === 0 || !summary) return;
    setSaving(true);
    try {
      const record: Omit<AIReportRecord, "schoolId"> = {
        id: `${classId}_${term}_${year}_${testType}_${Date.now()}`,
        classId: parseInt(classId || "0"),
        className: classData?.className || "Class",
        term: term || "Term 1",
        year: parseInt(year || String(new Date().getFullYear())),
        testType: testType || "endofterm",
        generatedAt: Timestamp.now(),
        reports: reports.map((r) => ({
          learnerId: r.learnerId,
          learnerName: r.learnerName,
          comment: r.comment,
          overallGrade: r.overallGrade,
          performance: r.performance,
        })),
        summary: summary.summary,
      };
      await saveAIReport(record);
      const saved = await getAIReports(parseInt(classId || "0"));
      setSavedReports(saved);
      alert("✅ Reports saved to Firebase!");
    } catch (err) {
      alert("Failed to save to Firebase. Check connection.");
    } finally {
      setSaving(false);
    }
  };

  // ─── COPY COMMENT ────────────────────────────────────────────────────────────
  const handleCopy = (report: GeneratedReport) => {
    navigator.clipboard.writeText(report.comment);
    setCopiedId(report.learnerId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── EXPORT PDF ──────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (reports.length === 0) return;
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFillColor(25, 138, 0);
    pdf.roundedRect(15, 15, pageWidth - 30, 20, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(
      `${classData?.className} — AI GENERATED REPORTS`,
      pageWidth / 2,
      23,
      { align: "center" },
    );
    pdf.setFontSize(9);
    pdf.text(
      `${term} ${year} • ${testType?.toUpperCase()} • ${isPrimary ? "PRIMARY" : "SECONDARY"}`,
      pageWidth / 2,
      30,
      { align: "center" },
    );

    // Summary
    if (summary) {
      pdf.setTextColor(17, 24, 39);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("CLASS SUMMARY", 15, 44);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const summaryLines = pdf.splitTextToSize(summary.summary, pageWidth - 30);
      pdf.text(summaryLines, 15, 50);
    }

    let startY = summary ? 65 : 45;

    // Reports table
    autoTable(pdf, {
      startY,
      margin: { left: 15, right: 15 },
      head: [["#", "Learner", "Grade", "Performance", "Report Comment"]],
      body: reports.map((r, i) => [
        (i + 1).toString(),
        r.learnerName,
        `Grade ${r.overallGrade}`,
        r.performance,
        r.comment,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [25, 138, 0],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [17, 24, 39] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 35, fontStyle: "bold" },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 28 },
        4: { cellWidth: "auto" },
      },
    });

    pdf.save(`${classData?.className}_AI_Reports_${term}_${year}.pdf`);
  };

  // ─── PROGRESS BAR ─────────────────────────────────────────────────────────
  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  // ─── RENDER ───────────────────────────────────────────────────────────────
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
          background: t.surface,
          borderBottom: `1.5px solid ${t.border}`,
          padding: isMobile ? "0 12px" : "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: `0 1px 3px ${t.shadow}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: t.textMuted,
              cursor: "pointer",
              padding: 8,
              borderRadius: 8,
              display: "flex",
            }}
          >
            {Icons.back}
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>
                AI Report Generator
              </span>
              <span
                style={{
                  background: t.accentBg,
                  color: t.accent,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 99,
                  border: `1px solid ${t.accent}30`,
                }}
              >
                BETA
              </span>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
              {classData?.className || "Loading..."} • {term} {year}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {reports.length > 0 && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${t.accent}`,
                  background: t.accentBg,
                  color: t.accent,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {saving ? "..." : "☁️ Save"}
              </button>
              <button
                onClick={exportPDF}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${t.border}`,
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {Icons.download} PDF
              </button>
            </>
          )}
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
              color: t.textSub,
            }}
          >
            {dark ? Icons.sun : Icons.moon}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          background: t.surface,
          borderBottom: `1.5px solid ${t.border}`,
          padding: "0 24px",
        }}
      >
        {(["generate", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? `2.5px solid ${t.accent}`
                  : "2.5px solid transparent",
              background: "none",
              color: activeTab === tab ? t.accent : t.textMuted,
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab === "generate"
              ? `Generate${reports.length > 0 ? ` (${reports.length})` : ""}`
              : `History (${savedReports.length})`}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, padding: isMobile ? 12 : 24, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.textMuted }}>
            Loading class data...
          </div>
        ) : activeTab === "generate" ? (
          <>
            {/* Info Card */}
            <div
              style={{
                background: t.surface,
                border: `1.5px solid ${t.border}`,
                borderRadius: 14,
                padding: isMobile ? 14 : 20,
                marginBottom: 18,
                boxShadow: `0 2px 8px ${t.shadow}`,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(2,1fr)"
                    : "repeat(4,1fr)",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "Learners",
                    value: learners.length,
                    color: t.accent,
                  },
                  {
                    label: "Subjects",
                    value: subjects.length,
                    color: "#8B5CF6",
                  },
                  {
                    label: "Level",
                    value: isPrimary ? "Primary" : "Secondary",
                    color: "#F97316",
                  },
                  {
                    label: "Reports",
                    value:
                      reports.length > 0 ? `${reports.length} ✓` : "None yet",
                    color: reports.length > 0 ? t.accent : t.textMuted,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: t.surfaceAlt,
                      borderRadius: 10,
                      padding: 12,
                      border: `1.5px solid ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: stat.color,
                        marginTop: 6,
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            {!generating && reports.length === 0 && (
              <div
                style={{
                  background: t.surface,
                  border: `1.5px solid ${t.border}`,
                  borderRadius: 14,
                  padding: 32,
                  marginBottom: 18,
                  textAlign: "center",
                  boxShadow: `0 2px 8px ${t.shadow}`,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: t.text,
                    marginBottom: 8,
                  }}
                >
                  Generate AI Report Comments
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: t.textMuted,
                    marginBottom: 24,
                    maxWidth: 400,
                    margin: "0 auto 24px",
                  }}
                >
                  AI will write professional report card comments for all{" "}
                  {learners.length} learners based on their {term} {year}{" "}
                  scores.
                </div>
                {error && (
                  <div
                    style={{
                      background: "#FEE2E2",
                      border: "1.5px solid #FCA5A5",
                      borderRadius: 10,
                      padding: 12,
                      color: "#DC2626",
                      fontSize: 12,
                      marginBottom: 16,
                      textAlign: "left",
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={preparedData.length === 0}
                  style={{
                    padding: "14px 32px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      preparedData.length === 0
                        ? t.border
                        : `linear-gradient(135deg, ${t.accent}, #059669)`,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor:
                      preparedData.length === 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow:
                      preparedData.length === 0
                        ? "none"
                        : `0 4px 14px ${t.accent}40`,
                  }}
                >
                  {Icons.spark} Generate {learners.length} Reports
                </button>
                {preparedData.length === 0 && (
                  <div
                    style={{ fontSize: 11, color: t.textMuted, marginTop: 10 }}
                  >
                    No scores found for {term} {year} {testType}
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            {generating && (
              <div
                style={{
                  background: t.surface,
                  border: `1.5px solid ${t.accent}40`,
                  borderRadius: 14,
                  padding: 24,
                  marginBottom: 18,
                  boxShadow: `0 2px 8px ${t.shadow}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: t.text }}
                  >
                    🤖 Generating Reports...
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 800, color: t.accent }}
                  >
                    {progressPct}%
                  </span>
                </div>
                <div
                  style={{
                    background: t.surfaceAlt,
                    borderRadius: 99,
                    height: 8,
                    overflow: "hidden",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${t.accent}, #059669)`,
                      borderRadius: 99,
                      width: `${progressPct}%`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: t.textMuted }}>
                  {progress.done}/{progress.total} • Writing comment for:{" "}
                  <strong>{progress.current}</strong>
                </div>
              </div>
            )}

            {/* Regenerate button after done */}
            {!generating && reports.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <button
                  onClick={handleGenerate}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1.5px solid ${t.border}`,
                    background: t.surfaceAlt,
                    color: t.textSub,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🔄 Regenerate All
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    alignSelf: "center",
                  }}
                >
                  {reports.length} comments generated
                </span>
              </div>
            )}

            {/* Class Summary */}
            {summary && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${t.accentBg}, ${t.surface})`,
                  border: `1.5px solid ${t.accent}30`,
                  borderRadius: 14,
                  padding: isMobile ? 14 : 20,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: t.accent,
                    marginBottom: 10,
                  }}
                >
                  📋 Class Summary
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: t.text,
                    lineHeight: 1.7,
                    marginBottom: 14,
                  }}
                >
                  {summary.summary}
                </p>
                {summary.recommendations.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: 8,
                      }}
                    >
                      Recommendations for Next Term
                    </div>
                    {summary.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ color: t.accent, marginTop: 2 }}>→</span>
                        <span
                          style={{
                            fontSize: 12,
                            color: t.textSub,
                            lineHeight: 1.5,
                          }}
                        >
                          {rec}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Reports List */}
            {reports.map((report) => {
              const learnerData = preparedData.find(
                (l) => l.learnerId === report.learnerId,
              );
              const isCopied = copiedId === report.learnerId;
              const isSelected = selectedReport?.learnerId === report.learnerId;

              return (
                <div
                  key={report.learnerId}
                  onClick={() => setSelectedReport(isSelected ? null : report)}
                  style={{
                    background: t.surface,
                    border: `1.5px solid ${isSelected ? t.accent : t.border}`,
                    borderRadius: 12,
                    padding: isMobile ? 12 : 16,
                    marginBottom: 10,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isSelected
                      ? `0 2px 12px ${t.accent}20`
                      : `0 1px 4px ${t.shadow}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: t.accentBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 800,
                          color: t.accent,
                          flexShrink: 0,
                        }}
                      >
                        {learnerData?.rank || "?"}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: t.text,
                          }}
                        >
                          {report.learnerName}
                        </div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>
                          {report.performance}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          background: gradeColor(report.overallGrade) + "20",
                          color: gradeColor(report.overallGrade),
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 99,
                          border: `1px solid ${gradeColor(report.overallGrade)}40`,
                        }}
                      >
                        Grade {report.overallGrade}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(report);
                        }}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          border: `1px solid ${t.border}`,
                          background: isCopied ? t.accentBg : t.surfaceAlt,
                          color: isCopied ? t.accent : t.textMuted,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isCopied ? Icons.check : Icons.copy}
                      </button>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: t.textSub,
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {report.comment}
                  </p>

                  {isSelected && learnerData && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: `1px solid ${t.border}`,
                      }}
                    >
                      <div
                        style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
                      >
                        {report.strengths.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#10B981",
                                textTransform: "uppercase",
                                marginBottom: 4,
                              }}
                            >
                              Strengths
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              {report.strengths.map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    background: "#ECFDF5",
                                    color: "#065F46",
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                    border: "1px solid #10B98130",
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {report.areasForImprovement.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#F97316",
                                textTransform: "uppercase",
                                marginBottom: 4,
                              }}
                            >
                              Needs Work
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              {report.areasForImprovement.map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    background: "#FFF7ED",
                                    color: "#9A3412",
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                    border: "1px solid #F9731630",
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {learnerData.scores.map((sc) => (
                          <div
                            key={sc.subjectName}
                            style={{
                              background: t.surfaceAlt,
                              borderRadius: 6,
                              padding: "4px 10px",
                              border: `1px solid ${t.border}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 9,
                                color: t.textMuted,
                                fontWeight: 700,
                              }}
                            >
                              {sc.subjectName.substring(0, 8)}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: t.text,
                              }}
                            >
                              {sc.score}/{sc.maxMark}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          /* History Tab */
          <div>
            {savedReports.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: 60, color: t.textMuted }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  No saved reports yet
                </div>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  Generate and save reports to see them here
                </div>
              </div>
            ) : (
              savedReports.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    background: t.surface,
                    border: `1.5px solid ${t.border}`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 13, fontWeight: 800, color: t.text }}
                      >
                        {rec.className} — {rec.testType?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>
                        {rec.term} {rec.year} • {rec.reports.length} learners
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: t.textMuted }}>
                      {rec.generatedAt
                        ?.toDate?.()
                        .toLocaleDateString("en-GB") || ""}
                    </span>
                  </div>
                  {rec.summary && (
                    <p
                      style={{
                        fontSize: 12,
                        color: t.textSub,
                        marginTop: 10,
                        lineHeight: 1.6,
                      }}
                    >
                      {rec.summary}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  );
}
