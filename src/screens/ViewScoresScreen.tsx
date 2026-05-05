declare global {
  interface Window {
    jspdf?: any;
  }
}

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useLearners,
  useSubjects,
  useTestScores,
  useClasses,
} from "../hooks/useClassManager";
import { useAuth } from "../context/AuthContext";
import { getGradeLabel, getGradeColor } from "../lib/grading";

// Import db from the correct path
let dbInstance: any = null;

const initDb = async () => {
  if (!dbInstance) {
    try {
      const module = await import("../db");
      dbInstance = module.db;
      console.log("Database loaded successfully");
    } catch (e) {
      console.error("Error loading database:", e);
    }
  }
  return dbInstance;
};

const LIGHT = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F9F8",
  border: "#E5E9EB",
  borderSub: "#F1F3F5",
  text: "#111827",
  textSub: "#374151",
  textMuted: "#6B7280",
  accent: "#10B981",
  accentLight: "#D1FAE5",
  accentLighter: "#ECFDF5",
  accentBg: "#E0F2FE",
  accentText: "#0F766E",
  accentDark: "#059669",
  red: "#EF4444",
  redBg: "#FEE2E2",
  redText: "#7F1D1D",
  orange: "#F97316",
  orangeBg: "#FFEDD5",
  orangeText: "#7C2D12",
  sidebar: "#FFFFFF",
  sidebarBorder: "#E5E9EB",
  topbar: "#FFFFFF",
  statCard: "#FFFFFF",
  tableHead: "#F9FAFB",
  shadow: "rgba(17, 24, 39, 0.04)",
  shadowMd: "rgba(17, 24, 39, 0.08)",
};

const DARK = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#334155",
  border: "#475569",
  borderSub: "#3F3F46",
  text: "#F1F5F9",
  textSub: "#CBD5E1",
  textMuted: "#94A3B8",
  accent: "#10B981",
  accentLight: "#064E3B",
  accentLighter: "#052E16",
  accentBg: "#0C4A6E",
  accentText: "#86EFAC",
  accentDark: "#34D399",
  red: "#F87171",
  redBg: "#7F1D1D",
  redText: "#FCA5A5",
  orange: "#FB923C",
  orangeBg: "#7C2D12",
  orangeText: "#FDBA74",
  sidebar: "#0E180E",
  sidebarBorder: "#1A281A",
  topbar: "#1E293B",
  statCard: "#1E293B",
  tableHead: "#334155",
  shadow: "rgba(0, 0, 0, 0.2)",
  shadowMd: "rgba(0, 0, 0, 0.3)",
};

type Theme = typeof LIGHT;

const Icons = {
  back: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="3" y1="15" x2="21" y2="15"></line>
      <line x1="9" y1="3" x2="9" y2="21"></line>
      <line x1="15" y1="3" x2="15" y2="21"></line>
    </svg>
  ),
  subject: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  empty: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
};

// Subject color schemes for PDF headers
const SUBJECT_COLORS: Record<string, { primary: string; dark: string }> = {
  Mathematics: { primary: "#E63946", dark: "#A4161A" },
  English: { primary: "#457B9D", dark: "#1D3557" },
  Science: { primary: "#06A77D", dark: "#004E54" },
  "Social Studies": { primary: "#F4A261", dark: "#D97706" },
  "Physical Education": { primary: "#9D4EDD", dark: "#5A189A" },
  "Art & Design": { primary: "#FF006E", dark: "#C2185B" },
};

