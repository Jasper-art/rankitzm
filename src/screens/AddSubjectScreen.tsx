import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSubjects, useClasses } from "../hooks/useClassManager";
import { addActivity } from "../lib/activityLogger";
import { useAuth } from "../context/AuthContext";
import { v4 as uuidv4 } from "uuid";

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

const LIGHT = {
  bg: "#F2F5F2",
  surface: "#FFFFFF",
  surfaceAlt: "#EFF4EF",
  border: "#DDE8DD",
  borderSub: "#EEF4EE",
  text: "#0D1A0D",
  textSub: "#3A5A3A",
  textMuted: "#7A9A7A",
  accent: "#198A00",
  accentBg: "#E4F5E0",
  accentText: "#0A5000",
  red: "#EF3340",
  redBg: "#FDECEE",
  redText: "#8A0010",
  orange: "#E07200",
  orangeBg: "#FFF0E0",
  orangeText: "#7A3A00",
  topbar: "#FFFFFF",
  shadow: "rgba(25,138,0,0.10)",
};

const DARK = {
  bg: "#0A140A",
  surface: "#121E12",
  surfaceAlt: "#182418",
  border: "#243024",
  borderSub: "#1A241A",
  text: "#E0EEE0",
  textSub: "#80A880",
  textMuted: "#4A6A4A",
  accent: "#34C000",
  accentBg: "#0A2008",
  accentText: "#80E060",
  red: "#FF5060",
  redBg: "#280A0E",
  redText: "#FF9098",
  orange: "#FF9030",
  orangeBg: "#281600",
  orangeText: "#FFB870",
  topbar: "#121E12",
  shadow: "rgba(52,192,0,0.14)",
};

type Theme = typeof LIGHT;

