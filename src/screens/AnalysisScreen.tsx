import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  db,
  TestScoreEntity,
  LearnerEntity,
  ClassEntity,
  SubjectEntity,
} from "../db";
import { isPrimaryEducation, type EducationLevel } from "../lib/grading";

// Mobile-responsive hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024,
  );
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

// ==================== Themes ====================

const LIGHT = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  textMuted: "#6B7280",
  accent: "#10B981",
  accentLighter: "#ECFDF5",
  red: "#EF4444",
  redBg: "#FEE2E2",
  shadow: "rgba(17, 24, 39, 0.04)",
};

const DARK = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#334155",
  border: "#475569",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  accent: "#10B981",
  accentLighter: "#052E16",
  red: "#F87171",
  redBg: "#7F1D1D",
  shadow: "rgba(0, 0, 0, 0.2)",
};

type Theme = typeof LIGHT;

// ==================== Interfaces ====================

interface QualityPassBreakdown {
  grade: string;
  range: string;
  students: number;
  percentage: number;
}

interface AnalyticsData {
  totalStudents: number;
  studentsPresent: number;
  studentsAbsent: number;
  maleCount: number;
  femaleCount: number;
  totalPassed: number;
  totalFailed: number;
  qualityPassRate: number;
  quantityPassRate: number;
  maleQualityPass: number;
  maleQuantityPass: number;
  femaleQualityPass: number;
  femaleQuantityPass: number;
  subjectAnalysis: Array<{
    name: string;
    quantityPassRate: number;
    qualityPassRate: number;
    highestScore: number;
    lowestScore: number;
  }>;
  qualityPassBreakdown: QualityPassBreakdown[];
}

// ==================== Main Component ====================

