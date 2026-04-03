import React, { useState, useEffect, useMemo } from "react";
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
  getGradeLabel,
  getGradeStandard,
  isPassingGrade,
  calculatePercentage,
} from "../lib/grading";

interface ReportData {
  id: string;
  className: string;
  learnerName: string;
  subjectName: string;
  testType: string;
  term: string;
  year: number;
  score: number;
  percentage: number;
  grade: string;
  standard: string;
  status: "Pass" | "Fail";
  educationLevel: string;
}

type SortField = "class" | "learner" | "subject" | "score" | "grade" | "status";
type SortOrder = "asc" | "desc";

// --- useResponsive ---
function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// Shared label style
const labelStyle = (t: Theme): React.CSSProperties => ({
  fontSize: 11,
  color: t.textMuted,
  fontWeight: 700,
  marginBottom: 6,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

// Shared select/input style
const inputStyle = (t: Theme, isMobile: boolean): React.CSSProperties => ({
  width: "100%",
  padding: isMobile ? "13px 12px" : "9px 11px",
  borderRadius: 8,
  border: `1px solid ${t.border}`,
  background: t.surface,
  color: t.text,
  fontSize: isMobile ? 15 : 12,
  outline: "none",
  cursor: "pointer",
  minHeight: isMobile ? 48 : 36,
  fontFamily: "inherit",
  boxSizing: "border-box",
});

export default function CustomReportScreen() {
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useResponsive();

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t: Theme = dark ? DARK : LIGHT;

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [scores, setScores] = useState<TestScoreEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedLearners, setSelectedLearners] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTestType, setSelectedTestType] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [maxScore, setMaxScore] = useState("100");

  const [sortField, setSortField] = useState<SortField>("learner");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  // Mobile: toggles between filter panel and preview
  const [mobileView, setMobileView] = useState<"filters" | "preview">(
    "filters",
  );
  // Mobile: filter drawer open state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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
      if (classesData.length > 0) setSelectedClass(classesData[0].id || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      const selectedClassEntity = classes.find((c) => c.id === selectedClass);
      const educationLevel = selectedClassEntity?.educationLevel ?? "secondary";

      let filtered = scores;
      if (selectedClass) {
        const classLearners = learners.filter(
          (l) => l.classId === selectedClass,
        );
        filtered = filtered.filter((s) =>
          classLearners.some((l) => l.id === s.learnerId),
        );
      }
      if (selectedLearners.length > 0)
        filtered = filtered.filter((s) =>
          selectedLearners.includes(s.learnerId),
        );
      if (selectedSubjects.length > 0)
        filtered = filtered.filter((s) =>
          selectedSubjects.includes(s.subjectId),
        );
      if (selectedTerm)
        filtered = filtered.filter((s) => s.term === selectedTerm);
      filtered = filtered.filter((s) => s.year === selectedYear);
      if (selectedTestType)
        filtered = filtered.filter((s) => s.testType === selectedTestType);
      const minVal = parseInt(minScore, 10) || 0;
      const maxVal = parseInt(maxScore, 10) || 100;
      filtered = filtered.filter((s) => s.score >= minVal && s.score <= maxVal);

      const report: ReportData[] = filtered.map((s, idx) => {
        const subject = subjects.find((sb) => sb.id === s.subjectId);
        const maxMark = subject?.maxMark ?? 100;
        const percentage = calculatePercentage(s.score, maxMark);
        const grade = getGradeLabel(s.score, maxMark, educationLevel);
        const standard = getGradeStandard(s.score, maxMark, educationLevel);
        const passed = isPassingGrade(s.score, maxMark, educationLevel);
        return {
          id: `${s.learnerId}-${s.subjectId}-${s.term}-${idx}`,
          className:
            classes.find(
              (c) =>
                learners.find((l) => l.id === s.learnerId)?.classId === c.id,
            )?.className || "Unknown",
          learnerName:
            learners.find((l) => l.id === s.learnerId)?.name || "Unknown",
          subjectName: subject?.subjectName || "Unknown",
          testType: s.testType,
          term: s.term,
          year: s.year,
          score: s.score,
          percentage: Math.round(percentage * 10) / 10,
          grade,
          standard,
          status: passed ? "Pass" : "Fail",
          educationLevel,
        };
      });

      setReportData(report);
      setShowPreview(true);
      if (isMobile) setMobileView("preview");
      if (isMobile) setFilterDrawerOpen(false);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleReset = () => {
    setSelectedLearners([]);
    setSelectedSubjects([]);
    setSelectedTerm("");
    setSelectedTestType("");
    setMinScore("0");
    setMaxScore("100");
    setReportData([]);
    setShowPreview(false);
    setMobileView("filters");
  };

  const sortedReportData = useMemo(() => {
    return [...reportData].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case "class":
          aVal = a.className;
          bVal = b.className;
          break;
        case "learner":
          aVal = a.learnerName;
          bVal = b.learnerName;
          break;
        case "subject":
          aVal = a.subjectName;
          bVal = b.subjectName;
          break;
        case "score":
          aVal = a.percentage;
          bVal = b.percentage;
          break;
        case "grade":
          aVal = a.grade;
          bVal = b.grade;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.learnerName;
          bVal = b.learnerName;
      }
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [reportData, sortField, sortOrder]);

  const summaryStats = useMemo(() => {
    if (reportData.length === 0)
      return {
        totalRecords: 0,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        averageScore: 0,
      };
    const passCount = reportData.filter((r) => r.status === "Pass").length;
    const failCount = reportData.filter((r) => r.status === "Fail").length;
    const avgScore =
      reportData.reduce((sum, r) => sum + r.percentage, 0) / reportData.length;
    return {
      totalRecords: reportData.length,
      passCount,
      failCount,
      passRate: Math.round((passCount / reportData.length) * 100),
      averageScore: Math.round(avgScore * 10) / 10,
    };
  }, [reportData]);

  const exportToCSV = () => {
    if (reportData.length === 0) return;
    const headers = [
      "Class",
      "Learner",
      "Subject",
      "Test Type",
      "Term",
      "Year",
      "Score",
      "Percentage",
      "Grade",
      "Standard",
      "Status",
    ];
    const rows = sortedReportData.map((r) => [
      r.className,
      r.learnerName,
      r.subjectName,
      r.testType,
      r.term,
      r.year,
      r.score,
      r.percentage,
      r.grade,
      r.standard,
      r.status,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `RankIT_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPDF = () => {
    if (reportData.length === 0) return;
    const html = `<html><head><meta charset="utf-8"><title>RankIT ZM Report</title><style>body{font-family:'Segoe UI',Arial,sans-serif;margin:20px;color:#333}h1{color:#2D7D4D;text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:8px;border:1px solid #ddd;text-align:left}th{background:#2D7D4D;color:#fff}.pass{color:#2D7D4D;font-weight:bold}.fail{color:#D32F2F;font-weight:bold}</style></head><body><h1>RankIT ZM - Custom Report</h1><table><thead><tr><th>Class</th><th>Learner</th><th>Subject</th><th>Grade</th><th>Score %</th><th>Status</th></tr></thead><tbody>${sortedReportData.map((r) => `<tr><td>${r.className}</td><td>${r.learnerName}</td><td>${r.subjectName}</td><td>${r.grade}</td><td>${r.percentage}%</td><td class="${r.status.toLowerCase()}">${r.status}</td></tr>`).join("")}</tbody></table></body></html>`;
    const a = document.createElement("a");
    a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    a.download = `RankIT_Report_${new Date().toISOString().split("T")[0]}.html`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const classLearners = selectedClass
    ? learners.filter((l) => l.classId === selectedClass)
    : [];
  const classSubjects = selectedClass
    ? subjects.filter((s) => s.classId === selectedClass)
    : [];
  const activeFilters = [
    selectedClass ? 1 : 0,
    selectedLearners.length > 0 ? 1 : 0,
    selectedSubjects.length > 0 ? 1 : 0,
    selectedTerm ? 1 : 0,
    selectedTestType ? 1 : 0,
    minScore !== "0" || maxScore !== "100" ? 1 : 0,
  ].filter(Boolean).length;

  // --- FILTER PANEL (shared between drawer and sidebar) ---
  const FilterPanel = () => (
    <div>
      <div
        style={{
          display: "flex",
          height: 3,
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {(ZAMBIA_FLAG as string[]).map((c) => (
          <div key={c} style={{ flex: 1, background: c }} />
        ))}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: t.text,
          marginBottom: 14,
        }}
      >
        Filters
      </div>

      {/* Class */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle(t)}>Class</label>
        <select
          value={selectedClass || ""}
          onChange={(e) => {
            setSelectedClass(
              e.target.value ? parseInt(e.target.value, 10) : null,
            );
            setSelectedLearners([]);
            setSelectedSubjects([]);
          }}
          style={inputStyle(t, isMobile)}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.className}
            </option>
          ))}
        </select>
      </div>

      {/* Learners */}
      {classLearners.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle(t)}>
            Learners ({selectedLearners.length})
          </label>
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              maxHeight: 150,
              overflowY: "auto",
            }}
          >
            {classLearners.map((l) => (
              <label
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: isMobile ? "13px 12px" : "9px 11px",
                  borderBottom: `1px solid ${t.borderSub}`,
                  cursor: "pointer",
                  fontSize: isMobile ? 14 : 12,
                  minHeight: isMobile ? 48 : 36,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLearners.includes(l.id!)}
                  onChange={(e) =>
                    setSelectedLearners(
                      e.target.checked
                        ? [...selectedLearners, l.id!]
                        : selectedLearners.filter((id) => id !== l.id),
                    )
                  }
                  style={{
                    marginRight: 10,
                    cursor: "pointer",
                    width: 18,
                    height: 18,
                  }}
                />
                {l.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Subjects */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle(t)}>
          Subjects ({selectedSubjects.length})
        </label>
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            maxHeight: 150,
            overflowY: "auto",
          }}
        >
          {classSubjects.length > 0 ? (
            classSubjects.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: isMobile ? "13px 12px" : "9px 11px",
                  borderBottom: `1px solid ${t.borderSub}`,
                  cursor: "pointer",
                  fontSize: isMobile ? 14 : 12,
                  minHeight: isMobile ? 48 : 36,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(s.id!)}
                  onChange={(e) =>
                    setSelectedSubjects(
                      e.target.checked
                        ? [...selectedSubjects, s.id!]
                        : selectedSubjects.filter((id) => id !== s.id),
                    )
                  }
                  style={{
                    marginRight: 10,
                    cursor: "pointer",
                    width: 18,
                    height: 18,
                  }}
                />
                {s.subjectName}
              </label>
            ))
          ) : (
            <div style={{ padding: 12, color: t.textMuted, fontSize: 12 }}>
              Select a class first
            </div>
          )}
        </div>
      </div>

      {/* Term */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle(t)}>Term</label>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          style={inputStyle(t, isMobile)}
        >
          <option value="">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
      </div>

      {/* Year */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle(t)}>Year</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          style={inputStyle(t, isMobile)}
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Test Type */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle(t)}>Test Type</label>
        <select
          value={selectedTestType}
          onChange={(e) => setSelectedTestType(e.target.value)}
          style={inputStyle(t, isMobile)}
        >
          <option value="">All Types</option>
          <option value="endofterm">End of Term</option>
          <option value="midterm">Mid Term</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {/* Score Range */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div>
          <label style={labelStyle(t)}>Min Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            style={inputStyle(t, isMobile)}
          />
        </div>
        <div>
          <label style={labelStyle(t)}>Max Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            style={inputStyle(t, isMobile)}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          onClick={generateReport}
          disabled={generatingReport}
          style={{
            padding: isMobile ? "14px" : "12px",
            borderRadius: 8,
            background: t.accent,
            color: "white",
            border: "none",
            cursor: generatingReport ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: isMobile ? 14 : 13,
            opacity: generatingReport ? 0.6 : 1,
            minHeight: isMobile ? 52 : 40,
          }}
        >
          {generatingReport ? "Generating..." : "Generate"}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: isMobile ? "14px" : "12px",
            borderRadius: 8,
            background: t.surfaceAlt,
            color: t.text,
            border: `1px solid ${t.border}`,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: isMobile ? 14 : 13,
            minHeight: isMobile ? 52 : 40,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );

  // --- PREVIEW PANEL ---
  const PreviewPanel = () => (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 16,
        ...(isDesktop
          ? { maxHeight: "calc(100vh - 120px)", overflowY: "auto" }
          : {}),
      }}
    >
      {/* Preview header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          paddingBottom: 14,
          borderBottom: `1px solid ${t.border}`,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
            Report Preview
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
            {reportData.length} records
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={exportToCSV}
            disabled={reportData.length === 0}
            style={{
              padding: isMobile ? "10px 14px" : "8px 12px",
              borderRadius: 8,
              background: t.accentBg,
              color: t.accent,
              border: `1px solid ${t.accent}40`,
              cursor: reportData.length === 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              minHeight: isMobile ? 44 : 34,
            }}
          >
            ↓ CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={reportData.length === 0}
            style={{
              padding: isMobile ? "10px 14px" : "8px 12px",
              borderRadius: 8,
              background: t.redBg,
              color: t.red,
              border: `1px solid ${t.red}40`,
              cursor: reportData.length === 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              minHeight: isMobile ? 44 : 34,
            }}
          >
            ↓ PDF
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {reportData.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginBottom: 16,
            padding: 12,
            background: t.surfaceAlt,
            borderRadius: 8,
          }}
        >
          {[
            {
              label: "Total",
              value: summaryStats.totalRecords,
              color: t.accent,
            },
            { label: "Pass", value: summaryStats.passCount, color: t.accent },
            { label: "Fail", value: summaryStats.failCount, color: t.red },
            {
              label: "Avg %",
              value: `${summaryStats.averageScore}%`,
              color: t.accent,
            },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 10,
                  color: t.textMuted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: s.color,
                  marginTop: 4,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {reportData.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: t.textMuted,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>
            No data matches your filters
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 600,
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ background: t.surfaceAlt }}>
                {[
                  { label: "Class", field: "class" },
                  { label: "Learner", field: "learner" },
                  { label: "Subject", field: "subject" },
                  { label: "Grade", field: "grade" },
                  { label: "Score %", field: "score" },
                  { label: "Status", field: "status" },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => {
                      setSortField(col.field as SortField);
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}{" "}
                    {sortField === col.field &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedReportData.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: `1px solid ${t.borderSub}`,
                    background: idx % 2 === 0 ? "transparent" : t.surfaceAlt,
                  }}
                >
                  <td
                    style={{ padding: "10px", color: t.text, fontWeight: 500 }}
                  >
                    {row.className}
                  </td>
                  <td style={{ padding: "10px", color: t.text }}>
                    {row.learnerName}
                  </td>
                  <td style={{ padding: "10px", color: t.textSub }}>
                    {row.subjectName}
                  </td>
                  <td
                    style={{ padding: "10px", color: t.text, fontWeight: 700 }}
                  >
                    {row.grade}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontWeight: 700,
                      color:
                        row.percentage >= 75
                          ? t.accent
                          : row.percentage >= 50
                            ? t.orange
                            : t.red,
                    }}
                  >
                    {row.percentage}%
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontWeight: 600,
                      color: row.status === "Pass" ? t.accent : t.red,
                    }}
                  >
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: t.bg,
        color: t.text,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "12px 14px" : "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0,
          boxShadow: `0 1px 2px ${t.shadow}`,
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
              padding: 6,
              display: "flex",
              borderRadius: 6,
              minWidth: 44,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
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
            <div
              style={{
                fontSize: isMobile ? 14 : 15,
                fontWeight: 700,
                color: t.text,
              }}
            >
              Custom Report
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                Generate & export customized reports
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Mobile: filter toggle button */}
          {isMobile && (
            <button
              onClick={() => setFilterDrawerOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                minHeight: 44,
                background: t.accentBg,
                color: t.accent,
                border: `1px solid ${t.accent}40`,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width={16}
                height={16}
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-.553.894l-4 2A1 1 0 017 19v-8.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
              Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
          )}

          {/* Active filter badge — non-mobile */}
          {activeFilters > 0 && !isMobile && (
            <div
              style={{
                background: t.accentBg,
                color: t.accent,
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {activeFilters} active
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setDark((v) => !v)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.textMuted,
            }}
          >
            {dark ? (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width={16}
                height={16}
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width={16}
                height={16}
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* MOBILE: tab switcher when preview is available */}
      {isMobile && showPreview && (
        <div
          style={{
            display: "flex",
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            padding: "0 12px",
          }}
        >
          {(["filters", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileView(tab)}
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                color: mobileView === tab ? t.accent : t.textMuted,
                borderBottom:
                  mobileView === tab
                    ? `2px solid ${t.accent}`
                    : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {tab === "filters" ? "Filters" : `Preview (${reportData.length})`}
            </button>
          ))}
        </div>
      )}

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "16px 12px" : "20px 24px",
          overflowY: "auto",
          ...(isDesktop && showPreview
            ? {
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: 20,
                alignItems: "start",
              }
            : {}),
        }}
      >
        {/* Filter panel — desktop always visible, mobile only on "filters" tab */}
        {(!isMobile || mobileView === "filters") && (
          <div style={{ background: "transparent" }}>
            <FilterPanel />
          </div>
        )}

        {/* Preview — desktop always visible (when shown), mobile only on "preview" tab */}
        {showPreview && (!isMobile || mobileView === "preview") && (
          <PreviewPanel />
        )}
      </main>

      {/* MOBILE FILTER DRAWER (bottom sheet) */}
      {isMobile && filterDrawerOpen && (
        <div
          onClick={() => setFilterDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 60,
            display: "flex",
            alignItems: "flex-end",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface,
              borderRadius: "20px 20px 0 0",
              padding: "20px 16px 32px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "slideUp 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
                marginTop: -8,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: t.border,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>
                Filters
              </div>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                style={{
                  background: t.surfaceAlt,
                  border: "none",
                  color: t.textMuted,
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
