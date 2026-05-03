import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLearners, useClasses } from "../hooks/useClassManager";
import { db, LearnerEntity, ClassEntity } from "../db";
import { useClassListPDF } from "../lib/classListPDF";

const LIGHT = {
  bg: "#F3F4F6",
  surface: "#FFFFFF",
  surfaceAlt: "#F9FAFB",
  border: "#E5E7EB",
  borderLight: "#F1F3F5",
  text: "#111827",
  textSub: "#374151",
  textMuted: "#6B7280",
  accent: "#10B981",
  accentLight: "#D1FAE5",
  accentLighter: "#ECFDF5",
  accentBg: "#E0F2FE",
  accentText: "#0F766E",
  accentDark: "#059669",
  maleBg: "#DBEAFE",
  maleText: "#0284C7",
  femaleBg: "#FFEDD5",
  femaleText: "#EA580C",
  red: "#EF3340",
  redBg: "#FEE2E2",
  redText: "#7F1D1D",
  orange: "#FF8200",
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
  borderLight: "#3F3F46",
  text: "#F1F5F9",
  textSub: "#CBD5E1",
  textMuted: "#94A3B8",
  accent: "#10B981",
  accentLight: "#064E3B",
  accentLighter: "#052E16",
  accentBg: "#0C4A6E",
  accentText: "#86EFAC",
  accentDark: "#34D399",
  maleBg: "#1E3A8A",
  maleText: "#93C5FD",
  femaleBg: "#7C2D12",
  femaleText: "#FDBA74",
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
  search: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
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
  trash: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Load jsPDF dynamically with proper ES6 import
 */

export default function LearnerListScreen() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { learners = [], loading, error, deleteLearner } = useLearners() || {};
  const { classes = [] } = useClasses() || {};

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t = dark ? DARK : LIGHT;

  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Refresh learners data every 2 seconds to stay in sync with other screens
  useEffect(() => {
    const interval = setInterval(() => {
      // Component will re-render when learners change from useLearners hook
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "class">("name");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    if (classId) {
      setFilterClass(classId);
    }
  }, [classId]);

  const filteredLearners = (learners || [])
    .filter((l: LearnerEntity) => {
      const matchesSearch = l.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesClass =
        filterClass === "all" || l.classId.toString() === filterClass;
      const matchesGender =
        filterGender === "all" || l.gender?.toLowerCase() === filterGender;
      return matchesSearch && matchesClass && matchesGender;
    })
    .sort((a: LearnerEntity, b: LearnerEntity) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : a.classId - b.classId,
    );

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    try {
      await deleteLearner(id);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete learner:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (filterClass === "all") {
      alert("Please select a specific class to export.");
      return;
    }

    setPdfGenerating(true);
    try {
      const selectedClass = (classes || []).find(
        (c: ClassEntity) => c.id === parseInt(filterClass),
      );
      const classStudents = (learners || []).filter(
        (l: LearnerEntity) => l.classId === parseInt(filterClass),
      );

      if (classStudents.length === 0) {
        alert("No students found in this class.");
        setPdfGenerating(false);
        return;
      }

      let cachedSettings = null;
      try {
        const cached = localStorage.getItem("rankitz-school-settings");
        if (cached) {
          cachedSettings = JSON.parse(cached);
        }
      } catch (e) {
        console.warn("Failed to parse cached settings", e);
      }

      const schoolSettings = await db.getSchoolSettings(
        "Term 1",
        new Date().getFullYear(),
      );
      const schoolData = await db.getSchool(1);

      const schoolName =
        (schoolSettings as any)?.schoolName ||
        cachedSettings?.schoolName ||
        schoolData?.schoolName ||
        "Chipata Primary School";

      const headteacherName =
        (schoolSettings as any)?.headteacherName ||
        cachedSettings?.headteacherName ||
        "";
      const deputyHeadteacherName =
        (schoolSettings as any)?.deputyHeadteacherName ||
        cachedSettings?.deputyHeadteacherName ||
        "";

      // Generate PDF
      await generatePDF(
        classStudents,
        selectedClass?.className || "All Students",
        schoolName,
        new Date().getFullYear().toString(),
        headteacherName,
        deputyHeadteacherName,
        t,
      );
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(
        `Failed to generate PDF: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  const getClassName = (classId: number) =>
    (classes || []).find((c: ClassEntity) => c.id === classId)?.className ||
    `Class ${classId}`;

  const maleCount = (learners || []).filter(
    (l: LearnerEntity) => l.gender?.toLowerCase() === "male",
  ).length;
  const femaleCount = (learners || []).filter(
    (l: LearnerEntity) => l.gender?.toLowerCase() === "female",
  ).length;
  const contactCount = (learners || []).filter(
    (l: LearnerEntity) => l.parentPhone,
  ).length;

  const selectStyle: React.CSSProperties = {
    padding: isMobileView ? "8px 10px" : "8px 12px",
    borderRadius: 8,
    fontSize: isMobileView ? 12 : 13,
    fontWeight: 500,
    background: t.surface,
    border: `1px solid ${t.border}`,
    color: t.text,
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
  };

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
      {/* Professional Header */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobileView ? "12px 16px" : "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          flexShrink: 0,
          gap: isMobileView ? 8 : 16,
          boxShadow: `0 1px 3px ${t.shadow}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobileView ? 8 : 16,
            minWidth: 0,
            flex: 1,
          }}
        >
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.textMuted,
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              transition: "all 0.2s ease",
              minWidth: 36,
              minHeight: 36,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.color = t.text;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.textMuted;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.border;
            }}
            title="Back to Home"
          >
            <div style={{ width: 18, height: 18 }}>{Icons.back}</div>
          </button>

          {!isMobileView && (
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: t.text,
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                Learners Directory
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  marginTop: 2,
                  fontWeight: 400,
                  margin: "2px 0 0 0",
                }}
              >
                Manage student profiles and academic records
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={
              pdfGenerating || filterClass === "all" || learners.length === 0
            }
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: isMobileView ? "8px 10px" : "8px 14px",
              color: t.textSub,
              fontSize: isMobileView ? 12 : 13,
              fontWeight: 500,
              cursor:
                pdfGenerating || filterClass === "all" || learners.length === 0
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobileView ? 4 : 8,
              transition: "all 0.2s ease",
              opacity:
                pdfGenerating || filterClass === "all" || learners.length === 0
                  ? 0.6
                  : 1,
              minHeight: isMobileView ? 36 : "auto",
            }}
            onMouseEnter={(e) => {
              if (
                !pdfGenerating &&
                filterClass !== "all" &&
                learners.length > 0
              ) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  t.textMuted;
              }
            }}
            onMouseLeave={(e) => {
              if (
                !pdfGenerating &&
                filterClass !== "all" &&
                learners.length > 0
              ) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.surface;
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  t.border;
              }
            }}
            title={
              filterClass === "all"
                ? "Select a class to export"
                : "Export class list as PDF"
            }
          >
            <div style={{ width: 16, height: 16, flexShrink: 0 }}>
              {Icons.download}
            </div>
            {!isMobileView && (pdfGenerating ? "Generating..." : "Export List")}
          </button>

          {/* Add Student Button */}
          <button
            onClick={() => navigate("/learners/add")}
            style={{
              background: t.accent,
              border: "none",
              borderRadius: 8,
              padding: isMobileView ? "8px 10px" : "8px 16px",
              color: "#fff",
              fontSize: isMobileView ? 12 : 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobileView ? 4 : 8,
              transition: "all 0.2s ease",
              minHeight: isMobileView ? 36 : "auto",
              boxShadow: `0 1px 3px rgba(16, 185, 129, 0.2)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.accentDark;
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                `0 2px 8px rgba(16, 185, 129, 0.3)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.accent;
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                `0 1px 3px rgba(16, 185, 129, 0.2)`;
            }}
          >
            <div style={{ width: 16, height: 16, flexShrink: 0 }}>
              {Icons.plus}
            </div>
            {!isMobileView && "Add Learner"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobileView ? "16px" : "24px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Statistics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobileView
                ? "repeat(2, 1fr)"
                : "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Total Students",
                value: learners.length,
                icon: "👥",
                color: t.accent,
              },
              {
                label: "Male",
                value: maleCount,
                icon: "👦",
                color: "#0284C7",
              },
              {
                label: "Female",
                value: femaleCount,
                icon: "👧",
                color: "#EA580C",
              },
              {
                label: "Contact Info",
                value: contactCount,
                icon: "📞",
                color: "#8B5CF6",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: t.surface,
                  border: `2px solid`,
                  borderColor:
                    stat.label === "Total Students"
                      ? `rgba(16, 185, 129, 0.2)`
                      : stat.label === "Male"
                        ? `rgba(2, 132, 199, 0.2)`
                        : stat.label === "Female"
                          ? `rgba(245, 158, 11, 0.2)`
                          : `rgba(139, 92, 246, 0.2)`,
                  borderRadius: 8,
                  padding: isMobileView ? "12px 16px" : "16px 20px",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    stat.color;
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    `0 4px 12px ${t.shadowMd}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    stat.label === "Total Students"
                      ? `rgba(16, 185, 129, 0.2)`
                      : stat.label === "Male"
                        ? `rgba(2, 132, 199, 0.2)`
                        : stat.label === "Female"
                          ? `rgba(245, 158, 11, 0.2)`
                          : `rgba(139, 92, 246, 0.2)`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: isMobileView ? 20 : 24,
                    fontWeight: 800,
                    color: stat.color,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginTop: 8,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Search */}
          <div
            style={{
              display: "flex",
              gap: isMobileView ? 8 : 12,
              marginBottom: 20,
              flexDirection: isMobileView ? "column" : "row",
              alignItems: isMobileView ? "stretch" : "center",
            }}
          >
            {/* Search */}
            <div
              style={{
                position: "relative",
                flex: isMobileView ? 1 : "0 1 300px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: t.textMuted,
                  display: "flex",
                  width: 16,
                  height: 16,
                  pointerEvents: "none",
                }}
              >
                {Icons.search}
              </div>
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: t.text,
                  outline: "none",
                  transition: "all 0.2s ease",
                  minHeight: 36,
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    t.accent;
                  (e.currentTarget as HTMLInputElement).style.boxShadow =
                    `0 0 0 3px rgba(16, 185, 129, 0.1)`;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    t.border;
                  (e.currentTarget as HTMLInputElement).style.boxShadow =
                    "none";
                }}
              />
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flex: isMobileView ? 1 : "auto",
              }}
            >
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                style={{
                  ...selectStyle,
                  flex: isMobileView ? 1 : "auto",
                }}
              >
                <option value="all">All Classes</option>
                {(classes || []).map((cls: ClassEntity) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </select>

              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                style={{
                  ...selectStyle,
                  flex: isMobileView ? 1 : "auto",
                }}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              {!isMobileView && (
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "class")
                  }
                  style={selectStyle}
                >
                  <option value="name">Sort by Name</option>
                  <option value="class">Sort by Class</option>
                </select>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div
              style={{
                background: t.redBg,
                border: `1px solid ${t.red}`,
                borderRadius: 8,
                padding: isMobileView ? "10px 12px" : "12px 16px",
                marginBottom: 20,
                fontSize: isMobileView ? 12 : 13,
                color: t.redText,
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Data Table */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              overflowX: "auto",
              overflowY: "visible",
              boxShadow: `0 1px 3px ${t.shadow}`,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: isMobileView ? 12 : 13,
                minWidth: isMobileView ? 600 : "auto",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: t.surfaceAlt,
                    borderBottom: `2px solid ${t.border}`,
                  }}
                >
                  <th
                    style={{
                      padding: isMobileView ? "10px 12px" : "12px 16px",
                      color: t.textMuted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: isMobileView ? 10 : 11,
                      letterSpacing: "0.5px",
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: isMobileView ? "10px 12px" : "12px 16px",
                      color: t.textMuted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: isMobileView ? 10 : 11,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Student Name
                  </th>
                  <th
                    style={{
                      padding: isMobileView ? "10px 12px" : "12px 16px",
                      color: t.textMuted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: isMobileView ? 10 : 11,
                      letterSpacing: "0.5px",
                      display: isMobileView ? "none" : "table-cell",
                    }}
                  >
                    Gender
                  </th>
                  <th
                    style={{
                      padding: isMobileView ? "10px 12px" : "12px 16px",
                      color: t.textMuted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: isMobileView ? 10 : 11,
                      letterSpacing: "0.5px",
                      display: isMobileView ? "none" : "table-cell",
                    }}
                  >
                    Parent Phone
                  </th>
                  <th
                    style={{
                      padding: isMobileView ? "10px 12px" : "12px 16px",
                      color: t.textMuted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: isMobileView ? 10 : 11,
                      letterSpacing: "0.5px",
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Loading */}
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: isMobileView ? "40px 0" : "60px 0",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: `2px solid ${t.accent}`,
                          borderTopColor: "transparent",
                          animation: "spin 0.8s linear infinite",
                          margin: "0 auto 12px auto",
                        }}
                      />
                      <div
                        style={{
                          color: t.textMuted,
                          fontWeight: 500,
                          fontSize: 13,
                        }}
                      >
                        Loading students...
                      </div>
                    </td>
                  </tr>
                )}

                {/* Empty State */}
                {!loading && filteredLearners.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: isMobileView ? "40px 0" : "60px 0",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 48,
                          marginBottom: 12,
                        }}
                      >
                        📚
                      </div>
                      <div
                        style={{
                          color: t.textMuted,
                          marginBottom: 12,
                          fontSize: isMobileView ? 12 : 13,
                          fontWeight: 500,
                        }}
                      >
                        {searchQuery
                          ? "No students found matching your search."
                          : "No students have been registered yet."}
                      </div>
                      {!searchQuery && (
                        <button
                          onClick={() => navigate("/learners/add")}
                          style={{
                            color: t.accent,
                            background: "transparent",
                            border: "none",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontSize: isMobileView ? 12 : 13,
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.opacity = "0.7";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.opacity = "1";
                          }}
                        >
                          Add the first learner →
                        </button>
                      )}
                    </td>
                  </tr>
                )}

                {/* Data Rows */}
                {!loading &&
                  filteredLearners.map(
                    (learner: LearnerEntity, idx: number) => {
                      const initials = learner.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const isMale = learner.gender?.toLowerCase() === "male";

                      return (
                        <tr
                          key={learner.id}
                          style={{
                            borderBottom: `1px solid ${t.border}`,
                            background:
                              idx % 2 === 0 ? t.surface : t.surfaceAlt,
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.backgroundColor = t.borderLight;
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.backgroundColor =
                              idx % 2 === 0 ? t.surface : t.surfaceAlt;
                          }}
                        >
                          {/* Index */}
                          <td
                            style={{
                              padding: isMobileView ? "10px 12px" : "12px 16px",
                              color: t.textMuted,
                              fontWeight: 600,
                              width: 50,
                            }}
                          >
                            {idx + 1}
                          </td>

                          {/* Name */}
                          <td
                            style={{
                              padding: isMobileView ? "10px 12px" : "12px 16px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: isMale ? t.maleBg : t.femaleBg,
                                  color: isMale ? t.maleText : t.femaleText,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: t.text,
                                    fontSize: isMobileView ? 12 : 13,
                                  }}
                                >
                                  {learner.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: t.textMuted,
                                    marginTop: 2,
                                  }}
                                >
                                  {getClassName(learner.classId)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Gender */}
                          <td
                            style={{
                              padding: isMobileView ? "10px 12px" : "12px 16px",
                              display: isMobileView ? "none" : "table-cell",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: 12,
                                background: isMale ? t.maleBg : t.femaleBg,
                                color: isMale ? t.maleText : t.femaleText,
                                textTransform: "capitalize",
                              }}
                            >
                              {learner.gender || "Unknown"}
                            </span>
                          </td>

                          {/* Phone */}
                          <td
                            style={{
                              padding: isMobileView ? "10px 12px" : "12px 16px",
                              display: isMobileView ? "none" : "table-cell",
                              color: t.textSub,
                              fontWeight: 500,
                              fontFamily: "'Courier New', monospace",
                            }}
                          >
                            {learner.parentPhone ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: t.accent,
                                  }}
                                >
                                  {Icons.phone}
                                </div>
                                {learner.parentPhone}
                              </div>
                            ) : (
                              <span
                                style={{
                                  color: t.textMuted,
                                  fontStyle: "italic",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            style={{
                              padding: isMobileView ? "10px 12px" : "12px 16px",
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: isMobileView ? 6 : 8,
                              }}
                            >
                              <button
                                onClick={() =>
                                  navigate(`/learners/${learner.id}/scores`)
                                }
                                title="View Scores"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: t.accent,
                                  cursor: "pointer",
                                  padding: 6,
                                  borderRadius: 6,
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  minWidth: 32,
                                  minHeight: 32,
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background =
                                    `rgba(16, 185, 129, 0.1)`;
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "transparent";
                                }}
                              >
                                <div style={{ width: 16, height: 16 }}>
                                  {Icons.chart}
                                </div>
                              </button>

                              <button
                                onClick={() =>
                                  navigate(`/learners/${learner.id}/edit`)
                                }
                                title="Edit Learner"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: t.textMuted,
                                  cursor: "pointer",
                                  padding: 6,
                                  borderRadius: 6,
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  minWidth: 32,
                                  minHeight: 32,
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = t.borderLight;
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.color = t.text;
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "transparent";
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.color = t.textMuted;
                                }}
                              >
                                <div style={{ width: 16, height: 16 }}>
                                  {Icons.edit}
                                </div>
                              </button>

                              <button
                                onClick={() =>
                                  setShowDeleteConfirm(learner.id!)
                                }
                                title="Delete Learner"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: t.textMuted,
                                  cursor: "pointer",
                                  padding: 6,
                                  borderRadius: 6,
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  minWidth: 32,
                                  minHeight: 32,
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = t.redBg;
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.color = t.red;
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "transparent";
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.color = t.textMuted;
                                }}
                              >
                                <div style={{ width: 16, height: 16 }}>
                                  {Icons.trash}
                                </div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: isMobileView ? "16px" : 0,
          }}
        >
          <div
            style={{
              background: t.surface,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              padding: isMobileView ? "20px" : "24px",
              maxWidth: 400,
              width: "100%",
              boxShadow: `0 10px 25px rgba(0, 0, 0, 0.1)`,
            }}
          >
            <div
              style={{
                fontSize: isMobileView ? 14 : 16,
                fontWeight: 700,
                color: t.text,
                marginBottom: 8,
              }}
            >
              Confirm Deletion
            </div>
            <div
              style={{
                fontSize: isMobileView ? 12 : 13,
                color: t.textSub,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete this student? All their academic
              records, scores, and profile data will be permanently removed from
              the system.
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteLoading}
                style={{
                  padding: isMobileView ? "10px 14px" : "8px 16px",
                  borderRadius: 6,
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  color: t.text,
                  fontSize: isMobileView ? 12 : 13,
                  fontWeight: 500,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.6 : 1,
                  flex: isMobileView ? 1 : "auto",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!deleteLoading) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.surfaceAlt;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteLoading) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.surface;
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteLoading}
                style={{
                  padding: isMobileView ? "10px 14px" : "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: t.red,
                  color: "#fff",
                  fontSize: isMobileView ? 12 : 13,
                  fontWeight: 600,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.7 : 1,
                  flex: isMobileView ? 1 : "auto",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!deleteLoading) {
                    (e.currentTarget as HTMLButtonElement).style.opacity =
                      "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteLoading) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        ::-webkit-scrollbar { 
          width: 8px; 
          height: 8px; 
        }
        ::-webkit-scrollbar-track { 
          background: transparent; 
        }
        ::-webkit-scrollbar-thumb { 
          background: ${t.border}; 
          border-radius: 4px; 
        }
        ::-webkit-scrollbar-thumb:hover { 
          background: ${t.textMuted}; 
        }
        
        @media (max-width: 768px) {
          button { -webkit-appearance: none; }
          input { -webkit-appearance: none; border-radius: 8px; }
          select { -webkit-appearance: none; }
        }
      `}</style>
    </div>
  );
}

