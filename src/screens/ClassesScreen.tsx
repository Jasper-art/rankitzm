import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClasses, useLearners } from "../hooks/useClassManager";
import { addActivity } from "../lib/activityLogger";
import { useAuth } from "../context/AuthContext";
import { db } from "../db";

// --- THEMES ---
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
  topbar: "#FFFFFF",
  shadow: "rgba(17,24,39,0.04)",
  shadowMd: "rgba(17,24,39,0.08)",
  shadowLg: "rgba(17,24,39,0.12)",
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
  topbar: "#1E293B",
  shadow: "rgba(0,0,0,0.2)",
  shadowMd: "rgba(0,0,0,0.3)",
  shadowLg: "rgba(0,0,0,0.4)",
};

type Theme = typeof LIGHT;

// --- useResponsive ---
function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// --- ICONS ---
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  bookOpen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  layout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
};

const CLASS_GRADIENTS = [
  ["#10B981", "#059669"],
  ["#3B82F6", "#1D4ED8"],
  ["#8B5CF6", "#6D28D9"],
  ["#F59E0B", "#D97706"],
  ["#06B6D4", "#0891B2"],
  ["#EC4899", "#BE185D"],
];

// --- CLASS CARD ---
function ClassCard({
  cls,
  learnerCount,
  subjectCount,
  t,
  isMobile,
  onEdit,
  onDelete,
  onViewStudents,
  onViewSubjects,
}: {
  cls: any;
  learnerCount: number;
  subjectCount: number;
  t: Theme;
  isMobile: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewStudents: () => void;
  onViewSubjects: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const idx = (cls.id ?? 0) % CLASS_GRADIENTS.length;
  const [g1, g2] = CLASS_GRADIENTS[idx];
  const initial = cls.className?.charAt(0).toUpperCase() ?? "?";

  return (
    <div
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      onClick={onEdit}
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? t.accent : t.border}`,
        borderRadius: 16,
        overflow: "hidden",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered
          ? `0 12px 24px ${t.shadowMd}`
          : `0 2px 6px ${t.shadow}`,
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
    >
      {/* Gradient banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${g1}, ${g2})`,
          padding: isMobile ? "16px" : "20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: isMobile ? 40 : 44,
              height: isMobile ? 40 : 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? 18 : 20,
              fontWeight: 800,
            }}
          >
            {initial}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: isMobile ? 16 : 18,
                fontWeight: 800,
                letterSpacing: "-0.3px",
              }}
            >
              {cls.className}
            </h3>
            <div
              style={{
                fontSize: 12,
                opacity: 0.9,
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              {cls.educationLevel?.charAt(0).toUpperCase() +
                cls.educationLevel?.slice(1)}{" "}
              • {cls.academicYear}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.8)",
            touchAction: "manipulation",
          }}
        >
          <div style={{ width: 18, height: 18 }}>{Icons.trash}</div>
        </button>
      </div>

      {/* Card body */}
      <div
        style={{
          padding: isMobile ? "14px" : "20px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {/* Students stat */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewStudents();
            }}
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.borderSub}`,
              borderRadius: 10,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 56,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                background: t.accentLighter,
                color: t.accentDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 16, height: 16 }}>{Icons.users}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: t.text,
                  lineHeight: 1,
                }}
              >
                {learnerCount}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: t.textMuted,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                STUDENTS
              </div>
            </div>
          </div>

          {/* Subjects stat */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewSubjects();
            }}
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.borderSub}`,
              borderRadius: 10,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 56,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                background: t.surface,
                border: `1px solid ${t.border}`,
                color: t.textSub,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 16, height: 16 }}>{Icons.bookOpen}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: t.text,
                  lineHeight: 1,
                }}
              >
                {subjectCount}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: t.textMuted,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                SUBJECTS
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            borderTop: `1px solid ${t.borderSub}`,
          }}
        >
          <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>
            Cap: <strong>{cls.maximumPupils ?? "∞"}</strong>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: t.accent,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Manage{" "}
            <div style={{ width: 16, height: 16 }}>{Icons.arrowRight}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN SCREEN ---
