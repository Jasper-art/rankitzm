import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TableRow {
  teacherActivities: string;
  learnersActivities: string;
  assessmentCriteria: string;
}

interface LessonData {
  generalCompetences: string;
  specificCompetences: string;
  lessonGoal: string;
  rationale: string;
  priorKnowledge: string;
  references: string;
  naturalEnvironment: string;
  artificialEnvironment: string;
  technologicalEnvironment: string;
  materials: string;
  expectedStandard: string;
  introduction: TableRow;
  lessonDevelopment: TableRow;
  exerciseAssessment: TableRow;
  homework: TableRow;
  conclusion: TableRow;
  lessonEvaluation: string;
}

const emptyRow = (): TableRow => ({
  teacherActivities: "",
  learnersActivities: "",
  assessmentCriteria: "",
});

const emptyLessonData = (): LessonData => ({
  generalCompetences: "",
  specificCompetences: "",
  lessonGoal: "",
  rationale: "",
  priorKnowledge: "",
  references: "",
  naturalEnvironment: "",
  artificialEnvironment: "",
  technologicalEnvironment: "",
  materials: "",
  expectedStandard: "",
  introduction: emptyRow(),
  lessonDevelopment: emptyRow(),
  exerciseAssessment: emptyRow(),
  homework: emptyRow(),
  conclusion: emptyRow(),
  lessonEvaluation: "",
});

