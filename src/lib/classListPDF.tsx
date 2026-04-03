/**
 * Class List PDF Generator
 * Uses jsPDF directly - no html2canvas color issues
 */

import { useParams } from "react-router-dom";
import { useLearners, useClasses } from "../hooks/useClassManager";
import { db } from "../db";

interface PDFOptions {
  schoolName?: string;
  academicYear?: string;
  classId?: string | number;
  headteacherName?: string;
  deputyHeadteacherName?: string;
}

export function useClassListPDF() {
  const { classId: routeClassId } = useParams();
  const { learners } = useLearners();
  const { classes } = useClasses();

  const generatePDF = async (options: PDFOptions = {}) => {
    const schoolName = options.schoolName || "Your School Name";
    const academicYear =
      options.academicYear || new Date().getFullYear().toString();

    const classIdToUse = options.classId || routeClassId;
    const classIdNum = classIdToUse ? parseInt(classIdToUse as string) : null;

    if (!classIdNum) {
      alert("Please select a class first before exporting.");
      return;
    }

    const filteredLearners = learners.filter((l) => l.classId === classIdNum);

    const selectedClass = classIdNum
      ? classes.find((c) => c.id === classIdNum)
      : null;

    const maleCount = filteredLearners.filter(
      (l) => l.gender?.toLowerCase() === "male",
    ).length;
    const femaleCount = filteredLearners.filter(
      (l) => l.gender?.toLowerCase() === "female",
    ).length;
    const contactCount = filteredLearners.filter((l) => l.parentPhone).length;

    const className = selectedClass?.className || "All Students";
    const generatedDate = new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return new Promise((resolve, reject) => {
      if ((window as any).jsPDF) {
        generatePDFWithjsPDF(
          filteredLearners,
          maleCount,
          femaleCount,
          contactCount,
          schoolName,
          className,
          academicYear,
          generatedDate,
          options.headteacherName,
          options.deputyHeadteacherName,
        )
          .then(resolve)
          .catch(reject);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

      script.onload = () => {
        generatePDFWithjsPDF(
          filteredLearners,
          maleCount,
          femaleCount,
          contactCount,
          schoolName,
          className,
          academicYear,
          generatedDate,
          options.headteacherName,
          options.deputyHeadteacherName,
        )
          .then(resolve)
          .catch(reject);
      };

      script.onerror = () => {
        console.error("Failed to load jsPDF library");
        reject(new Error("Failed to load PDF library"));
      };

      document.head.appendChild(script);
    });
  };

  return { generatePDF };
}

/**
 * Generate PDF using jsPDF directly with text and table
 */
async function generatePDFWithjsPDF(
  learners: any[],
  maleCount: number,
  femaleCount: number,
  contactCount: number,
  schoolName: string,
  className: string,
  academicYear: string,
  generatedDate: string,
  headteacherName?: string,
  deputyHeadteacherName?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const jsPDFLib = (window as any).jsPDF;
      const jsPDF = jsPDFLib.jsPDF;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Set font for header
      pdf.setFontSize(18);
      pdf.setTextColor(17, 24, 39);
      pdf.text(schoolName, pageWidth / 2, yPos, { align: "center" });
      yPos += 8;

      pdf.setFontSize(14);
      pdf.text("Class List Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 8;

      // Header info
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      const headerInfo = [
        `Class: ${className}`,
        `Academic Year: ${academicYear}`,
        `Generated: ${generatedDate}`,
      ];
      headerInfo.forEach((info) => {
        pdf.text(info, margin, yPos);
        yPos += 5;
      });
      yPos += 5;

      // Stats section
      pdf.setFontSize(11);
      pdf.setTextColor(17, 24, 39);
      const stats = [
        { label: "Total Students", value: learners.length },
        { label: "Male", value: maleCount },
        { label: "Female", value: femaleCount },
        { label: "Contact Info", value: contactCount },
      ];

      const statColWidth = contentWidth / 4;
      stats.forEach((stat, idx) => {
        const xPos = margin + idx * statColWidth;
        pdf.setFontSize(14);
        pdf.setTextColor(16, 185, 129);
        pdf.text(stat.value.toString(), xPos + statColWidth / 2, yPos, {
          align: "center",
        });
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text(stat.label, xPos + statColWidth / 2, yPos + 6, {
          align: "center",
        });
      });
      yPos += 20;

      // Table
      const tableData = learners.map((learner, idx) => [
        (idx + 1).toString(),
        learner.name,
        learner.gender || "Unknown",
        learner.parentPhone || "—",
      ]);

      const learnersPerPage = 14;
      let pageNum = 0;
      let startIdx = 0;

      const generatePage = () => {
        const endIdx = Math.min(startIdx + learnersPerPage, tableData.length);
        const pageData = tableData.slice(startIdx, endIdx);

        // Table headers
        pdf.setFontSize(9);
        pdf.setTextColor(17, 24, 39);
        pdf.setFillColor(247, 249, 248);
        const colWidths = [15, 60, 35, 50];
        const headers = ["#", "Student Name", "Gender", "Parent Phone"];

        let xStart = margin;
        headers.forEach((header, idx) => {
          pdf.rect(xStart, yPos - 4, colWidths[idx], 8, "F");
          pdf.text(header, xStart + 2, yPos, { fontSize: 9 });
          xStart += colWidths[idx];
        });
        yPos += 10;

        // Table rows
        pageData.forEach((row, rowIdx) => {
          pdf.setTextColor(17, 24, 39);
          if (rowIdx % 2 === 0) {
            pdf.setFillColor(247, 249, 248);
            pdf.rect(margin, yPos - 4, contentWidth, 8, "F");
          }

          xStart = margin;
          row.forEach((cell, colIdx) => {
            pdf.text(cell.substring(0, 20), xStart + 2, yPos, { fontSize: 9 });
            xStart += colWidths[colIdx];
          });
          yPos += 8;

          if (yPos > pageHeight - 30) {
            pageNum++;
            if (endIdx < tableData.length) {
              pdf.addPage();
              yPos = margin;

              // Repeat header on new page
              pdf.setFontSize(9);
              pdf.setTextColor(17, 24, 39);
              pdf.setFillColor(247, 249, 248);
              xStart = margin;
              headers.forEach((header, idx) => {
                pdf.rect(xStart, yPos - 4, colWidths[idx], 8, "F");
                pdf.text(header, xStart + 2, yPos, { fontSize: 9 });
                xStart += colWidths[idx];
              });
              yPos += 10;
            }
          }
        });

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(
          `Page ${pageNum + 1} | Printed on ${generatedDate}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" },
        );

        // Signatures
        yPos += 15;
        if (yPos < pageHeight - 40) {
          pdf.setFontSize(9);
          pdf.setTextColor(17, 24, 39);
          pdf.text("Headteacher", margin, yPos);
          pdf.text("Deputy Headteacher", margin + 80, yPos);

          pdf.line(margin, yPos + 15, margin + 40, yPos + 15);
          pdf.line(margin + 80, yPos + 15, margin + 120, yPos + 15);

          pdf.setFontSize(7);
          pdf.text(headteacherName || "_____________", margin, yPos + 18);
          pdf.text(
            deputyHeadteacherName || "_____________",
            margin + 80,
            yPos + 18,
          );
        }

        if (endIdx < tableData.length) {
          startIdx = endIdx;
          generatePage();
        } else {
          const filename = `class-list-${className.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
          pdf.save(filename);
          resolve();
        }
      };

      generatePage();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
}
