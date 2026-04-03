import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types for PDF export
export interface LearnerScoreBreakdown {
  name: string;
  gender: string;
  weeklyScores: number[];
  midterm: number;
  endTerm: number;
  averageScore: number;
}

export interface SubjectScoreBreakdown {
  subjectName: string;
  weeklyScores: number[];
  midterm: number;
  endTerm: number;
  averageScore: number;
}

export interface ClassEntity {
  id: number;
  className: string;
  educationLevel: string;
}

export interface SubjectEntity {
  id: number;
  subjectName: string;
  maxMark: number;
}

export enum EducationLevel {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  HIGH_SCHOOL = 'HIGH_SCHOOL'
}

export enum PageOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

export interface HSGradingSystem {
  A1: { min: number; max: number; points: number };
  A2: { min: number; max: number; points: number };
  B3: { min: number; max: number; points: number };
  B4: { min: number; max: number; points: number };
  C5: { min: number; max: number; points: number };
  C6: { min: number; max: number; points: number };
  D7: { min: number; max: number; points: number };
  E8: { min: number; max: number; points: number };
  F9: { min: number; max: number; points: number };
}

export const DEFAULT_HS_GRADING: HSGradingSystem = {
  A1: { min: 91, max: 100, points: 12 },
  A2: { min: 81, max: 90, points: 11 },
  B3: { min: 71, max: 80, points: 10 },
  B4: { min: 66, max: 70, points: 9 },
  C5: { min: 61, max: 65, points: 8 },
  C6: { min: 56, max: 60, points: 7 },
  D7: { min: 51, max: 55, points: 6 },
  E8: { min: 46, max: 50, points: 5 },
  F9: { min: 0, max: 45, points: 4 }
};

class PDFExportUtil {
  private static readonly PAGE_WIDTH_PORTRAIT = 210; // A4 width in mm
  private static readonly PAGE_HEIGHT_PORTRAIT = 297; // A4 height in mm
  private static readonly PAGE_WIDTH_LANDSCAPE = 297; // A4 width in mm (landscape)
  private static readonly PAGE_HEIGHT_LANDSCAPE = 210; // A4 height in mm (landscape)
  private static readonly MARGIN = 20;
  private static readonly LINE_SPACING = 7;
  private static readonly CELL_HEIGHT = 8;