export default function ClassesScreen() {
  const navigate = useNavigate();
  const { classes, loading, error, deleteClass } = useClasses();
  const { learners } = useLearners();
  const { schoolId, userId, schoolName } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const t = dark ? DARK : LIGHT;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingClassName, setDeletingClassName] = useState("");
  const [subjectCounts, setSubjectCounts] = useState<{ [key: number]: number }>(
    {},
  );

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.className
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLevel =
      filterLevel === "all" || cls.educationLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  useEffect(() => {
    const loadSubjectCounts = async () => {
      const counts: { [key: number]: number } = {};
      for (const cls of classes) {
        try {
          const subjects = await db.getSubjectsByClass(cls.id!);
          counts[cls.id!] = subjects?.length || 0;
        } catch {
          counts[cls.id!] = 0;
        }
      }
      setSubjectCounts(counts);
    };
    if (classes.length > 0) loadSubjectCounts();
  }, [classes]);

  const getLearnerCount = (classId: number) =>
    learners.filter((l) => l.classId === classId).length;
  const getSubjectCount = (classId: number) => subjectCounts[classId] || 0;

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    try {
      await deleteClass(id);
      setShowDeleteConfirm(null);
      await addActivity({
        type: "class_added",
        title: "Class deleted",
        subtitle: deletingClassName,
        timestamp: Date.now(),
        schoolId: schoolId || "default",
        userId: userId || undefined,
      });
    } catch (err) {
      console.error("Failed to delete class:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const levels = ["all", "primary", "secondary"];

  // Responsive values
  const headerPad = isMobile ? "12px 14px" : "16px 24px";
  const mainPad = isMobile ? "16px 12px" : isTablet ? "24px 20px" : "32px 40px";
  const gridCols = isMobile
    ? "1fr"
    : isTablet
      ? "repeat(2, 1fr)"
      : "repeat(auto-fill, minmax(300px, 1fr))";
  const statCols = isMobile
    ? "repeat(2, 1fr)"
    : "repeat(auto-fit, minmax(180px, 1fr))";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: t.bg,
        fontFamily:
          "'Inter', '-apple-system', 'BlinkMacSystemFont', sans-serif",
        color: t.text,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: headerPad,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 16,
          }}
        >
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.textMuted,
              cursor: "pointer",
              minWidth: 48,
              minHeight: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              touchAction: "manipulation",
            }}
          >
            <div style={{ width: 18, height: 18 }}>{Icons.back}</div>
          </button>
          <div>
            <div
              style={{
                fontSize: isMobile ? 16 : 20,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              Class Management
            </div>
            {!isMobile && (
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
                {schoolName || "Academic Dashboard"}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate("/classes/add")}
          style={{
            background: t.accent,
            border: "none",
            borderRadius: 8,
            padding: isMobile ? "10px 14px" : "10px 20px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 4 : 8,
            minHeight: 48,
            touchAction: "manipulation",
          }}
        >
          <div style={{ width: 18, height: 18 }}>{Icons.plus}</div>
          {!isMobile && "Add New Class"}
        </button>
      </header>

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          padding: mainPad,
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* STAT CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: statCols,
            gap: isMobile ? 10 : 16,
            marginBottom: isMobile ? 20 : 32,
          }}
        >
          {[
            {
              icon: Icons.layout,
              bg: t.accentLighter,
              color: t.accentDark,
              value: classes.length,
              label: "Total Classes",
            },
            {
              icon: Icons.users,
              bg: t.accentLighter,
              color: t.accentDark,
              value: learners.length,
              label: "Total Students",
            },
            {
              icon: Icons.bookOpen,
              bg: t.orangeBg,
              color: t.orange,
              value: classes.filter((c) => c.educationLevel === "primary")
                .length,
              label: "Primary Classes",
            },
            {
              icon: Icons.bookOpen,
              bg: "rgba(139,92,246,0.1)",
              color: "#7C3AED",
              value: classes.filter((c) => c.educationLevel === "secondary")
                .length,
              label: "Secondary Classes",
            },
          ].map((stat, i) =>
            // Hide last 2 stat cards on mobile to save space
            !isMobile || i < 2 ? (
              <div
                key={i}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: isMobile ? "14px" : "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 16,
                  boxShadow: `0 2px 6px ${t.shadow}`,
                }}
              >
                <div
                  style={{
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                    borderRadius: 12,
                    background: stat.bg,
                    color: stat.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 20 : 24,
                      height: isMobile ? 20 : 24,
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 20 : 24,
                      fontWeight: 800,
                      color: t.text,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? 10 : 12,
                      color: t.textMuted,
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ) : null,
          )}
        </div>

        {/* FILTERS + SEARCH TOOLBAR */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            marginBottom: isMobile ? 16 : 24,
            gap: isMobile ? 10 : 16,
          }}
        >
          {/* Level filter */}
          <div
            style={{
              display: "flex",
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: 4,
            }}
          >
            {levels.map((lv) => (
              <button
                key={lv}
                onClick={() => setFilterLevel(lv)}
                style={{
                  flex: isMobile ? 1 : undefined,
                  padding: isMobile ? "10px 8px" : "8px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: filterLevel === lv ? t.surface : "transparent",
                  color: filterLevel === lv ? t.text : t.textMuted,
                  boxShadow:
                    filterLevel === lv ? `0 1px 3px ${t.shadow}` : "none",
                  transition: "all 0.2s",
                  minHeight: 40,
                  touchAction: "manipulation",
                }}
              >
                {lv === "all"
                  ? "All"
                  : lv.charAt(0).toUpperCase() + lv.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: isMobile ? "100%" : 320 }}>
            <div
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: t.textMuted,
                width: 16,
                height: 16,
              }}
            >
              {Icons.search}
            </div>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 36px",
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: t.surface,
                color: t.text,
                fontSize: 14,
                outline: "none",
                minHeight: 48,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `3px solid ${t.border}`,
                borderTopColor: t.accent,
                animation: "spin 0.8s linear infinite",
                marginBottom: 16,
              }}
            />
            <div style={{ fontSize: 14, color: t.textMuted, fontWeight: 600 }}>
              Loading classes...
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: t.redBg,
              border: `1px solid ${t.red}40`,
              borderLeft: `4px solid ${t.red}`,
              borderRadius: 8,
              padding: "16px",
              marginBottom: 24,
              color: t.redText,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 20, height: 20 }}>{Icons.trash}</div>
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredClasses.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "60px 20px",
              textAlign: "center",
              background: t.surface,
              borderRadius: 16,
              border: `1px dashed ${t.border}`,
              marginTop: 16,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: t.accentLighter,
                color: t.accentDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ width: 36, height: 36 }}>{Icons.layout}</div>
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: t.text,
                marginBottom: 8,
              }}
            >
              No Classes Found
            </h3>
            <p
              style={{
                fontSize: 14,
                color: t.textMuted,
                marginBottom: 24,
                maxWidth: 280,
                lineHeight: 1.5,
              }}
            >
              {searchQuery
                ? "Try adjusting your search or filters."
                : "Get started by creating your first class."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/classes/add")}
                style={{
                  background: t.accent,
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 28px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 52,
                  touchAction: "manipulation",
                }}
              >
                <div style={{ width: 18, height: 18 }}>{Icons.plus}</div>
                Create Class
              </button>
            )}
          </div>
        )}

        {/* CLASS GRID */}
        {!loading && filteredClasses.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              gap: isMobile ? 12 : 20,
            }}
          >
            {filteredClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                learnerCount={getLearnerCount(cls.id!)}
                subjectCount={getSubjectCount(cls.id!)}
                t={t}
                isMobile={isMobile}
                onEdit={() => navigate(`/classes/${cls.id}/details`)}
                onDelete={() => {
                  setDeletingClassName(cls.className);
                  setShowDeleteConfirm(cls.id!);
                }}
                onViewStudents={() => navigate(`/classes/${cls.id}/learners`)}
                onViewSubjects={() => navigate(`/classes/${cls.id}/details`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* DELETE CONFIRM — bottom sheet on mobile, centered modal on desktop */}
      {showDeleteConfirm !== null && (
        <div
          onClick={() => !deleteLoading && setShowDeleteConfirm(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            zIndex: 50,
            padding: isMobile ? 0 : 20,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface,
              borderRadius: isMobile ? "20px 20px 0 0" : 16,
              padding: isMobile ? "24px 20px 32px" : "32px",
              width: "100%",
              maxWidth: isMobile ? "100%" : 420,
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
              animation: isMobile
                ? "slideUp 0.3s ease"
                : "modalIn 0.3s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* drag handle */}
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 20,
                  marginTop: -8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: t.border,
                  }}
                />
              </div>
            )}

            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: t.redBg,
                color: t.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ width: 24, height: 24 }}>{Icons.trash}</div>
            </div>

            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: t.text,
                marginBottom: 12,
              }}
            >
              Delete Class?
            </h3>
            <p
              style={{
                fontSize: 14,
                color: t.textSub,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete{" "}
              <strong style={{ color: t.text }}>{deletingClassName}</strong>?{" "}
              This action cannot be undone and will permanently remove all
              associated students and scores.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  background: t.surfaceAlt,
                  color: t.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: 52,
                  touchAction: "manipulation",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 8,
                  border: "none",
                  background: t.red,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 52,
                  opacity: deleteLoading ? 0.7 : 1,
                  touchAction: "manipulation",
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}
