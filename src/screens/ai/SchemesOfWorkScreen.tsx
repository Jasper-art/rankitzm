import React, { useState } from "react";

interface GridRow {
  week: string;
  topic: string;
  subTopic: string;
  philosophy: string;
  competence: string;
  concepts: string;
  strategies: string;
  assessment: string;
  environment: string;
  materials: string;
  materialsStructuring: string;
  teacher: string;
  references: string;
}

export default function SchemesOfWorkScreen() {
  const [formData, setFormData] = useState({
    subject: "",
    grade: "",
    term: "1",
    format: "simple",
    school: "",
    teacher: "",
    tsNo: "",
    year: new Date().getFullYear().toString(),
  });
  const [schemeOfWork, setSchemeOfWork] = useState("");
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!formData.subject || !formData.grade) {
      alert("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const endpoint =
        formData.format === "moe-grid"
          ? `/api/generate-scheme-grid`
          : `/api/generate-scheme`;

      const response = await fetch(
        `${endpoint}?subject=${formData.subject}&grade=${formData.grade}&term=${formData.term}`,
      );
      const data = await response.json();
      if (data.scheme) {
        setSchemeOfWork(data.scheme);
      }
      if (data.gridData) {
        setGridData(data.gridData);
      } else if (formData.format === "moe-grid") {
        setGridData(
          Array(13)
            .fill(null)
            .map((_, i) => ({
              week: `Week ${i + 1}`,
              topic: "",
              subTopic: "",
              philosophy: "",
              competence: "",
              concepts: "",
              strategies: "",
              assessment: "",
              environment: "",
              materials: "",
              materialsStructuring: "",
              teacher: "",
              references: "",
            })),
        );
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateGridRow = (
    index: number,
    field: keyof GridRow,
    value: string,
  ) => {
    const updated = [...gridData];
    updated[index][field] = value;
    setGridData(updated);
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // A4 landscape: 297mm wide, 210mm tall. Margins 4mm each side = 289mm usable.
    const centerX = 148;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MINISTRY OF EDUCATION", centerX, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text((formData.school || "SCHOOL NAME").toUpperCase(), centerX, 16, {
      align: "center",
    });
    doc.text("CURRICULUM ANALYSIS GRID", centerX, 22, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `TEACHER: ${formData.teacher || "___"}   TS NO: ${formData.tsNo || "___"}   SUBJECT: ${formData.subject.toUpperCase()}   LEVEL: ${formData.grade.toUpperCase()}   TERM: ${formData.term}   YEAR: ${formData.year}`,
      centerX,
      27,
      { align: "center" },
    );

    autoTable(doc, {
      startY: 31,
      tableWidth: 289,
      head: [
        [
          "WK",
          "TOPIC &\nSUB-TOPIC",
          "PHILOSOPHY &\nGOAL",
          "PRESCRIBED\nCOMPETENCE",
          "KEY CONCEPTS\n& CONTENT",
          "LEARNING\nSTRATEGIES",
          "ASSESSMENT",
          "LEARNING\nENVIRONMENT",
          "MATERIAL\nDEVELOPMENT",
          "MATERIALS\nSTRUCTURING",
          "TEACHER\nSTATUS",
          "REFERENCES",
        ],
      ],
      body: gridData.map((row) => [
        row.week,
        `${row.topic}\n${row.subTopic}`,
        row.philosophy,
        row.competence,
        row.concepts,
        row.strategies,
        row.assessment,
        row.environment,
        row.materials,
        row.materialsStructuring,
        row.teacher,
        row.references,
      ]),
      styles: {
        fontSize: 6,
        cellPadding: 1.2,
        valign: "top",
        overflow: "linebreak",
        lineColor: [180, 180, 180],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: 255,
        fontSize: 6,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        cellPadding: 2,
      },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      // Total must = 289mm
      columnStyles: {
        0: { cellWidth: 10, halign: "center" }, // WK
        1: { cellWidth: 26 }, // TOPIC & SUB-TOPIC
        2: { cellWidth: 28 }, // PHILOSOPHY & GOAL
        3: { cellWidth: 25 }, // COMPETENCE
        4: { cellWidth: 25 }, // KEY CONCEPTS
        5: { cellWidth: 22 }, // STRATEGIES
        6: { cellWidth: 20 }, // ASSESSMENT
        7: { cellWidth: 20 }, // ENVIRONMENT
        8: { cellWidth: 22 }, // MATERIALS
        9: { cellWidth: 22 }, // MAT STRUCTURING
        10: { cellWidth: 16, halign: "center" }, // TEACHER STATUS
        11: { cellWidth: 23 }, // REFERENCES
      },
      margin: { left: 4, right: 4 },
    });

    doc.save(`curriculum-grid-${formData.subject}-term${formData.term}.pdf`);
  };
  const generateGridCSV = () => {
    const headers = [
      "WK",
      "TOPIC",
      "SUB-TOPIC",
      "CURRICULUM PHILOSOPHY AND GOALS",
      "PRESCRIBED COMPETENCE",
      "KEY CONCEPTS AND CONTENT",
      "LEARNING STRATEGIES",
      "ASSESSMENT",
      "LEARNING ENVIRONMENT",
      "MATERIAL DEVELOPMENT",
      "MATERIALS STRUCTURING",
      "TEACHER STATUS",
      "REFERENCES",
    ];
    let csv = headers.join(",") + "\n";
    gridData.forEach((row) => {
      const values = [
        row.week,
        row.topic,
        row.subTopic,
        row.philosophy,
        row.competence,
        row.concepts,
        row.strategies,
        row.assessment,
        row.environment,
        row.materials,
        row.materialsStructuring,
        row.teacher,
        row.references,
      ];
      csv += values.map((val) => `"${val}"`).join(",") + "\n";
    });
    return csv;
  };

  const downloadGridCSV = (csv: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scheme-of-work-${formData.subject}-term${formData.term}.csv`;
    a.click();
  };

  return (
    <div className="max-w-full mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2 text-primary">
        Scheme of Work Generator
      </h2>
      <p className="text-gray-600 mb-6">
        Generate termly overviews in your preferred format
      </p>

      <div className="space-y-4 bg-card p-6 rounded-lg shadow mb-6">
        {/* Row 1: Subject, Grade, Term, Format, Generate */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Subject (e.g. Mathematics)"
            className="p-3 border rounded-lg bg-background text-foreground"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Grade (e.g. Form 1)"
            className="p-3 border rounded-lg bg-background text-foreground"
            value={formData.grade}
            onChange={(e) =>
              setFormData({ ...formData, grade: e.target.value })
            }
          />
          <select
            className="p-3 border rounded-lg bg-background text-foreground"
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value })}
          >
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
          <select
            className="p-3 border-2 rounded-lg bg-background text-primary font-bold"
            value={formData.format}
            onChange={(e) =>
              setFormData({ ...formData, format: e.target.value })
            }
          >
            <option value="simple">Simple Format</option>
            <option value="moe-grid">MoE Grid Format</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Row 2: School info (only for moe-grid) */}
        {formData.format === "moe-grid" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="School Name"
              className="p-3 border rounded-lg bg-background text-foreground"
              value={formData.school}
              onChange={(e) =>
                setFormData({ ...formData, school: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Teacher Name"
              className="p-3 border rounded-lg bg-background text-foreground"
              value={formData.teacher}
              onChange={(e) =>
                setFormData({ ...formData, teacher: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="TS Number"
              className="p-3 border rounded-lg bg-background text-foreground"
              value={formData.tsNo}
              onChange={(e) =>
                setFormData({ ...formData, tsNo: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Year (e.g. 2025)"
              className="p-3 border rounded-lg bg-background text-foreground"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
            />
          </div>
        )}

        <div className="mt-2 p-4 rounded-lg bg-background border-l-4 border-primary">
          {formData.format === "simple" ? (
            <div>
              <h4 className="font-bold text-sm mb-1">Simple Format</h4>
              <p className="text-xs text-gray-600">
                Week | Topic | Subtopic | Outcomes | Teaching Aids | Assessment
              </p>
            </div>
          ) : (
            <div>
              <h4 className="font-bold text-sm mb-1">
                🏛️ Official MoE Curriculum Analysis Grid
              </h4>
              <p className="text-xs text-gray-600">
                Week | Topic & SubTopic | Philosophy & Goal | Competence | Key
                Concepts | Strategies | Assessment | Environment | Materials |
                Materials Structuring | Teacher Status | References
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simple Format Output */}
      {schemeOfWork && formData.format === "simple" && (
        <div className="mt-8 p-6 bg-card border-l-4 border-primary rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">Generated Scheme (13 Weeks)</h3>
              <p className="text-sm text-gray-600">
                {formData.subject} • {formData.grade}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold"
            >
              Print Scheme
            </button>
          </div>
          <div className="whitespace-pre-wrap text-foreground leading-relaxed text-sm">
            {schemeOfWork}
          </div>
        </div>
      )}

      {/* MoE Grid Format Output */}
      {gridData.length > 0 && formData.format === "moe-grid" && (
        <div className="mt-8 bg-card p-6 rounded-lg shadow">
          {/* Header Info */}
          <div className="text-center mb-4 border-b pb-4">
            <p className="font-bold text-sm">MINISTRY OF EDUCATION</p>
            <p className="font-bold text-sm">
              {formData.school || "SCHOOL NAME"}
            </p>
            <p className="font-bold text-sm">CURRICULUM ANALYSIS GRID</p>
            <p className="text-xs mt-1 text-gray-600">
              TEACHER: {formData.teacher || "___"} &nbsp;|&nbsp; TS NO:{" "}
              {formData.tsNo || "___"} &nbsp;|&nbsp; SUBJECT: {formData.subject}{" "}
              &nbsp;|&nbsp; LEVEL: {formData.grade} &nbsp;|&nbsp; TERM:{" "}
              {formData.term} &nbsp;|&nbsp; YEAR: {formData.year}
            </p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Term {formData.term} • Editable Grid
            </p>
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold"
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  const csv = generateGridCSV();
                  downloadGridCSV(csv);
                }}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse text-xs bg-white">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border p-2 text-left w-10">WK</th>
                  <th className="border p-2 text-left w-20">TOPIC</th>
                  <th className="border p-2 text-left w-20">SUB-TOPIC</th>
                  <th className="border p-2 text-left w-24">
                    PHILOSOPHY & GOAL
                  </th>
                  <th className="border p-2 text-left w-24">
                    PRESCRIBED COMPETENCE
                  </th>
                  <th className="border p-2 text-left w-24">
                    KEY CONCEPTS & CONTENT
                  </th>
                  <th className="border p-2 text-left w-20">
                    LEARNING STRATEGIES
                  </th>
                  <th className="border p-2 text-left w-20">ASSESSMENT</th>
                  <th className="border p-2 text-left w-20">
                    LEARNING ENVIRONMENT
                  </th>
                  <th className="border p-2 text-left w-20">
                    MATERIAL DEVELOPMENT
                  </th>
                  <th className="border p-2 text-left w-20">
                    MATERIALS STRUCTURING
                  </th>
                  <th className="border p-2 text-left w-16">TEACHER STATUS</th>
                  <th className="border p-2 text-left w-20">REFERENCES</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx === 5
                        ? "bg-yellow-50"
                        : idx === 10 || idx === 11 || idx === 12
                          ? "bg-blue-50"
                          : idx % 2 === 0
                            ? "bg-gray-50"
                            : ""
                    }
                  >
                    <td className="border p-2 font-bold text-center">
                      {row.week}
                    </td>
                    {(
                      [
                        "topic",
                        "subTopic",
                        "philosophy",
                        "competence",
                        "concepts",
                        "strategies",
                        "assessment",
                        "environment",
                        "materials",
                        "materialsStructuring",
                        "teacher",
                        "references",
                      ] as (keyof GridRow)[]
                    ).map((field) => (
                      <td key={field} className="border p-2">
                        <textarea
                          value={row[field]}
                          onChange={(e) =>
                            updateGridRow(idx, field, e.target.value)
                          }
                          className="w-full bg-transparent resize-none border-0 focus:outline-none"
                          rows={2}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