  static async exportLearnerScoresBreakdownToPDF(
    scores: LearnerScoreBreakdown[],
    passRate: number,
    term: string,
    year: number,
    subjectName: string,
    className: string,
    orientation: PageOrientation = PageOrientation.LANDSCAPE,
    schoolName: string = 'School Name',
    teacherName?: string
  ): Promise<boolean> {
    try {
      const effectiveOrientation = orientation ?? PageOrientation.LANDSCAPE;
      const effectiveSchoolName = schoolName ?? 'School Name';

      const doc = new jsPDF({
        orientation: effectiveOrientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = effectiveOrientation === PageOrientation.PORTRAIT ?
        this.PAGE_WIDTH_PORTRAIT : this.PAGE_WIDTH_LANDSCAPE;
      const pageHeight = effectiveOrientation === PageOrientation.PORTRAIT ?
        this.PAGE_HEIGHT_PORTRAIT : this.PAGE_HEIGHT_LANDSCAPE;

      let yPosition = this.MARGIN;

      // Header
      yPosition = this.drawReportHeader(doc, pageWidth, effectiveSchoolName,
        'LEARNER SCORES BREAKDOWN REPORT', yPosition);
      yPosition += 10;

      // Report Info
      yPosition = this.drawReportInfo(doc, pageWidth, subjectName, className,
        term, year, yPosition, teacherName);
      yPosition += 10;

      // Summary Statistics
      const stats = this.calculateSummaryStats(scores, passRate);
      yPosition = this.drawSummaryStatistics(doc, pageWidth, effectiveOrientation, stats, yPosition);
      yPosition += 15;

      // Table
      const maxWeeklyTests = Math.max(...scores.map(s => s.weeklyScores.length));
      yPosition = this.drawLearnerTableHeader(doc, pageWidth, maxWeeklyTests, yPosition);
      yPosition += 5;

      scores.forEach((score, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = this.MARGIN;
          yPosition = this.drawLearnerTableHeader(doc, pageWidth, maxWeeklyTests, yPosition);
          yPosition += 5;
        }
        yPosition = this.drawLearnerTableRow(doc, pageWidth, index + 1, score,
          passRate, maxWeeklyTests, yPosition);
      });

      // Performance Distribution
      yPosition += 10;
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawPerformanceDistribution(doc, pageWidth, effectiveOrientation, stats, yPosition);

      // Recommendations
      yPosition += 10;
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawRecommendations(doc, pageWidth, effectiveOrientation, stats, passRate, yPosition);

      // Footer
      this.drawPageFooter(doc, pageWidth, pageHeight, 1, 1);

      // Save PDF
      const fileName = `LearnerScores_${subjectName}_${term}_${year}_${Date.now()}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  }

  static async exportLearnerSubjectScoresToPDF(
    learnerName: string,
    scores: SubjectScoreBreakdown[],
    passRate: number,
    term: string,
    year: number,
    className: string,
    orientation: PageOrientation = PageOrientation.LANDSCAPE,
    schoolName: string = 'School Name'
  ): Promise<boolean> {
    try {
      const effectiveOrientation = orientation ?? PageOrientation.LANDSCAPE;
      const effectiveSchoolName = schoolName ?? 'School Name';

      const doc = new jsPDF({
        orientation: effectiveOrientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = effectiveOrientation === PageOrientation.PORTRAIT ?
        this.PAGE_WIDTH_PORTRAIT : this.PAGE_WIDTH_LANDSCAPE;
      const pageHeight = effectiveOrientation === PageOrientation.PORTRAIT ?
        this.PAGE_HEIGHT_PORTRAIT : this.PAGE_HEIGHT_LANDSCAPE;

      let yPosition = this.MARGIN;

      // Header
      yPosition = this.drawReportHeader(doc, pageWidth, effectiveSchoolName,
        'SUBJECT SCORES BREAKDOWN REPORT', yPosition);
      yPosition += 10;

      // Report Info
      yPosition = this.drawLearnerInfo(doc, pageWidth, learnerName, className,
        term, year, yPosition);
      yPosition += 10;

      // Summary Statistics
      const stats = this.calculateSubjectSummaryStats(scores, passRate);
      yPosition = this.drawSummaryStatistics(doc, pageWidth, effectiveOrientation, stats, yPosition);
      yPosition += 15;

      // Table
      const maxWeeklyTests = Math.max(...scores.map(s => s.weeklyScores.length));
      yPosition = this.drawSubjectTableHeader(doc, pageWidth, maxWeeklyTests, yPosition);
      yPosition += 5;

      scores.forEach((score, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = this.MARGIN;
          yPosition = this.drawSubjectTableHeader(doc, pageWidth, maxWeeklyTests, yPosition);
          yPosition += 5;
        }
        yPosition = this.drawSubjectTableRow(doc, pageWidth, index + 1, score,
          passRate, maxWeeklyTests, yPosition);
      });

      // Performance Distribution
      yPosition += 10;
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawPerformanceDistribution(doc, pageWidth, effectiveOrientation, stats, yPosition);

      // Recommendations
      yPosition += 10;
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawRecommendations(doc, pageWidth, effectiveOrientation, stats, passRate, yPosition);

      // Footer
      this.drawPageFooter(doc, pageWidth, pageHeight, 1, 1);

      // Save PDF
      const fileName = `SubjectScores_${learnerName.replace(/\s+/g, '_')}_${term}_${year}_${Date.now()}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating subject scores PDF:', error);
      return false;
    }
  }

  // HS-specific grading methods
  static getHSGrade(score: number, gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING): string {
    if (score >= gradingSystem.A1.min) return 'A1';
    if (score >= gradingSystem.A2.min) return 'A2';
    if (score >= gradingSystem.B3.min) return 'B3';
    if (score >= gradingSystem.B4.min) return 'B4';
    if (score >= gradingSystem.C5.min) return 'C5';
    if (score >= gradingSystem.C6.min) return 'C6';
    if (score >= gradingSystem.D7.min) return 'D7';
    if (score >= gradingSystem.E8.min) return 'E8';
    return 'F9';
  }

  static getHSGradePoints(grade: string, gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING): number {
    switch (grade) {
      case 'A1': return gradingSystem.A1.points;
      case 'A2': return gradingSystem.A2.points;
      case 'B3': return gradingSystem.B3.points;
      case 'B4': return gradingSystem.B4.points;
      case 'C5': return gradingSystem.C5.points;
      case 'C6': return gradingSystem.C6.points;
      case 'D7': return gradingSystem.D7.points;
      case 'E8': return gradingSystem.E8.points;
      case 'F9': return gradingSystem.F9.points;
      default: return 0;
    }
  }

  static calculateHSOverallGrade(subjectGrades: string[], gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING): {
    grade: string;
    points: number;
    averagePoints: number;
  } {
    const totalPoints = subjectGrades.reduce((sum, grade) => sum + this.getHSGradePoints(grade, gradingSystem), 0);
    const averagePoints = subjectGrades.length > 0 ? totalPoints / subjectGrades.length : 0;

    // Determine overall grade based on average points
    if (averagePoints >= 11.5) return { grade: 'A1', points: totalPoints, averagePoints };
    if (averagePoints >= 10.5) return { grade: 'A2', points: totalPoints, averagePoints };
    if (averagePoints >= 9.5) return { grade: 'B3', points: totalPoints, averagePoints };
    if (averagePoints >= 8.5) return { grade: 'B4', points: totalPoints, averagePoints };
    if (averagePoints >= 7.5) return { grade: 'C5', points: totalPoints, averagePoints };
    if (averagePoints >= 6.5) return { grade: 'C6', points: totalPoints, averagePoints };
    if (averagePoints >= 5.5) return { grade: 'D7', points: totalPoints, averagePoints };
    if (averagePoints >= 4.5) return { grade: 'E8', points: totalPoints, averagePoints };
    return { grade: 'F9', points: totalPoints, averagePoints };
  }

  static async exportHSProgressReport(
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
    gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING,
    orientation: PageOrientation = PageOrientation.PORTRAIT
  ): Promise<boolean> {
    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = orientation === PageOrientation.PORTRAIT ?
        this.PAGE_WIDTH_PORTRAIT : this.PAGE_WIDTH_LANDSCAPE;
      const pageHeight = orientation === PageOrientation.PORTRAIT ?
        this.PAGE_HEIGHT_PORTRAIT : this.PAGE_HEIGHT_LANDSCAPE;

      let yPosition = this.MARGIN;

      // Header
      yPosition = this.drawReportHeader(doc, pageWidth, schoolName,
        'HIGH SCHOOL PROGRESS REPORT', yPosition);
      yPosition += 10;

      // Learner Info
      yPosition = this.drawLearnerInfo(doc, pageWidth, learnerName, className,
        term, year, yPosition);
      yPosition += 10;

      // Overall Performance (HS style)
      yPosition = this.drawHSOverallPerformance(doc, pageWidth, orientation, progressData, yPosition);
      yPosition += 15;

      // Subject Scores Table (HS style)
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawHSProgressSubjectTable(doc, pageWidth, orientation, progressData.subjects, yPosition);
      yPosition += 15;

      // Grading Scale
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawHSGradingScale(doc, pageWidth, orientation, gradingSystem, yPosition);
      yPosition += 15;

      // Additional Information
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawAdditionalInfo(doc, pageWidth, orientation, progressData, yPosition);

      // Comments
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawComments(doc, pageWidth, orientation, progressData, yPosition);

      // Footer
      this.drawPageFooter(doc, pageWidth, pageHeight, 1, 1);

      // Save PDF
      const fileName = `HS_ProgressReport_${learnerName.replace(/\s+/g, '_')}_${term}_${year}_${Date.now()}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating HS progress PDF:', error);
      return false;
    }
  }

  static async exportHSAnalysisReport(
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
    gradingSystem: HSGradingSystem = DEFAULT_HS_GRADING,
    orientation: PageOrientation = PageOrientation.LANDSCAPE
  ): Promise<boolean> {
    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = orientation === PageOrientation.PORTRAIT ?
        this.PAGE_WIDTH_PORTRAIT : this.PAGE_WIDTH_LANDSCAPE;
      const pageHeight = orientation === PageOrientation.PORTRAIT ?
        this.PAGE_HEIGHT_PORTRAIT : this.PAGE_HEIGHT_LANDSCAPE;

      let yPosition = this.MARGIN;

      // Header
      yPosition = this.drawReportHeader(doc, pageWidth, schoolName,
        'HIGH SCHOOL CLASS ANALYSIS REPORT', yPosition);
      yPosition += 10;

      // Report Info
      yPosition = this.drawHSReportInfo(doc, pageWidth, className, term, year, yPosition);
      yPosition += 15;

      // Overall Summary
      yPosition = this.drawHSOverallSummary(doc, pageWidth, orientation, analysisData, yPosition);
      yPosition += 15;

      // Subject Analysis Table
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawHSSubjectAnalysisTable(doc, pageWidth, orientation, analysisData.subjects, yPosition);
      yPosition += 15;

      // Top Performers
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawHSTopPerformers(doc, pageWidth, orientation, analysisData.topPerformers, yPosition);
      yPosition += 15;

      // Needs Improvement
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawHSNeedsImprovement(doc, pageWidth, orientation, analysisData.needsImprovement, yPosition);

      // Footer
      this.drawPageFooter(doc, pageWidth, pageHeight, 1, 1);

      // Save PDF
      const fileName = `HS_AnalysisReport_${className}_${term}_${year}_${Date.now()}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating HS analysis PDF:', error);
      return false;
    }
  }

