import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClasses } from "../hooks/useClassManager";
import { addActivity } from "../lib/activityLogger";
import { useAuth } from "../context/AuthContext";
import { db } from "../db";
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
  shadow: "rgba(17, 24, 39, 0.04)",
  shadowMd: "rgba(17, 24, 39, 0.08)",
  shadowLg: "rgba(17, 24, 39, 0.12)",
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
  shadow: "rgba(0, 0, 0, 0.2)",
  shadowMd: "rgba(0, 0, 0, 0.3)",
  shadowLg: "rgba(0, 0, 0, 0.4)",
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
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export default function AddClassScreen() {
  const navigate = useNavigate();
  const { addClass, loading: addingClass } = useClasses();
  const { schoolId, userId } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t = dark ? DARK : LIGHT;

  const [formData, setFormData] = useState({
    className: "",
    academicYear: new Date().getFullYear(),
    educationLevel: "primary",
    level: "",
    maximumPupils: "",
    subjectsOffered: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maximumPupils" ? (value ? parseInt(value) : "") : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!formData.className.trim()) {
        setError("Class name is required");
        setLoading(false);
        return;
      }
      if (!formData.level.trim()) {
        setError("Class level is required");
        setLoading(false);
        return;
      }
      if (!formData.subjectsOffered.trim()) {
        setError("At least one subject is required");
        setLoading(false);
        return;
      }

      const newClassId = await addClass({
        className: formData.className.trim(),
        academicYear: formData.academicYear,
        educationLevel: formData.educationLevel,
        level: formData.level.trim(),
        maximumPupils: formData.maximumPupils
          ? parseInt(formData.maximumPupils.toString())
          : null,
        subjectsOffered: formData.subjectsOffered
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", "),
        syncId: uuidv4(),
      });

      const subjects = formData.subjectsOffered
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await Promise.all(
        subjects.map(async (subjectName) => {
          const id = await db.addSubject({
            subjectName,
            subjectId: 0,
            classId: newClassId,
            maxMark: null,
            syncId: uuidv4(),
          });
          await db.updateSubject({
            id,
            subjectName,
            subjectId: id,
            classId: newClassId,
            maxMark: null,
            syncId: uuidv4(),
          });
        }),
      );

      await addActivity({
        type: "class_added",
        title: "Class created",
        subtitle: `${formData.className.trim()} • ${formData.educationLevel}`,
        timestamp: Date.now(),
        schoolId: schoolId || "default",
        userId: userId || undefined,
      });

      navigate("/classes", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: isMobile ? "10px 12px" : "11px 14px",
    background: t.surfaceAlt,
    border: `1.5px solid ${t.border}`,
    borderRadius: isMobile ? 6 : 8,
    fontSize: isMobile ? 12 : 13,
    color: t.text,
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontWeight: 500,
    letterSpacing: "-0.1px",
  };

  const subjectTags = formData.subjectsOffered
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: t.bg,
        fontFamily:
          "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', sans-serif",
        color: t.text,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "0 16px" : "0 32px",
          height: isMobile ? 60 : 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          flexShrink: 0,
          boxShadow: `0 1px 3px ${t.shadow}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 14,
            minWidth: 0,
          }}
        >
          <button
            onClick={() => navigate("/classes")}
            style={{
              background: "transparent",
              border: "none",
              color: t.textMuted,
              cursor: "pointer",
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              transition: "all 0.3s ease",
              flexShrink: 0,
              width: 40,
              height: 40,
              fontSize: 20,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.color = t.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
            }}
            title="Back"
          >
            {Icons.back}
          </button>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 800,
                color: t.text,
                letterSpacing: "-0.8px",
                whiteSpace: "nowrap",
              }}
            >
              Add New Class
            </div>
            <div
              style={{
                fontSize: isMobile ? 10 : 11,
                color: t.textMuted,
                marginTop: 2,
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Create Class & Subjects
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "20px 16px" : "28px 32px",
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          minWidth: 0,
          maxWidth: isMobile ? "100%" : 700,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: t.redBg,
              border: `1.5px solid ${t.red}`,
              borderRadius: 12,
              padding: isMobile ? "12px 14px" : "14px 16px",
              marginBottom: 24,
              fontSize: isMobile ? 12 : 13,
              color: t.redText,
              fontWeight: 600,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              animation: "slideInDown 0.3s ease",
              lineHeight: 1.5,
            }}
          >
            <span style={{ flexShrink: 0, fontSize: 16, lineHeight: 1 }}>
              ⚠️
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Class Information Card */}
        <div
          style={{
            background: t.surface,
            border: `1.5px solid ${t.border}`,
            borderRadius: 12,
            padding: isMobile ? "18px" : "24px",
            marginBottom: 20,
            boxShadow: `0 2px 8px ${t.shadowMd}`,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 14 : 15,
              fontWeight: 800,
              color: t.text,
              marginBottom: 18,
              paddingBottom: 14,
              borderBottom: `1.5px solid ${t.border}`,
              letterSpacing: "-0.3px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>📋</span>
            Class Information
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: t.textMuted,
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Class Name *
            </label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleInputChange}
              placeholder="e.g., Class 1A, Form 3 Blue"
              style={inputStyle}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surface;
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  `0 0 0 3px ${t.accentLighter}`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 6,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              Give your class a unique and recognizable name
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: t.textMuted,
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Class Level *
            </label>
            <input
              type="text"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              placeholder="e.g., Grade 1, Form 3, Year 7"
              style={inputStyle}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surface;
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  `0 0 0 3px ${t.accentLighter}`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 6,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              Specify the grade, form, or year level
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 14 : 14,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  color: t.textMuted,
                  display: "block",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Education Level *
              </label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                style={inputStyle}
                onFocus={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    t.accent;
                  (e.currentTarget as HTMLSelectElement).style.background =
                    t.surface;
                  (e.currentTarget as HTMLSelectElement).style.boxShadow =
                    `0 0 0 3px ${t.accentLighter}`;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    t.border;
                  (e.currentTarget as HTMLSelectElement).style.background =
                    t.surfaceAlt;
                  (e.currentTarget as HTMLSelectElement).style.boxShadow =
                    "none";
                }}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="tertiary">Tertiary</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  color: t.textMuted,
                  display: "block",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Academic Year *
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                style={inputStyle}
                onFocus={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    t.accent;
                  (e.currentTarget as HTMLSelectElement).style.background =
                    t.surface;
                  (e.currentTarget as HTMLSelectElement).style.boxShadow =
                    `0 0 0 3px ${t.accentLighter}`;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    t.border;
                  (e.currentTarget as HTMLSelectElement).style.background =
                    t.surfaceAlt;
                  (e.currentTarget as HTMLSelectElement).style.boxShadow =
                    "none";
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: t.textMuted,
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Maximum Pupils (Optional)
            </label>
            <input
              type="number"
              name="maximumPupils"
              value={formData.maximumPupils}
              onChange={handleInputChange}
              placeholder="e.g., 40"
              min="1"
              max="1000"
              style={inputStyle}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surface;
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  `0 0 0 3px ${t.accentLighter}`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 6,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              Limit the number of students in this class
            </div>
          </div>
        </div>

        {/* Subjects Card */}
        <div
          style={{
            background: t.surface,
            border: `1.5px solid ${t.border}`,
            borderRadius: 12,
            padding: isMobile ? "18px" : "24px",
            marginBottom: 20,
            boxShadow: `0 2px 8px ${t.shadowMd}`,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 14 : 15,
              fontWeight: 800,
              color: t.text,
              marginBottom: 18,
              paddingBottom: 14,
              borderBottom: `1.5px solid ${t.border}`,
              letterSpacing: "-0.3px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>📚</span>
            Subjects Offered
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: t.textMuted,
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Subjects *
            </label>
            <textarea
              name="subjectsOffered"
              value={formData.subjectsOffered}
              onChange={handleInputChange}
              placeholder="Mathematics, English, Science, Social Studies, PE, Art"
              rows={isMobile ? 2 : 3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: isMobile ? "70px" : "90px",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLTextAreaElement).style.background =
                  t.surface;
                (e.currentTarget as HTMLTextAreaElement).style.boxShadow =
                  `0 0 0 3px ${t.accentLighter}`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLTextAreaElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLTextAreaElement).style.boxShadow =
                  "none";
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 6,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              Separate each subject with a comma. You can add more subjects
              later
            </div>
          </div>

          {/* Subject Tags Preview */}
          {subjectTags.length > 0 && (
            <div
              style={{
                padding: "12px 14px",
                background: t.surfaceAlt,
                borderRadius: 8,
                border: `1.5px solid ${t.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: t.textMuted,
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Preview ({subjectTags.length} subjects)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {subjectTags.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      background: t.accentLighter,
                      color: t.accentText,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: isMobile ? "4px 9px" : "5px 11px",
                      borderRadius: 6,
                      letterSpacing: "-0.2px",
                      textTransform: "capitalize",
                      display: "inline-block",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tip Box */}
        <div
          style={{
            background: t.accentLighter,
            border: `1.5px solid ${t.accent}`,
            borderRadius: 12,
            padding: isMobile ? "12px 14px" : "14px 16px",
            marginBottom: 28,
            fontSize: isMobile ? 11 : 12,
            color: t.accentText,
            fontWeight: 600,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            lineHeight: 1.6,
            letterSpacing: "-0.1px",
          }}
        >
          <span style={{ flexShrink: 0, fontSize: 16, lineHeight: 1 }}>💡</span>
          <span>
            After creating the class, you can assign learners, manage subjects,
            and configure class settings.
          </span>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: isMobile ? 8 : 10,
            marginTop: "auto",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <button
            onClick={() => navigate("/classes")}
            disabled={loading || addingClass}
            style={{
              flex: 1,
              padding: isMobile ? "11px 0" : "12px 0",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              cursor: loading || addingClass ? "not-allowed" : "pointer",
              opacity: loading || addingClass ? 0.6 : 1,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              if (!loading && !addingClass) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.border;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 4px 12px ${t.shadowMd}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !addingClass) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || addingClass}
            style={{
              flex: 1,
              padding: isMobile ? "11px 0" : "12px 0",
              borderRadius: 8,
              border: "none",
              background: t.accent,
              color: "#fff",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              cursor: loading || addingClass ? "not-allowed" : "pointer",
              opacity: loading || addingClass ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: `0 4px 12px ${t.shadowMd}`,
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              if (!loading && !addingClass) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accentDark;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 8px 20px ${t.shadowLg}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !addingClass) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accent;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 4px 12px ${t.shadowMd}`;
              }
            }}
          >
            {loading || addingClass ? (
              <>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                  }}
                />
                <span>Creating…</span>
              </>
            ) : (
              <>
                <div style={{ width: 12, height: 12, flexShrink: 0 }}>
                  {Icons.plus}
                </div>
                <span>Create Class</span>
              </>
            )}
          </button>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: ${t.border};
          border-radius: 6px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${t.textMuted};
        }
      `}</style>
    </div>
  );
}