function FlagStrip() {
  return (
    <div style={{ display: "flex", height: 3, width: "100%", flexShrink: 0 }}>
      {["#198A00", "#EF3340", "#1A1A1A", "#FF8200"].map((c) => (
        <div key={c} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  isMobile,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  isMobile: boolean;
}) {
  return (
    <div style={{ marginBottom: isMobile ? 14 : 18 }}>
      <label
        style={{
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600,
          color: "#3A5A3A",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div
          style={{
            fontSize: isMobile ? 10 : 11,
            color: "#7A9A7A",
            marginTop: 4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export default function AddSubjectScreen() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { addSubject, updateSubject, loading: addingSubject } = useSubjects();
  const { classes } = useClasses();
  const { schoolId, userId } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const t: Theme = dark ? DARK : LIGHT;

  const [formData, setFormData] = useState(() => {
    const defaultClassId = classId ? parseInt(classId) : classes[0]?.id || 0;
    const defaultClass = classes.find((c) => c.id === defaultClassId);
    const defaultIsPrimary =
      defaultClass?.educationLevel?.toLowerCase() === "primary";
    return {
      subjectName: "",
      classId: defaultClassId,
      maxMark: defaultIsPrimary ? "" : "100",
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedClass = classes.find((c) => c.id === formData.classId);
  const isPrimary = selectedClass?.educationLevel?.toLowerCase() === "primary";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          name === "classId"
            ? parseInt(value)
            : name === "maxMark"
              ? value
                ? parseInt(value)
                : ""
              : value,
      };

      if (name === "classId") {
        const newClass = classes.find((c) => c.id === parseInt(value));
        const newIsPrimary =
          newClass?.educationLevel?.toLowerCase() === "primary";
        newData.maxMark = newIsPrimary ? "" : "100";
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!formData.subjectName.trim()) {
        setError("Subject name is required");
        setLoading(false);
        return;
      }
      if (!formData.classId) {
        setError("Please select a class");
        setLoading(false);
        return;
      }

      if (isPrimary && !formData.maxMark) {
        setError("Maximum marks is required for primary level subjects");
        setLoading(false);
        return;
      }

      const subjectId = await addSubject({
        subjectName: formData.subjectName.trim(),
        subjectId: 0,
        classId: formData.classId,
        maxMark: formData.maxMark
          ? parseInt(formData.maxMark.toString())
          : null,
        syncId: uuidv4(),
      });

      await updateSubject({
        id: subjectId,
        subjectName: formData.subjectName.trim(),
        subjectId: subjectId,
        classId: formData.classId,
        maxMark: formData.maxMark
          ? parseInt(formData.maxMark.toString())
          : null,
        syncId: uuidv4(),
      });

      await addActivity({
        type: "class_added",
        title: "Subject created",
        subtitle: `${formData.subjectName.trim()} • ${selectedClass?.className}`,
        timestamp: Date.now(),
        schoolId: schoolId || "default",
        userId: userId || undefined,
      });

      navigate(`/classes/${classId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: isMobile ? "9px 11px" : "10px 12px",
    background: t.surfaceAlt,
    border: `1px solid ${t.border}`,
    borderRadius: isMobile ? 7 : 9,
    fontSize: isMobile ? 12 : 13,
    color: t.text,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: t.bg,
        fontFamily: "'DM Sans','Outfit','Segoe UI',system-ui,sans-serif",
        color: t.text,
      }}
    >
      <FlagStrip />

      {/* Topbar */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "0 16px" : "0 24px",
          height: isMobile ? 52 : 58,
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 10 : 12,
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => navigate(`/classes/${classId}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: t.textMuted,
            display: "flex",
            padding: 4,
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div>
          <div
            style={{
              fontSize: isMobile ? 15 : 16,
              fontWeight: 700,
              color: t.text,
            }}
          >
            Add New Subject
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11, color: t.textMuted }}>
            Fill in the details below
          </div>
        </div>
      </header>

      {/* Body */}
      <main
        style={{
          padding: isMobile ? "18px 16px" : "24px",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        {/* Flag bar */}
        <div
          style={{
            display: "flex",
            height: 4,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: isMobile ? 16 : 20,
          }}
        >
          {["#198A00", "#EF3340", "#1A1A1A", "#FF8200"].map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: t.redBg,
              border: `1px solid ${t.red}40`,
              borderRadius: 10,
              padding: isMobile ? "10px 14px" : "12px 16px",
              marginBottom: 16,
              fontSize: isMobile ? 12 : 13,
              color: t.redText,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Form card */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: isMobile ? "18px" : "24px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 13 : 14,
              fontWeight: 700,
              color: t.text,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${t.borderSub}`,
            }}
          >
            Subject Information
          </div>

          <Field
            label="Subject Name *"
            hint="Give your subject a unique name e.g. Mathematics, English"
            isMobile={isMobile}
          >
            <input
              type="text"
              name="subjectName"
              value={formData.subjectName}
              onChange={handleInputChange}
              placeholder="e.g., Mathematics"
              style={inputStyle}
            />
          </Field>

          <Field
            label="Class *"
            hint="Select the class for this subject"
            isMobile={isMobile}
          >
            <select
              name="classId"
              value={formData.classId}
              onChange={handleInputChange}
              style={{ ...inputStyle, appearance: "none" as const }}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} ({cls.level})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={`Maximum Marks ${isPrimary ? "*" : "(Optional)"}`}
            hint={
              isPrimary
                ? "Maximum marks for this subject (required for primary level)"
                : "Maximum marks for this subject (defaults to 100 for percentages)"
            }
            isMobile={isMobile}
          >
            <input
              type="number"
              name="maxMark"
              value={formData.maxMark}
              onChange={handleInputChange}
              placeholder={isPrimary ? "e.g., 50" : "e.g., 100"}
              min="1"
              max="1000"
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Tip box */}
        <div
          style={{
            background: t.accentBg,
            border: `1px solid ${t.accent}40`,
            borderRadius: 12,
            padding: isMobile ? "10px 12px" : "12px 16px",
            marginBottom: isMobile ? 18 : 24,
            fontSize: isMobile ? 12 : 13,
            color: t.accentText,
          }}
        >
          💡 <strong>Tip:</strong> You can edit subject details and add learners
          after creating the subject.
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: isMobile ? 8 : 12,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <button
            onClick={() => navigate(`/classes/${classId}`)}
            disabled={loading}
            style={{
              flex: 1,
              padding: isMobile ? "10px 0" : "12px 0",
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || addingSubject}
            style={{
              flex: 1,
              padding: isMobile ? "10px 0" : "12px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#198A00,#0D5800)",
              color: "#fff",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading || addingSubject ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(25,138,0,0.30)",
            }}
          >
            {loading || addingSubject ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: isMobile ? 12 : 13 }}>Creating…</span>
              </>
            ) : (
              "Create Subject"
            )}
          </button>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