export default function ViewScoresScreen() {
  const navigate = useNavigate();
  const { testType, classId } = useParams();
  const { learners } = useLearners();
  const { subjects } = useSubjects();
  const { scores, loading } = useTestScores();
  const { classes } = useClasses();
  const { schoolName } = useAuth();

  const [viewType, setViewType] = useState<"table" | "subject" | "learner">(
    "table",
  );
  const [selectedLearner, setSelectedLearner] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [editingScore, setEditingScore] = useState<{
    learnerId: number;
    subjectId: number;
    currentScore: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localScores, setLocalScores] = useState<any[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [searchLearnerQuery, setSearchLearnerQuery] = useState("");
  const [searchSubjectQuery, setSearchSubjectQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showAIModal, setShowAIModal] = useState(false);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const [aiLearner, setAiLearner] = useState<number | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedMessage, setAiGeneratedMessage] = useState("");
  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t = dark ? DARK : LIGHT;

  const classIdNum = parseInt(classId || "0");
  const classLearners = learners.filter((l) => l.classId === classIdNum);
  const classSubjects = subjects.filter((s) => s.classId === classIdNum);
  const classInfo = classes.find((c) => c.id === classIdNum);

  React.useEffect(() => {
    if (selectedLearner === null && classLearners.length > 0) {
      setSelectedLearner(classLearners[0].id || null);
    }
  }, [classLearners, selectedLearner]);

  React.useEffect(() => {
    if (selectedSubject === null && classSubjects.length > 0) {
      setSelectedSubject(classSubjects[0].id || null);
    }
  }, [classSubjects, selectedSubject]);

  React.useEffect(() => {
    const refetchScores = async () => {
      try {
        const database = await initDb();
        if (database) {
          const allScores = await database.getAllScores();
          console.log("Refreshed scores from IndexedDB:", allScores);
        }
      } catch (err) {
        console.error("Error refetching scores:", err);
      }
    };

    if (localScores.length > 0) {
      refetchScores();
    }
  }, [localScores]);

  const [allScores, setAllScores] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchAllScores = async () => {
      try {
        const database = await initDb();
        if (database) {
          const fresh = await database.getAllScores();
          setAllScores(fresh);
        }
      } catch (err) {
        console.error("Error fetching scores:", err);
      }
    };
    fetchAllScores();
  }, [localScores]);

  const filteredScores = allScores.filter(
    (score) =>
      score.testType === testType &&
      classLearners.some((l) => l.id === score.learnerId) &&
      classSubjects.some((s) => s.id === score.subjectId),
  );

  const getScore = (learnerId: number, subjectId: number) => {
    return filteredScores.find(
      (s) => s.learnerId === learnerId && s.subjectId === subjectId,
    )?.score;
  };

  const handleSaveScore = async () => {
    if (!editingScore) return;

    const newScore = parseInt(editValue);
    const subject = classSubjects.find((s) => s.id === editingScore.subjectId);
    const maxMark = subject?.maxMark || 100;

    if (isNaN(newScore) || newScore < 0 || newScore > maxMark) {
      alert(`Invalid score. Please enter a value between 0 and ${maxMark}.`);
      return;
    }

    try {
      const database = await initDb();

      if (!database) throw new Error("Database not available");

      const now = new Date();
      const year = now.getFullYear();
      const currentMonth = now.getMonth();
      const term =
        currentMonth >= 8 ? "Term3" : currentMonth >= 4 ? "Term2" : "Term1";
      const weekNumber = 1;

      const scoreData = {
        learnerId: editingScore.learnerId,
        subjectId: editingScore.subjectId,
        testType: testType || "endofterm",
        score: newScore,
        term: term,
        year: year,
        weekNumber: weekNumber,
        dateEntered: Date.now(),
      };

      await database.updateScore(scoreData);

      // Immediately refresh allScores
      const refreshed = await database.getAllScores();
      setAllScores(refreshed);

      setSaveSuccess(true);
      setTimeout(() => {
        setEditingScore(null);
        setEditValue("");
        setSaveSuccess(false);
      }, 1000);
    } catch (err) {
      console.error("Error saving score:", err);
      alert("Error saving score. Please try again.");
    }
  };

  const getScoreColorInfo = (score?: number, maxMark: number = 100) => {
    if (score === undefined || score === null)
      return { bg: t.surfaceAlt, text: t.textMuted, border: t.borderSub };
    const level = classInfo?.educationLevel || "secondary";
    return getGradeColor(score, maxMark, level);
  };

  const calculateLearnerAverage = (learnerId: number) => {
    const learnerScores = filteredScores.filter(
      (s) => s.learnerId === learnerId,
    );
    if (learnerScores.length === 0) return 0;
    const total = learnerScores.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round(total / learnerScores.length);
  };

  const generateAIMessage = async () => {
    if (!aiLearner || !aiMessage) return;

    const learner = classLearners.find((l) => l.id === aiLearner);
    if (!learner) return;

    const scores = classSubjects.map((s) => ({
      subject: s.subjectName,
      score: getScore(aiLearner, s.id!) || 0,
      maxMark: s.maxMark || 100,
    }));

    const avg = calculateLearnerAverage(aiLearner);
    const topSubject = scores.sort((a, b) => b.score - a.score)[0];
    const weakSubject = scores.sort((a, b) => a.score - b.score)[0];

    const prompt = `Generate a professional parent message about ${learner.name}'s academic performance.
${aiMessage === "positive" ? "Tone: Encouraging and positive, celebrating strengths." : "Tone: Urgent, action-required, addressing concerns."}

SCORES:
${scores.map((s) => `${s.subject}: ${s.score}/${s.maxMark}`).join("\n")}
Overall Average: ${avg}%
Strongest: ${topSubject.subject}
Needs Help: ${weakSubject.subject}

Write 2-3 sentences suitable for SMS or email. Include specific scores.`;

    setAiLoading(true);
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setAiGeneratedMessage(data.choices?.[0]?.message?.content || "");
    } catch (err) {
      alert("Error generating message. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Generate PDF Logic
  const handleGeneratePDF = async (subjectId: number) => {
    setGeneratingPDF(true);
    try {
      if (!(window as any).jspdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load jsPDF"));
          document.head.appendChild(script);
        });
      }
      await generatePosterPDF(subjectId);
    } catch (error) {
      console.error("Error loading jsPDF:", error);
      alert("Error loading PDF library. Please try again.");
      setGeneratingPDF(false);
    }
  };

  const generatePosterPDF = async (subjectId: number) => {
    try {
      const subject = classSubjects.find((s) => s.id === subjectId);
      if (!subject) return;

      // Fetch school name from settings
      const database = await initDb();
      let posterSchoolName = schoolName || "School";

      if (database) {
        try {
          const cachedSettings = localStorage.getItem(
            "rankitz-school-settings",
          );
          let settingsSchoolName = null;

          if (cachedSettings) {
            const parsed = JSON.parse(cachedSettings);
            settingsSchoolName = parsed.schoolName;
          }

          const schoolSettings = await database.getSchoolSettings(
            "Term 1",
            new Date().getFullYear(),
          );
          const schoolData = await database.getSchool(1);

          posterSchoolName =
            (schoolSettings as any)?.schoolName ||
            settingsSchoolName ||
            schoolData?.schoolName ||
            schoolName ||
            "School";
        } catch (e) {
          console.warn("Failed to fetch school settings for PDF:", e);
          // Falls back to schoolName from useAuth
        }
      }

      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 0, g: 0, b: 0 };
      };

      const colors =
        SUBJECT_COLORS[subject.subjectName as keyof typeof SUBJECT_COLORS] ||
        SUBJECT_COLORS.Mathematics;
      const primaryRgb = hexToRgb(colors.primary);

      let yPos = 0;

      // HEADER
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, 0, pageWidth, 55, "F");
      doc.setFillColor(255, 255, 255);
      doc.ellipse(pageWidth / 2, 55, pageWidth, 12, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${new Date().getFullYear()} • Term 1`, pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFontSize(28);
      doc.text(subject.subjectName, pageWidth / 2, 32, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text(
        testType === "term1" ? "Term 1 Examination" : testType || "Test Score",
        pageWidth / 2,
        42,
        { align: "center" },
      );

      yPos = 70;

      // SCHOOL INFO
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(posterSchoolName, margin, yPos);

      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Official Results Notice", margin, yPos + 6);

      const classText = `Class: ${classInfo?.className || "N/A"}`;
      const classTextWidth = doc.getTextWidth(classText);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(
        pageWidth - margin - classTextWidth - 10,
        yPos - 5,
        classTextWidth + 10,
        10,
        2,
        2,
        "F",
      );
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(classText, pageWidth - margin - 5, yPos + 1.5, {
        align: "right",
      });

      yPos += 14;
      doc.setDrawColor(229, 233, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // STATISTICS
      const subjectScores = classLearners
        .map((learner) => ({
          name: learner.name,
          score: getScore(learner.id!, subjectId) || 0,
          gender: learner.gender || "M",
        }))
        .filter((s) => s.score > 0);

      if (subjectScores.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128);
        doc.text("No scores available", pageWidth / 2, yPos + 20, {
          align: "center",
        });
        setGeneratingPDF(false);
        doc.save(`${subject.subjectName.replace(/\s+/g, "_")}_scores.pdf`);
        return;
      }

      const avgScore = Math.round(
        subjectScores.reduce((sum, s) => sum + s.score, 0) /
          subjectScores.length,
      );
      const maxScore = Math.max(...subjectScores.map((s) => s.score));

      const boxW = (contentWidth - 10) / 3;
      const boxH = 22;

      // Total Box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 233, 235);
      doc.roundedRect(margin, yPos, boxW, boxH, 3, 3, "FD");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL STUDENTS", margin + boxW / 2, yPos + 7, {
        align: "center",
      });
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setFontSize(18);
      doc.text(`${subjectScores.length}`, margin + boxW / 2, yPos + 17, {
        align: "center",
      });

      // Avg Box
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setDrawColor(
        hexToRgb(colors.dark).r,
        hexToRgb(colors.dark).g,
        hexToRgb(colors.dark).b,
      );
      doc.roundedRect(margin + boxW + 5, yPos, boxW, boxH, 3, 3, "FD");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("CLASS AVERAGE", margin + boxW + 5 + boxW / 2, yPos + 7, {
        align: "center",
      });
      doc.setFontSize(18);
      doc.text(`${avgScore}%`, margin + boxW + 5 + boxW / 2, yPos + 17, {
        align: "center",
      });

      // Top Score Box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 233, 235);
      doc.roundedRect(margin + boxW * 2 + 10, yPos, boxW, boxH, 3, 3, "FD");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TOP SCORE", margin + boxW * 2 + 10 + boxW / 2, yPos + 7, {
        align: "center",
      });
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setFontSize(18);
      doc.text(`${maxScore}%`, margin + boxW * 2 + 10 + boxW / 2, yPos + 17, {
        align: "center",
      });

      yPos += 35;

      // TABLE HEADER
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.roundedRect(margin, yPos, contentWidth, 10, 1.5, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");

      const colX = {
        rank: margin + 5,
        name: margin + 25,
        gender: margin + 100,
        score: margin + 130,
        grade: margin + 160,
      };

      doc.text("RANK", colX.rank, yPos + 6.5);
      doc.text("STUDENT NAME", colX.name, yPos + 6.5);
      doc.text("GENDER", colX.gender, yPos + 6.5, { align: "center" });
      doc.text("SCORE", colX.score, yPos + 6.5, { align: "center" });
      doc.text("GRADE", colX.grade, yPos + 6.5, { align: "center" });

      yPos += 10;

      // ROWS
      const sorted = [...subjectScores].sort((a, b) => b.score - a.score);

      sorted.forEach((student, idx) => {
        const subject = classSubjects.find((s) => s.id === subjectId);
        const maxMark = subject?.maxMark || 100;
        const level = classInfo?.educationLevel || "secondary";
        const grade = getGradeLabel(student.score, maxMark, level);
        const isEven = idx % 2 === 1;

        if (isEven) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPos, contentWidth, 12, "F");
        }

        doc.setDrawColor(229, 233, 235);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos + 12, margin + contentWidth, yPos + 12);

        if (idx === 0) {
          doc.setFillColor(255, 215, 0);
          doc.circle(colX.rank + 3.5, yPos + 6, 3.5, "F");
        } else if (idx === 1) {
          doc.setFillColor(192, 192, 192);
          doc.circle(colX.rank + 3.5, yPos + 6, 3.5, "F");
        } else if (idx === 2) {
          doc.setFillColor(205, 127, 50);
          doc.circle(colX.rank + 3.5, yPos + 6, 3.5, "F");
        }

        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", idx < 3 ? "bold" : "normal");
        doc.setFontSize(10);
        doc.text(`${idx + 1}`, colX.rank + (idx < 3 ? 3.5 : 0), yPos + 7.5, {
          align: idx < 3 ? "center" : "left",
        });

        doc.setFont("helvetica", "normal");
        doc.text(student.name, colX.name, yPos + 7.5);
        doc.text(student.gender, colX.gender, yPos + 7.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.text(`${student.score}%`, colX.score, yPos + 7.5, {
          align: "center",
        });
        let gBg, gText;
        switch (grade) {
          case "One":
            gBg = { r: 209, g: 250, b: 229 };
            gText = { r: 6, g: 95, b: 70 };
            break;
          case "Two":
            gBg = { r: 209, g: 250, b: 229 };
            gText = { r: 6, g: 95, b: 70 };
            break;
          case "Three":
            gBg = { r: 219, g: 234, b: 254 };
            gText = { r: 30, g: 64, b: 175 };
            break;
          case "Four":
            gBg = { r: 219, g: 234, b: 254 };
            gText = { r: 30, g: 64, b: 175 };
            break;
          case "Five":
            gBg = { r: 254, g: 243, b: 199 };
            gText = { r: 146, g: 64, b: 14 };
            break;
          case "Six":
            gBg = { r: 254, g: 243, b: 199 };
            gText = { r: 146, g: 64, b: 14 };
            break;
          case "Seven":
            gBg = { r: 255, g: 237, b: 213 };
            gText = { r: 154, g: 52, b: 18 };
            break;
          case "Eight":
            gBg = { r: 255, g: 237, b: 213 };
            gText = { r: 154, g: 52, b: 18 };
            break;
          case "Fail":
          default:
            gBg = { r: 254, g: 226, b: 226 };
            gText = { r: 153, g: 27, b: 27 };
            break;
        }

        doc.setFillColor(gBg.r, gBg.g, gBg.b);
        doc.roundedRect(colX.grade - 6, yPos + 2.5, 12, 7, 1.5, 1.5, "F");
        doc.setTextColor(gText.r, gText.g, gText.b);
        doc.setFontSize(9);
        doc.text(grade, colX.grade, yPos + 7.5, { align: "center" });

        yPos += 12;

        if (yPos > pageHeight - margin - 20 && idx < sorted.length - 1) {
          doc.addPage();
          yPos = margin;
        }
      });

      yPos = Math.max(yPos + 10, pageHeight - margin - 5);
      doc.setDrawColor(229, 233, 235);
      doc.setLineDash([2, 2], 0);
      doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
      doc.setLineDash([], 0);

      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} | ${posterSchoolName} Notice Board`,
        pageWidth / 2,
        yPos,
        { align: "center" },
      );

      doc.save(`${subject.subjectName.replace(/\s+/g, "_")}_scores.pdf`);
      setGeneratingPDF(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
      setGeneratingPDF(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        background: t.bg,
        fontFamily:
          "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', sans-serif",
        color: t.text,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
        }}
      >
        {/* Professional Topbar */}
        <header
          style={{
            background: isMobile
              ? dark
                ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
                : "linear-gradient(135deg, #0F766E 0%, #10B981 100%)"
              : t.topbar,
            borderBottom: isMobile
              ? "1px solid rgba(255,255,255,0.1)"
              : `1px solid ${t.border}`,
            padding: isMobile ? "14px 16px" : "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
            flexShrink: 0,
            boxShadow: isMobile ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => navigate("/tests")}
              style={{
                background: isMobile ? "rgba(255,255,255,0.1)" : "transparent",
                border: isMobile
                  ? "1px solid rgba(255,255,255,0.15)"
                  : `1px solid ${t.border}`,
                color: isMobile ? "rgba(255,255,255,0.85)" : t.textMuted,
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                transition: "all 0.2s ease",
              }}
              title="Back"
            >
              <div style={{ width: 18, height: 18 }}>{Icons.back}</div>
            </button>
            <div>
              <div
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 700,
                  color: isMobile ? "#FFFFFF" : t.text,
                  letterSpacing: "-0.5px",
                }}
              >
                Results Analysis
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isMobile ? "rgba(255,255,255,0.65)" : t.textMuted,
                  marginTop: 2,
                  fontWeight: 400,
                }}
              >
                {classInfo?.className} •{" "}
                {testType === "term1" ? "Term 1 Exam" : "Assessment"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{
                background: isMobile ? "rgba(255,255,255,0.1)" : t.surface,
                border: isMobile
                  ? "1px solid rgba(255,255,255,0.15)"
                  : `1px solid ${t.border}`,
                borderRadius: 6,
                padding: isMobile ? "8px" : "8px 14px",
                color: isMobile ? "rgba(255,255,255,0.85)" : t.textSub,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
                minWidth: isMobile ? 36 : "auto",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 16, height: 16 }}>{Icons.download}</div>
              {!isMobile && "Print View"}
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              style={{
                background: isMobile ? "rgba(255,255,255,0.15)" : t.accent,
                border: isMobile ? "1px solid rgba(255,255,255,0.2)" : "none",
                borderRadius: 6,
                padding: isMobile ? "8px 10px" : "8px 14px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              🤖{!isMobile && " AI Messages"}
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: isMobile ? "12px" : "24px 32px",
            overflowY: "auto",
          }}
        >
          {/* Professional Underline Tabs */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginBottom: 24,
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            {(["table", "subject", "learner"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                style={{
                  padding: "0 4px 12px 4px",
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 600,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: viewType === view ? t.accent : t.textMuted,
                  borderBottom:
                    viewType === view
                      ? `2px solid ${t.accent}`
                      : "2px solid transparent",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 4 : 8,
                  textTransform: "capitalize",
                  marginBottom: "-1px",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ width: 16, height: 16 }}>
                  {view === "table"
                    ? Icons.table
                    : view === "subject"
                      ? Icons.subject
                      : Icons.user}
                </div>
                {isMobile
                  ? view === "table"
                    ? "Table"
                    : view === "subject"
                      ? "Subject"
                      : "Learner"
                  : `${view} View`}
              </button>
            ))}
          </div>

          {/* Selectors */}
          {(viewType === "subject" || viewType === "learner") &&
            !loading &&
            filteredScores.length > 0 && (
              <div style={{ marginBottom: 24, maxWidth: 320 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: t.textMuted,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {viewType === "subject"
                    ? "Filter by Subject"
                    : "Select Learner"}
                </label>
                {viewType === "subject" ? (
                  <select
                    value={selectedSubject || ""}
                    onChange={(e) =>
                      setSelectedSubject(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${t.border}`,
                      background: t.surface,
                      color: t.text,
                      fontSize: 13,
                      fontWeight: 500,
                      outline: "none",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                  >
                    {classSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedLearner || ""}
                    onChange={(e) =>
                      setSelectedLearner(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${t.border}`,
                      background: t.surface,
                      color: t.text,
                      fontSize: 13,
                      fontWeight: 500,
                      outline: "none",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                  >
                    {classLearners.map((learner) => (
                      <option key={learner.id} value={learner.id}>
                        {learner.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

          {/* Loading State */}
          {loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 0",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `2px solid ${t.accent}`,
                  borderTopColor: "transparent",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: 16,
                }}
              />
              <div
                style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}
              >
                Retrieving scores...
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredScores.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 24px",
                textAlign: "center",
                background: t.surface,
                border: `1px dashed ${t.border}`,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  color: t.border,
                  marginBottom: 16,
                }}
              >
                {Icons.empty}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: t.text,
                  marginBottom: 6,
                }}
              >
                No Data Available
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  maxWidth: 300,
                  lineHeight: 1.5,
                }}
              >
                Scores haven't been recorded for this class and test type yet.
                Head back to enter scores.
              </div>
            </div>
          )}

          {/* TABLE VIEW */}
          {!loading &&
            filteredScores.length > 0 &&
            viewType === "table" &&
            (isMobile ? (
              // Mobile: Card per learner
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {classLearners.map((learner) => {
                  const avg = calculateLearnerAverage(learner.id!);
                  const avgInfo = getScoreColorInfo(avg, 100);
                  return (
                    <div
                      key={learner.id}
                      style={{
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: 12,
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: t.text,
                          }}
                        >
                          {learner.name}
                        </div>
                        <div
                          style={{
                            background: avgInfo.bg,
                            color: avgInfo.text,
                            border: `1px solid ${avgInfo.border}`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          AVG: {avg}%
                        </div>
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {classSubjects.map((subject) => {
                          const score = getScore(learner.id!, subject.id!);
                          const sInfo = getScoreColorInfo(
                            score,
                            subject.maxMark || 100,
                          );
                          return (
                            <button
                              key={subject.id}
                              onClick={() => {
                                setEditingScore({
                                  learnerId: learner.id!,
                                  subjectId: subject.id!,
                                  currentScore: score || 0,
                                });
                                setEditValue(score?.toString() || "");
                              }}
                              style={{
                                background: sInfo.bg,
                                color: sInfo.text,
                                border: `1px solid ${sInfo.border}`,
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {subject.subjectName.substring(0, 3)}:{" "}
                              {score ?? "—"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
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
                        background: t.surfaceAlt,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      <th
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: t.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "12px 16px",
                          minWidth: 160,
                        }}
                      >
                        Learner Name
                      </th>
                      {classSubjects.map((subject) => (
                        <th
                          key={subject.id}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: t.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "12px 16px",
                            textAlign: "center",
                            minWidth: 80,
                          }}
                        >
                          {subject.subjectName.substring(0, 3)}
                        </th>
                      ))}
                      <th
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: t.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "12px 16px",
                          textAlign: "center",
                          minWidth: 80,
                        }}
                      >
                        AVG
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classLearners.map((learner) => (
                      <tr
                        key={learner.id}
                        style={{
                          borderBottom: `1px solid ${t.borderSub}`,
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = t.surfaceAlt;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: t.text,
                            padding: "12px 16px",
                          }}
                        >
                          {learner.name}
                        </td>
                        {classSubjects.map((subject) => {
                          const score = getScore(learner.id!, subject.id!);
                          const sInfo = getScoreColorInfo(
                            score,
                            subject.maxMark || 100,
                          );
                          return (
                            <td
                              key={subject.id}
                              style={{
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() => {
                                  setEditingScore({
                                    learnerId: learner.id!,
                                    subjectId: subject.id!,
                                    currentScore: score || 0,
                                  });
                                  setEditValue(score?.toString() || "");
                                }}
                                style={{
                                  background: "transparent",
                                  color: sInfo.text,
                                  padding: "4px 8px",
                                  borderRadius: 4,
                                  border: `1px solid transparent`,
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  minWidth: 40,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = sInfo.bg;
                                  e.currentTarget.style.borderColor =
                                    sInfo.border;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.borderColor =
                                    "transparent";
                                }}
                              >
                                {score !== undefined ? score : "—"}
                              </button>
                            </td>
                          );
                        })}
                        <td
                          style={{ padding: "8px 12px", textAlign: "center" }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: t.textSub,
                            }}
                          >
                            {calculateLearnerAverage(learner.id!)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* SUBJECT VIEW */}
          {!loading &&
            filteredScores.length > 0 &&
            viewType === "subject" &&
            selectedSubject && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div style={{ position: "relative", width: 300 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: t.textMuted,
                        width: 14,
                        height: 14,
                      }}
                    >
                      {Icons.search}
                    </div>
                    <input
                      type="text"
                      placeholder="Search learners..."
                      value={searchLearnerQuery}
                      onChange={(e) => setSearchLearnerQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 34px",
                        borderRadius: 6,
                        border: `1px solid ${t.border}`,
                        background: t.surface,
                        color: t.text,
                        fontSize: 13,
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = t.accent;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = t.border;
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleGeneratePDF(selectedSubject)}
                    disabled={generatingPDF}
                    style={{
                      background: t.accent,
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      cursor: generatingPDF ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.2s ease",
                      opacity: generatingPDF ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!generatingPDF)
                        e.currentTarget.style.background = t.accentDark;
                    }}
                    onMouseLeave={(e) => {
                      if (!generatingPDF)
                        e.currentTarget.style.background = t.accent;
                    }}
                  >
                    <div style={{ width: 16, height: 16 }}>{Icons.pdf}</div>
                    {generatingPDF ? "Generating..." : "Export Poster"}
                  </button>
                </div>

                <div
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {classLearners
                    .filter((l) =>
                      l.name
                        .toLowerCase()
                        .includes(searchLearnerQuery.toLowerCase()),
                    )
                    .map((learner, idx, arr) => {
                      const score = getScore(learner.id!, selectedSubject);
                      const sInfo = getScoreColorInfo(
                        score,
                        classSubjects.find((s) => s.id === selectedSubject)
                          ?.maxMark || 100,
                      );
                      return (
                        <div
                          key={learner.id}
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom:
                              idx < arr.length - 1
                                ? `1px solid ${t.borderSub}`
                                : "none",
                            transition: "background 0.2s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = t.surfaceAlt)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: t.text,
                              }}
                            >
                              {learner.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: t.textMuted,
                                marginTop: 2,
                              }}
                            >
                              {learner.gender === "M" ? "Male" : "Female"}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingScore({
                                learnerId: learner.id!,
                                subjectId: selectedSubject,
                                currentScore: score || 0,
                              });
                              setEditValue(score?.toString() || "");
                            }}
                            style={{
                              background: sInfo.bg,
                              color: sInfo.text,
                              padding: "6px 12px",
                              borderRadius: 4,
                              border: `1px solid ${sInfo.border}`,
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              minWidth: 48,
                              textAlign: "center",
                              transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = "brightness(0.95)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = "none";
                            }}
                          >
                            {score !== undefined ? score : "—"}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          {/* LEARNER VIEW */}
          {!loading &&
            filteredScores.length > 0 &&
            viewType === "learner" &&
            selectedLearner && (
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: t.surfaceAlt,
                    borderBottom: `1px solid ${t.border}`,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 600, color: t.text, fontSize: 15 }}
                    >
                      {
                        classLearners.find((l) => l.id === selectedLearner)
                          ?.name
                      }
                    </div>
                    <div
                      style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}
                    >
                      Learner ID: {selectedLearner}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: t.textMuted,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      Overall Avg
                    </div>
                    <div
                      style={{ color: t.accent, fontWeight: 700, fontSize: 18 }}
                    >
                      {calculateLearnerAverage(selectedLearner)}%
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 20px",
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div style={{ position: "relative", maxWidth: 300 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: t.textMuted,
                        width: 14,
                        height: 14,
                      }}
                    >
                      {Icons.search}
                    </div>
                    <input
                      type="text"
                      placeholder="Filter subjects..."
                      value={searchSubjectQuery}
                      onChange={(e) => setSearchSubjectQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 10px 6px 30px",
                        borderRadius: 4,
                        border: `1px solid ${t.border}`,
                        background: t.surface,
                        color: t.text,
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  {classSubjects
                    .filter((s) =>
                      s.subjectName
                        .toLowerCase()
                        .includes(searchSubjectQuery.toLowerCase()),
                    )
                    .map((subject, idx, arr) => {
                      const score = getScore(selectedLearner, subject.id!);
                      const sInfo = getScoreColorInfo(
                        score,
                        subject.maxMark || 100,
                      );
                      return (
                        <div
                          key={subject.id}
                          style={{
                            padding: "12px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom:
                              idx < arr.length - 1
                                ? `1px solid ${t.borderSub}`
                                : "none",
                            transition: "background 0.2s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = t.surfaceAlt)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: t.text,
                            }}
                          >
                            {subject.subjectName}
                          </div>
                          <button
                            onClick={() => {
                              setEditingScore({
                                learnerId: selectedLearner,
                                subjectId: subject.id!,
                                currentScore: score || 0,
                              });
                              setEditValue(score?.toString() || "");
                            }}
                            style={{
                              background: sInfo.bg,
                              color: sInfo.text,
                              padding: "4px 12px",
                              borderRadius: 4,
                              border: `1px solid ${sInfo.border}`,
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              minWidth: 48,
                              textAlign: "center",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = "brightness(0.95)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = "none";
                            }}
                          >
                            {score !== undefined ? score : "—"}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
        </main>
      </div>

      {/* Edit Score Modal */}
      {editingScore && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !saveSuccess && setEditingScore(null)}
        >
          {/* Subtle Success Alert */}
          {saveSuccess && (
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: `0 10px 25px ${t.shadowMd}`,
                animation: "scaleIn 0.2s ease-out",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  color: t.accent,
                  background: t.accentLighter,
                  borderRadius: "50%",
                  padding: 4,
                }}
              >
                {Icons.check}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
                Score updated successfully
              </div>
            </div>
          )}

          {/* Edit Form */}
          {!saveSuccess && (
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "24px",
                maxWidth: 360,
                width: "90%",
                boxShadow: `0 10px 25px ${t.shadowMd}`,
                animation: "scaleIn 0.2s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: t.text,
                  marginBottom: 4,
                }}
              >
                Update Score
              </h2>
              <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 20 }}>
                {
                  classLearners.find((l) => l.id === editingScore.learnerId)
                    ?.name
                }{" "}
                •{" "}
                {
                  classSubjects.find((s) => s.id === editingScore.subjectId)
                    ?.subjectName
                }
              </p>

              <div style={{ marginBottom: 24 }}>
                {(() => {
                  const subject = classSubjects.find(
                    (s) => s.id === editingScore.subjectId,
                  );
                  const maxMark = subject?.maxMark || 100;
                  const numValue = parseInt(editValue);
                  const isInvalid = !!(
                    editValue &&
                    (isNaN(numValue) || numValue < 0 || numValue > maxMark)
                  );

                  return (
                    <>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 6,
                          border: `1px solid ${
                            isInvalid ? t.red + "60" : t.border
                          }`,
                          background: isInvalid ? t.redBg : t.surface,
                          color: isInvalid ? t.red : t.text,
                          fontSize: 15,
                          fontWeight: 500,
                          outline: "none",
                          transition:
                            "border-color 0.2s, background-color 0.2s",
                        }}
                        onFocus={(e) => {
                          const val = parseInt(editValue);
                          if (editValue && (isNaN(val) || val > maxMark)) {
                            e.currentTarget.style.borderColor = t.red;
                          } else {
                            e.currentTarget.style.borderColor = t.accent;
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(editValue);
                          if (editValue && (isNaN(val) || val > maxMark)) {
                            e.currentTarget.style.borderColor = t.red + "60";
                          } else {
                            e.currentTarget.style.borderColor = t.border;
                          }
                        }}
                        autoFocus
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <p style={{ fontSize: 11, color: t.textMuted }}>
                          Max: {maxMark}
                        </p>
                        {isInvalid && (
                          <p
                            style={{
                              fontSize: 11,
                              color: t.red,
                              fontWeight: 600,
                            }}
                          >
                            {numValue > maxMark
                              ? `Exceeds max by ${numValue - maxMark}`
                              : "Invalid score"}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <button
                  onClick={() => setEditingScore(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.surfaceAlt;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.surface;
                  }}
                >
                  Cancel
                </button>
                {(() => {
                  const subject = classSubjects.find(
                    (s) => s.id === editingScore.subjectId,
                  );
                  const maxMark = subject?.maxMark || 100;
                  const numValue = parseInt(editValue);
                  const isInvalid =
                    editValue &&
                    (isNaN(numValue) || numValue < 0 || numValue > maxMark);

                  return (
                    <button
                      onClick={handleSaveScore}
                      disabled={!!isInvalid}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "none",
                        background: isInvalid ? t.border : t.accent,
                        color: isInvalid ? t.textMuted : "#fff",
                        cursor: isInvalid ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        opacity: isInvalid ? 0.5 : 1,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isInvalid)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = t.accentDark;
                      }}
                      onMouseLeave={(e) => {
                        if (!isInvalid)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = t.accent;
                      }}
                    >
                      Save Changes
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Communication Modal */}
      {showAIModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowAIModal(false)}
        >
          <div
            style={{
              background: t.surface,
              borderRadius: 12,
              padding: "24px",
              maxWidth: 500,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text }}>
                🤖 AI Communication Assistant
              </h2>
              <button
                onClick={() => setShowAIModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: t.textMuted,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Select Learner
              </label>
              <select
                value={aiLearner || ""}
                onChange={(e) =>
                  setAiLearner(e.target.value ? parseInt(e.target.value) : null)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: `1px solid ${t.border}`,
                  background: t.surfaceAlt,
                  color: t.text,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <option value="">Choose a learner...</option>
                {classLearners.map((learner) => {
                  const avg = calculateLearnerAverage(learner.id!);
                  return (
                    <option key={learner.id} value={learner.id}>
                      {learner.name} - Avg: {avg}%
                    </option>
                  );
                })}
              </select>
            </div>

            {aiLearner && (
              <div
                style={{
                  background: t.surfaceAlt,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    marginBottom: 8,
                  }}
                >
                  Learner Scores:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {classSubjects.map((subject) => {
                    const score = getScore(aiLearner, subject.id!);
                    const sInfo = getScoreColorInfo(
                      score,
                      subject.maxMark || 100,
                    );
                    return (
                      <div
                        key={subject.id}
                        style={{
                          background: sInfo.bg,
                          color: sInfo.text,
                          padding: "6px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {subject.subjectName.substring(0, 4)}: {score || "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Message Tone
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => setAiMessage("positive")}
                  style={{
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${
                      aiMessage === "positive" ? t.accent : t.border
                    }`,
                    background:
                      aiMessage === "positive" ? t.accentBg : t.surface,
                    color: aiMessage === "positive" ? t.accent : t.text,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ✓ Positive
                </button>
                <button
                  onClick={() => setAiMessage("urgent")}
                  style={{
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${
                      aiMessage === "urgent" ? t.accent : t.border
                    }`,
                    background: aiMessage === "urgent" ? t.accentBg : t.surface,
                    color: aiMessage === "urgent" ? t.accent : t.text,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Urgent
                </button>
              </div>
            </div>

            <button
              onClick={() => generateAIMessage()}
              disabled={!aiLearner || !aiMessage || aiLoading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 6,
                border: "none",
                background:
                  !aiLearner || !aiMessage || aiLoading ? t.border : t.accent,
                color: "#fff",
                cursor:
                  !aiLearner || !aiMessage || aiLoading
                    ? "not-allowed"
                    : "pointer",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {aiLoading ? "Generating..." : "Generate Message"}
            </button>

            {aiGeneratedMessage && (
              <div
                style={{
                  background: t.surfaceAlt,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: t.textMuted,
                    marginBottom: 8,
                  }}
                >
                  Generated Message:
                </div>
                <textarea
                  value={aiGeneratedMessage}
                  onChange={(e) => setAiGeneratedMessage(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 12,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiGeneratedMessage);
                    alert("Message copied to clipboard!");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  📋 Copy Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}
