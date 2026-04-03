import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLearners, useClasses } from "../hooks/useClassManager";
import { addActivity } from "../lib/activityLogger";
import { useAuth } from "../context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import BulkAddModal from "./BulkAddModal";

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
      width={18}
      height={18}
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export default function AddLearnerScreen() {
  const navigate = useNavigate();
  const { classId: paramClassId } = useParams<{ classId: string }>();
  const { addLearner, loading: addingLearner, learners } = useLearners();
  const { classes } = useClasses();
  const { schoolId, userId } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const t = dark ? DARK : LIGHT;

  const [formData, setFormData] = useState({
    name: "",
    classId: paramClassId ? parseInt(paramClassId) : classes[0]?.id || 0,
    gender: "male",
    parentPhone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "classId" ? parseInt(value) : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      classId: paramClassId ? parseInt(paramClassId) : classes[0]?.id || 0,
      gender: "male",
      parentPhone: "",
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.name.trim()) {
        setDuplicateMessage("Student name is required");
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }
      if (!formData.classId) {
        setDuplicateMessage("Please select a class");
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }
      if (
        formData.parentPhone &&
        !/^\d{10,}$/.test(formData.parentPhone.replace(/\D/g, ""))
      ) {
        setDuplicateMessage("Please enter a valid phone number (10+ digits)");
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }

      const selectedClass = classes.find((c) => c.id === formData.classId);

      const studentName = formData.name.trim().toLowerCase();
      const classLearners = learners.filter(
        (l) => l.classId === formData.classId,
      );
      const isDuplicate = classLearners.some(
        (l) => l.name.toLowerCase() === studentName,
      );

      if (isDuplicate) {
        setDuplicateMessage(
          `A student named "${formData.name.trim()}" already exists in ${selectedClass?.className}.`,
        );
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }
      await addLearner({
        name: formData.name.trim(),
        classId: formData.classId,
        gender: formData.gender,
        parentPhone: formData.parentPhone.trim(),
        syncId: uuidv4(),
      });

      await addActivity({
        type: "student_added",
        title: "Student added",
        subtitle: `${formData.name.trim()} • ${selectedClass?.className}`,
        timestamp: Date.now(),
        schoolId: schoolId || "default",
        userId: userId || undefined,
      });

      setSuccessMessage(
        `${formData.name} added to ${selectedClass?.className} successfully!`,
      );
      setShowSuccess(true);
      resetForm();

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: isMobile ? "10px 12px" : "11px 14px",
    background: t.surfaceAlt,
    border: `1.5px solid ${t.border}`,
    borderRadius: isMobile ? 6 : 8,
    fontSize: isMobile ? 12 : 13,
    color: t.text,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    fontWeight: 500,
    transition: "all 0.2s",
  };

  const selectedClass = classes.find((c) => c.id === formData.classId);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: t.bg,
        fontFamily:
          "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', sans-serif",
        color: t.text,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
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
            onClick={() =>
              paramClassId
                ? navigate(`/classes/${paramClassId}`)
                : navigate("/learners")
            }
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
              width: 40,
              height: 40,
              flexShrink: 0,
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
              Add Student
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
              Register a new learner
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
        }}
      >
        {/* Form Card */}
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
            }}
          >
            📋 Student Information
          </div>

          {/* Full Name */}
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
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Chanda Mwale"
              style={inputStyle}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surface;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surfaceAlt;
              }}
            />
          </div>

          {/* Class Selection */}
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
              Class *
            </label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleInputChange}
              style={{
                ...inputStyle,
                appearance: "none",
                paddingRight: 32,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: "right 10px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLSelectElement).style.background =
                  t.surface;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLSelectElement).style.background =
                  t.surfaceAlt;
              }}
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} · {cls.educationLevel}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Class Pill */}
          {selectedClass && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: t.accentLighter,
                border: `1.5px solid ${t.accent}`,
                borderRadius: 8,
                padding: isMobile ? "7px 10px" : "8px 12px",
                marginBottom: 16,
              }}
            >
              <svg viewBox="0 0 20 20" fill={t.accent} width={14} height={14}>
                <path d="M10.5 1.5H9.5V1h1v.5zM19 9.5H9V0h1v9.5h9z" />
              </svg>
              <span
                style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  color: t.accentText,
                  letterSpacing: "-0.2px",
                }}
              >
                {selectedClass.className} · {selectedClass.educationLevel}
              </span>
            </div>
          )}

          {/* Gender Selection */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: t.textMuted,
                display: "block",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Gender *
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: isMobile ? 8 : 10,
              }}
            >
              {["male", "female", "other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, gender: g }))
                  }
                  style={{
                    padding: isMobile ? "10px 0" : "11px 0",
                    borderRadius: 8,
                    border: `1.5px solid ${formData.gender === g ? t.accent : t.border}`,
                    background:
                      formData.gender === g ? t.accentLighter : t.surfaceAlt,
                    color: formData.gender === g ? t.accent : t.textSub,
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                    letterSpacing: "-0.2px",
                  }}
                  onMouseEnter={(e) => {
                    if (formData.gender !== g) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        t.accent;
                      (e.currentTarget as HTMLButtonElement).style.background =
                        t.accentLighter;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.gender !== g) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        t.border;
                      (e.currentTarget as HTMLButtonElement).style.background =
                        t.surfaceAlt;
                    }
                  }}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
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
              Parent/Guardian Phone (Optional)
            </label>
            <input
              type="tel"
              name="parentPhone"
              value={formData.parentPhone}
              onChange={handleInputChange}
              placeholder="+260978123456 or 0978123456"
              style={inputStyle}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.accent;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surface;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLInputElement).style.background =
                  t.surfaceAlt;
              }}
            />
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
              Used for SMS result notifications · Format: +260XXX or 0XXX
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div
          style={{
            background: t.accentLighter,
            border: `1.5px solid ${t.accent}`,
            borderRadius: 10,
            padding: isMobile ? "11px 12px" : "12px 14px",
            marginBottom: 20,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span style={{ flexShrink: 0, fontSize: 16 }}>💡</span>
          <div
            style={{
              fontSize: isMobile ? 10 : 11,
              color: t.accentText,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            You can assign subjects and enter scores for this student after
            registration.
          </div>
        </div>

        {/* Mode Selection Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 10 : 12,
            marginBottom: 18,
          }}
        >
          <button
            onClick={() => setShowBulkModal(true)}
            style={{
              padding: isMobile ? "11px 14px" : "12px 16px",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isMobile ? 10 : 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.accentLighter;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.accent;
              (e.currentTarget as HTMLButtonElement).style.color = t.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.border;
              (e.currentTarget as HTMLButtonElement).style.color = t.text;
            }}
          >
            📊 Bulk Add
          </button>
          <button
            onClick={() =>
              paramClassId
                ? navigate(`/classes/${paramClassId}`)
                : navigate("/learners")
            }
            style={{
              padding: isMobile ? "11px 14px" : "12px 16px",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isMobile ? 10 : 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.accentLighter;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.accent;
              (e.currentTarget as HTMLButtonElement).style.color = t.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.border;
              (e.currentTarget as HTMLButtonElement).style.color = t.text;
            }}
          >
            ← Close
          </button>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: isMobile ? 8 : 12,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <button
            onClick={() =>
              paramClassId
                ? navigate(`/classes/${paramClassId}`)
                : navigate("/learners")
            }
            disabled={loading || addingLearner}
            style={{
              flex: 1,
              padding: isMobile ? "10px 0" : "11px 0",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              opacity: loading || addingLearner ? 0.6 : 1,
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || addingLearner}
            style={{
              flex: 1,
              padding: isMobile ? "10px 0" : "11px 0",
              borderRadius: 8,
              border: "none",
              background: t.accent,
              color: "#fff",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading || addingLearner ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.3s ease",
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              if (!loading && !addingLearner) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accentDark;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.accent;
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            {loading || addingLearner ? (
              <>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `2px solid rgba(255,255,255,0.4)`,
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Adding…
              </>
            ) : (
              <>
                {Icons.plus}
                Add Student
              </>
            )}
          </button>
        </div>
      </main>

      {/* Duplicate Warning Popup */}
      {showDuplicateWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.3s ease",
            padding: isMobile ? "16px" : "0",
          }}
          onClick={() => setShowDuplicateWarning(false)}
        >
          <div
            style={{
              background: t.surface,
              borderRadius: 12,
              padding: isMobile ? "20px" : "24px",
              maxWidth: isMobile ? "100%" : 420,
              textAlign: "center",
              boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3)`,
              animation: "slideUp 0.3s ease",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDuplicateWarning(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: t.surfaceAlt,
                border: "none",
                color: t.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.redBg;
                (e.currentTarget as HTMLButtonElement).style.color = t.red;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLButtonElement).style.color =
                  t.textMuted;
              }}
            >
              ✕
            </button>

            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: t.redBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: t.red,
                fontSize: 28,
              }}
            >
              ⚠️
            </div>
            <div
              style={{
                fontSize: isMobile ? 15 : 16,
                fontWeight: 800,
                color: t.text,
                marginBottom: 8,
                letterSpacing: "-0.3px",
              }}
            >
              Duplicate Student
            </div>
            <div
              style={{
                fontSize: isMobile ? 12 : 13,
                color: t.textMuted,
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {duplicateMessage}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <button
                onClick={() => setShowDuplicateWarning(false)}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 0" : "11px 0",
                  borderRadius: 8,
                  border: `1.5px solid ${t.border}`,
                  background: t.surfaceAlt,
                  color: t.text,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "-0.2px",
                  textTransform: "uppercase",
                }}
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  resetForm();
                }}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 0" : "11px 0",
                  borderRadius: 8,
                  border: "none",
                  background: t.red,
                  color: "#fff",
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "-0.2px",
                  textTransform: "uppercase",
                }}
              >
                Clear Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.3s ease",
            padding: isMobile ? "16px" : "0",
          }}
        >
          <div
            style={{
              background: t.surface,
              borderRadius: 12,
              padding: isMobile ? "20px" : "24px",
              maxWidth: isMobile ? "100%" : 400,
              textAlign: "center",
              boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3)`,
              animation: "slideUp 0.3s ease",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: t.accentLighter,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: t.accent,
                fontSize: 28,
              }}
            >
              ✓
            </div>
            <div
              style={{
                fontSize: isMobile ? 15 : 16,
                fontWeight: 800,
                color: t.text,
                marginBottom: 8,
                letterSpacing: "-0.3px",
              }}
            >
              Student Added Successfully!
            </div>
            <div
              style={{
                fontSize: isMobile ? 12 : 13,
                color: t.textMuted,
                marginBottom: 18,
                lineHeight: 1.6,
              }}
            >
              {successMessage}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 0" : "11px 0",
                  borderRadius: 8,
                  border: `1.5px solid ${t.border}`,
                  background: t.surfaceAlt,
                  color: t.text,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "-0.2px",
                  textTransform: "uppercase",
                }}
              >
                Add Another
              </button>
              <button
                onClick={() =>
                  paramClassId
                    ? navigate(`/classes/${paramClassId}`)
                    : navigate("/learners")
                }
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 0" : "11px 0",
                  borderRadius: 8,
                  border: "none",
                  background: t.accent,
                  color: "#fff",
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "-0.2px",
                  textTransform: "uppercase",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      <BulkAddModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        classId={formData.classId}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}
