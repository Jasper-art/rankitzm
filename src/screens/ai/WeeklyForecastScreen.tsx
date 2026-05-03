import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Plus, Trash2 } from "lucide-react";

interface ForecastRow {
  id: string;
  week: string;
  day: string;
  date: string;
  topic: string;
  subTopic: string;
  specificOutcomes: string;
  methods: string;
  resources: string;
  references: string;
  remarks: string;
}

const defaultRows: ForecastRow[] = [
  {
    id: "1",
    week: "1",
    day: "Mon",
    date: "",
    topic: "",
    subTopic: "",
    specificOutcomes: "",
    methods: "",
    resources: "",
    references: "",
    remarks: "",
  },
  {
    id: "2",
    week: "1",
    day: "Tue",
    date: "",
    topic: "",
    subTopic: "",
    specificOutcomes: "",
    methods: "",
    resources: "",
    references: "",
    remarks: "",
  },
  {
    id: "3",
    week: "1",
    day: "Wed",
    date: "",
    topic: "",
    subTopic: "",
    specificOutcomes: "",
    methods: "",
    resources: "",
    references: "",
    remarks: "",
  },
  {
    id: "4",
    week: "1",
    day: "Thu",
    date: "",
    topic: "",
    subTopic: "",
    specificOutcomes: "",
    methods: "",
    resources: "",
    references: "",
    remarks: "",
  },
  {
    id: "5",
    week: "1",
    day: "Fri",
    date: "",
    topic: "",
    subTopic: "",
    specificOutcomes: "",
    methods: "",
    resources: "",
    references: "",
    remarks: "",
  },
];

export default function WeeklyForecastScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ForecastRow[]>(defaultRows);
  const [schoolName, setSchoolName] = useState("School Name");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [term, setTerm] = useState("1");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [teacher, setTeacher] = useState("");

  const updateRow = (id: string, field: keyof ForecastRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => {
    const newRow: ForecastRow = {
      id: Date.now().toString(),
      week: "",
      day: "",
      date: "",
      topic: "",
      subTopic: "",
      specificOutcomes: "",
      methods: "",
      resources: "",
      references: "",
      remarks: "",
    };
    setRows((prev) => [...prev, newRow]);
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button
          onClick={() => navigate("/ai-tools")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Weekly Forecast</h1>
          <p className="text-sm text-gray-500">CDC Standard Format (Zambia)</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Meta Info */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 print:shadow-none print:border-black">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">School</label>
            <input
              className="w-full border-b border-gray-300 text-sm py-1 focus:outline-none focus:border-primary bg-transparent"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Subject</label>
            <input
              className="w-full border-b border-gray-300 text-sm py-1 focus:outline-none focus:border-primary bg-transparent"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Grade</label>
            <input
              className="w-full border-b border-gray-300 text-sm py-1 focus:outline-none focus:border-primary bg-transparent"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. Grade 5"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Term</label>
            <select
              className="w-full border-b border-gray-300 text-sm py-1 focus:outline-none focus:border-primary bg-transparent"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Year</label>
            <input
              className="w-full border-b border-gray-300 text-sm py-1 focus:outline-none focus:border-primary bg-transparent"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Teacher</label>
            <input
              className="w-full border-b border-gray-300 text-sm py-1 focus:outline-none focus:border-primary bg-transparent"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Teacher's name"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto print:shadow-none print:border-black">
        <div className="print:p-2">
          {/* Print Title */}
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-lg font-bold uppercase">{schoolName}</h2>
            <p className="text-sm">
              Weekly Forecast — {subject} | {grade} | Term {term} | {year}
            </p>
            <p className="text-sm">Teacher: {teacher}</p>
          </div>

          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-primary text-white print:bg-gray-200 print:text-black">
                <th className="border border-gray-300 p-2 text-left w-8">Wk</th>
                <th className="border border-gray-300 p-2 text-left w-10">
                  Day
                </th>
                <th className="border border-gray-300 p-2 text-left w-20">
                  Date
                </th>
                <th className="border border-gray-300 p-2 text-left w-24">
                  Topic
                </th>
                <th className="border border-gray-300 p-2 text-left w-24">
                  Sub-Topic
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Specific Outcomes
                </th>
                <th className="border border-gray-300 p-2 text-left w-24">
                  Methods
                </th>
                <th className="border border-gray-300 p-2 text-left w-24">
                  Resources
                </th>
                <th className="border border-gray-300 p-2 text-left w-28">
                  References
                </th>
                <th className="border border-gray-300 p-2 text-left w-24">
                  Remarks
                </th>
                <th className="border border-gray-300 p-2 w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {(
                    [
                      "week",
                      "day",
                      "date",
                      "topic",
                      "subTopic",
                      "specificOutcomes",
                      "methods",
                      "resources",
                      "references",
                      "remarks",
                    ] as (keyof ForecastRow)[]
                  ).map((field) => (
                    <td key={field} className="border border-gray-300 p-1">
                      <input
                        className="w-full bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 py-0.5 text-xs"
                        value={row[field]}
                        onChange={(e) =>
                          updateRow(row.id, field, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 p-1 print:hidden">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-red-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Row */}
      <button
        onClick={addRow}
        className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-primary hover:text-primary rounded-lg text-sm text-gray-500 transition-colors w-full justify-center print:hidden"
      >
        <Plus className="w-4 h-4" />
        Add Row
      </button>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, table, table * { visibility: visible; }
          table { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
