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

// ==================== PDF HTML Template ====================
const generatePDFHTML = (
  analytics: AnalyticsData,
  selectedClass: string,
  educationLevel: string,
  term: string,
  schoolName: string = "School Report",
) => {
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Analytics Report - ${selectedClass}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333;
          line-height: 1.4;
          font-size: 11px;
          background: white;
        }
        
        @page {
          size: A4;
          margin: 0.4in;
        }
        
        .container {
          width: 100%;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0;
        }
        
        /* Header */
        .header {
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          color: white;
          padding: 14px 16px;
          border-radius: 4px;
          margin-bottom: 10px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
        }
        
        .header h1 {
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .header .subtitle {
          font-size: 11px;
          opacity: 0.95;
          margin: 0 0 3px 0;
          font-weight: 600;
        }
        
        .header .date {
          font-size: 9px;
          opacity: 0.85;
          margin: 0;
          font-weight: 500;
        }
        
        /* School Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
          padding: 6px;
          background: #f9fafb;
          border-radius: 3px;
          border-left: 3px solid #10B981;
          text-align: center;
        }
        
        .info-label {
          font-size: 8px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 2px;
          letter-spacing: 0.3px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
        }
        
        /* Section Title */
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          margin-top: 6px;
          margin-bottom: 4px;
          padding-bottom: 2px;
          border-bottom: 2px solid #10B981;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        
        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 8px 10px;
          border-radius: 4px;
          border-left: 3px solid #10B981;
          border: 1px solid #d1fae5;
          text-align: center;
          box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1);
        }
        
        .card-label {
          font-size: 8px;
          color: #6b7280;
          font-weight: 700;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .card-value {
          font-size: 14px;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
        }
        
        .card-subtitle {
          font-size: 8px;
          color: #9ca3af;
          margin-top: 2px;
        }
        
        /* Gender Boxes */
        .gender-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .gender-box {
          background: #f9fafb;
          padding: 8px 10px;
          border-radius: 4px;
          border: 1.5px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .gender-box h3 {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #059669;
          text-align: center;
          border-bottom: 2px solid #d1fae5;
          padding-bottom: 4px;
        }
        
        .gender-stat {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 9px;
        }
        
        .gender-stat:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          color: #6b7280;
          font-weight: 600;
        }
        
        .stat-value {
          font-weight: 700;
          color: #10B981;
        }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 9px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        table thead {
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
        }
        
        table th {
          padding: 6px 8px;
          text-align: left;
          font-weight: 700;
          color: white;
          border-bottom: 2px solid #059669;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        table td {
          padding: 4px;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        /* Criteria Box */
        .criteria-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1.5px solid #d1fae5;
          padding: 10px 12px;
          border-radius: 4px;
          margin-top: 8px;
          font-size: 9px;
          box-shadow: 0 2px 4px rgba(5, 150, 105, 0.1);
        }
        
        .criteria-box h3 {
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 8px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .criteria-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .criteria-section h4 {
          font-size: 9px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 3px;
          text-align: center;
        }
        
        .criteria-section ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .criteria-section li {
          padding: 2px 0 2px 10px;
          position: relative;
          font-size: 8px;
          color: #374151;
        }
        
        .criteria-section li:before {
          content: "•";
          position: absolute;
          left: 3px;
          color: #10B981;
          font-weight: bold;
        }
        
        /* Footer */
        .footer {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 8px;
          color: #6b7280;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>${schoolName.toUpperCase()}</h1>
          <p class="subtitle">📊 CLASS ANALYTICS REPORT</p>
          <p class="subtitle" style="font-size: 9px; margin-top: 2px;">RankIT ZM - School Management System</p>
          <p class="date">${reportDate}</p>
        </div>
        
        <!-- School Info -->
        <div class="info-grid">
          <div>
            <div class="info-label">Class</div>
            <div class="info-value">${selectedClass}</div>
          </div>
          <div>
            <div class="info-label">Level</div>
            <div class="info-value">${educationLevel}</div>
          </div>
          <div>
            <div class="info-label">Total Students</div>
            <div class="info-value">${analytics.totalStudents}</div>
          </div>
          <div>
            <div class="info-label">Term</div>
            <div class="info-value">${term || "All"}</div>
          </div>
        </div>
        
        <!-- Overall Summary -->
        <h2 class="section-title">OVERALL SUMMARY</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="card-label">Present</div>
            <div class="card-value">${analytics.studentsPresent}</div>
            <div class="card-subtitle">Absent: ${analytics.studentsAbsent}</div>
          </div>
          <div class="summary-card">
            <div class="card-label">Pass Rate</div>
            <div class="card-value">${analytics.quantityPassRate.toFixed(1)}%</div>
            <div class="card-subtitle">${analytics.totalPassed} passed</div>
          </div>
          <div class="summary-card">
            <div class="card-label">Quality Pass</div>
            <div class="card-value">${analytics.qualityPassRate.toFixed(1)}%</div>
            <div class="card-subtitle">Grade 2+/4+</div>
          </div>
        </div>
        
        <!-- Gender Performance -->
        <h2 class="section-title">GENDER PERFORMANCE</h2>
        <div class="gender-boxes">
          <div class="gender-box">
            <h3>👨 Male (${analytics.maleCount})</h3>
            <div class="gender-stat">
              <span class="stat-label">Quality Pass</span>
              <span class="stat-value">${analytics.maleCount > 0 ? ((analytics.maleQualityPass / analytics.maleCount) * 100).toFixed(1) : 0}%</span>
            </div>
            <div class="gender-stat">
              <span class="stat-label">Quantity Pass</span>
              <span class="stat-value">${analytics.maleCount > 0 ? ((analytics.maleQuantityPass / analytics.maleCount) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
          <div class="gender-box">
            <h3>👩 Female (${analytics.femaleCount})</h3>
            <div class="gender-stat">
              <span class="stat-label">Quality Pass</span>
              <span class="stat-value">${analytics.femaleCount > 0 ? ((analytics.femaleQualityPass / analytics.femaleCount) * 100).toFixed(1) : 0}%</span>
            </div>
            <div class="gender-stat">
              <span class="stat-label">Quantity Pass</span>
              <span class="stat-value">${analytics.femaleCount > 0 ? ((analytics.femaleQuantityPass / analytics.femaleCount) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
        
        <!-- Subject Analysis -->
        <h2 class="section-title">SUBJECT ANALYSIS (Top 5)</h2>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th class="text-center">Qty %</th>
              <th class="text-center">Qty %</th>
              <th class="text-center">High</th>
              <th class="text-center">Low</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.subjectAnalysis
              .slice(0, 5)
              .map(
                (s) => `
              <tr>
                <td>${s.name}</td>
                <td class="text-center">${s.quantityPassRate.toFixed(0)}%</td>
                <td class="text-center">${s.qualityPassRate.toFixed(0)}%</td>
                <td class="text-right">${s.highestScore.toFixed(0)}</td>
                <td class="text-right">${s.lowestScore.toFixed(0)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <!-- Grade Distribution -->
        <h2 class="section-title">GRADE DISTRIBUTION</h2>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th class="text-center">Range</th>
              <th class="text-center">Students</th>
              <th class="text-center">%</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.qualityPassBreakdown
              .map(
                (item) => `
              <tr>
                <td><strong>${item.grade}</strong></td>
                <td class="text-center">${item.range}</td>
                <td class="text-center">${item.students}</td>
                <td class="text-right"><strong>${item.percentage.toFixed(1)}%</strong></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <!-- Criteria -->
        <div class="criteria-box">
          <h3>📋 PASSING CRITERIA (ZAMBIAN EDUCATION)</h3>
          <div class="criteria-grid">
            <div class="criteria-section">
              <h4>PRIMARY (JSSLC)</h4>
              <ul>
                <li>Pass: ≥50 total marks</li>
                <li>Quality: ≥60% avg</li>
                <li>Grade 1: 75%+</li>
                <li>Grade 2: 60-74%</li>
              </ul>
            </div>
            <div class="criteria-section">
              <h4>SECONDARY (School Cert)</h4>
              <ul>
                <li>Pass: 6+ subjects</li>
                <li>Quality: ≥60% avg</li>
                <li>Grade 1: 75%+</li>
                <li>Grade 4: 60-64%</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>RankIT ZM | School Management System | For inquiries contact school administration</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

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
        const cachedSettings = localStorage.getItem("rankitz-school-settings");
        if (cachedSettings) {
          const parsed = JSON.parse(cachedSettings);
          schoolName = parsed.schoolName || "School Report";
        }
      } catch (e) {
        console.warn("Failed to get school name from cache:", e);
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => {
        const html = generatePDFHTML(
          analytics,
          selectedClassEntity!.className,
          currentLevel,
          selectedTerm || "All Terms",
          schoolName,
        );

        const element = document.createElement("div");
        element.innerHTML = html;

        const filename = `Analytics_${selectedClassEntity!.className}_${new Date().getTime()}.pdf`;

        (window as any)
          .html2pdf()
          .set({
            margin: 0.3,
            filename: filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { format: "a4", orientation: "portrait" },
          })
          .from(element)
          .save();

        setExporting(false);
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error("Error exporting PDF:", error);
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
