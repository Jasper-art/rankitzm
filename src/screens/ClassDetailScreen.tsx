import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, ClassEntity, LearnerEntity, SubjectEntity } from "../db";

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
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  students: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
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

// --- BOTTOM SHEET / MODAL WRAPPER ---
function ModalSheet({
  children,
  onClose,
  isMobile,
  t,
}: {
  children: React.ReactNode;
  onClose: () => void;
  isMobile: boolean;
  t: Theme;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 100,
        padding: isMobile ? 0 : 16,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface,
          borderRadius: isMobile ? "20px 20px 0 0" : 20,
          padding: 24,
          width: "100%",
          maxWidth: isMobile ? "100%" : 420,
          maxHeight: isMobile ? "92vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          animation: isMobile ? "slideUp 0.3s ease" : "popIn 0.25s ease",
        }}
      >
        {/* drag handle on mobile */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
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
        {children}
      </div>
    </div>
  );
}

// --- MAIN SCREEN ---
export default function ClassDetailScreen() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { isMobile, isDesktop } = useResponsive();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const t = dark ? DARK : LIGHT;

  const [classData, setClassData] = useState<ClassEntity | null>(null);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [subjectToRemove, setSubjectToRemove] = useState<SubjectEntity | null>(
    null,
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const id = classId ? parseInt(classId, 10) : null;
      if (!id) return;
      const [cls, learnersData, subjectsData] = await Promise.all([
        db.getClass(id),
        db.getLearnersByClass(id),
        db.getSubjectsByClass(id),
      ]);
      setClassData(cls || null);
      setLearners(learnersData || []);
      setSubjects(subjectsData || []);
      setLoading(false);
    };
    load();
  }, [classId]);

  const handleRemoveSubject = (subject: SubjectEntity) => {
    setSubjects(subjects.filter((s) => s.id !== subject.id));
    setSubjectToRemove(null);
  };

  const handleEditClass = (updates: Partial<ClassEntity>) => {
    if (classData) {
      setClassData({ ...classData, ...updates });
      setShowEditDialog(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: t.bg,
          color: t.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `4px solid ${t.accent}`,
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 15, color: t.textMuted, fontWeight: 600 }}>
          Loading class workspace...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const idx = (classData?.id ?? 0) % CLASS_GRADIENTS.length;
  const [g1, g2] = CLASS_GRADIENTS[idx];
  const initial = classData?.className?.charAt(0).toUpperCase() ?? "C";
  const pad = isMobile ? "16px 12px" : "20px 16px";

  return (
    <div
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: pad,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/classes")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.textMuted,
              borderRadius: 10,
              minWidth: 48,
              minHeight: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "manipulation",
            }}
          >
            <div style={{ width: 20, height: 20 }}>{Icons.back}</div>
          </button>
          <div
            style={{
              fontSize: isMobile ? 13 : 14,
              color: t.textMuted,
              fontWeight: 600,
            }}
          >
            {classData?.className || "Class"}
          </div>
        </div>
        <button
          onClick={() => setShowEditDialog(true)}
          style={{
            background: t.surfaceAlt,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: "10px 18px",
            color: t.text,
            fontSize: isMobile ? 13 : 14,
            fontWeight: 700,
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            touchAction: "manipulation",
          }}
        >
          <div style={{ width: 16, height: 16 }}>{Icons.edit}</div>
          Edit
        </button>
      </header>

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "16px 12px" : "20px 16px",
          overflowY: "auto",
        }}
      >
        {/* HERO BANNER */}
        <div
          style={{
            background: `linear-gradient(135deg, ${g1}, ${g2})`,
            borderRadius: 16,
            padding: isMobile ? "20px 16px" : "24px 20px",
            color: "#fff",
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: `0 8px 20px ${t.shadowMd}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              background: "rgba(255,255,255,0.12)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: isMobile ? 52 : 64,
                height: isMobile ? 52 : 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 26 : 32,
                fontWeight: 800,
                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
              }}
            >
              {initial}
            </div>
            <div>
              <h1
                style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {classData?.className}
              </h1>
              <div
                style={{
                  fontSize: isMobile ? 13 : 14,
                  opacity: 0.9,
                  marginTop: 6,
                }}
              >
                {classData?.educationLevel} • {classData?.academicYear}
              </div>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(3, 1fr)"
              : "repeat(auto-fit, minmax(140px, 1fr))",
            gap: isMobile ? 8 : 12,
            marginBottom: 20,
          }}
        >
          <StatCard
            icon={Icons.book}
            value={subjects.length.toString()}
            label="Subjects"
            color={t.accent}
            bg={t.accentLighter}
            t={t}
            isMobile={isMobile}
          />
          <StatCard
            icon={Icons.students}
            value={learners.length.toString()}
            label="Learners"
            color={t.accent}
            bg={t.accentLighter}
            t={t}
            isMobile={isMobile}
          />
          <StatCard
            icon={Icons.calendar}
            value={classData?.academicYear.toString() || "—"}
            label="Year"
            color={t.orange}
            bg={t.orangeBg}
            t={t}
            isMobile={isMobile}
          />
        </div>

        {/* RESPONSIVE GRID — 1 col mobile, 2 col desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: isDesktop ? 24 : 16,
            alignItems: "start",
          }}
        >
          {/* SUBJECTS CARD */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: isMobile ? 16 : 20,
              boxShadow: `0 2px 8px ${t.shadow}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: t.accentLighter,
                    color: t.accentDark,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: 18, height: 18 }}>{Icons.book}</div>
                </div>
                <h2
                  style={{
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  Subjects
                </h2>
              </div>
              <button
                onClick={() => navigate(`/classes/${classId}/add-subject`)}
                style={{
                  background: t.accent,
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minHeight: 48,
                  touchAction: "manipulation",
                }}
              >
                <div style={{ width: 16, height: 16 }}>{Icons.plus}</div>
                Add
              </button>
            </div>

            {subjects.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>
                  📚
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                  No subjects yet
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: t.textMuted,
                    maxWidth: 320,
                    margin: "0 auto",
                  }}
                >
                  Add subjects to define the curriculum for this class.
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    style={{
                      background: t.surfaceAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          flexShrink: 0,
                          background: t.accentLighter,
                          color: t.accentDark,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 800,
                        }}
                      >
                        {subject.subjectName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>
                          {subject.subjectName}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.textMuted,
                            marginTop: 2,
                          }}
                        >
                          Max: {subject.maxMark || "—"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() =>
                          navigate(
                            `/classes/${classId}/edit-subject/${subject.id}`,
                          )
                        }
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.textSub,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          touchAction: "manipulation",
                        }}
                      >
                        <div style={{ width: 18, height: 18 }}>
                          {Icons.edit}
                        </div>
                      </button>
                      <button
                        onClick={() => setSubjectToRemove(subject)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.red,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          touchAction: "manipulation",
                        }}
                      >
                        <div style={{ width: 18, height: 18 }}>
                          {Icons.trash}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — Learners + Settings */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isDesktop ? 24 : 16,
            }}
          >
            {/* LEARNERS CARD */}
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 16,
                padding: isMobile ? 16 : 20,
                boxShadow: `0 2px 8px ${t.shadow}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(59,130,246,0.1)",
                    color: "#3B82F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: 18, height: 18 }}>{Icons.students}</div>
                </div>
                <h3
                  style={{
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  Learners
                </h3>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  {
                    path: `/classes/${classId}/learners`,
                    icon: Icons.students,
                    iconBg: t.accentLighter,
                    iconColor: t.accentDark,
                    title: "View Roster",
                    sub: `${learners.length} students`,
                  },
                  {
                    path: `/classes/${classId}/add-learner`,
                    icon: Icons.plus,
                    iconBg: t.accent,
                    iconColor: "#fff",
                    title: "Add Learner",
                    sub: "Enroll new student",
                  },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      background: t.surfaceAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      minHeight: 72,
                      textAlign: "left",
                      touchAction: "manipulation",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: item.iconBg,
                        color: item.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ width: 24, height: 24 }}>{item.icon}</div>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 15, fontWeight: 700, color: t.text }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: t.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SETTINGS CARD */}
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 16,
                padding: isMobile ? 16 : 20,
                boxShadow: `0 2px 8px ${t.shadow}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: t.surfaceAlt,
                    color: t.textMuted,
                    border: `1px solid ${t.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: 18, height: 18 }}>{Icons.info}</div>
                </div>
                <h3
                  style={{
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  Settings
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Level", value: classData?.level || "—" },
                  {
                    label: "Education Path",
                    value: classData?.educationLevel || "—",
                  },
                  {
                    label: "Capacity",
                    value: String(classData?.maximumPupils ?? "Unlimited"),
                  },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    style={{
                      paddingTop: i === 0 ? 0 : 14,
                      marginTop: i === 0 ? 0 : 14,
                      borderTop: i === 0 ? "none" : `1px solid ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {row.label}
                    </div>
                    <div
                      style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}
                    >
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* REMOVE SUBJECT MODAL */}
      {subjectToRemove && (
        <ModalSheet
          onClose={() => setSubjectToRemove(null)}
          isMobile={isMobile}
          t={t}
        >
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
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            Remove Subject?
          </h3>
          <p
            style={{
              fontSize: 14,
              color: t.textSub,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to remove{" "}
            <strong>{subjectToRemove.subjectName}</strong>?<br />
            This will also remove related grading data.
          </p>
          <div
            style={{
              background: t.redBg,
              border: `1px solid ${t.red}40`,
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontSize: 12, color: t.redText, fontWeight: 600 }}>
              This action cannot be undone.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setSubjectToRemove(null)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.surfaceAlt,
                color: t.text,
                fontSize: 15,
                fontWeight: 600,
                minHeight: 52,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleRemoveSubject(subjectToRemove)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 10,
                background: t.red,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                minHeight: 52,
              }}
            >
              Remove
            </button>
          </div>
        </ModalSheet>
      )}

      {/* EDIT CLASS MODAL */}
      {showEditDialog && classData && (
        <ModalSheet
          onClose={() => setShowEditDialog(false)}
          isMobile={isMobile}
          t={t}
        >
          <EditClassDialog
            classData={classData}
            onClose={() => setShowEditDialog(false)}
            onConfirm={handleEditClass}
            t={t}
            isMobile={isMobile}
          />
        </ModalSheet>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popIn   { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
        button { cursor: pointer; font-family: inherit; }
      `}</style>
    </div>
  );
}

// --- STAT CARD ---
function StatCard({
  icon,
  value,
  label,
  color,
  bg,
  t,
  isMobile,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  bg: string;
  t: Theme;
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: isMobile ? "12px 10px" : "16px",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        minHeight: isMobile ? 70 : 82,
      }}
    >
      <div
        style={{
          width: isMobile ? 36 : 44,
          height: isMobile ? 36 : 44,
          borderRadius: 10,
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: isMobile ? 18 : 22, height: isMobile ? 18 : 22 }}>
          {icon}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: isMobile ? 18 : 22,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: isMobile ? 10 : 12,
            color: t.textMuted,
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// --- EDIT CLASS DIALOG ---
function EditClassDialog({
  classData,
  onClose,
  onConfirm,
  t,
  isMobile,
}: {
  classData: ClassEntity;
  onClose: () => void;
  onConfirm: (updates: Partial<ClassEntity>) => void;
  t: Theme;
  isMobile: boolean;
}) {
  const [className, setClassName] = useState(classData.className);
  const [year, setYear] = useState(classData.academicYear.toString());
  const [classNameError, setClassNameError] = useState(false);
  const years = Array.from({ length: 27 }, (_, i) => (2024 + i).toString());

  const handleSave = () => {
    if (!className.trim()) {
      setClassNameError(true);
      return;
    }
    onConfirm({
      className: className.trim(),
      academicYear: parseInt(year, 10),
    });
  };

  return (
    <>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
        Edit Class
      </h3>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t.textMuted,
            display: "block",
            marginBottom: 8,
          }}
        >
          Class Name *
        </label>
        <input
          type="text"
          value={className}
          onChange={(e) => {
            setClassName(e.target.value);
            if (classNameError) setClassNameError(false);
          }}
          placeholder="e.g. Grade 10A"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 10,
            border: `1px solid ${classNameError ? t.red : t.border}`,
            background: t.surfaceAlt,
            color: t.text,
            fontSize: isMobile ? 16 : 15,
            minHeight: 52,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        {classNameError && (
          <div
            style={{
              color: t.red,
              fontSize: 13,
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            Class name is required
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t.textMuted,
            display: "block",
            marginBottom: 8,
          }}
        >
          Academic Year *
        </label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.surfaceAlt,
            color: t.text,
            fontSize: isMobile ? 16 : 15,
            minHeight: 52,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: t.accentLighter,
          border: `1px solid ${t.accent}40`,
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <span style={{ fontSize: 18, color: t.accent }}>ℹ️</span>
        <div
          style={{
            fontSize: 12,
            color: t.accentText,
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          Education Level cannot be changed after creation to preserve data
          consistency.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.surfaceAlt,
            color: t.text,
            fontSize: 15,
            fontWeight: 600,
            minHeight: 52,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 10,
            background: t.accent,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            minHeight: 52,
          }}
        >
          Save Changes
        </button>
      </div>
    </>
  );
}