export default function LessonPlanScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    school: "",
    date: "",
    duration: "40",
    totalPupils: "",
    teacher: "",
    class: "1",
    time: "",
    subject: "",
    topic: "",
    subTopic: "",
    term: "1",
  });
  const [lessonData, setLessonData] = useState<LessonData>(emptyLessonData());
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [topics, setTopics] = useState<
    { topic: string; subTopics: string[] }[]
  >([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (formData.subject && formData.class) {
      loadTopics();
    }
  }, [formData.subject, formData.class]);

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const formNum = parseInt(formData.class);
      const response = await fetch(
        `/api/topics?subject=${encodeURIComponent(formData.subject)}&form=${formNum}`,
      );
      const data = await response.json();
      console.log("Topics loaded:", data);
      setTopics(data.topics || []);
      setFormData((prev) => ({ ...prev, topic: "", subTopic: "" }));
    } catch (err) {
      console.error("Failed to load topics:", err);
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateLesson = (field: keyof LessonData, value: string) => {
    setLessonData((prev) => ({ ...prev, [field]: value }));
  };

  const updateRow = (
    stage:
      | "introduction"
      | "lessonDevelopment"
      | "exerciseAssessment"
      | "homework"
      | "conclusion",
    field: keyof TableRow,
    value: string,
  ) => {
    setLessonData((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], [field]: value },
    }));
  };

  const handleGenerate = async () => {
    if (!formData.subject || !formData.topic || !formData.class) {
      alert("Please fill in Subject, Topic and Class.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/generate?subject=${encodeURIComponent(formData.subject)}&topic=${encodeURIComponent(formData.topic)}&subtopic=${encodeURIComponent(formData.subTopic)}&grade=${encodeURIComponent(formData.class)}`,
      );
      const data = await response.json();
      if (data.plan) {
        const text: string = data.plan;
        const get = (pattern: RegExp) => {
          const match = text.match(pattern);
          return match ? match[1].trim() : "";
        };
        setLessonData({
          generalCompetences: get(
            /GENERAL COMPETEN[A-Z]*[:\s]+([\s\S]*?)(?=SPECIFIC|LESSON GOAL|$)/i,
          ),
          specificCompetences: get(
            /SPECIFIC COMPETEN[A-Z]*[:\s]+([\s\S]*?)(?=LESSON GOAL|RATIONALE|$)/i,
          ),
          lessonGoal: get(/LESSON GOAL[:\s]+([\s\S]*?)(?=RATIONALE|PRIOR|$)/i),
          rationale: get(
            /RATIONALE[:\s]+([\s\S]*?)(?=PRIOR KNOWLEDGE|REFERENCES|$)/i,
          ),
          priorKnowledge: get(
            /PRIOR KNOWLEDGE[:\s]+([\s\S]*?)(?=REFERENCES|LEARNING|$)/i,
          ),
          references: get(
            /REFERENCES?[:\s]+([\s\S]*?)(?=LEARNING ENVIRONMENT|TEACHING|$)/i,
          ),
          naturalEnvironment: get(
            /Natural environment[:\s]+([\s\S]*?)(?=Artificial|$)/i,
          ),
          artificialEnvironment: get(
            /Artificial environment[:\s]+([\s\S]*?)(?=Technological|$)/i,
          ),
          technologicalEnvironment: get(
            /Technological environment[:\s]+([\s\S]*?)(?=TEACHING|MATERIALS|$)/i,
          ),
          materials: get(
            /(?:TEACHING AND LEARNING MATERIALS|MATERIALS|RESOURCES)[:\s]+([\s\S]*?)(?=EXPECTED|$)/i,
          ),
          expectedStandard: get(
            /EXPECTED STANDARD[:\s]+([\s\S]*?)(?=LESSON PROGRESSION|INTRODUCTION|$)/i,
          ),
          introduction: {
            teacherActivities: get(
              /INTRODUCTION[\s\S]*?Teacher[:\s]+([\s\S]*?)(?=Learner|Pupil|$)/i,
            ),
            learnersActivities: get(
              /INTRODUCTION[\s\S]*?Learner[:\s]+([\s\S]*?)(?=Assessment|LESSON DEV|$)/i,
            ),
            assessmentCriteria: get(
              /INTRODUCTION[\s\S]*?Assessment[:\s]+([\s\S]*?)(?=LESSON DEV|$)/i,
            ),
          },
          lessonDevelopment: {
            teacherActivities: get(
              /LESSON DEVELOPMENT[\s\S]*?Teacher[:\s]+([\s\S]*?)(?=Learner|Pupil|$)/i,
            ),
            learnersActivities: get(
              /LESSON DEVELOPMENT[\s\S]*?Learner[:\s]+([\s\S]*?)(?=Assessment|EXERCISE|$)/i,
            ),
            assessmentCriteria: get(
              /LESSON DEVELOPMENT[\s\S]*?Assessment[:\s]+([\s\S]*?)(?=EXERCISE|$)/i,
            ),
          },
          exerciseAssessment: {
            teacherActivities: get(
              /EXERCISE[\s\S]*?Teacher[:\s]+([\s\S]*?)(?=Learner|Pupil|$)/i,
            ),
            learnersActivities: get(
              /EXERCISE[\s\S]*?Learner[:\s]+([\s\S]*?)(?=Assessment|HOMEWORK|$)/i,
            ),
            assessmentCriteria: get(
              /EXERCISE[\s\S]*?Assessment[:\s]+([\s\S]*?)(?=HOMEWORK|$)/i,
            ),
          },
          homework: {
            teacherActivities: get(
              /HOMEWORK[\s\S]*?Teacher[:\s]+([\s\S]*?)(?=Learner|Pupil|$)/i,
            ),
            learnersActivities: get(
              /HOMEWORK[\s\S]*?Learner[:\s]+([\s\S]*?)(?=Assessment|CONCLUSION|$)/i,
            ),
            assessmentCriteria: get(
              /HOMEWORK[\s\S]*?Assessment[:\s]+([\s\S]*?)(?=CONCLUSION|$)/i,
            ),
          },
          conclusion: {
            teacherActivities: get(
              /CONCLUSION[\s\S]*?Teacher[:\s]+([\s\S]*?)(?=Learner|Pupil|$)/i,
            ),
            learnersActivities: get(
              /CONCLUSION[\s\S]*?Learner[:\s]+([\s\S]*?)(?=Assessment|EVALUATION|$)/i,
            ),
            assessmentCriteria: get(
              /CONCLUSION[\s\S]*?Assessment[:\s]+([\s\S]*?)(?=EVALUATION|$)/i,
            ),
          },
          lessonEvaluation: get(
            /(?:LESSON EVALUATION|EVALUATION)[:\s]+([\s\S]*?)(?=$)/i,
          ),
        });
        setGenerated(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Failed:", err);
      alert("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const W = 210;
    const margin = 14;
    const col = W - margin * 2;
    let y = 14;

    const LINE_H = 6;
    const HEADER_COLOR: [number, number, number] = [30, 64, 175];
    const GRAY: [number, number, number] = [240, 240, 240];

    const title = (text: string) => {
      doc.setFontSize(14).setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(...HEADER_COLOR);
      doc.rect(margin, y, col, 8, "F");
      doc.text(text, W / 2, y + 5.5, { align: "center" });
      doc.setTextColor(0, 0, 0);
      y += 10;
    };

    const field = (label: string, value: string, fullWidth = false) => {
      doc.setFontSize(8).setFont("helvetica", "bold");
      doc.text(label + ":", margin, y);
      doc.setFont("helvetica", "normal");
      const labelW = doc.getTextWidth(label + ": ");
      const maxW = fullWidth ? col - labelW : col / 2 - labelW;
      const lines = doc.splitTextToSize(value || "_______________", maxW);
      doc.text(lines, margin + labelW, y);
      y += LINE_H * lines.length;
    };

    const twoFields = (l1: string, v1: string, l2: string, v2: string) => {
      const half = col / 2;
      doc.setFontSize(8).setFont("helvetica", "bold");
      doc.text(l1 + ":", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        v1 || "_______________",
        margin + doc.getTextWidth(l1 + ": "),
        y,
      );
      doc.setFont("helvetica", "bold");
      doc.text(l2 + ":", margin + half, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        v2 || "_______________",
        margin + half + doc.getTextWidth(l2 + ": "),
        y,
      );
      y += LINE_H;
    };

    const sectionLabel = (text: string) => {
      doc.setFontSize(8).setFont("helvetica", "bold");
      doc.setFillColor(...GRAY);
      doc.rect(margin, y, col, 5, "F");
      doc.text(text, margin + 2, y + 3.5);
      doc.setFont("helvetica", "normal");
      y += 6;
    };

    const multiLine = (label: string, value: string) => {
      sectionLabel(label);
      doc.setFontSize(8).setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(value || " ", col - 4);
      doc.text(lines, margin + 2, y);
      y += LINE_H * lines.length + 2;
    };

    const gap = (n = 3) => {
      y += n;
    };

    title("LESSON PLAN");

    twoFields("SCHOOL", formData.school, "DATE", formData.date);
    twoFields(
      "NAME OF TEACHER",
      formData.teacher,
      "DURATION",
      formData.duration + " mins",
    );
    twoFields(
      "CLASS",
      formData.class,
      "TOTAL NO. OF PUPILS",
      formData.totalPupils,
    );
    twoFields("TIME", formData.time, "TERM", "Term " + formData.term);
    gap();

    field("SUBJECT", formData.subject, true);
    doc
      .setFontSize(7)
      .setFont("helvetica", "italic")
      .setTextColor(120, 120, 120);
    doc.text(
      "(This must come from the syllabus with its serial number)",
      margin,
      y,
    );
    doc.setTextColor(0, 0, 0);
    y += 5;

    field("TOPIC", formData.topic, true);
    doc
      .setFontSize(7)
      .setFont("helvetica", "italic")
      .setTextColor(120, 120, 120);
    doc.text(
      "(This must come from the syllabus with its serial number)",
      margin,
      y,
    );
    doc.setTextColor(0, 0, 0);
    y += 5;

    field("SUB-TOPIC", formData.subTopic, true);
    gap();

    field("GENERAL COMPETENCES", lessonData.generalCompetences, true);
    gap(1);
    field("SPECIFIC COMPETENCES", lessonData.specificCompetences, true);
    gap(1);
    field("LESSON GOAL", lessonData.lessonGoal, true);
    gap();

    multiLine("RATIONALE", lessonData.rationale);
    field("PRIOR KNOWLEDGE", lessonData.priorKnowledge, true);
    gap();

    multiLine("REFERENCES", lessonData.references);

    sectionLabel("LEARNING ENVIRONMENT");
    doc.setFontSize(8).setFont("helvetica", "normal");
    doc.text(
      "• Natural: " + (lessonData.naturalEnvironment || "___"),
      margin + 2,
      y,
    );
    y += LINE_H;
    doc.text(
      "• Artificial: " + (lessonData.artificialEnvironment || "___"),
      margin + 2,
      y,
    );
    y += LINE_H;
    doc.text(
      "• Technological: " + (lessonData.technologicalEnvironment || "___"),
      margin + 2,
      y,
    );
    y += LINE_H + 2;

    multiLine(
      "TEACHING AND LEARNING MATERIALS / RESOURCES",
      lessonData.materials,
    );

    field("EXPECTED STANDARD", lessonData.expectedStandard, true);
    doc
      .setFontSize(7)
      .setFont("helvetica", "italic")
      .setTextColor(120, 120, 120);
    doc.text("(This must come from the syllabus as it is)", margin, y);
    doc.setTextColor(0, 0, 0);
    y += 5;

    doc.addPage();
    y = 14;

    title("LESSON PROGRESSION");

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [
        [
          "STAGES",
          "TEACHER'S ACTIVITIES",
          "LEARNERS' ACTIVITIES",
          "ASSESSMENT CRITERIA",
        ],
      ],
      body: [
        [
          "INTRODUCTION",
          lessonData.introduction.teacherActivities,
          lessonData.introduction.learnersActivities,
          lessonData.introduction.assessmentCriteria,
        ],
        [
          "LESSON DEVELOPMENT",
          lessonData.lessonDevelopment.teacherActivities,
          lessonData.lessonDevelopment.learnersActivities,
          lessonData.lessonDevelopment.assessmentCriteria,
        ],
        [
          "EXERCISE/ASSESSMENT",
          lessonData.exerciseAssessment.teacherActivities,
          lessonData.exerciseAssessment.learnersActivities,
          lessonData.exerciseAssessment.assessmentCriteria,
        ],
        [
          "HOMEWORK",
          lessonData.homework.teacherActivities,
          lessonData.homework.learnersActivities,
          lessonData.homework.assessmentCriteria,
        ],
        [
          "CONCLUSION",
          lessonData.conclusion.teacherActivities,
          lessonData.conclusion.learnersActivities,
          lessonData.conclusion.assessmentCriteria,
        ],
      ],
      styles: { fontSize: 8, cellPadding: 3, valign: "top" },
      headStyles: {
        fillColor: HEADER_COLOR,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: "bold", fillColor: GRAY },
        1: { cellWidth: 52 },
        2: { cellWidth: 52 },
        3: { cellWidth: 42 },
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(9).setFont("helvetica", "bold");
    doc.setFillColor(...GRAY);
    doc.rect(margin, y, col, 6, "F");
    doc.text("LESSON EVALUATION:", margin + 2, y + 4.5);
    y += 8;
    doc.setFont("helvetica", "normal").setFontSize(8);
    const evalLines = doc.splitTextToSize(
      lessonData.lessonEvaluation || " ",
      col - 4,
    );
    doc.text(evalLines, margin + 2, y);
    y += LINE_H * Math.max(evalLines.length, 3) + 6;

    for (let i = 0; i < 3; i++) {
      doc.setDrawColor(0).line(margin, y, margin + col, y);
      y += 6;
    }
    y += 6;

    const sigW = col / 2 - 6;
    doc.setFont("helvetica", "bold").setFontSize(8);
    doc.line(margin, y, margin + sigW, y);
    doc.line(margin + col / 2 + 6, y, margin + col, y);
    y += 4;
    doc.text("Teacher's Signature", margin, y);
    doc.text("HOD / Head Teacher's Signature", margin + col / 2 + 6, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Date: _______________", margin, y);
    doc.text("Date: _______________", margin + col / 2 + 6, y);

    doc.save(
      `LessonPlan_${formData.subject}_${formData.topic}_${formData.class}.pdf`,
    );
  };

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    note,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    note?: string;
  }) => (
    <div className="flex items-start gap-2">
      <span className="font-bold text-xs whitespace-nowrap pt-1">{label}:</span>
      <div className="flex-1 border-b border-gray-800">
        <input
          className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {note && <span className="text-gray-400 text-xs italic">{note}</span>}
      </div>
    </div>
  );

  const RowCell = ({
    stage,
    field,
    rows = 6,
  }: {
    stage:
      | "introduction"
      | "lessonDevelopment"
      | "exerciseAssessment"
      | "homework"
      | "conclusion";
    field: keyof TableRow;
    rows?: number;
  }) => (
    <textarea
      className="w-full text-xs p-1 resize-none focus:outline-none bg-transparent"
      rows={rows}
      value={lessonData[stage][field]}
      onChange={(e) => updateRow(stage, field, e.target.value)}
      placeholder="Write here..."
    />
  );

  const selectedTopicData = topics.find((t) => t.topic === formData.topic);
  const subTopicsForSelected = selectedTopicData?.subTopics || [];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/ai-tools")}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Lesson Plan Generator</h1>
          <p className="text-sm text-gray-500">
            Official MoE Format (Zambia) - CDC Aligned
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "✨ AI Generate"}
          </button>
          {generated && (
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl mx-auto">
        <h2 className="text-center text-xl font-bold uppercase tracking-widest mb-6">
          Lesson Plan
        </h2>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4 text-sm">
          <Field
            label="SCHOOL"
            value={formData.school}
            onChange={(v) => updateForm("school", v)}
            placeholder="School name"
          />
          <Field
            label="DATE"
            value={formData.date}
            onChange={(v) => updateForm("date", v)}
            placeholder="DD/MM/YYYY"
          />
          <Field
            label="NAME OF TEACHER"
            value={formData.teacher}
            onChange={(v) => updateForm("teacher", v)}
            placeholder="Full name"
          />
          <Field
            label="DURATION"
            value={formData.duration}
            onChange={(v) => updateForm("duration", v)}
            placeholder="e.g. 40 mins"
          />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs whitespace-nowrap">CLASS:</span>
            <select
              className="border-b border-gray-800 text-xs py-0.5 focus:outline-none bg-transparent flex-1"
              value={formData.class}
              onChange={(e) => updateForm("class", e.target.value)}
            >
              <option value="1">Form 1</option>
              <option value="2">Form 2</option>
              <option value="3">Form 3</option>
              <option value="4">Form 4</option>
            </select>
          </div>
          <Field
            label="TOTAL NO. OF PUPILS"
            value={formData.totalPupils}
            onChange={(v) => updateForm("totalPupils", v)}
            placeholder="e.g. 45"
          />
          <Field
            label="TIME"
            value={formData.time}
            onChange={(v) => updateForm("time", v)}
            placeholder="e.g. 08:00"
          />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs whitespace-nowrap">TERM:</span>
            <select
              className="border-b border-gray-800 text-xs py-0.5 focus:outline-none bg-transparent flex-1"
              value={formData.term}
              onChange={(e) => updateForm("term", e.target.value)}
            >
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              SUBJECT:
            </span>
            <div className="flex-1">
              <select
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent border-b border-gray-800"
                value={formData.subject}
                onChange={(e) => updateForm("subject", e.target.value)}
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
              </select>
              <span className="text-gray-400 text-xs italic">
                (This must come from the syllabus with its serial number)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              TOPIC:
            </span>
            <div className="flex-1">
              <select
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent border-b border-gray-800"
                value={formData.topic}
                onChange={(e) => updateForm("topic", e.target.value)}
                disabled={loadingTopics || topics.length === 0}
              >
                <option value="">
                  {loadingTopics ? "Loading topics..." : "Select Topic"}
                </option>
                {topics.map((t) => (
                  <option key={t.topic} value={t.topic}>
                    {t.topic}
                  </option>
                ))}
              </select>
              <span className="text-gray-400 text-xs italic">
                (This must come from the syllabus with its serial number)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              SUB-TOPIC:
            </span>
            <div className="flex-1">
              <select
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent border-b border-gray-800"
                value={formData.subTopic}
                onChange={(e) => updateForm("subTopic", e.target.value)}
                disabled={subTopicsForSelected.length === 0}
              >
                <option value="">Select Sub-Topic</option>
                {subTopicsForSelected.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              GENERAL COMPETENCES:
            </span>
            <div className="flex-1 border-b border-gray-800">
              <input
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
                value={lessonData.generalCompetences}
                onChange={(e) =>
                  updateLesson("generalCompetences", e.target.value)
                }
                placeholder="From the 12 general competencies"
              />
              <span className="text-gray-400 text-xs italic">
                (These must come from any among the 12 general competencies in
                the syllabus)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              SPECIFIC COMPETENCES:
            </span>
            <div className="flex-1 border-b border-gray-800">
              <input
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
                value={lessonData.specificCompetences}
                onChange={(e) =>
                  updateLesson("specificCompetences", e.target.value)
                }
                placeholder="From the syllabus with its serial number"
              />
              <span className="text-gray-400 text-xs italic">
                (This must come from the syllabus with its serial number)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              LESSON GOAL:
            </span>
            <div className="flex-1 border-b border-gray-800">
              <input
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
                value={lessonData.lessonGoal}
                onChange={(e) => updateLesson("lessonGoal", e.target.value)}
                placeholder="What learners will achieve"
              />
            </div>
          </div>
          <div>
            <p className="font-bold text-xs mb-1">RATIONALE:</p>
            <textarea
              className="w-full border-b border-gray-800 text-xs py-0.5 focus:outline-none bg-transparent resize-none"
              rows={3}
              value={lessonData.rationale}
              onChange={(e) => updateLesson("rationale", e.target.value)}
              placeholder="Why this lesson matters..."
            />
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              PRIOR KNOWLEDGE:
            </span>
            <div className="flex-1 border-b border-gray-800">
              <input
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
                value={lessonData.priorKnowledge}
                onChange={(e) => updateLesson("priorKnowledge", e.target.value)}
                placeholder="What learners already know..."
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="font-bold text-xs mb-1">REFERENCES:</p>
          <textarea
            className="w-full border-b border-gray-800 text-xs py-0.5 focus:outline-none bg-transparent resize-none"
            rows={2}
            value={lessonData.references}
            onChange={(e) => updateLesson("references", e.target.value)}
            placeholder="Textbooks, TG page numbers..."
          />
        </div>

        <div className="mb-4">
          <p className="font-bold text-xs mb-2">LEARNING ENVIRONMENT</p>
          <div className="space-y-2 pl-4">
            {[
              {
                label: "• Natural environment",
                field: "naturalEnvironment" as keyof LessonData,
                placeholder: "e.g. School garden, field",
              },
              {
                label: "• Artificial environment",
                field: "artificialEnvironment" as keyof LessonData,
                placeholder: "e.g. Classroom, laboratory",
              },
              {
                label: "• Technological environment",
                field: "technologicalEnvironment" as keyof LessonData,
                placeholder: "e.g. Computer lab, projector",
              },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="flex items-center gap-2">
                <span className="text-xs font-medium whitespace-nowrap">
                  {label}:
                </span>
                <div className="flex-1 border-b border-gray-800">
                  <input
                    className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
                    value={lessonData[field] as string}
                    onChange={(e) => updateLesson(field, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="font-bold text-xs mb-1">
            TEACHING AND LEARNING MATERIALS/RESOURCES
          </p>
          <textarea
            className="w-full border-b border-gray-800 text-xs py-0.5 focus:outline-none bg-transparent resize-none"
            rows={2}
            value={lessonData.materials}
            onChange={(e) => updateLesson("materials", e.target.value)}
            placeholder="Charts, counters, textbooks, calculators..."
          />
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-2">
            <span className="font-bold text-xs whitespace-nowrap pt-1">
              EXPECTED STANDARD:
            </span>
            <div className="flex-1 border-b border-gray-800">
              <input
                className="w-full text-xs py-0.5 focus:outline-none bg-transparent"
                value={lessonData.expectedStandard}
                onChange={(e) =>
                  updateLesson("expectedStandard", e.target.value)
                }
                placeholder="From the syllabus as it is"
              />
              <span className="text-gray-400 text-xs italic">
                (This must come from the syllabus as it is)
              </span>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-sm uppercase mb-3">
          Lesson Progression:
        </h3>
        <table className="w-full border-collapse border border-gray-800 mb-6 text-xs">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="border border-gray-800 p-2 text-left w-32">
                STAGES
              </th>
              <th className="border border-gray-800 p-2 text-left">
                TEACHER'S ACTIVITIES
              </th>
              <th className="border border-gray-800 p-2 text-left">
                LEARNERS' ACTIVITIES
              </th>
              <th className="border border-gray-800 p-2 text-left w-36">
                ASSESSMENT CRITERIA
              </th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                { key: "introduction", label: "INTRODUCTION" },
                { key: "lessonDevelopment", label: "LESSON DEVELOPMENT" },
                { key: "exerciseAssessment", label: "EXERCISE / ASSESSMENT" },
                { key: "homework", label: "HOMEWORK" },
                { key: "conclusion", label: "CONCLUSION" },
              ] as {
                key:
                  | "introduction"
                  | "lessonDevelopment"
                  | "exerciseAssessment"
                  | "homework"
                  | "conclusion";
                label: string;
              }[]
            ).map(({ key, label }) => (
              <tr key={key}>
                <td className="border border-gray-800 p-2 font-bold align-top bg-gray-50 text-xs">
                  {label}
                </td>
                <td className="border border-gray-800 p-1 align-top">
                  <RowCell stage={key} field="teacherActivities" />
                </td>
                <td className="border border-gray-800 p-1 align-top">
                  <RowCell stage={key} field="learnersActivities" />
                </td>
                <td className="border border-gray-800 p-1 align-top">
                  <RowCell stage={key} field="assessmentCriteria" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-6">
          <p className="font-bold text-xs mb-2">LESSON EVALUATION:</p>
          <textarea
            className="w-full border-b border-gray-800 text-xs py-0.5 focus:outline-none bg-transparent resize-none"
            rows={4}
            value={lessonData.lessonEvaluation}
            onChange={(e) => updateLesson("lessonEvaluation", e.target.value)}
            placeholder="Write lesson evaluation here..."
          />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-800 mt-2" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <div className="border-b border-gray-800 mb-1" />
            <p className="text-xs font-bold">Teacher's Signature</p>
            <p className="text-xs text-gray-500 mt-1">Date: _______________</p>
          </div>
          <div>
            <div className="border-b border-gray-800 mb-1" />
            <p className="text-xs font-bold">HOD / Head Teacher's Signature</p>
            <p className="text-xs text-gray-500 mt-1">Date: _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