export default function AnalyticsReportScreen() {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [dark, setDark] = useState(false);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [scores, setScores] = useState<TestScoreEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const t: Theme = dark ? DARK : LIGHT;

  const selectedClassEntity = useMemo(
    () => classes.find((c) => c.id === selectedClass) || null,
    [classes, selectedClass],
  );

  const currentLevel = selectedClassEntity?.educationLevel || "secondary";

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      calculateAnalytics();
    }
  }, [selectedClass, selectedTerm, learners, scores, subjects, classes]);

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
        setSelectedClass(classesData[0].id || null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    if (!selectedClassEntity) return;

    const classLearners = learners.filter((l) => l.classId === selectedClass);
    const classLearnerIds = new Set(
      classLearners.map((l) => l.id).filter((id) => id != null),
    );

    const filteredScores = scores.filter(
      (s) =>
        classLearnerIds.has(s.learnerId) &&
        (!selectedTerm || s.term === selectedTerm),
    );

    const totalStudents = classLearners.length;
    const studentsPresent = new Set(filteredScores.map((s) => s.learnerId))
      .size;
    const studentsAbsent = totalStudents - studentsPresent;

    const maleCount = classLearners.filter(
      (l) => l.gender?.toLowerCase() === "male",
    ).length;
    const femaleCount = classLearners.filter(
      (l) => l.gender?.toLowerCase() === "female",
    ).length;

    const isPrimary = isPrimaryEducation(currentLevel);

    const learnerPerformanceList = new Map<
      number,
      {
        learnerId: number;
        avgScore: number;
        gender?: string;
        subjectsPassedCount?: number;
        totalMarks?: number;
        hasPassed: boolean;
        isQualityPass: boolean;
      }
    >();

    classLearners.forEach((learner) => {
      if (learner.id) {
        const studentScores = filteredScores.filter(
          (s) => s.learnerId === learner.id,
        );
        if (studentScores.length > 0) {
          const totalMarks = studentScores.reduce((sum, s) => sum + s.score, 0);
          const avgScore = totalMarks / studentScores.length;

          let hasPassed = false;
          let isQualityPass = false;
          let subjectsPassedCount = 0;

          if (isPrimary) {
            hasPassed = totalMarks >= 50;
            isQualityPass = avgScore >= 60;
          } else {
            const passedSubjects = new Set(
              studentScores
                .filter((s) => s.score >= 40)
                .map((s) => s.subjectId),
            );
            subjectsPassedCount = passedSubjects.size;
            hasPassed = subjectsPassedCount >= 6;
            isQualityPass = avgScore >= 60;
          }

          learnerPerformanceList.set(learner.id, {
            learnerId: learner.id,
            avgScore,
            gender: learner.gender,
            subjectsPassedCount,
            totalMarks,
            hasPassed,
            isQualityPass,
          });
        }
      }
    });

    const learnerPerformance = Array.from(learnerPerformanceList.values());

    const totalPassed = learnerPerformance.filter((p) => p.hasPassed).length;
    const totalFailed = learnerPerformance.length - totalPassed;
    const qualityPassed = learnerPerformance.filter(
      (p) => p.isQualityPass,
    ).length;

    const malePerformance = learnerPerformance.filter(
      (p) => p.gender?.toLowerCase() === "male",
    );
    const femalePerformance = learnerPerformance.filter(
      (p) => p.gender?.toLowerCase() === "female",
    );

    const maleQuantityPass = malePerformance.filter((p) => p.hasPassed).length;
    const maleQualityPass = malePerformance.filter(
      (p) => p.isQualityPass,
    ).length;
    const femaleQuantityPass = femalePerformance.filter(
      (p) => p.hasPassed,
    ).length;
    const femaleQualityPass = femalePerformance.filter(
      (p) => p.isQualityPass,
    ).length;

    const subjectMap = new Map<number, { scores: number[]; name: string }>();

    filteredScores.forEach((s) => {
      if (!subjectMap.has(s.subjectId)) {
        const subject = subjects.find((sub) => sub.id === s.subjectId);
        subjectMap.set(s.subjectId, {
          scores: [],
          name: subject?.subjectName || `Subject ${s.subjectId}`,
        });
      }
      subjectMap.get(s.subjectId)!.scores.push(s.score);
    });

    let qualityPassThreshold = 60;

    const subjectAnalysis = Array.from(subjectMap.entries())
      .map(([, { scores: subjectScores, name }]) => {
        const quantityPassed = subjectScores.filter((s) => s >= 40).length;
        const qualityPassed = subjectScores.filter(
          (s) => s >= qualityPassThreshold,
        ).length;
        return {
          name,
          quantityPassRate: (quantityPassed / subjectScores.length) * 100,
          qualityPassRate: (qualityPassed / subjectScores.length) * 100,
          highestScore: Math.max(...subjectScores),
          lowestScore: Math.min(...subjectScores),
        };
      })
      .sort((a, b) => b.qualityPassRate - a.qualityPassRate);

    const qualityPassBreakdown: QualityPassBreakdown[] = isPrimary
      ? [
          {
            grade: "Grade 1 (75-100%)",
            range: "75%+",
            students: learnerPerformance.filter((p) => p.avgScore >= 75).length,
            percentage: 0,
          },
          {
            grade: "Grade 2 (60-74%)",
            range: "60-74%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 60 && p.avgScore < 75,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 3 (50-59%)",
            range: "50-59%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 50 && p.avgScore < 60,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 4 (40-49%)",
            range: "40-49%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 40 && p.avgScore < 50,
            ).length,
            percentage: 0,
          },
          {
            grade: "Fail (0-39%)",
            range: "0-39%",
            students: learnerPerformance.filter((p) => p.avgScore < 40).length,
            percentage: 0,
          },
        ]
      : [
          {
            grade: "Grade 1 (75-100%)",
            range: "75-100%",
            students: learnerPerformance.filter((p) => p.avgScore >= 75).length,
            percentage: 0,
          },
          {
            grade: "Grade 2 (70-74%)",
            range: "70-74%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 70 && p.avgScore < 75,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 3 (65-69%)",
            range: "65-69%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 65 && p.avgScore < 70,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 4 (60-64%)",
            range: "60-64%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 60 && p.avgScore < 65,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 5 (55-59%)",
            range: "55-59%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 55 && p.avgScore < 60,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 6 (50-54%)",
            range: "50-54%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 50 && p.avgScore < 55,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 7 (45-49%)",
            range: "45-49%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 45 && p.avgScore < 50,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 8 (40-44%)",
            range: "40-44%",
            students: learnerPerformance.filter(
              (p) => p.avgScore >= 40 && p.avgScore < 45,
            ).length,
            percentage: 0,
          },
          {
            grade: "Grade 9 (0-39%)",
            range: "0-39%",
            students: learnerPerformance.filter((p) => p.avgScore < 40).length,
            percentage: 0,
          },
        ];

    qualityPassBreakdown.forEach((item) => {
      item.percentage =
        learnerPerformance.length > 0
          ? (item.students / learnerPerformance.length) * 100
          : 0;
    });

    setAnalytics({
      totalStudents,
      studentsPresent,
      studentsAbsent,
      maleCount,
      femaleCount,
      totalPassed,
      totalFailed,
      qualityPassRate:
        learnerPerformance.length > 0
          ? (qualityPassed / learnerPerformance.length) * 100
          : 0,
      quantityPassRate:
        learnerPerformance.length > 0
          ? (totalPassed / learnerPerformance.length) * 100
          : 0,
      maleQualityPass,
      maleQuantityPass,
      femaleQualityPass,
      femaleQuantityPass,
      subjectAnalysis,
      qualityPassBreakdown,
    });
  };

  const exportToPDF = async () => {
    if (!analytics || !selectedClassEntity) return;
    setExporting(true);

    try {
      let schoolName = "School Report";
      try {
        const schoolData = await db.getSchool(1);
        const cachedSettings = localStorage.getItem("rankitz-school-settings");
        if (schoolData?.schoolName) {
          schoolName = schoolData.schoolName;
        } else if (cachedSettings) {
          const parsed = JSON.parse(cachedSettings);
          schoolName = parsed.schoolName || "School Report";
        }
      } catch (e) {}

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
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
      pdf.text(schoolName.toUpperCase(), pageWidth / 2, 20, {
        align: "center",
      });
      pdf.setFontSize(9);
      pdf.text("CLASS ANALYTICS REPORT", pageWidth / 2, 26, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(
        `${selectedClassEntity.className} • ${currentLevel.toUpperCase()} • ${selectedTerm || "All Terms"} • ${new Date().toLocaleDateString()}`,
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

      // ── SUMMARY STATS ──
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("OVERALL SUMMARY", margin, y);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
      y += 5;

      const boxW = (contentWidth - 9) / 4;
      const summaryItems = [
        { l: "TOTAL STUDENTS", v: analytics.totalStudents.toString() },
        { l: "PRESENT", v: analytics.studentsPresent.toString() },
        { l: "QTY PASS RATE", v: `${analytics.quantityPassRate.toFixed(1)}%` },
        { l: "QUALITY PASS", v: `${analytics.qualityPassRate.toFixed(1)}%` },
      ];
      summaryItems.forEach((item, i) => {
        const bx = margin + i * (boxW + 3);
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(bx, y, boxW, 14, 1.5, 1.5, "FD");
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        pdf.setFont("helvetica", "bold");
        pdf.text(item.l, bx + boxW / 2, y + 5, { align: "center" });
        pdf.setFontSize(11);
        pdf.setTextColor(5, 150, 105);
        pdf.text(item.v, bx + boxW / 2, y + 11, { align: "center" });
      });
      y += 20;

      // ── GENDER PERFORMANCE ──
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("GENDER PERFORMANCE", margin, y);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
      y += 4;

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [
          [
            "Gender",
            "Total",
            "Qty Pass",
            "Qty Pass %",
            "Quality Pass",
            "Quality Pass %",
          ],
        ],
        body: [
          [
            "Male",
            analytics.maleCount,
            analytics.maleQuantityPass,
            analytics.maleCount > 0
              ? `${((analytics.maleQuantityPass / analytics.maleCount) * 100).toFixed(1)}%`
              : "0%",
            analytics.maleQualityPass,
            analytics.maleCount > 0
              ? `${((analytics.maleQualityPass / analytics.maleCount) * 100).toFixed(1)}%`
              : "0%",
          ],
          [
            "Female",
            analytics.femaleCount,
            analytics.femaleQuantityPass,
            analytics.femaleCount > 0
              ? `${((analytics.femaleQuantityPass / analytics.femaleCount) * 100).toFixed(1)}%`
              : "0%",
            analytics.femaleQualityPass,
            analytics.femaleCount > 0
              ? `${((analytics.femaleQualityPass / analytics.femaleCount) * 100).toFixed(1)}%`
              : "0%",
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
        },
        bodyStyles: { fontSize: 8, halign: "center", textColor: [17, 24, 39] },
        columnStyles: { 0: { fontStyle: "bold", halign: "left" } },
      });

      y = (pdf as any).lastAutoTable.finalY + 8;

      // ── SUBJECT ANALYSIS ──
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("SUBJECT ANALYSIS", margin, y);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
      y += 4;

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [
          ["Subject", "Qty Pass %", "Quality Pass %", "Highest", "Lowest"],
        ],
        body: analytics.subjectAnalysis.map((s) => [
          s.name,
          `${s.quantityPassRate.toFixed(0)}%`,
          `${s.qualityPassRate.toFixed(0)}%`,
          s.highestScore.toFixed(0),
          s.lowestScore.toFixed(0),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
        },
        bodyStyles: { fontSize: 8, textColor: [17, 24, 39] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: "left", fontStyle: "bold" },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
        },
      });

      y = (pdf as any).lastAutoTable.finalY + 8;

      // ── GRADE DISTRIBUTION ──
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("GRADE DISTRIBUTION", margin, y);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
      y += 4;

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Grade", "Range", "Students", "%"]],
        body: analytics.qualityPassBreakdown.map((item) => [
          item.grade,
          item.range,
          item.students,
          `${item.percentage.toFixed(1)}%`,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
        },
        bodyStyles: { fontSize: 8, textColor: [17, 24, 39] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: "left", fontStyle: "bold" },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
        },
      });

      // ── FOOTER on every page ──
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(156, 163, 175);
        pdf.setDrawColor(229, 231, 235);
        (pdf as any).setLineDash([1, 1], 0);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        (pdf as any).setLineDash([], 0);
        pdf.text(
          "RankItZM Analytics Report • School Management System",
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
        `Analytics_${selectedClassEntity.className}_${selectedTerm || "AllTerms"}.pdf`,
      );
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF: " + (err as any).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        background: t.bg,
        color: t.text,
        minHeight: "100vh",
        padding: isMobile ? "16px" : isTablet ? "18px" : "20px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: isMobile ? 20 : 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 0,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? 24 : 32,
              fontWeight: 800,
              margin: "0 0 10px 0",
            }}
          >
            Analytics Report
          </h1>
          <p
            style={{
              fontSize: isMobile ? 12 : 14,
              color: t.textMuted,
              margin: 0,
            }}
          >
            Comprehensive class performance analysis
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {analytics && selectedClassEntity && (
            <button
              onClick={exportToPDF}
              disabled={exporting}
              style={{
                padding: isMobile ? "9px 12px" : "10px 16px",
                borderRadius: 8,
                border: "none",
                background: t.accent,
                color: "white",
                cursor: exporting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: isMobile ? 11 : 13,
                opacity: exporting ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {exporting
                ? "Generating…"
                : isMobile
                  ? "📥 PDF"
                  : "📥 Export PDF (A4)"}
            </button>
          )}
          <button
            onClick={() => setDark(!dark)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.surface,
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div
        style={{
          marginBottom: isMobile ? 20 : 30,
          display: "flex",
          gap: isMobile ? 8 : 12,
          flexWrap: "wrap",
        }}
      >
        <select
          value={selectedClass || ""}
          onChange={(e) =>
            setSelectedClass(
              e.target.value ? parseInt(e.target.value, 10) : null,
            )
          }
          style={{
            padding: isMobile ? "8px 10px" : "10px 12px",
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            fontSize: isMobile ? 12 : 13,
            fontWeight: 600,
            flex: isMobile ? "1 1 100%" : "auto",
          }}
        >
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.className} ({c.educationLevel})
            </option>
          ))}
        </select>

        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          style={{
            padding: isMobile ? "8px 10px" : "10px 12px",
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            fontSize: isMobile ? 12 : 13,
            fontWeight: 600,
            flex: isMobile ? "1 1 100%" : "auto",
          }}
        >
          <option value="">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
      </div>

      {loading || !analytics || !selectedClassEntity ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: t.textMuted }}>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Overall Summary */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: isMobile ? 16 : 20,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700,
                margin: "0 0 14px 0",
              }}
            >
              OVERALL SUMMARY
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, 1fr)"
                  : isTablet
                    ? "repeat(3, 1fr)"
                    : "repeat(auto-fit, minmax(200px, 1fr))",
                gap: isMobile ? 10 : 16,
              }}
            >
              <SummaryItem
                label="Total Students"
                value={analytics.totalStudents}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Present"
                value={analytics.studentsPresent}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Absent"
                value={analytics.studentsAbsent}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Male"
                value={analytics.maleCount}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Female"
                value={analytics.femaleCount}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Passed"
                value={analytics.totalPassed}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Failed"
                value={analytics.totalFailed}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Quality Pass"
                value={`${analytics.qualityPassRate.toFixed(1)}%`}
                t={t}
                isMobile={isMobile}
              />
              <SummaryItem
                label="Qty Pass"
                value={`${analytics.quantityPassRate.toFixed(1)}%`}
                t={t}
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* Gender Performance */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: isMobile ? 16 : 20,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700,
                margin: "0 0 14px 0",
              }}
            >
              GENDER PERFORMANCE
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? 12 : 16,
              }}
            >
              <GenderPerformanceBox
                title={`Male Students (${analytics.maleCount})`}
                qualityPass={analytics.maleQualityPass}
                quantityPass={analytics.maleQuantityPass}
                total={analytics.maleCount}
                t={t}
                isMobile={isMobile}
              />
              <GenderPerformanceBox
                title={`Female Students (${analytics.femaleCount})`}
                qualityPass={analytics.femaleQualityPass}
                quantityPass={analytics.femaleQuantityPass}
                total={analytics.femaleCount}
                t={t}
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* Subject Analysis */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: isMobile ? 14 : 20,
              marginBottom: 20,
              overflowX: "auto",
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700,
                margin: "0 0 14px 0",
              }}
            >
              SUBJECT ANALYSIS
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: isMobile ? "350px" : "600px",
                  fontSize: isMobile ? 11 : 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "left",
                        fontWeight: 700,
                      }}
                    >
                      Subject
                    </th>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: isMobile ? 10 : 12,
                      }}
                    >
                      Qty %
                    </th>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: isMobile ? 10 : 12,
                      }}
                    >
                      Qlt %
                    </th>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: isMobile ? 10 : 12,
                      }}
                    >
                      High
                    </th>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: isMobile ? 10 : 12,
                      }}
                    >
                      Low
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.subjectAnalysis.map((subject, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: `1px solid ${t.border}`,
                        background:
                          idx % 2 === 0 ? t.surfaceAlt : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          fontWeight: 600,
                        }}
                      >
                        {isMobile
                          ? subject.name.substring(0, 10)
                          : subject.name}
                      </td>
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {subject.quantityPassRate.toFixed(0)}%
                      </td>
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {subject.qualityPassRate.toFixed(0)}%
                      </td>
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {subject.highestScore.toFixed(0)}
                      </td>
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {subject.lowestScore.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Pass Analysis */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: isMobile ? 14 : 20,
              marginBottom: 20,
              overflowX: "auto",
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700,
                margin: "0 0 14px 0",
              }}
            >
              GRADE DISTRIBUTION
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: isMobile ? "280px" : "400px",
                  fontSize: isMobile ? 11 : 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "left",
                        fontWeight: 700,
                      }}
                    >
                      Grade
                    </th>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: isMobile ? 10 : 12,
                      }}
                    >
                      Students
                    </th>
                    <th
                      style={{
                        padding: isMobile ? 8 : 12,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: isMobile ? 10 : 12,
                      }}
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.qualityPassBreakdown.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: `1px solid ${t.border}`,
                        background:
                          idx % 2 === 0 ? t.surfaceAlt : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          fontWeight: 600,
                          fontSize: isMobile ? 10 : 13,
                        }}
                      >
                        {item.grade}
                      </td>
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {item.students}
                      </td>
                      <td
                        style={{
                          padding: isMobile ? 8 : 12,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Passing Criteria Info */}
          <div
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: isMobile ? 12 : 16,
              marginTop: 20,
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? 13 : 14,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              📋 Passing Criteria
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? 12 : 16,
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    color: t.textMuted,
                    marginBottom: 6,
                  }}
                >
                  PRIMARY
                </h4>
                <ul
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    margin: 0,
                    paddingLeft: 16,
                    lineHeight: "1.6",
                  }}
                >
                  <li>Pass: ≥50 marks</li>
                  <li>Quality: ≥60% avg</li>
                  <li>Grade 1: 75%+</li>
                  <li>Grade 2: 60-74%</li>
                </ul>
              </div>
              <div>
                <h4
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    color: t.textMuted,
                    marginBottom: 6,
                  }}
                >
                  SECONDARY
                </h4>
                <ul
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    margin: 0,
                    paddingLeft: 16,
                    lineHeight: "1.6",
                  }}
                >
                  <li>Pass: 6+ subjects</li>
                  <li>Quality: ≥60% avg</li>
                  <li>Grade 1: 75%+</li>
                  <li>Grade 9: 0-39%</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

