import { useState } from 'react';
import PDFExportUtil, {
  LearnerScoreBreakdown,
  SubjectScoreBreakdown,
  EducationLevel,
  HSGradingSystem,
  DEFAULT_HS_GRADING,
  PageOrientation
} from '../lib/PDFExportUtil';

export interface UsePDFExportReturn {
  exportLearnerBreakdown: (
    scores: LearnerScoreBreakdown[],
    passRate: number,
    term: string,
    year: number,
    subjectName: string,
    className: string,
    schoolName?: string,
    teacherName?: string
  ) => Promise<boolean>;

  exportSubjectBreakdown: (
    learnerName: string,
    scores: SubjectScoreBreakdown[],
    passRate: number,
    term: string,
    year: number,
    className: string,
    schoolName?: string
  ) => Promise<boolean>;

  exportHSProgressReport: (
    learnerName: string,
    className: string,
    term: string,
    year: number,
    progressData: {
      subjects: Array<{
        subjectName: string;
        scores: number[];
        average: number;
        grade: string;
        points: number;
        remark: string;
      }>;
      overallGrade: string;
      overallPoints: number;
      averagePoints: number;
      position: number;
      totalLearners: number;
      attendance: number;
      conduct: string;
      teacherComments: string;
      principalComments: string;
    },
    schoolName?: string,
    gradingSystem?: HSGradingSystem
  ) => Promise<boolean>;

  exportHSAnalysisReport: (
    className: string,
    term: string,
    year: number,
    analysisData: {
      subjects: Array<{
        subjectName: string;
        totalLearners: number;
        passedCount: number;
        failedCount: number;
        classAverage: number;
        highestScore: number;
        lowestScore: number;
        gradeDistribution: Array<{
          grade: string;
          count: number;
          percentage: number;
        }>;
      }>;
      overallClassAverage: number;
      overallPassRate: number;
      topPerformers: Array<{
        name: string;
        overallGrade: string;
        overallPoints: number;
        position: number;
      }>;
      needsImprovement: Array<{
        name: string;
        overallGrade: string;
        overallPoints: number;
        position: number;
      }>;
    },
    schoolName?: string,
    gradingSystem?: HSGradingSystem
  ) => Promise<boolean>;

  isExporting: boolean;
  error: string | null;
}

