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

// --- ZAMBIAN EDUCATION SYSTEM GRADING UTILITIES ---
export type EducationLevel = "primary" | "secondary" | string;

export function isPrimaryEducation(level: EducationLevel): boolean {
  return level?.toString().toLowerCase() === "primary";
}

export function calculatePercentage(score: number, outOf: number): number {
  if (outOf <= 0) return 0;
  return (score / outOf) * 100;
}

export function getPassThreshold(level: EducationLevel): number {
  return 40; // Both Primary and Secondary use 40% as passing
}

export function isPassingGrade(
  score: number,
  maxMark: number,
  level: EducationLevel,
): boolean {
  return calculatePercentage(score, maxMark) >= getPassThreshold(level);
}

export function getGradeLabel(
  score: number,
  maxMark: number,
  level: EducationLevel = "secondary",
): string {
  const percentage = calculatePercentage(score, maxMark);
  if (isPrimaryEducation(level)) {
    if (percentage >= 75) return "One";
    if (percentage >= 60) return "Two";
    if (percentage >= 50) return "Three";
    if (percentage >= 40) return "Four";
    return "Fail";
  }
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

export function getGradeStandard(
  score: number,
  maxMark: number,
  level: EducationLevel = "secondary",
): string {
  const percentage = calculatePercentage(score, maxMark);
  if (isPrimaryEducation(level)) {
    if (percentage >= 75) return "Distinction";
    if (percentage >= 60) return "Merit";
    if (percentage >= 50) return "Credit";
    if (percentage >= 40) return "Pass";
    return "Fail";
  }
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

export function getGradeColor(
  score: number,
  maxMark: number,
  level: EducationLevel = "secondary",
) {
  const percentage = calculatePercentage(score, maxMark);
  if (isPrimaryEducation(level)) {
    if (percentage >= 75)
      return { bg: "#ECFDF5", text: "#065F46", border: "#10B981" };
    if (percentage >= 60)
      return { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" };
    if (percentage >= 50)
      return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
    if (percentage >= 40)
      return { bg: "#FED7AA", text: "#B45309", border: "#F97316" };
    return { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" };
  }
  if (percentage >= 70)
    return { bg: "#ECFDF5", text: "#065F46", border: "#10B981" };
  if (percentage >= 60)
    return { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" };
  if (percentage >= 50)
    return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
  if (percentage >= 40)
    return { bg: "#FED7AA", text: "#B45309", border: "#F97316" };
  return { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" };
}

// --- TYPES ---
interface SubjectScoreDisplay {
  subject: string;
  score: number;
}
interface TestTypeAverages {
  weekly: number;
  midterm: number;
  endterm: number;
}
interface ProgressData {
  term: string;
  year: number;
  educationLevel: EducationLevel;
  averageScore: number;
  passRate: number;
  learnerCount: number;
  subjects: SubjectScoreDisplay[];
  testTypes: TestTypeAverages;
}

export default function ProgressReportScreen() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Export States
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [scores, setScores] = useState<TestScoreEntity[]>([]);
  const [subjectsDb, setSubjectsDb] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<
    "class" | "learner" | "subject"
  >("class");

  const [availableSubjectIds, setAvailableSubjectIds] = useState<number[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null,
  );
  const [subjectViewMode, setSubjectViewMode] = useState<"yearly" | "termly">(
    "yearly",
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    let isMounted = true;

    // Natively load jsPDF and AutoTable for flawless PDF generation bypassing CSS crashes
    const loadPdfLibraries = async () => {
      const loadScript = (src: string, id: string) => {
        return new Promise((resolve, reject) => {
          if (document.getElementById(id)) return resolve(true);
          const script = document.createElement("script");
          script.id = id;
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      try {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
          "jspdf-lib",
        );
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js",
          "jspdf-autotable-lib",
        );
        if (isMounted) setIsPdfReady(true);
      } catch (err) {
        console.error("Failed to load PDF libraries", err);
      }
    };

    loadPdfLibraries();

    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => {
      isMounted = false;
      window.removeEventListener("resize", fn);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      let subjectsData = [];
      try {
        if ("getAllSubjects" in db) {
          subjectsData = await (db as any).getAllSubjects();
        }
      } catch (err) {
        console.warn("Could not load subjects from DB", err);
      }

      const [classesData, learnersData, scoresData] = await Promise.all([
        db.getAllClasses(),
        db.getAllLearners(),
        db.getAllScores(),
      ]);

      setClasses(classesData);
      setLearners(learnersData);
      setScores(scoresData);
      setSubjectsDb(subjectsData);

      const uniqueSubjectIds = Array.from(
        new Set(scoresData.map((s) => s.subjectId).filter(Boolean)),
      );
      setAvailableSubjectIds(uniqueSubjectIds);

      if (classesData.length > 0) setSelectedClass(classesData[0].id || null);
      if (learnersData.length > 0)
        setSelectedLearner(learnersData[0].id || null);
      if (uniqueSubjectIds.length > 0)
        setSelectedSubjectId(uniqueSubjectIds[0]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectName = (subjectId: number): string => {
    const sub = subjectsDb.find(
      (s) => s.id === subjectId || s.subjectId === subjectId,
    );
    return sub ? sub.subjectName : `Subject ID: ${subjectId}`;
  };

  const availableYears = useMemo(() => {
    if (!selectedSubjectId) return [];
    return Array.from(
      new Set(
        scores
          .filter((s) => s.subjectId === selectedSubjectId)
          .map((s) => s.year),
      ),
    ).sort((a, b) => b - a);
  }, [scores, selectedSubjectId]);

  const availableTerms = useMemo(() => {
    if (!selectedSubjectId || !selectedYear) return [];
    return Array.from(
      new Set(
        scores
          .filter(
            (s) => s.subjectId === selectedSubjectId && s.year === selectedYear,
          )
          .map((s) => s.term),
      ),
    ).sort();
  }, [scores, selectedSubjectId, selectedYear]);

  useEffect(() => {
    if (
      availableYears.length > 0 &&
      (!selectedYear || !availableYears.includes(selectedYear))
    )
      setSelectedYear(availableYears[0]);
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (
      availableTerms.length > 0 &&
      (!selectedTerm || !availableTerms.includes(selectedTerm))
    )
      setSelectedTerm(availableTerms[0]);
  }, [availableTerms, selectedTerm]);

  const getClassProgress = (classId: number): ProgressData[] => {
    const classInfo = classes.find((c) => c.id === classId);
    const classLevel = (classInfo as any)?.educationLevel || "secondary";
    const classLearners = learners.filter((l) => l.classId === classId);
    const classScores = scores.filter((s) =>
      classLearners.some((l) => l.id === s.learnerId),
    );

    const grouped: { [key: string]: TestScoreEntity[] } = {};
    classScores.forEach((s) => {
      const k = `${s.term}_${s.year}`;
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(s);
    });

    return Object.entries(grouped)
      .map(([key, items]) => {
        const [term, year] = key.split("_");
        const getAvg = (arr: TestScoreEntity[]) =>
          arr.length
            ? arr.reduce((sum, s) => sum + s.score, 0) / arr.length
            : 0;
        const avgScore = getAvg(items);
        const passCount = items.filter((s) =>
          isPassingGrade(s.score, 100, classLevel),
        ).length;
        const passRate =
          items.length > 0 ? (passCount / items.length) * 100 : 0;

        const testTypes = {
          weekly: Math.round(
            getAvg(items.filter((s) => s.testType === "weekly")),
          ),
          midterm: Math.round(
            getAvg(items.filter((s) => s.testType === "midterm")),
          ),
          endterm: Math.round(
            getAvg(items.filter((s) => s.testType === "endofterm")),
          ),
        };

        const subjectMap: Record<string, number[]> = {};
        items.forEach((s) => {
          if (s.subjectId) {
            const subName = getSubjectName(s.subjectId);
            if (!subjectMap[subName]) subjectMap[subName] = [];
            subjectMap[subName].push(s.score);
          }
        });
        const subjectsDisplay = Object.entries(subjectMap).map(
          ([subject, scoresArr]) => ({
            subject,
            score: Math.round(
              scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length,
            ),
          }),
        );

        return {
          term,
          year: parseInt(year, 10),
          educationLevel: classLevel,
          averageScore: Math.round(avgScore * 10) / 10,
          passRate: Math.round(passRate),
          learnerCount: new Set(items.map((s) => s.learnerId)).size,
          subjects: subjectsDisplay,
          testTypes,
        };
      })
      .sort((a, b) => a.year - b.year || a.term.localeCompare(b.term));
  };

  const getLearnerProgress = (learnerId: number): ProgressData[] => {
    const learner = learners.find((l) => l.id === learnerId);
    const classInfo = classes.find((c) => c.id === learner?.classId);
    const learnerLevel = (classInfo as any)?.educationLevel || "secondary";
    const learnerScores = scores.filter((s) => s.learnerId === learnerId);

    const grouped: { [key: string]: TestScoreEntity[] } = {};
    learnerScores.forEach((s) => {
      const k = `${s.term}_${s.year}`;
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(s);
    });

    return Object.entries(grouped)
      .map(([key, items]) => {
        const [term, year] = key.split("_");
        const getAvg = (arr: TestScoreEntity[]) =>
          arr.length
            ? arr.reduce((sum, s) => sum + s.score, 0) / arr.length
            : 0;
        const avgScore = getAvg(items);
        const passCount = items.filter((s) =>
          isPassingGrade(s.score, 100, learnerLevel),
        ).length;
        const passRate =
          items.length > 0 ? (passCount / items.length) * 100 : 0;

        const testTypes = {
          weekly: Math.round(
            getAvg(items.filter((s) => s.testType === "weekly")),
          ),
          midterm: Math.round(
            getAvg(items.filter((s) => s.testType === "midterm")),
          ),
          endterm: Math.round(
            getAvg(items.filter((s) => s.testType === "endofterm")),
          ),
        };

        const subjectMap: Record<string, number[]> = {};
        items.forEach((s) => {
          if (s.subjectId) {
            const subName = getSubjectName(s.subjectId);
            if (!subjectMap[subName]) subjectMap[subName] = [];
            subjectMap[subName].push(s.score);
          }
        });
        const subjectsDisplay = Object.entries(subjectMap).map(
          ([subject, scoresArr]) => ({
            subject,
            score: Math.round(
              scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length,
            ),
          }),
        );

        return {
          term,
          year: parseInt(year, 10),
          educationLevel: learnerLevel,
          averageScore: Math.round(avgScore * 10) / 10,
          passRate: Math.round(passRate),
          learnerCount: 1,
          subjects: subjectsDisplay,
          testTypes,
        };
      })
      .sort((a, b) => a.year - b.year || a.term.localeCompare(b.term));
  };

  const classProgress = selectedClass ? getClassProgress(selectedClass) : [];
  const learnerProgress = selectedLearner
    ? getLearnerProgress(selectedLearner)
    : [];
  const displayProgress =
    compareMode === "class" ? classProgress : learnerProgress;

  const getSubjectProgress = () => {
    if (!selectedSubjectId || !selectedYear) return { columns: [], rows: [] };
    let targetScores = scores.filter(
      (s) => s.subjectId === selectedSubjectId && s.year === selectedYear,
    );

    if (subjectViewMode === "termly") {
      if (!selectedTerm) return { columns: [], rows: [] };
      targetScores = targetScores.filter((s) => s.term === selectedTerm);
      const columns = [
        { key: "weekly", label: "Weekly Test" },
        { key: "midterm", label: "Mid Term" },
        { key: "endofterm", label: "End of Term" },
      ];
      const rowMap = new Map<
        number,
        {
          name: string;
          level: EducationLevel;
          scores: Record<string, number>;
          total: number;
          count: number;
        }
      >();

      targetScores.forEach((s) => {
        if (!rowMap.has(s.learnerId)) {
          const learner = learners.find((l) => l.id === s.learnerId);
          const classInfo = classes.find((c) => c.id === learner?.classId);
          rowMap.set(s.learnerId, {
            name: learner?.name || "Unknown Learner",
            level: (classInfo as any)?.educationLevel || "secondary",
            scores: {},
            total: 0,
            count: 0,
          });
        }
        const row = rowMap.get(s.learnerId)!;
        if (s.testType) {
          row.scores[s.testType] = s.score;
        }
        row.total += s.score;
        row.count += 1;
      });

      const rows = Array.from(rowMap.entries())
        .map(([learnerId, data]) => ({
          learnerId,
          learnerName: data.name,
          educationLevel: data.level,
          scores: data.scores,
          average: data.count > 0 ? Math.round(data.total / data.count) : 0,
        }))
        .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
      return { columns, rows };
    } else {
      const columns = availableTerms.map((t) => ({
        key: t,
        label: `${t} Avg`,
      }));
      const rowMap = new Map<
        number,
        {
          name: string;
          level: EducationLevel;
          termTotals: Record<string, number>;
          termCounts: Record<string, number>;
          overallTotal: number;
          overallCount: number;
        }
      >();

      targetScores.forEach((s) => {
        if (!rowMap.has(s.learnerId)) {
          const learner = learners.find((l) => l.id === s.learnerId);
          const classInfo = classes.find((c) => c.id === learner?.classId);
          rowMap.set(s.learnerId, {
            name: learner?.name || "Unknown Learner",
            level: (classInfo as any)?.educationLevel || "secondary",
            termTotals: {},
            termCounts: {},
            overallTotal: 0,
            overallCount: 0,
          });
        }
        const row = rowMap.get(s.learnerId)!;
        if (!row.termTotals[s.term]) {
          row.termTotals[s.term] = 0;
          row.termCounts[s.term] = 0;
        }
        row.termTotals[s.term] += s.score;
        row.termCounts[s.term] += 1;
        row.overallTotal += s.score;
        row.overallCount += 1;
      });

      const rows = Array.from(rowMap.entries())
        .map(([learnerId, data]) => {
          const scoresMap: Record<string, number> = {};
          availableTerms.forEach((t) => {
            if (data.termCounts[t])
              scoresMap[t] = Math.round(
                data.termTotals[t] / data.termCounts[t],
              );
          });
          return {
            learnerId,
            learnerName: data.name,
            educationLevel: data.level,
            scores: scoresMap,
            average:
              data.overallCount > 0
                ? Math.round(data.overallTotal / data.overallCount)
                : 0,
          };
        })
        .sort((a, b) => a.learnerName.localeCompare(b.learnerName));
      return { columns, rows };
    }
  };

  const subjectData = getSubjectProgress();

  // --- NATIVE PDF EXPORT LOGIC WITH jsPDF & AutoTable ---
  // --- NATIVE PDF EXPORT LOGIC (FIXED: NO OKLCH, NO EXTERNAL FONTS) ---
  const handleExportPDF = () => {
    const jsPDFLib = (window as any).jspdf?.jsPDF;
    if (!jsPDFLib) {
      setPdfMessage("PDF library still loading...");
      setTimeout(() => setPdfMessage(""), 3000);
      return;
    }

    setIsExporting(true);

    try {
      // Create PDF with standard settings to avoid font/CSS issues
      const doc = new jsPDFLib({ orientation: "p", unit: "mm", format: "a4" });

      // Force use of standard Helvetica to bypass the Geist font error
      doc.setFont("helvetica", "normal");

      const drawHeader = (title: string) => {
        // Title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("School Progress Report", 105, 15, { align: "center" });

        // Rankitz Brand
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Rankitz Education System - Zambia", 105, 21, {
          align: "center",
        });

        // Zambia Flag Stripe (Standard RGB values, NOT CSS variables)
        const startX = 14;
        const width = 182 / 4;
        doc.setLineWidth(1.5);
        doc.setDrawColor(25, 138, 0);
        doc.line(startX, 26, startX + width, 26);
        doc.setDrawColor(222, 32, 16);
        doc.line(startX + width, 26, startX + width * 2, 26);
        doc.setDrawColor(0, 0, 0);
        doc.line(startX + width * 2, 26, startX + width * 3, 26);
        doc.setDrawColor(239, 125, 0);
        doc.line(startX + width * 3, 26, 196, 26);

        // Subtitle
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 14, 36);

        doc.setFontSize(9);
        doc.text(`Exported: ${new Date().toLocaleDateString()}`, 196, 36, {
          align: "right",
        });
      };

      if (compareMode === "learner" && selectedLearner) {
        const learner = learners.find((l) => l.id === selectedLearner);
        const cls = classes.find((c) => c.id === learner?.classId);
        drawHeader("Learner Academic Progress");
        doc.setFontSize(11);
        doc.text(`Name: ${learner?.name || "N/A"}`, 14, 45);
        doc.text(`Class: ${cls?.className || "N/A"}`, 196, 45, {
          align: "right",
        });

        let currentY = 55;
        displayProgress.forEach((p) => {
          doc.setFontSize(12);
          doc.text(`${p.term} ${p.year}`, 14, currentY);

          const tableData = p.subjects.map((sub) => [
            sub.subject,
            `${sub.score}%`,
            getGradeLabel(sub.score, 100, p.educationLevel),
            getGradeStandard(sub.score, 100, p.educationLevel),
          ]);

          (doc as any).autoTable({
            startY: currentY + 3,
            head: [["Subject", "Score", "Grade", "Standard"]],
            body: tableData,
            theme: "grid",
            styles: { font: "helvetica", fontSize: 9 },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
          });
          currentY = (doc as any).lastAutoTable.finalY + 12;
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
        });
      } else if (compareMode === "subject" && selectedSubjectId) {
        drawHeader(`Subject: ${getSubjectName(selectedSubjectId)}`);
        const headRow = [
          "Learner",
          ...subjectData.columns.map((c) => c.label),
          "Avg",
          "Remarks",
        ];
        const bodyData = subjectData.rows.map((row) => [
          row.learnerName,
          ...subjectData.columns.map((c) =>
            row.scores[c.key] !== undefined ? `${row.scores[c.key]}%` : "-",
          ),
          `${row.average}%`,
          getGradeStandard(row.average, 100, row.educationLevel),
        ]);

        (doc as any).autoTable({
          startY: 45,
          head: [headRow],
          body: bodyData,
          theme: "grid",
          styles: { font: "helvetica", fontSize: 8 },
          headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
        });
      }

      doc.save(`Rankitz_${compareMode}_Report.pdf`);
    } catch (err) {
      console.error("PDF Export Failed:", err);
      setPdfMessage("Export Error: Check Console");
    } finally {
      setIsExporting(false);
    }
  };

  const selectStyle = {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    fontSize: 13,
    outline: "none",
    width: "100%",
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
    trend: (
      <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
        <path
          fillRule="evenodd"
          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
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
    pdf: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width={16}
        height={16}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
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
          flexShrink: 0,
        }}
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
              Progress Report
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
              Track performance over time
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {pdfMessage && (
            <span style={{ fontSize: 12, color: t.red }}>{pdfMessage}</span>
          )}
          <button
            onClick={handleExportPDF}
            disabled={
              !isPdfReady ||
              isExporting ||
              (!selectedClass && !selectedLearner && !selectedSubjectId)
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background:
                !isPdfReady ||
                isExporting ||
                (!selectedClass && !selectedLearner && !selectedSubjectId)
                  ? t.textMuted
                  : t.accent,
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {icons.pdf} {isExporting ? "Generating..." : "Export PDF"}
          </button>

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
          {ZAMBIA_FLAG.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Compare Mode Selector */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {(["class", "learner", "subject"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCompareMode(mode)}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border:
                  compareMode === mode
                    ? `2px solid ${t.accent}`
                    : `1px solid ${t.border}`,
                background: compareMode === mode ? t.accentBg : t.surface,
                color: compareMode === mode ? t.accent : t.textSub,
                cursor: "pointer",
                fontWeight: compareMode === mode ? 700 : 500,
                fontSize: 13,
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {mode} Progress
            </button>
          ))}
        </div>

        {/* Dynamic Selectors Area */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {compareMode === "class" && (
            <select
              value={selectedClass || ""}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              style={selectStyle}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </select>
          )}

          {compareMode === "learner" && (
            <select
              value={selectedLearner || ""}
              onChange={(e) =>
                setSelectedLearner(
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              style={selectStyle}
            >
              <option value="">Select Learner</option>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          {compareMode === "subject" && (
            <>
              <select
                value={selectedSubjectId || ""}
                onChange={(e) =>
                  setSelectedSubjectId(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                style={selectStyle}
              >
                <option value="">Select Subject</option>
                {availableSubjectIds.map((subId) => (
                  <option key={subId} value={subId}>
                    {getSubjectName(subId)}
                  </option>
                ))}
              </select>

              <select
                value={subjectViewMode}
                onChange={(e) =>
                  setSubjectViewMode(e.target.value as "yearly" | "termly")
                }
                style={selectStyle}
              >
                <option value="yearly">Yearly Overview</option>
                <option value="termly">Termly Breakdown</option>
              </select>

              <select
                value={selectedYear || ""}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                style={selectStyle}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {subjectViewMode === "termly" && (
                <select
                  value={selectedTerm || ""}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  style={selectStyle}
                >
                  {availableTerms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>

        {/* Progress Display */}
        {!loading && compareMode === "subject" ? (
          <div
            style={{
              background: t.surface,
              borderRadius: 14,
              border: `1px solid ${t.border}`,
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${t.border}`,
                    background: t.surfaceAlt,
                  }}
                >
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textSub,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Learner
                  </th>
                  {subjectData.columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        padding: "14px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textSub,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textSub,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {subjectViewMode === "termly"
                      ? "Term Average"
                      : "Yearly Average"}
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textSub,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectData.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={subjectData.columns.length + 3}
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: t.textMuted,
                      }}
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  subjectData.rows.map((row, i) => {
                    const gradeColor = getGradeColor(
                      row.average,
                      100,
                      row.educationLevel,
                    );
                    return (
                      <tr
                        key={row.learnerId}
                        style={{
                          borderBottom:
                            i === subjectData.rows.length - 1
                              ? "none"
                              : `1px solid ${t.border}`,
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: t.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.learnerName}
                        </td>
                        {subjectData.columns.map((col) => {
                          const score = row.scores[col.key];
                          const isPass =
                            score !== undefined &&
                            isPassingGrade(score, 100, row.educationLevel);
                          return (
                            <td
                              key={col.key}
                              style={{
                                padding: "14px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                color:
                                  score === undefined
                                    ? t.textMuted
                                    : isPass
                                      ? t.text
                                      : t.red,
                              }}
                            >
                              {score !== undefined ? `${score}%` : "-"}
                            </td>
                          );
                        })}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: isPassingGrade(
                              row.average,
                              100,
                              row.educationLevel,
                            )
                              ? t.accent
                              : t.red,
                          }}
                        >
                          {row.average}%
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: gradeColor.bg,
                              color: gradeColor.text,
                              border: `1px solid ${gradeColor.border}`,
                            }}
                          >
                            {getGradeStandard(
                              row.average,
                              100,
                              row.educationLevel,
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : !loading && displayProgress.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: t.textMuted,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: t.text,
                marginBottom: 4,
              }}
            >
              No progress data
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: 14,
            }}
          >
            {displayProgress.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 14,
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
                    {p.term} {p.year}
                  </div>
                  <div
                    style={{
                      color:
                        p.passRate >= 75
                          ? t.accent
                          : p.passRate >= 40
                            ? t.orange
                            : t.red,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {icons.trend}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      Term Avg
                    </div>
                    <div
                      style={{ fontSize: 18, fontWeight: 700, color: t.accent }}
                    >
                      {p.averageScore.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      Pass Rate
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color:
                          p.passRate >= 75
                            ? t.accent
                            : p.passRate >= 40
                              ? t.orange
                              : t.red,
                      }}
                    >
                      {p.passRate}%
                    </div>
                  </div>
                </div>

                {/* Test Types Breakdown */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    background: t.surfaceAlt,
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      Weekly
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: isPassingGrade(
                          p.testTypes.weekly,
                          100,
                          p.educationLevel,
                        )
                          ? t.text
                          : t.red,
                      }}
                    >
                      {p.testTypes.weekly > 0 ? `${p.testTypes.weekly}%` : "-"}
                    </div>
                  </div>
                  <div
                    style={{ width: 1, background: t.border, margin: "0 8px" }}
                  />
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      Mid Term
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: isPassingGrade(
                          p.testTypes.midterm,
                          100,
                          p.educationLevel,
                        )
                          ? t.text
                          : t.red,
                      }}
                    >
                      {p.testTypes.midterm > 0
                        ? `${p.testTypes.midterm}%`
                        : "-"}
                    </div>
                  </div>
                  <div
                    style={{ width: 1, background: t.border, margin: "0 8px" }}
                  />
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      End Term
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: isPassingGrade(
                          p.testTypes.endterm,
                          100,
                          p.educationLevel,
                        )
                          ? t.text
                          : t.red,
                      }}
                    >
                      {p.testTypes.endterm > 0
                        ? `${p.testTypes.endterm}%`
                        : "-"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    height: 6,
                    background: t.border,
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${p.passRate}%`,
                      background:
                        p.passRate >= 75
                          ? t.accent
                          : p.passRate >= 40
                            ? t.orange
                            : t.red,
                      transition: "width 0.3s",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: `1px dashed ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: t.textMuted,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Subject Scores
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {p.subjects.map((sub, i) => {
                      const badgeColors = getGradeColor(
                        sub.score,
                        100,
                        p.educationLevel,
                      );
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontSize: 13, color: t.textSub }}>
                            {sub.subject}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: badgeColors.bg,
                                color: badgeColors.text,
                              }}
                            >
                              {getGradeStandard(
                                sub.score,
                                100,
                                p.educationLevel,
                              )}
                            </span>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: isPassingGrade(
                                  sub.score,
                                  100,
                                  p.educationLevel,
                                )
                                  ? t.text
                                  : t.red,
                              }}
                            >
                              {sub.score}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  );
}
