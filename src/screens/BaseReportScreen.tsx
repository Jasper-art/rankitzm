import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, ClassEntity, LearnerEntity, SubjectEntity } from "../db";
import { getGradeLabel } from "../lib/grading";
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from "../styles/rankitz-colors";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

// ========== TYPES ==========

interface ScoreMapType {
  [learnerId: number]: {
    [subjectId: number]: number;
  };
}

interface RankedLearner {
  learnerId: number;
  name: string;
  scores: { [subjectId: number]: number };
  total: number;
  rank: number;
}

// ========== UTILITY FUNCTIONS ==========

const getPointsFromGrade = (grade: string, isPrimary: boolean): number => {
  if (isPrimary) return 0;
  const gradePoints: { [key: string]: number } = {
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
    Five: 5,
    Six: 6,
    Seven: 7,
    Eight: 8,
    Nine: 9,
  };
  return gradePoints[grade] ?? 9;
};

const calculateLearnerPoints = (
  learnerScores: { [subjectId: number]: number },
  subjectTotalMarks: { [subjectId: number]: number },
): number => {
  const passedSubjects = Object.entries(learnerScores)
    .filter(([subjectId, score]) => {
      const maxMark = subjectTotalMarks[parseInt(subjectId)] || 100;
      return score >= maxMark * 0.4;
    })
    .map(([subjectId, score]) => {
      const maxMark = subjectTotalMarks[parseInt(subjectId)] || 100;
      const grade = getGradeLabel(score, maxMark, "secondary");
      return getPointsFromGrade(grade, false);
    })
    .sort((a, b) => a - b)
    .slice(0, 6);

  if (passedSubjects.length < 6) {
    return 999;
  }

  return passedSubjects.reduce((a, b) => a + b, 0);
};

const calculateRanking = (
  totals: RankedLearner[],
  method: string,
): Map<number, number> => {
  const rankedMap = new Map<number, number>();

  if (method === "Dense (112234)") {
    let currentRank = 1;
    let lastScore = -1;

    totals.forEach((entry) => {
      if (entry.total !== lastScore) {
        currentRank = rankedMap.size + 1;
        lastScore = entry.total;
      }
      rankedMap.set(entry.learnerId, currentRank);
    });
  } else if (method === "Standard (112345)") {
    totals.forEach((entry, index) => {
      rankedMap.set(entry.learnerId, index + 1);
    });
  } else if (method === "Fractional (1, 2.5, 4)") {
    let currentRank = 1;
    let lastScore = -1;
    let indices: number[] = [];

    totals.forEach((entry, index) => {
      indices.push(index);
      if (entry.total !== lastScore && index > 0) {
        const ties = indices.length;
        const avgRank = (currentRank + currentRank + ties - 1) / ties;
        indices.forEach((idx) => {
          rankedMap.set(totals[idx].learnerId, Math.round(avgRank * 100) / 100);
        });
        currentRank += ties;
        indices = [];
        lastScore = entry.total;
      }
    });

    if (indices.length > 0) {
      indices.forEach((idx) => {
        rankedMap.set(totals[idx].learnerId, currentRank + (idx - currentRank));
      });
    }
  }

  return rankedMap;
};

// ========== MAIN COMPONENT ==========