export const usePDFExport = (): UsePDFExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (
    exportFunction: () => Promise<boolean>,
    errorMessage: string = 'Failed to export PDF'
  ): Promise<boolean> => {
    setIsExporting(true);
    setError(null);

    try {
      const success = await exportFunction();
      if (!success) {
        setError(errorMessage);
      }
      return success;
    } catch (err) {
      console.error('PDF export error:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const exportLearnerBreakdown = async (
    scores: LearnerScoreBreakdown[],
    passRate: number,
    term: string,
    year: number,
    subjectName: string,
    className: string,
    schoolName: string = 'School Name',
    teacherName?: string
  ): Promise<boolean> => {
    return handleExport(
      () => PDFExportUtil.exportLearnerScoresBreakdownToPDF(
        scores,
        passRate,
        term,
        year,
        subjectName,
        className,
        PageOrientation.LANDSCAPE,
        schoolName,
        teacherName
      ),
      'Failed to export learner breakdown PDF'
    );
  };

  const exportSubjectBreakdown = async (
    learnerName: string,
    scores: SubjectScoreBreakdown[],
    passRate: number,
    term: string,
    year: number,
    className: string,
    schoolName: string = 'School Name'
  ): Promise<boolean> => {
    return handleExport(
      () => PDFExportUtil.exportLearnerSubjectScoresToPDF(
        learnerName,
        scores,
        passRate,
        term,
        year,
        className,
        PageOrientation.LANDSCAPE,
        schoolName
      ),
      'Failed to export subject breakdown PDF'
    );
  };

  const exportHSProgressReport = async (
    learnerName: string,
    className: string,
    term: string,
    year: number,
    progressData: {
      subjects: Array<{
        subjectName: string;
        scores: number[];
        average: number;
        grade: string;
        points: number;
        remark: string;
      }>;
      overallGrade: string;
      overallPoints: number;
      averagePoints: number;
      position: number;
      totalLearners: number;
      attendance: number;
      conduct: string;
      teacherComments: string;
      principalComments: string;
    },
    schoolName: string = 'School Name',
    gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING
  ): Promise<boolean> => {
    return handleExport(
      () => PDFExportUtil.exportHSProgressReport(
        learnerName,
        className,
        term,
        year,
        progressData,
        schoolName,
        gradingSystem,
        PageOrientation.PORTRAIT
      ),
      'Failed to export HS progress report PDF'
    );
  };

  const exportHSAnalysisReport = async (
    className: string,
    term: string,
    year: number,
    analysisData: {
      subjects: Array<{
        subjectName: string;
        totalLearners: number;
        passedCount: number;
        failedCount: number;
        classAverage: number;
        highestScore: number;
        lowestScore: number;
        gradeDistribution: Array<{
          grade: string;
          count: number;
          percentage: number;
        }>;
      }>;
      overallClassAverage: number;
      overallPassRate: number;
      topPerformers: Array<{
        name: string;
        overallGrade: string;
        overallPoints: number;
        position: number;
      }>;
      needsImprovement: Array<{
        name: string;
        overallGrade: string;
        overallPoints: number;
        position: number;
      }>;
    },
    schoolName: string = 'School Name',
    gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING
  ): Promise<boolean> => {
    return handleExport(
      () => PDFExportUtil.exportHSAnalysisReport(
        className,
        term,
        year,
        analysisData,
        schoolName,
        gradingSystem,
        PageOrientation.LANDSCAPE
      ),
      'Failed to export HS analysis report PDF'
    );
  };

  return {
    exportLearnerBreakdown,
    exportSubjectBreakdown,
    exportHSProgressReport,
    exportHSAnalysisReport,
    isExporting,
    error
  };
};

// Utility functions for data transformation
export const transformToLearnerScoreBreakdown = (
  learnerData: any,
  weeklyTests: number[],
  midterm: number,
  endTerm: number
): LearnerScoreBreakdown => {
  const averageScore = calculateAverage([...weeklyTests, midterm, endTerm]);

  return {
    name: learnerData.name,
    gender: learnerData.gender,
    weeklyScores: weeklyTests,
    midterm,
    endTerm,
    averageScore
  };
};

export const transformToSubjectScoreBreakdown = (
  subjectData: any,
  weeklyTests: number[],
  midterm: number,
  endTerm: number
): SubjectScoreBreakdown => {
  const averageScore = calculateAverage([...weeklyTests, midterm, endTerm]);

  return {
    subjectName: subjectData.name,
    weeklyScores: weeklyTests,
    midterm,
    endTerm,
    averageScore
  };
};

export const calculateHSGradeAndPoints = (
  score: number,
  gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING
): { grade: string; points: number } => {
  const grade = PDFExportUtil.getHSGrade(score, gradingSystem);
  const points = PDFExportUtil.getHSGradePoints(grade, gradingSystem);

  return { grade, points };
};

export const calculateAverage = (scores: number[]): number => {
  const validScores = scores.filter(score => score > 0);
  if (validScores.length === 0) return 0;

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return sum / validScores.length;
};

export const determineEducationLevel = (className: string): EducationLevel => {
  const upperClassName = className.toUpperCase();

  if (upperClassName.includes('GRADE') || upperClassName.includes('PRIMARY')) {
    return EducationLevel.PRIMARY;
  } else if (upperClassName.includes('FORM') || upperClassName.includes('SECONDARY') || upperClassName.includes('HS')) {
    return EducationLevel.HIGH_SCHOOL;
  } else {
    return EducationLevel.SECONDARY;
  }
};