// ==================== Helper Components ====================

function SummaryItem(props: {
  label: string;
  value: string | number;
  t: Theme;
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        background: props.t.surfaceAlt,
        padding: props.isMobile ? 10 : 12,
        borderRadius: 8,
        border: `1px solid ${props.t.border}`,
      }}
    >
      <div
        style={{
          fontSize: props.isMobile ? 10 : 11,
          fontWeight: 600,
          color: props.t.textMuted,
          marginBottom: 4,
        }}
      >
        {props.label}
      </div>
      <div
        style={{
          fontSize: props.isMobile ? 16 : 20,
          fontWeight: 800,
          color: props.t.text,
        }}
      >
        {props.value}
      </div>
    </div>
  );
}

function GenderPerformanceBox(props: {
  title: string;
  qualityPass: number;
  quantityPass: number;
  total: number;
  t: Theme;
  isMobile: boolean;
}) {
  const qualityPassRate =
    props.total > 0
      ? ((props.qualityPass / props.total) * 100).toFixed(1)
      : "0.0";
  const quantityPassRate =
    props.total > 0
      ? ((props.quantityPass / props.total) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      style={{
        background: props.t.surfaceAlt,
        padding: props.isMobile ? 12 : 16,
        borderRadius: 8,
        border: `1px solid ${props.t.border}`,
      }}
    >
      <h3
        style={{
          fontSize: props.isMobile ? 13 : 14,
          fontWeight: 700,
          margin: "0 0 10px 0",
        }}
      >
        {props.title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: props.isMobile ? 11 : 12,
              fontWeight: 600,
              color: props.t.textMuted,
            }}
          >
            Quality Pass:
          </span>
          <span
            style={{
              fontSize: props.isMobile ? 11 : 12,
              fontWeight: 700,
              color: props.t.text,
            }}
          >
            {qualityPassRate}%
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: props.isMobile ? 11 : 12,
              fontWeight: 600,
              color: props.t.textMuted,
            }}
          >
            Quantity Pass:
          </span>
          <span
            style={{
              fontSize: props.isMobile ? 11 : 12,
              fontWeight: 700,
              color: props.t.text,
            }}
          >
            {quantityPassRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