/**
 * Generate class list PDF using jsPDF + autoTable
 */
async function generatePDF(
  students: LearnerEntity[],
  className: string,
  schoolName: string,
  academicYear: string,
  headteacherName: string = "",
  deputyHeadteacherName: string = "",
  theme: Theme,
): Promise<void> {
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    const generatedDate = new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // ── HEADER ──
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin, 12, contentWidth, 24, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(schoolName.toUpperCase(), pageWidth / 2, 20, { align: "center" });
    pdf.setFontSize(9);
    pdf.text("CLASS LIST REPORT", pageWidth / 2, 26, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(
      `${className} • Academic Year: ${academicYear} • Generated: ${generatedDate}`,
      pageWidth / 2,
      32,
      { align: "center" },
    );

    // Zambia flag strip
    const stripY = 38;
    const pW = contentWidth / 7;
    pdf.setFillColor(25, 138, 0);
    pdf.rect(margin, stripY, pW * 4, 1.2, "F");
    pdf.setFillColor(222, 32, 16);
    pdf.rect(margin + pW * 4, stripY, pW, 1.2, "F");
    pdf.setFillColor(0, 0, 0);
    pdf.rect(margin + pW * 5, stripY, pW, 1.2, "F");
    pdf.setFillColor(239, 125, 0);
    pdf.rect(margin + pW * 6, stripY, pW, 1.2, "F");

    let y = 46;

    // ── STATS BOXES ──
    const maleCount = students.filter(
      (s) => s.gender?.toLowerCase() === "male",
    ).length;
    const femaleCount = students.filter(
      (s) => s.gender?.toLowerCase() === "female",
    ).length;
    const contactCount = students.filter((s) => s.parentPhone).length;

    const boxW = (contentWidth - 9) / 4;
    const statsArr = [
      {
        l: "TOTAL STUDENTS",
        v: students.length.toString(),
        color: [16, 185, 129] as [number, number, number],
      },
      {
        l: "MALE",
        v: maleCount.toString(),
        color: [2, 132, 199] as [number, number, number],
      },
      {
        l: "FEMALE",
        v: femaleCount.toString(),
        color: [245, 158, 11] as [number, number, number],
      },
      {
        l: "CONTACT INFO",
        v: contactCount.toString(),
        color: [139, 92, 246] as [number, number, number],
      },
    ];
    statsArr.forEach((s, i) => {
      const bx = margin + i * (boxW + 3);
      pdf.setFillColor(249, 250, 251);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(bx, y, boxW, 14, 1.5, 1.5, "FD");
      pdf.setFontSize(6);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont("helvetica", "bold");
      pdf.text(s.l, bx + boxW / 2, y + 5, { align: "center" });
      pdf.setFontSize(11);
      pdf.setTextColor(...s.color);
      pdf.text(s.v, bx + boxW / 2, y + 11, { align: "center" });
    });
    y += 20;

    // ── STUDENT TABLE ──
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.text("STUDENT LIST", margin, y);
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
    y += 4;

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin, bottom: 25 },
      head: [["#", "Student Name", "Gender", "Parent Phone"]],
      body: students.map((student, idx) => [
        (idx + 1).toString(),
        student.name,
        student.gender
          ? student.gender.charAt(0).toUpperCase() +
            student.gender.slice(1).toLowerCase()
          : "—",
        student.parentPhone || "—",
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: { fontSize: 8, textColor: [17, 24, 39] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", fontStyle: "bold" },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "left", cellWidth: 45 },
      },
    });

    // ── SIGNATURES ──
    const finalY = (pdf as any).lastAutoTable.finalY + 12;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    pdf.text("Headteacher", margin, finalY);
    pdf.text("Deputy Headteacher", margin + 90, finalY);
    pdf.setDrawColor(17, 24, 39);
    pdf.line(margin, finalY + 12, margin + 55, finalY + 12);
    pdf.line(margin + 90, finalY + 12, margin + 145, finalY + 12);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.text(
      headteacherName || "________________________________",
      margin,
      finalY + 16,
    );
    pdf.text(
      deputyHeadteacherName || "________________________________",
      margin + 90,
      finalY + 16,
    );

    // ── FOOTER on every page ──
    const totalPages = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.setDrawColor(229, 231, 235);
      (pdf as any).setLineDash([1, 1], 0);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      (pdf as any).setLineDash([], 0);
      pdf.text(
        "RankItZM School Management System • Class List",
        margin,
        pageHeight - 8,
      );
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" } as any,
      );
    }

    const filename = `class-list-${className.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `PDF Generation Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