  static async exportProgressReport(
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
        remark: string;
      }>;
      overallAverage: number;
      overallGrade: string;
      position: number;
      totalLearners: number;
      attendance: number;
      conduct: string;
      teacherComments: string;
      principalComments: string;
    },
    schoolName: string = 'School Name',
    orientation: PageOrientation = PageOrientation.PORTRAIT
  ): Promise<boolean> {
    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = orientation === PageOrientation.PORTRAIT ?
        this.PAGE_WIDTH_PORTRAIT : this.PAGE_WIDTH_LANDSCAPE;
      const pageHeight = orientation === PageOrientation.PORTRAIT ?
        this.PAGE_HEIGHT_PORTRAIT : this.PAGE_HEIGHT_LANDSCAPE;

      let yPosition = this.MARGIN;

      // Header
      yPosition = this.drawReportHeader(doc, pageWidth, schoolName,
        'PROGRESS REPORT', yPosition);
      yPosition += 10;

      // Learner Info
      yPosition = this.drawLearnerInfo(doc, pageWidth, learnerName, className,
        term, year, yPosition);
      yPosition += 10;

      // Overall Performance
      yPosition = this.drawOverallPerformance(doc, pageWidth, orientation, progressData, yPosition);
      yPosition += 15;

      // Subject Scores Table
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawProgressSubjectTable(doc, pageWidth, orientation, progressData.subjects, yPosition);
      yPosition += 15;

      // Additional Information
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawAdditionalInfo(doc, pageWidth, orientation, progressData, yPosition);

      // Comments
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGIN;
      }
      yPosition = this.drawComments(doc, pageWidth, orientation, progressData, yPosition);

      // Footer
      this.drawPageFooter(doc, pageWidth, pageHeight, 1, 1);

      // Save PDF
      const fileName = `ProgressReport_${learnerName.replace(/\s+/g, '_')}_${term}_${year}_${Date.now()}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating progress PDF:', error);
      return false;
    }
  }

  // Additional helper methods for analysis and progress reports
  private static drawAnalysisSummary(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    // Draw box
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 35, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 35);

    y += 8;

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYSIS SUMMARY', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Stats
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const midCol = pageWidth / 2;
    const rightCol = pageWidth - this.MARGIN - 10;

    doc.text(`Total Learners: ${data.totalLearners}`, leftCol, y);
    doc.text(`Passed: ${data.passedCount}`, midCol, y);
    doc.text(`Class Average: ${data.classAverage.toFixed(1)}%`, rightCol, y, { align: 'right' });

    y += 6;
    doc.text(`Failed: ${data.failedCount}`, leftCol, y);
    doc.text(`Highest Score: ${data.highestScore.toFixed(1)}%`, midCol, y);
    doc.text(`Pass Rate: ${data.passRate.toFixed(1)}%`, rightCol, y, { align: 'right' });

    y += 6;
    doc.text(`Lowest Score: ${data.lowestScore.toFixed(1)}%`, leftCol, y);

    return y + 8;
  }

  private static drawAnalysisPerformanceDistribution(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE DISTRIBUTION', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const categories = [
      { label: 'Excellent (80-100%)', count: data.performanceDistribution.excellent },
      { label: 'Good (70-79%)', count: data.performanceDistribution.good },
      { label: 'Average (50-69%)', count: data.performanceDistribution.average },
      { label: 'Needs Support (<50%)', count: data.performanceDistribution.needsSupport }
    ];

    categories.forEach(category => {
      const percentage = data.totalLearners > 0 ? (category.count / data.totalLearners * 100).toFixed(1) : '0.0';
      doc.text(`${category.label}: ${category.count} learners (${percentage}%)`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawGradeDistribution(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    gradeDistribution: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GRADE DISTRIBUTION', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    gradeDistribution.forEach(grade => {
      doc.text(`Grade ${grade.grade}: ${grade.count} learners (${grade.percentage.toFixed(1)}%)`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawTopPerformers(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    topPerformers: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP PERFORMERS', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    topPerformers.forEach(performer => {
      doc.text(`${performer.position}. ${performer.name}: ${performer.score.toFixed(1)}%`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawNeedsImprovement(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    needsImprovement: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NEEDS IMPROVEMENT', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    needsImprovement.forEach(learner => {
      doc.text(`${learner.position}. ${learner.name}: ${learner.score.toFixed(1)}%`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawOverallPerformance(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    // Draw box
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 25, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 25);

    y += 8;

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL PERFORMANCE', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Stats
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const midCol = pageWidth / 2;
    const rightCol = pageWidth - this.MARGIN - 10;

    doc.text(`Overall Average: ${data.overallAverage.toFixed(1)}%`, leftCol, y);
    doc.text(`Grade: ${data.overallGrade}`, midCol, y);
    doc.text(`Position: ${data.position}/${data.totalLearners}`, rightCol, y, { align: 'right' });

    return y + 8;
  }

  private static drawProgressSubjectTable(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    subjects: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT PERFORMANCE', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Table header
    doc.setFillColor(200, 200, 200);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    const colWidth = (pageWidth - 2 * this.MARGIN) / 5;
    let x = this.MARGIN + 2;

    doc.text('SUBJECT', x, y);
    x += colWidth * 2;
    doc.text('SCORES', x, y);
    x += colWidth;
    doc.text('AVERAGE', x, y);
    x += colWidth;
    doc.text('GRADE', x, y);
    x += colWidth;
    doc.text('REMARK', x, y);

    y += 4;

    // Table rows
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    subjects.forEach((subject, index) => {
      if (y > this.PAGE_HEIGHT_PORTRAIT - 40) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');
      }

      y += 6;
      x = this.MARGIN + 2;

      doc.text(subject.subjectName.substring(0, 20), x, y);
      x += colWidth * 2;
      doc.text(subject.scores.join(', '), x, y);
      x += colWidth;
      doc.text(subject.average.toFixed(1), x, y);
      x += colWidth;
      doc.text(subject.grade, x, y);
      x += colWidth;
      doc.text(subject.remark, x, y);

      y += 2;
    });

    return y;
  }

  private static drawAdditionalInfo(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ADDITIONAL INFORMATION', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const rightCol = pageWidth / 2 + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Attendance:', leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.attendance}%`, leftCol + 25, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Conduct:', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.conduct, rightCol + 25, y);

    return y + this.LINE_SPACING;
  }

  private static drawComments(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMMENTS', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Teacher Comments
    doc.setFont('helvetica', 'bold');
    doc.text('Teacher Comments:', this.MARGIN + 10, y);
    y += this.LINE_SPACING;
    doc.setFont('helvetica', 'normal');
    const teacherLines = this.wrapText(doc, data.teacherComments, pageWidth - 2 * this.MARGIN - 20);
    teacherLines.forEach((line: string) => {
      doc.text(line, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    y += 5;

    // Principal Comments
    doc.setFont('helvetica', 'bold');
    doc.text('Principal Comments:', this.MARGIN + 10, y);
    y += this.LINE_SPACING;
    doc.setFont('helvetica', 'normal');
    const principalLines = this.wrapText(doc, data.principalComments, pageWidth - 2 * this.MARGIN - 20);
    principalLines.forEach((line: string) => {
      doc.text(line, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawHSOverallPerformance(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    // Draw box
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 30, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 30);

    y += 8;

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL PERFORMANCE (HIGH SCHOOL GRADING)', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Stats
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const midCol = pageWidth / 2;
    const rightCol = pageWidth - this.MARGIN - 10;

    doc.text(`Overall Grade: ${data.overallGrade}`, leftCol, y);
    doc.text(`Total Points: ${data.overallPoints}`, midCol, y);
    doc.text(`Position: ${data.position}/${data.totalLearners}`, rightCol, y, { align: 'right' });

    y += 6;
    doc.text(`Average Points: ${data.averagePoints.toFixed(2)}`, leftCol, y);

    return y + 8;
  }

  private static drawHSProgressSubjectTable(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    subjects: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT PERFORMANCE (HIGH SCHOOL GRADING)', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Table header
    doc.setFillColor(200, 200, 200);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    const colWidth = (pageWidth - 2 * this.MARGIN) / 6;
    let x = this.MARGIN + 2;

    doc.text('SUBJECT', x, y);
    x += colWidth * 2;
    doc.text('SCORES', x, y);
    x += colWidth;
    doc.text('AVERAGE', x, y);
    x += colWidth;
    doc.text('GRADE', x, y);
    x += colWidth;
    doc.text('POINTS', x, y);
    x += colWidth;
    doc.text('REMARK', x, y);

    y += 4;

    // Table rows
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    subjects.forEach((subject, index) => {
      if (y > this.PAGE_HEIGHT_PORTRAIT - 40) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');
      }

      y += 6;
      x = this.MARGIN + 2;

      doc.text(subject.subjectName.substring(0, 18), x, y);
      x += colWidth * 2;
      doc.text(subject.scores.join(', '), x, y);
      x += colWidth;
      doc.text(subject.average.toFixed(1), x, y);
      x += colWidth;
      doc.text(subject.grade, x, y);
      x += colWidth;
      doc.text(subject.points.toString(), x, y);
      x += colWidth;
      doc.text(subject.remark, x, y);

      y += 2;
    });

    return y;
  }

  private static drawHSGradingScale(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    gradingSystem: HSGradingSystem,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('HIGH SCHOOL GRADING SCALE', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const grades = [
      { grade: 'A1', range: `${gradingSystem.A1.min}-${gradingSystem.A1.max}%`, points: gradingSystem.A1.points },
      { grade: 'A2', range: `${gradingSystem.A2.min}-${gradingSystem.A2.max}%`, points: gradingSystem.A2.points },
      { grade: 'B3', range: `${gradingSystem.B3.min}-${gradingSystem.B3.max}%`, points: gradingSystem.B3.points },
      { grade: 'B4', range: `${gradingSystem.B4.min}-${gradingSystem.B4.max}%`, points: gradingSystem.B4.points },
      { grade: 'C5', range: `${gradingSystem.C5.min}-${gradingSystem.C5.max}%`, points: gradingSystem.C5.points },
      { grade: 'C6', range: `${gradingSystem.C6.min}-${gradingSystem.C6.max}%`, points: gradingSystem.C6.points },
      { grade: 'D7', range: `${gradingSystem.D7.min}-${gradingSystem.D7.max}%`, points: gradingSystem.D7.points },
      { grade: 'E8', range: `${gradingSystem.E8.min}-${gradingSystem.E8.max}%`, points: gradingSystem.E8.points },
      { grade: 'F9', range: `${gradingSystem.F9.min}-${gradingSystem.F9.max}%`, points: gradingSystem.F9.points }
    ];

    const colWidth = (pageWidth - 2 * this.MARGIN) / 3;
    let x = this.MARGIN + 10;

    grades.forEach((grade, index) => {
      if (index % 3 === 0 && index > 0) {
        y += this.LINE_SPACING;
        x = this.MARGIN + 10;
      }

      doc.text(`${grade.grade}: ${grade.range} (${grade.points} pts)`, x, y);
      x += colWidth;
    });

    return y + this.LINE_SPACING;
  }

  private static drawHSReportInfo(
    doc: jsPDF,
    pageWidth: number,
    className: string,
    term: string,
    year: number,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const rightCol = pageWidth / 2 + 10;

    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(className, leftCol + 25, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Term:', leftCol, y + this.LINE_SPACING);
    doc.setFont('helvetica', 'normal');
    doc.text(`${term}, ${year}`, leftCol + 25, y + this.LINE_SPACING);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Education Level:', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text('High School', rightCol + 35, y);

    // Date
    doc.setFont('helvetica', 'bold');
    doc.text('Report Date:', leftCol, y + this.LINE_SPACING * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), leftCol + 25, y + this.LINE_SPACING * 2);

    return y + this.LINE_SPACING * 3;
  }

  private static drawHSOverallSummary(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    data: any,
    yPosition: number
  ): number {
    let y = yPosition;

    // Draw box
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 25, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 25);

    y += 8;

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLASS OVERALL SUMMARY', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Stats
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const midCol = pageWidth / 2;
    const rightCol = pageWidth - this.MARGIN - 10;

    doc.text(`Overall Class Average: ${data.overallClassAverage.toFixed(1)}%`, leftCol, y);
    doc.text(`Pass Rate: ${data.overallPassRate.toFixed(1)}%`, midCol, y);
    doc.text(`Total Subjects: ${data.subjects.length}`, rightCol, y, { align: 'right' });

    return y + 8;
  }

  private static drawHSSubjectAnalysisTable(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    subjects: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT ANALYSIS', pageWidth / 2, y, { align: 'center' });
    y += 10;

    subjects.forEach((subject, index) => {
      if (y > this.PAGE_HEIGHT_LANDSCAPE - 60) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Subject header
      doc.setFillColor(220, 220, 220);
      doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT + 2, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT + 2);

      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${subject.subjectName}`, this.MARGIN + 10, y);
      y += 6;

      // Subject stats
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      const leftCol = this.MARGIN + 10;
      const midCol = pageWidth / 2;
      const rightCol = pageWidth - this.MARGIN - 10;

      doc.text(`Total Learners: ${subject.totalLearners}`, leftCol, y);
      doc.text(`Passed: ${subject.passedCount}`, midCol, y);
      doc.text(`Class Average: ${subject.classAverage.toFixed(1)}%`, rightCol, y, { align: 'right' });

      y += 5;
      doc.text(`Failed: ${subject.failedCount}`, leftCol, y);
      doc.text(`Highest: ${subject.highestScore.toFixed(1)}%`, midCol, y);
      doc.text(`Lowest: ${subject.lowestScore.toFixed(1)}%`, rightCol, y, { align: 'right' });

      y += 8;
    });

    return y;
  }

  private static drawHSTopPerformers(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    topPerformers: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP PERFORMERS (HIGH SCHOOL GRADING)', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    topPerformers.forEach(performer => {
      doc.text(`${performer.position}. ${performer.name}: ${performer.overallGrade} (${performer.overallPoints} points)`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawHSNeedsImprovement(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    needsImprovement: any[],
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NEEDS IMPROVEMENT (HIGH SCHOOL GRADING)', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    needsImprovement.forEach(learner => {
      doc.text(`${learner.position}. ${learner.name}: ${learner.overallGrade} (${learner.overallPoints} points)`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  // Helper methods for drawing PDF elements
  private static drawReportHeader(
    doc: jsPDF,
    pageWidth: number,
    schoolName: string,
    reportTitle: string,
    yPosition: number
  ): number {
    let y = yPosition;

    // School name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Report title
    doc.setFontSize(14);
    doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Underline
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y);
    y += 8;

    return y;
  }

  private static drawReportInfo(
    doc: jsPDF,
    pageWidth: number,
    subjectName: string,
    className: string,
    term: string,
    year: number,
    yPosition: number,
    teacherName?: string
  ): number {
    let y = yPosition;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const rightCol = pageWidth / 2 + 10;

    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Subject:', leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(subjectName, leftCol + 25, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Term:', leftCol, y + this.LINE_SPACING);
    doc.setFont('helvetica', 'normal');
    doc.text(`${term}, ${year}`, leftCol + 25, y + this.LINE_SPACING);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(className, rightCol + 25, y);

    if (teacherName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Teacher:', rightCol, y + this.LINE_SPACING);
      doc.setFont('helvetica', 'normal');
      doc.text(teacherName, rightCol + 25, y + this.LINE_SPACING);
    }

    // Date
    doc.setFont('helvetica', 'bold');
    doc.text('Report Date:', leftCol, y + this.LINE_SPACING * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), leftCol + 25, y + this.LINE_SPACING * 2);

    return y + this.LINE_SPACING * 3;
  }

  private static drawLearnerInfo(
    doc: jsPDF,
    pageWidth: number,
    learnerName: string,
    className: string,
    term: string,
    year: number,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const rightCol = pageWidth / 2 + 10;

    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Learner:', leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(learnerName, leftCol + 25, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Term:', leftCol, y + this.LINE_SPACING);
    doc.setFont('helvetica', 'normal');
    doc.text(`${term}, ${year}`, leftCol + 25, y + this.LINE_SPACING);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(className, rightCol + 25, y);

    // Date
    doc.setFont('helvetica', 'bold');
    doc.text('Report Date:', leftCol, y + this.LINE_SPACING * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), leftCol + 25, y + this.LINE_SPACING * 2);

    return y + this.LINE_SPACING * 3;
  }

  private static calculateSummaryStats(scores: LearnerScoreBreakdown[], passRate: number) {
    const totalLearners = scores.length;
    const passedCount = scores.filter(s => s.averageScore >= passRate).length;
    const failedCount = totalLearners - passedCount;
    const classAverage = scores.length > 0 ? scores.reduce((sum, s) => sum + s.averageScore, 0) / scores.length : 0;
    const highestScore = Math.max(...scores.map(s => s.averageScore));

    const excellent = scores.filter(s => s.averageScore >= 80).length;
    const good = scores.filter(s => s.averageScore >= 70 && s.averageScore < 80).length;
    const average = scores.filter(s => s.averageScore >= 50 && s.averageScore < 70).length;
    const needsSupport = scores.filter(s => s.averageScore < 50).length;
    const declining = scores.filter(s => s.endTerm < s.midterm && s.averageScore < passRate).length;

    return {
      totalLearners,
      passedCount,
      failedCount,
      classAverage,
      highestScore,
      excellent,
      good,
      average,
      needsSupport,
      declining
    };
  }

  private static calculateSubjectSummaryStats(scores: SubjectScoreBreakdown[], passRate: number) {
    const totalSubjects = scores.length;
    const passedCount = scores.filter(s => s.averageScore >= passRate).length;
    const failedCount = totalSubjects - passedCount;
    const overallAverage = scores.length > 0 ? scores.reduce((sum, s) => sum + s.averageScore, 0) / scores.length : 0;
    const highestScore = Math.max(...scores.map(s => s.averageScore));

    const excellent = scores.filter(s => s.averageScore >= 80).length;
    const good = scores.filter(s => s.averageScore >= 70 && s.averageScore < 80).length;
    const average = scores.filter(s => s.averageScore >= 50 && s.averageScore < 70).length;
    const needsSupport = scores.filter(s => s.averageScore < 50).length;
    const declining = scores.filter(s => s.endTerm < s.midterm && s.averageScore < passRate).length;

    return {
      totalLearners: totalSubjects,
      passedCount,
      failedCount,
      classAverage: overallAverage,
      highestScore,
      excellent,
      good,
      average,
      needsSupport,
      declining
    };
  }

  private static drawSummaryStatistics(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    stats: any,
    yPosition: number
  ): number {
    let y = yPosition;

    // Draw box
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 25, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, 25);

    y += 8;

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE SUMMARY', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Stats
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = this.MARGIN + 10;
    const midCol = pageWidth / 2;
    const rightCol = pageWidth - this.MARGIN - 10;

    doc.text(`Total: ${stats.totalLearners}`, leftCol, y);
    doc.text(`Passed: ${stats.passedCount}`, midCol, y);
    doc.text(`Class Avg: ${stats.classAverage.toFixed(1)}`, rightCol, y, { align: 'right' });

    y += 6;
    doc.text(`Failed: ${stats.failedCount}`, leftCol, y);
    doc.text(`Highest: ${stats.highestScore.toFixed(1)}`, midCol, y);
    doc.text(`Pass Rate: ${(stats.passedCount / stats.totalLearners * 100).toFixed(1)}%`, rightCol, y, { align: 'right' });

    return y + 8;
  }

  private static drawLearnerTableHeader(
    doc: jsPDF,
    pageWidth: number,
    maxWeeklyTests: number,
    yPosition: number
  ): number {
    let y = yPosition;

    // Header background
    doc.setFillColor(200, 200, 200);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');

    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let x = this.MARGIN + 2;
    const colWidth = (pageWidth - 2 * this.MARGIN) / (6 + maxWeeklyTests);

    doc.text('SN', x, y);
    x += colWidth;
    doc.text('NAME', x, y);
    x += colWidth * 2; // Name gets more space

    for (let i = 1; i <= maxWeeklyTests; i++) {
      doc.text(`WK${i}`, x, y);
      x += colWidth;
    }

    doc.text('MID', x, y);
    x += colWidth;
    doc.text('END', x, y);
    x += colWidth;
    doc.text('AVG', x, y);
    x += colWidth;
    doc.text('REMARK', x, y);

    return y + 2;
  }

  private static drawSubjectTableHeader(
    doc: jsPDF,
    pageWidth: number,
    maxWeeklyTests: number,
    yPosition: number
  ): number {
    let y = yPosition;

    // Header background
    doc.setFillColor(200, 200, 200);
    doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');

    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let x = this.MARGIN + 2;
    const colWidth = (pageWidth - 2 * this.MARGIN) / (6 + maxWeeklyTests);

    doc.text('SN', x, y);
    x += colWidth;
    doc.text('SUBJECT', x, y);
    x += colWidth * 2; // Subject gets more space

    for (let i = 1; i <= maxWeeklyTests; i++) {
      doc.text(`WK${i}`, x, y);
      x += colWidth;
    }

    doc.text('MID', x, y);
    x += colWidth;
    doc.text('END', x, y);
    x += colWidth;
    doc.text('AVG', x, y);
    x += colWidth;
    doc.text('REMARK', x, y);

    return y + 2;
  }

  private static drawLearnerTableRow(
    doc: jsPDF,
    pageWidth: number,
    index: number,
    score: LearnerScoreBreakdown,
    passRate: number,
    maxWeeklyTests: number,
    yPosition: number
  ): number {
    let y = yPosition;

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');
    }

    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    let x = this.MARGIN + 2;
    const colWidth = (pageWidth - 2 * this.MARGIN) / (6 + maxWeeklyTests);

    doc.text(index.toString(), x, y);
    x += colWidth;
    doc.text(score.name.substring(0, 15), x, y);
    x += colWidth * 2;

    score.weeklyScores.slice(0, maxWeeklyTests).forEach(score => {
      doc.text(score > 0 ? score.toString() : '-', x, y);
      x += colWidth;
    });

    // Fill missing weekly scores
    for (let i = score.weeklyScores.length; i < maxWeeklyTests; i++) {
      doc.text('-', x, y);
      x += colWidth;
    }

    doc.text(score.midterm > 0 ? score.midterm.toString() : '-', x, y);
    x += colWidth;
    doc.text(score.endTerm > 0 ? score.endTerm.toString() : '-', x, y);
    x += colWidth;

    doc.setFont('helvetica', 'bold');
    doc.text(score.averageScore.toFixed(1), x, y);
    x += colWidth;

    doc.setFont('helvetica', 'normal');
    doc.text(this.generateRemarkText(score, passRate), x, y);

    return y + 2;
  }

  private static drawSubjectTableRow(
    doc: jsPDF,
    pageWidth: number,
    index: number,
    score: SubjectScoreBreakdown,
    passRate: number,
    maxWeeklyTests: number,
    yPosition: number
  ): number {
    let y = yPosition;

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(this.MARGIN, y, pageWidth - 2 * this.MARGIN, this.CELL_HEIGHT, 'F');
    }

    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    let x = this.MARGIN + 2;
    const colWidth = (pageWidth - 2 * this.MARGIN) / (6 + maxWeeklyTests);

    doc.text(index.toString(), x, y);
    x += colWidth;
    doc.text(score.subjectName.substring(0, 15), x, y);
    x += colWidth * 2;

    score.weeklyScores.slice(0, maxWeeklyTests).forEach(score => {
      doc.text(score > 0 ? score.toString() : '-', x, y);
      x += colWidth;
    });

    // Fill missing weekly scores
    for (let i = score.weeklyScores.length; i < maxWeeklyTests; i++) {
      doc.text('-', x, y);
      x += colWidth;
    }

    doc.text(score.midterm > 0 ? score.midterm.toString() : '-', x, y);
    x += colWidth;
    doc.text(score.endTerm > 0 ? score.endTerm.toString() : '-', x, y);
    x += colWidth;

    doc.setFont('helvetica', 'bold');
    doc.text(score.averageScore.toFixed(1), x, y);
    x += colWidth;

    doc.setFont('helvetica', 'normal');
    doc.text(this.generateSubjectRemarkText(score, passRate), x, y);

    return y + 2;
  }

  private static drawPerformanceDistribution(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    stats: any,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE DISTRIBUTION', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const categories = [
      { label: 'Excellent (80-100)', count: stats.excellent },
      { label: 'Good (70-79)', count: stats.good },
      { label: 'Average (50-69)', count: stats.average },
      { label: 'Needs Support (<50)', count: stats.needsSupport }
    ];

    categories.forEach(category => {
      const percentage = stats.totalLearners > 0 ? (category.count / stats.totalLearners * 100).toFixed(1) : '0.0';
      doc.text(`${category.label}: ${category.count} (${percentage}%)`, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawRecommendations(
    doc: jsPDF,
    pageWidth: number,
    orientation: PageOrientation,
    stats: any,
    passRate: number,
    yPosition: number
  ): number {
    let y = yPosition;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDATIONS', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const recommendations = [];

    if (stats.needsSupport > 0) {
      recommendations.push(`• ${stats.needsSupport} learners require remedial support (below 50%)`);
    }
    if (stats.declining > 0) {
      recommendations.push(`• ${stats.declining} learners showing declining performance - needs intervention`);
    }
    if (stats.excellent > 0) {
      recommendations.push(`• ${stats.excellent} learners performing excellently - consider advanced materials`);
    }

    const avgText = stats.classAverage >= passRate
      ? `• Class average of ${stats.classAverage.toFixed(1)}% is above pass rate of ${passRate}%`
      : `• Class average of ${stats.classAverage.toFixed(1)}% is below pass rate - requires attention`;
    recommendations.push(avgText);

    recommendations.forEach(rec => {
      doc.text(rec, this.MARGIN + 10, y);
      y += this.LINE_SPACING;
    });

    return y;
  }

  private static drawPageFooter(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    pageNumber: number,
    totalPages: number
  ) {
    const footerY = pageHeight - 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    doc.text('Generated by: RankItZM School Management System', this.MARGIN, footerY);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - this.MARGIN, footerY, { align: 'right' });
  }

  private static wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }


  private static generateRemarkText(score: LearnerScoreBreakdown, passRate: number): string {
    if (score.endTerm > score.midterm && score.averageScore >= passRate) return 'Improving';
    if (score.averageScore >= passRate + 20) return 'Excellent';
    if (score.averageScore >= passRate) return 'Consistent';
    if (score.endTerm < score.midterm && score.averageScore < passRate) return 'Declining';
    if (score.averageScore < passRate) return 'NeedsSupp';
    return 'Average';
  }

  private static generateSubjectRemarkText(score: SubjectScoreBreakdown, passRate: number): string {
    if (score.endTerm > score.midterm && score.averageScore >= passRate) return 'Improving';
    if (score.averageScore >= passRate + 20) return 'Excellent';
    if (score.averageScore >= passRate) return 'Consistent';
    if (score.endTerm < score.midterm && score.averageScore < passRate) return 'Declining';
    if (score.averageScore < passRate) return 'NeedsSupp';
    return 'Average';
  }

}

export default PDFExportUtil;