export default function BaseReportScreen() {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const {
    classId,
    testType: routeTestType,
    term: routeTerm,
    year: routeYear,
  } = useParams();
  const [dark, setDark] = useState(
    () => localStorage.getItem("rankitz-theme") === "dark",
  );

  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [classData, setClassData] = useState<ClassEntity | null>(null);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [scoreMap, setScoreMap] = useState<ScoreMapType>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [rowsToShow, setRowsToShow] = useState(20);
  const [rankingMethod, setRankingMethod] = useState("Dense (112234)");

  const t: Theme = dark ? DARK : LIGHT;
  const normalizedTestType = routeTestType?.toLowerCase() || "midterm";
  const isPrimary =
    classData?.educationLevel?.toLowerCase() === "primary" || false;

  // Get pass rate from settings based on education level
  const getPassRate = useCallback(() => {
    if (!schoolSettings) return 0.4; // Default to 40%

    if (isPrimary) {
      return (schoolSettings.primaryPassingRate || 50) / 100;
    } else {
      return (schoolSettings.secondaryPassingRate || 60) / 100;
    }
  }, [schoolSettings, isPrimary]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load school settings with term and year parameters
        const settings = await db.getSchoolSettings(
          routeTerm || "Term 1",
          parseInt(routeYear || "2025"),
        );
        setSchoolSettings(settings);

        const cId = classId ? parseInt(classId, 10) : null;
        if (!cId) {
          setError("Invalid class ID");
          setLoading(false);
          return;
        }

        const cls = await db.getClass(cId);
        setClassData(cls || null);

        const learnersData = await db.getAllLearners();
        const subjectsData = await db.getAllSubjects();

        const classLearners = learnersData.filter((l) => l.classId === cId);
        const classSubjects = subjectsData.filter((s) => s.classId === cId);

        setLearners(classLearners.sort((a, b) => a.name.localeCompare(b.name)));
        setSubjects(
          classSubjects.sort((a, b) =>
            a.subjectName.localeCompare(b.subjectName),
          ),
        );

        const scoresData = await db.getAllScores();
        const scoresByLearner: ScoreMapType = {};

        classLearners.forEach((learner) => {
          if (!learner.id) return;
          const learnerId = learner.id;
          scoresByLearner[learnerId] = {};

          const learnerScores = scoresData.filter(
            (s) =>
              s.learnerId === learner.id &&
              s.testType?.toLowerCase() === normalizedTestType &&
              s.term?.replace(/\s+/g, "") === routeTerm?.replace(/\s+/g, "") &&
              s.year ===
                parseInt(routeYear || String(new Date().getFullYear())),
          );

          learnerScores.forEach((score) => {
            const subjectId = score.subjectId;
            if (typeof subjectId === "number") {
              scoresByLearner[learnerId][subjectId] = score.score;
            }
          });
        });

        setScoreMap(scoresByLearner);
        setLoading(false);
      } catch (err) {
        console.error("Error loading report data:", err);
        setError("Failed to load report data");
        setLoading(false);
      }
    };

    loadData();
  }, [classId, normalizedTestType, routeTerm, routeYear]);

  const subjectTotalMarks = useCallback(() => {
    const totals: { [subjectId: number]: number } = {};
    subjects.forEach((subject) => {
      if (subject.id) {
        totals[subject.id] = subject.maxMark || 100;
      }
    });
    return totals;
  }, [subjects]);

  const calculateTotals = useCallback((): RankedLearner[] => {
    const totals: RankedLearner[] = [];

    learners.forEach((learner: LearnerEntity) => {
      if (!learner.id) return;
      const learnerScores = scoreMap[learner.id] || {};
      const marks = subjectTotalMarks();

      let total = 0;

      if (isPrimary) {
        total = Object.values(learnerScores).reduce(
          (sum: number, score: number) => sum + score,
          0,
        );
      } else {
        total = calculateLearnerPoints(learnerScores, marks);
      }

      totals.push({
        learnerId: learner.id,
        name: learner.name,
        scores: learnerScores,
        total,
        rank: 0,
      });
    });

    if (isPrimary) {
      totals.sort((a: RankedLearner, b: RankedLearner) => b.total - a.total);
    } else {
      totals.sort((a: RankedLearner, b: RankedLearner) => a.total - b.total);
    }

    return totals;
  }, [learners, scoreMap, subjectTotalMarks, isPrimary]);

  const totals = calculateTotals();
  const rankedMap = calculateRanking(totals, rankingMethod);

  const calculateSubjectPassRates = useCallback((): {
    [subjectId: number]: number;
  } => {
    const passRates: { [subjectId: number]: number } = {};
    const marks = subjectTotalMarks();
    const passRate = getPassRate();

    subjects.forEach((subject: SubjectEntity) => {
      if (!subject.id) return;
      const subjectId = subject.id;
      let passed = 0;
      let total = 0;

      learners.forEach((learner: LearnerEntity) => {
        if (!learner.id) return;
        const score = scoreMap[learner.id]?.[subjectId];
        if (score !== undefined && score > 0) {
          total++;
          // Use dynamic pass rate from school settings
          const threshold = marks[subjectId] * passRate;
          if (score >= threshold) {
            passed++;
          }
        }
      });

      passRates[subjectId] = total > 0 ? Math.round((passed / total) * 100) : 0;
    });

    return passRates;
  }, [subjects, learners, scoreMap, subjectTotalMarks, getPassRate]);

  const subjectPassRates = calculateSubjectPassRates();

  const calculateStats = useCallback((): {
    avgScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
  } => {
    let totalScore = 0;
    let scoreCount = 0;
    let passCount = 0;
    let highestScore = 0;
    let lowestScore = Infinity;

    learners.forEach((learner: LearnerEntity) => {
      if (!learner.id) return;
      const learnerScores = scoreMap[learner.id] || {};
      const marks = subjectTotalMarks();

      Object.entries(learnerScores).forEach(
        ([subjectId, score]: [string, number]) => {
          totalScore += score;
          scoreCount++;
          highestScore = Math.max(highestScore, score);
          lowestScore = Math.min(lowestScore, score);

          const threshold = isPrimary
            ? marks[parseInt(subjectId)] * 0.5
            : marks[parseInt(subjectId)] * 0.4;
          if (score >= threshold) {
            passCount++;
          }
        },
      );
    });

    const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;
    const passRate =
      scoreCount > 0 ? Math.round((passCount / scoreCount) * 100) : 0;

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      passRate,
      highestScore: highestScore === -Infinity ? 0 : highestScore,
      lowestScore: lowestScore === Infinity ? 0 : lowestScore,
    };
  }, [learners, scoreMap, subjectTotalMarks, isPrimary]);

  const stats = calculateStats();

  // Export to CSV
  const exportToCSV = async () => {
    try {
      setExporting(true);
      let csv = `${classData?.className} - ${normalizedTestType.toUpperCase()} Report\n`;
      csv += `Term: ${routeTerm}, Year: ${routeYear}\n`;
      csv += `Education Level: ${isPrimary ? "Primary" : "Secondary"}\n\n`;

      csv +=
        "Pos,Name," +
        subjects.map((s: SubjectEntity) => s.subjectName).join(",") +
        (isPrimary ? ",Total" : ",Points") +
        "\n";

      csv +=
        "Out of," +
        subjects.map((s: SubjectEntity) => s.maxMark || 100).join(",") +
        "," +
        (isPrimary
          ? Object.values(scoreMap).reduce(
              (sum: number, scores: { [key: number]: number }) =>
                Math.max(sum, Object.values(scores).length * 100),
              0,
            )
          : "Points") +
        "\n";

      csv +=
        "Pass %," +
        subjects
          .map((s: SubjectEntity) => (s.id ? subjectPassRates[s.id] || 0 : 0))
          .join(",") +
        "\n\n";

      totals.slice(0, rowsToShow).forEach((entry: RankedLearner) => {
        const rank = rankedMap.get(entry.learnerId) || "-";
        let row = `${rank},${entry.name}`;

        subjects.forEach((subject: SubjectEntity) => {
          const score = subject.id ? entry.scores[subject.id] || "-" : "-";
          row += `,${score}`;
        });

        row += `,${entry.total === 999 ? "DNQ" : entry.total}`;
        csv += row + "\n";
      });

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
      );
      element.setAttribute(
        "download",
        `${classData?.className}_${normalizedTestType}_report.csv`,
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  // Export to Excel (Using SheetJS from CDN)
  const exportToExcel = async () => {
    try {
      setExporting(true);

      // Load SheetJS from CDN if not already loaded
      if (!(window as any).XLSX) {
        const script = document.createElement("script");
        script.src =
          "https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js";
        script.async = true;
        script.onload = () => {
          performExcelExport();
        };
        script.onerror = () => {
          alert("Failed to load Excel library from CDN");
          setExporting(false);
        };
        document.body.appendChild(script);
      } else {
        performExcelExport();
      }

      function performExcelExport() {
        try {
          const XLSX = (window as any).XLSX;
          const data: (string | number)[][] = [];

          // Add title and metadata
          data.push([
            `${classData?.className} - ${normalizedTestType.toUpperCase()} Report`,
          ]);
          data.push([`Term: ${routeTerm}, Year: ${routeYear}`]);
          data.push([
            `Education Level: ${isPrimary ? "Primary" : "Secondary"}`,
          ]);
          data.push([]);

          // Add headers
          const headers = [
            "Position",
            "Name",
            ...subjects.map((s) => s.subjectName),
            isPrimary ? "Total" : "Points",
          ];
          data.push(headers);

          // Add subject max marks
          const maxMarks: (string | number)[] = [
            "Out of",
            "",
            ...subjects.map((s) => s.maxMark || 100),
            "",
          ];
          data.push(maxMarks);

          // Add pass rates
          const passRates: (string | number)[] = [
            "Pass %",
            "",
            ...subjects.map((s) => (s.id ? subjectPassRates[s.id] || 0 : 0)),
            "",
          ];
          data.push(passRates);
          data.push([]);

          // Add learner rows
          totals.slice(0, rowsToShow).forEach((entry: RankedLearner) => {
            const rank = rankedMap.get(entry.learnerId) || "-";
            const row: (string | number)[] = [
              rank,
              entry.name,
              ...subjects.map((subject: SubjectEntity) => {
                if (!subject.id) return "-";
                const score = entry.scores[subject.id] || 0;
                return score === 0 ? "-" : score;
              }),
              entry.total === 999 ? "DNQ" : entry.total,
            ];
            data.push(row);
          });

          // Create workbook
          const ws = XLSX.utils.aoa_to_sheet(data);
          ws["!cols"] = Array(headers.length).fill({ width: 15 });

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Report");

          XLSX.writeFile(
            wb,
            `${classData?.className}_${normalizedTestType}_report.xlsx`,
          );
          setExporting(false);
        } catch (err) {
          console.error("Excel export error:", err);
          alert("Failed to export Excel");
          setExporting(false);
        }
      }
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel");
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);

      let finalSchoolName = "SCHOOL REPORT";
      try {
        if (schoolSettings?.schoolName) {
          finalSchoolName = schoolSettings.schoolName;
        } else {
          const cachedSettings = localStorage.getItem(
            "rankitz-school-settings",
          );
          if (cachedSettings) {
            const parsed = JSON.parse(cachedSettings);
            if (parsed.schoolName) finalSchoolName = parsed.schoolName;
          }
        }
      } catch (e) {}

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.setFillColor(16, 185, 129);
      pdf.roundedRect(15, 15, pageWidth - 30, 22, 2, 2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(finalSchoolName.toUpperCase(), pageWidth / 2, 22, {
        align: "center",
      });
      pdf.setFontSize(10);
      pdf.text("END OF TERM REPORT - MARK SCHEDULE", pageWidth / 2, 28, {
        align: "center",
      });
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${classData?.className?.toUpperCase()} • TERM ${routeTerm} • ${routeYear} • ${isPrimary ? "PRIMARY" : "SECONDARY"} LEVEL`,
        pageWidth / 2,
        33,
        { align: "center" },
      );

      const stripY = 38.5;
      const totalW = pageWidth - 30;
      const pW = totalW / 7;
      pdf.setFillColor(25, 138, 0);
      pdf.rect(15, stripY, pW * 4, 1.2, "F");
      pdf.setFillColor(222, 32, 16);
      pdf.rect(15 + pW * 4, stripY, pW, 1.2, "F");
      pdf.setFillColor(0, 0, 0);
      pdf.rect(15 + pW * 5, stripY, pW, 1.2, "F");
      pdf.setFillColor(239, 125, 0);
      pdf.rect(15 + pW * 6, stripY, pW, 1.2, "F");

      let metaY = 46;
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "bold");
      pdf.text("Generated:", 15, metaY);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(17, 24, 39);
      pdf.text(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        38,
        metaY,
      );
      metaY += 5;
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "bold");
      pdf.text("Class:", 15, metaY);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(17, 24, 39);
      pdf.text(classData?.className || "-", 38, metaY);
      metaY += 5;
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "bold");
      pdf.text("Total Learners:", 15, metaY);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(17, 24, 39);
      pdf.text(learners.length.toString(), 38, metaY);

      let metaY2 = 46;
      const col2X = pageWidth / 2;
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "bold");
      pdf.text("Education Level:", col2X, metaY2);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(17, 24, 39);
      pdf.text(isPrimary ? "Primary" : "Secondary", col2X + 28, metaY2);
      metaY2 += 5;
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "bold");
      pdf.text("Total Subjects:", col2X, metaY2);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(17, 24, 39);
      pdf.text(subjects.length.toString(), col2X + 28, metaY2);
      metaY2 += 5;
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ranking Method:", col2X, metaY2);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(17, 24, 39);
      pdf.text(rankingMethod, col2X + 28, metaY2);

      let currentY = 60;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("CLASS PERFORMANCE SUMMARY", 15, currentY);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(15, currentY + 1.5, pageWidth - 15, currentY + 1.5);
      currentY += 5;

      const statW = (pageWidth - 30 - 12) / 4;
      const statsArr = [
        { l: "AVG SCORE", v: `${stats.avgScore}%` },
        { l: "PASS RATE", v: `${stats.passRate}%` },
        { l: "HIGHEST SCORE", v: `${stats.highestScore}%` },
        { l: "LOWEST SCORE", v: `${stats.lowestScore}%` },
      ];
      statsArr.forEach((s, i) => {
        const bx = 15 + i * (statW + 4);
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(bx, currentY, statW, 12, 1.5, 1.5, "FD");
        pdf.setFontSize(6.5);
        pdf.setTextColor(75, 85, 99);
        pdf.setFont("helvetica", "bold");
        pdf.text(s.l, bx + statW / 2, currentY + 4.5, { align: "center" });
        pdf.setFontSize(10);
        pdf.setTextColor(5, 150, 105);
        pdf.text(s.v, bx + statW / 2, currentY + 9.5, { align: "center" });
      });
      currentY += 18;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("SUBJECT PERFORMANCE (PASS %)", 15, currentY);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(15, currentY + 1.5, pageWidth - 15, currentY + 1.5);
      currentY += 5;

      const subsPerRow = Math.min(subjects.length, 8);
      const subGap = 2.5;
      const subW = (pageWidth - 30 - (subsPerRow - 1) * subGap) / subsPerRow;
      const subH = 15;
      subjects.forEach((sub, i) => {
        const bx = 15 + (i % subsPerRow) * (subW + subGap);
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(bx, currentY, subW, subH, 1.5, 1.5, "FD");
        let sName = sub.subjectName;
        if (sName.length > 12) sName = sName.substring(0, 11) + "…";
        pdf.setFontSize(6);
        pdf.setTextColor(17, 24, 39);
        pdf.setFont("helvetica", "bold");
        pdf.text(sName, bx + subW / 2, currentY + 3.5, { align: "center" });
        const passP = subjectPassRates[sub.id!] || 0;
        pdf.setFontSize(9);
        pdf.setTextColor(5, 150, 105);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${passP}%`, bx + subW / 2, currentY + 8, { align: "center" });
        pdf.setFontSize(5);
        pdf.setTextColor(75, 85, 99);
        pdf.setFont("helvetica", "normal");
        const passMark = isPrimary
          ? (sub.maxMark || 100) * 0.5
          : (sub.maxMark || 100) * 0.4;
        pdf.text(
          `Pass: ${Math.round(passMark)}`,
          bx + subW / 2,
          currentY + 12,
          { align: "center" },
        );
      });
      currentY += subH + 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(17, 24, 39);
      pdf.text("DETAILED LEARNER RESULTS", 15, currentY);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(15, currentY + 1.5, pageWidth - 15, currentY + 1.5);
      currentY += 4;

      const headers = [
        "Pos",
        "Name",
        "Sex",
        ...subjects.map((s) => s.subjectName.substring(0, 6)),
        isPrimary ? "Total" : "Pts",
      ];

      const tableBody = totals
        .slice(0, rowsToShow)
        .map((entry: RankedLearner) => {
          const rank = rankedMap.get(entry.learnerId) || "-";
          const learnerDetails = learners.find((l) => l.id === entry.learnerId);
          const gender =
            learnerDetails?.gender === "M"
              ? "M"
              : learnerDetails?.gender === "F"
                ? "F"
                : "-";
          return [
            rank.toString(),
            entry.name.length > 18
              ? entry.name.substring(0, 16) + "…"
              : entry.name,
            gender,
            ...subjects.map((subject: SubjectEntity) => {
              if (!subject.id) return "-";
              const score = entry.scores[subject.id] || 0;
              return score === 0 ? "-" : score.toString();
            }),
            entry.total === 999 ? "DNQ" : entry.total.toString(),
          ];
        });

      autoTable(pdf, {
        startY: currentY,
        margin: { left: 15, right: 15, bottom: 20 },
        head: isPrimary
          ? [
              headers,
              [
                "Max",
                "Marks",
                "",
                ...subjects.map((s) => (s.maxMark || 100).toString()),
                subjects
                  .reduce((sum, s) => sum + (s.maxMark || 100), 0)
                  .toString(),
              ],
            ]
          : [headers],
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: 7,
          lineWidth: 0.1,
          lineColor: [5, 150, 105],
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [17, 24, 39],
          lineColor: [229, 231, 235],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: "center", fontStyle: "bold", cellWidth: 8 },
          1: { halign: "left", fontStyle: "bold", cellWidth: 35 },
          2: { halign: "center", textColor: [107, 114, 128], cellWidth: 8 },
          [headers.length - 1]: {
            halign: "center",
            fontStyle: "bold",
            fillColor: [209, 250, 229],
            textColor: [5, 150, 105],
            cellWidth: 10,
          },
        },
        didParseCell: function (data: any) {
          if (
            data.section === "body" &&
            data.column.index >= 3 &&
            data.column.index < headers.length - 1
          ) {
            data.cell.styles.halign = "center";
            const scoreStr = data.cell.raw;
            if (scoreStr !== "-" && scoreStr !== "DNQ") {
              const score = parseInt(scoreStr, 10);
              const subject = subjects[data.column.index - 3];
              if (subject) {
                const maxM = subject.maxMark || 100;
                if (score < (isPrimary ? maxM * 0.5 : maxM * 0.4)) {
                  data.cell.styles.textColor = [222, 32, 16];
                }
              }
            }
          }
          if (
            data.section === "body" &&
            data.column.index === headers.length - 1 &&
            data.cell.raw === "DNQ"
          ) {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
          }
        },
      });

      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(156, 163, 175);
        pdf.setDrawColor(229, 231, 235);
        (pdf as any).setLineDash([1, 1], 0);
        pdf.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
        (pdf as any).setLineDash([], 0);
        pdf.text(
          "RankItZM Reporting System • Official Mark Schedule",
          15,
          pageHeight - 8,
        );
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 8, {
          align: "right",
        } as any);
      }

      pdf.save(
        `${classData?.className?.replace(/\s+/g, "_")}_${normalizedTestType}_Mark_Schedule.pdf`,
      );
      setExporting(false);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF: " + (err as any).message);
      setExporting(false);
    }
  };
  const getScoreColor = (score: number, maxMark: number): string => {
    const threshold50 = maxMark * 0.5;
    const threshold75 = maxMark * 0.75;

    if (score >= threshold75) return t.accent;
    if (score >= threshold50) return "#F97316";
    return t.red;
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
            background: t.surface,
            borderBottom: `1.5px solid ${t.border}`,
            padding: isMobile ? "0 12px" : "0 24px",
            height: isMobile ? 56 : 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
            flexShrink: 0,
            boxShadow: `0 1px 3px ${t.shadow}`,
            flexWrap: isMobile ? "wrap" : "nowrap",
          } as React.CSSProperties
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 12,
          }}
        >
          <button
            onClick={() => navigate("/reports")}
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
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.color = t.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
            }}
          >
            {icons.back}
          </button>
          <div>
            <div
              style={{
                fontSize: isMobile ? 14 : 16,
                fontWeight: 800,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              {normalizedTestType.charAt(0).toUpperCase() +
                normalizedTestType.slice(1)}{" "}
              Report
            </div>
            <div
              style={{
                fontSize: isMobile ? 10 : 12,
                color: t.textMuted,
                marginTop: 2,
              }}
            >
              {classData?.className || "Loading..."}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 10,
            flexWrap: isMobile ? "wrap" : "nowrap",
          }}
        >
          {!isMobile && (
            <>
              <button
                onClick={exportToCSV}
                disabled={loading || totals.length === 0 || exporting}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${t.border}`,
                  background: t.surfaceAlt,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    loading || totals.length === 0 || exporting
                      ? "not-allowed"
                      : "pointer",
                  color: t.textSub,
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 6,
                  opacity:
                    loading || totals.length === 0 || exporting ? 0.5 : 1,
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!(loading || totals.length === 0 || exporting)) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.border;
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.surfaceAlt;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
                title="Export as CSV"
              >
                {icons.download}
                CSV
              </button>

              <button
                onClick={exportToExcel}
                disabled={loading || totals.length === 0 || exporting}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${t.border}`,
                  background: t.accentBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    loading || totals.length === 0 || exporting
                      ? "not-allowed"
                      : "pointer",
                  color: t.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 6,
                  opacity:
                    loading || totals.length === 0 || exporting ? 0.5 : 1,
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!(loading || totals.length === 0 || exporting)) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.accent;
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.accentBg;
                  (e.currentTarget as HTMLButtonElement).style.color = t.accent;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
                title="Export as Excel"
              >
                {icons.download}
                Excel
              </button>

              <button
                onClick={exportToPDF}
                disabled={loading || totals.length === 0 || exporting}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${t.border}`,
                  background: "#FEE2E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    loading || totals.length === 0 || exporting
                      ? "not-allowed"
                      : "pointer",
                  color: t.red,
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 6,
                  opacity:
                    loading || totals.length === 0 || exporting ? 0.5 : 1,
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!(loading || totals.length === 0 || exporting)) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.red;
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#FEE2E2";
                  (e.currentTarget as HTMLButtonElement).style.color = t.red;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
                title="Export as PDF"
              >
                {icons.download}
                PDF
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/ai-reports/${classId}/${routeTestType}/${routeTerm}/${routeYear}`,
                  )
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${t.accent}`,
                  background: t.accentBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: t.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 6,
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.accentBg;
                  (e.currentTarget as HTMLButtonElement).style.color = t.accent;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
                title="AI Report Generator"
              >
                🤖 AI Reports
              </button>
            </>
          )}

          <button
            onClick={() => setDark((v) => !v)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.textSub,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.border;
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            {dark ? icons.sun : icons.moon}
          </button>
        </div>
      </header>

      {/* Mobile Export Bar */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "8px 12px",
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <button
            onClick={exportToPDF}
            disabled={loading || totals.length === 0 || exporting}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: "#FEE2E2",
              color: t.red,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading || totals.length === 0 || exporting ? 0.5 : 1,
            }}
          >
            PDF
          </button>
        </div>
      )}
      {/* Main Content */}
      <main
        style={
          {
            flex: 1,
            padding: isMobile ? "12px" : isTablet ? "16px 24px" : "24px 32px",
            overflowY: "auto",
          } as React.CSSProperties
        }
      >
        {/* Zambia Flag */}
        <div
          style={{
            display: "flex",
            height: 4,
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: isMobile ? 14 : 20,
          }}
        >
          {ZAMBIA_FLAG.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Report Header Card */}
        {!loading && classData && (
          <div
            style={{
              background: t.surface,
              border: `1.5px solid ${t.border}`,
              borderRadius: 14,
              padding: isMobile ? "14px" : "20px",
              marginBottom: 18,
              boxShadow: `0 2px 8px ${t.shadow}`,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 13 : 15,
                fontWeight: 800,
                color: t.text,
                marginBottom: 12,
                letterSpacing: "-0.3px",
              }}
            >
              📊 {classData.className} - {normalizedTestType.toUpperCase()}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, 1fr)"
                  : isTablet
                    ? "repeat(3, 1fr)"
                    : "repeat(5, 1fr)",
                gap: isMobile ? 10 : 14,
              }}
            >
              <div
                style={{
                  background: t.accentBg,
                  borderRadius: 10,
                  padding: isMobile ? "10px" : "12px",
                  border: `1.5px solid ${t.accent}30`,
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Learners
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 800,
                    color: t.accent,
                    marginTop: 6,
                  }}
                >
                  {learners.length}
                </div>
              </div>

              <div
                style={{
                  background: t.surfaceAlt,
                  borderRadius: 10,
                  padding: isMobile ? "10px" : "12px",
                  border: `1.5px solid ${t.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Avg Score
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 800,
                    color: t.text,
                    marginTop: 6,
                  }}
                >
                  {stats.avgScore}
                </div>
              </div>

              <div
                style={{
                  background: t.surfaceAlt,
                  borderRadius: 10,
                  padding: isMobile ? "10px" : "12px",
                  border: `1.5px solid ${t.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Pass Rate
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 800,
                    color: t.accent,
                    marginTop: 6,
                  }}
                >
                  {stats.passRate}%
                </div>
              </div>

              {!isMobile && (
                <>
                  <div
                    style={{
                      background: t.surfaceAlt,
                      borderRadius: 10,
                      padding: "12px",
                      border: `1.5px solid ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Highest
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: t.text,
                        marginTop: 6,
                      }}
                    >
                      {stats.highestScore}
                    </div>
                  </div>

                  <div
                    style={{
                      background: t.surfaceAlt,
                      borderRadius: 10,
                      padding: "12px",
                      border: `1.5px solid ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Level
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: t.text,
                        marginTop: 6,
                      }}
                    >
                      {isPrimary ? "🎒 Primary" : "📚 Secondary"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            style={{
              background: t.accentBg,
              border: `1.5px solid ${t.accent}40`,
              borderRadius: 12,
              padding: isMobile ? "16px" : "24px",
              textAlign: "center",
              color: t.accentText,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
            }}
          >
            📂 Loading report data...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              border: `1.5px solid ${t.red}40`,
              borderRadius: 12,
              padding: isMobile ? "16px" : "24px",
              color: t.red,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Controls */}
        {!loading && !error && (
          <>
            <div
              style={{
                background: t.surface,
                border: `1.5px solid ${t.border}`,
                borderRadius: 14,
                padding: isMobile ? "12px" : "16px",
                marginBottom: 16,
                boxShadow: `0 2px 8px ${t.shadow}`,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: isMobile ? 10 : 14,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: isMobile ? 11 : 12,
                      color: t.textMuted,
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Rows to Show
                  </label>
                  <select
                    value={rowsToShow}
                    onChange={(e) => setRowsToShow(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      padding: isMobile ? "9px 10px" : "10px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${t.border}`,
                      background: t.bg,
                      color: t.text,
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {[10, 20, 30, 40, 50, 60, 70, 80, 100].map((num) => (
                      <option key={num} value={num}>
                        {num} rows
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: isMobile ? 11 : 12,
                      color: t.textMuted,
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Ranking Method
                  </label>
                  <select
                    value={rankingMethod}
                    onChange={(e) => setRankingMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: isMobile ? "9px 10px" : "10px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${t.border}`,
                      background: t.bg,
                      color: t.text,
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <option value="Dense (112234)">Dense (112234)</option>
                    <option value="Standard (112345)">Standard (112345)</option>
                    <option value="Fractional (1, 2.5, 4)">
                      Fractional (1, 2.5, 4)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Report Table */}
            <div
              style={{
                background: t.surface,
                border: `1.5px solid ${t.border}`,
                borderRadius: 14,
                padding: isMobile ? "12px 8px" : "16px",
                overflowX: "auto",
                boxShadow: `0 2px 8px ${t.shadow}`,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: isMobile ? 400 : 800,
                }}
              >
                <thead>
                  <tr style={{ background: t.surfaceAlt }}>
                    <th
                      style={{
                        padding: isMobile ? "8px" : "12px",
                        textAlign: "left",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1.5px solid ${t.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Pos
                    </th>
                    <th
                      style={{
                        padding: isMobile ? "8px" : "12px",
                        textAlign: "left",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1.5px solid ${t.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Name
                    </th>
                    {subjects
                      .slice(0, isMobile ? 4 : subjects.length)
                      .map((subject) => (
                        <th
                          key={subject.id || `subject-${subject.subjectName}`}
                          style={{
                            padding: isMobile ? "8px" : "12px",
                            textAlign: "center",
                            fontSize: isMobile ? 9 : 11,
                            fontWeight: 700,
                            color: t.textMuted,
                            borderBottom: `1.5px solid ${t.border}`,
                            minWidth: isMobile ? 50 : 70,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                          }}
                        >
                          {subject.subjectName.substring(0, isMobile ? 6 : 10)}
                        </th>
                      ))}

                    <th
                      style={{
                        padding: isMobile ? "8px" : "12px",
                        textAlign: "center",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1.5px solid ${t.border}`,
                        minWidth: isMobile ? 50 : 70,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {isPrimary ? "Total" : "Points"}
                    </th>
                  </tr>
                  {isPrimary && (
                    <tr
                      style={{
                        background: t.accentLighter || t.accentBg,
                        borderBottom: `1.5px solid ${t.border}`,
                      }}
                    >
                      <td
                        style={{
                          padding: isMobile ? "8px" : "12px",
                          fontSize: isMobile ? 10 : 11,
                          fontWeight: 700,
                          color: t.accentText || t.accent,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.3px",
                        }}
                        colSpan={2}
                      >
                        Total Marks
                      </td>
                      {subjects
                        .slice(0, isMobile ? 4 : subjects.length)
                        .map((subject) => (
                          <td
                            key={subject.id}
                            style={{
                              padding: isMobile ? "8px" : "12px",
                              textAlign: "center",
                              fontSize: isMobile ? 11 : 13,
                              fontWeight: 800,
                              color: t.accentText || t.accent,
                            }}
                          >
                            {subject.maxMark || 100}
                          </td>
                        ))}
                      <td
                        style={{
                          padding: isMobile ? "8px" : "12px",
                          textAlign: "center",
                          fontSize: isMobile ? 11 : 13,
                          fontWeight: 800,
                          color: t.accentText || t.accent,
                        }}
                      >
                        {subjects
                          .slice(0, isMobile ? 4 : subjects.length)
                          .reduce((sum, s) => sum + (s.maxMark || 100), 0)}
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {totals
                    .slice(0, rowsToShow)
                    .map((entry: RankedLearner, idx: number) => (
                      <tr
                        key={entry.learnerId}
                        style={{
                          background: idx % 2 === 0 ? t.surface : t.surfaceAlt,
                          borderBottom: `1px solid ${t.border}`,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = t.accent + "10";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background =
                            idx % 2 === 0 ? t.surface : t.surfaceAlt;
                        }}
                      >
                        <td
                          style={{
                            padding: isMobile ? "8px" : "12px",
                            fontSize: isMobile ? 11 : 12,
                            fontWeight: 800,
                            color: t.accent,
                          }}
                        >
                          {rankedMap.get(entry.learnerId) || "-"}
                        </td>
                        <td
                          style={{
                            padding: isMobile ? "8px" : "12px",
                            fontSize: isMobile ? 11 : 13,
                            fontWeight: 600,
                            color: t.text,
                          }}
                        >
                          {isMobile && entry.name.length > 12
                            ? entry.name.substring(0, 11) + "…"
                            : entry.name}
                        </td>
                        {subjects
                          .slice(0, isMobile ? 4 : subjects.length)
                          .map((subject: SubjectEntity) => {
                            if (!subject.id) return null;
                            const score = entry.scores[subject.id] || 0;
                            const maxMark = subject.maxMark || 100;
                            const color =
                              score === 0
                                ? t.textMuted
                                : getScoreColor(score, maxMark);

                            const displayScore = isPrimary
                              ? score
                              : Math.round((score / maxMark) * 100);

                            return (
                              <td
                                key={subject.id}
                                style={{
                                  padding: isMobile ? "8px" : "12px",
                                  textAlign: "center",
                                  fontSize: isMobile ? 11 : 13,
                                  fontWeight: 700,
                                  color: color,
                                }}
                              >
                                {score === 0 ? "-" : displayScore}
                              </td>
                            );
                          })}

                        <td
                          style={{
                            padding: isMobile ? "8px" : "12px",
                            textAlign: "center",
                            fontSize: isMobile ? 11 : 13,
                            fontWeight: 800,
                            color: entry.total === 999 ? t.red : t.accent,
                          }}
                        >
                          {entry.total === 999 ? "DNQ" : entry.total}
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        select:hover { border-color: var(--accent, #10B981); }
        select:focus { border-color: var(--accent, #10B981); outline: none; }
      `}</style>
    </div>
  );
}
