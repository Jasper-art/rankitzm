import React, { useState } from "react";

export default function RecordsOfWorkScreen() {
  const [formData, setFormData] = useState({
    subject: "",
    grade: "",
    date: "",
    topicTaught: "",
    classAttendance: "",
    remarks: "",
  });
  const [recordOfWork, setRecordOfWork] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<
    { date: string; topic: string; record: string }[]
  >([]);

  const handleGenerate = async () => {
    if (
      !formData.subject ||
      !formData.grade ||
      !formData.date ||
      !formData.topicTaught
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/generate-record?subject=${formData.subject}&grade=${formData.grade}&date=${formData.date}&topic=${formData.topicTaught}&attendance=${formData.classAttendance}&remarks=${formData.remarks}`,
      );
      const data = await response.json();
      if (data.record) {
        setRecordOfWork(data.record);
        // Add to records list
        setRecords([
          ...records,
          {
            date: formData.date,
            topic: formData.topicTaught,
            record: data.record,
          },
        ]);
        // Reset form
        setFormData({
          subject: formData.subject,
          grade: formData.grade,
          date: "",
          topicTaught: "",
          classAttendance: "",
          remarks: "",
        });
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-primary">Records of Work</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4 bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Daily Record Entry</h3>

          <input
            type="text"
            placeholder="Subject (e.g. Mathematics)"
            className="w-full p-3 border rounded-lg bg-background text-foreground"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Grade (e.g. 8)"
            className="w-full p-3 border rounded-lg bg-background text-foreground"
            value={formData.grade}
            onChange={(e) =>
              setFormData({ ...formData, grade: e.target.value })
            }
          />
          <input
            type="date"
            className="w-full p-3 border rounded-lg bg-background text-foreground"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <textarea
            placeholder="Topic Taught"
            className="w-full p-3 border rounded-lg bg-background text-foreground h-20"
            value={formData.topicTaught}
            onChange={(e) =>
              setFormData({ ...formData, topicTaught: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Class Attendance (e.g. 35/40)"
            className="w-full p-3 border rounded-lg bg-background text-foreground"
            value={formData.classAttendance}
            onChange={(e) =>
              setFormData({ ...formData, classAttendance: e.target.value })
            }
          />
          <textarea
            placeholder="Remarks (optional)"
            className="w-full p-3 border rounded-lg bg-background text-foreground h-16"
            value={formData.remarks}
            onChange={(e) =>
              setFormData({ ...formData, remarks: e.target.value })
            }
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Recording..." : "Add Record"}
          </button>
        </div>

        {/* Records List */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Records This Week</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-gray-500">No records yet</p>
            ) : (
              records.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-background border-l-4 border-primary rounded"
                >
                  <p className="font-bold text-sm">{rec.date}</p>
                  <p className="text-sm text-gray-600">{rec.topic}</p>
                </div>
              ))
            )}
          </div>
          {records.length > 0 && (
            <button
              onClick={() => window.print()}
              className="w-full mt-4 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Print All Records
            </button>
          )}
        </div>
      </div>

      {recordOfWork && (
        <div className="mt-8 p-6 bg-card border-l-4 border-primary rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Latest Record Summary</h3>
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {recordOfWork}
          </div>
        </div>
      )}
    </div>
  );
}
