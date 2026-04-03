import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClasses } from "../hooks/useClassManager";
import { useAuth } from "../context/AuthContext";

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

interface TestType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  badge: string;
}

interface EntryMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  badge: string;
}

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
  check: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  ),
  weekly: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  midterm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  endOfTerm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  subject: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
};

export default function TestsScreen() {
  const navigate = useNavigate();
  const { classes, loading } = useClasses();
  const { schoolName } = useAuth();

  const testTypeRef = useRef<HTMLDivElement>(null);
  const mainScrollContainer = useRef<HTMLDivElement>(null);

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedTestType, setSelectedTestType] = useState<string>("weekly");

  const t = dark ? DARK : LIGHT;

  const testTypes: TestType[] = [
    {
      id: "weekly",
      name: "Weekly Test",
      icon: Icons.weekly,
      description: "Regular weekly assessments",
      badge: "Regular",
    },
    {
      id: "midterm",
      name: "Mid-Term Exam",
      icon: Icons.midterm,
      description: "Mid-semester examination",
      badge: "Important",
    },
    {
      id: "endofterm",
      name: "End of Term",
      icon: Icons.endOfTerm,
      description: "Final term assessment",
      badge: "Critical",
    },
  ];

  const entryMethods: EntryMethod[] = [
    {
      id: "by-learner",
      name: "By Learner",
      icon: Icons.user,
      description: "Enter scores for one student across all subjects",
      badge: "Individual",
    },
    {
      id: "by-subject",
      name: "By Subject",
      icon: Icons.subject,
      description: "Enter scores for all students in one specific subject",
      badge: "Bulk",
    },
  ];

  useEffect(() => {
    if (selectedClass && testTypeRef.current && mainScrollContainer.current) {
      setTimeout(() => {
        testTypeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [selectedClass]);

  const handleStartScoreEntry = (methodId: string) => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }
    navigate(`/tests/${selectedTestType}/${selectedClass}/${methodId}`);
  };

  const handleViewScores = () => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }
    navigate(`/scores/${selectedTestType}/${selectedClass}`);
  };

  const classStats = useMemo(() => {
    if (!selectedClass) return null;
    const cls = classes.find((c) => c.id === selectedClass);
    return {
      name: cls?.className || "Select Class",
      level: (cls as any)?.educationLevel || "Primary",
    };
  }, [selectedClass, classes]);

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
      {/* Professional Header Area */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
              borderRadius: 6,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.color = t.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
            }}
            title="Back"
          >
            <div style={{ width: 18, height: 18 }}>{Icons.back}</div>
          </button>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              Assessment Center
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.textMuted,
                marginTop: 2,
                fontWeight: 400,
              }}
            >
              {schoolName || "Score Management"}
            </div>
          </div>
        </div>

        {selectedClass && (
          <div
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 14, height: 14, color: t.accent }}>
              {Icons.check}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
              {classStats?.name}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        ref={mainScrollContainer}
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
          {/* STEP 1: CLASS SELECTION */}
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.textMuted,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 12,
              }}
            >
              Step 1: Select Class
            </h2>
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "20px",
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: t.textMuted,
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "10px 0",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `2px solid ${t.accent}`,
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Loading available classes...
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                  }}
                >
                  {classes.map((cls) => (
                    <ClassButton
                      key={cls.id}
                      cls={cls}
                      selected={selectedClass === cls.id}
                      onSelect={() => setSelectedClass(cls.id || null)}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedClass && (
            <div
              ref={testTypeRef}
              style={{ animation: "fadeIn 0.3s ease-in-out" }}
            >
              {/* STEP 2: TEST TYPE */}
              <div style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 12,
                  }}
                >
                  Step 2: Assessment Type
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 12,
                  }}
                >
                  {testTypes.map((test) => (
                    <TestTypeCard
                      key={test.id}
                      test={test}
                      selected={selectedTestType === test.id}
                      onSelect={() => setSelectedTestType(test.id)}
                      t={t}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 3: ACTIONS */}
              <div style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 12,
                  }}
                >
                  Step 3: Action
                </h2>
                <div
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${t.border}`,
                      background: t.surfaceAlt,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.text,
                        margin: 0,
                      }}
                    >
                      Enter New Scores
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: t.textMuted,
                        marginTop: 2,
                        marginBottom: 0,
                      }}
                    >
                      Choose your preferred data entry method.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {entryMethods.map((method, index) => (
                      <ActionRow
                        key={method.id}
                        method={method}
                        onSelect={() => handleStartScoreEntry(method.id)}
                        t={t}
                        isLast={index === entryMethods.length - 1}
                      />
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${t.border}`,
                      background: t.surfaceAlt,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.text,
                        margin: 0,
                      }}
                    >
                      Review Data
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: t.textMuted,
                        marginTop: 2,
                        marginBottom: 0,
                      }}
                    >
                      Analyze existing results and generate reports.
                    </p>
                  </div>
                  <ActionRow
                    method={{
                      id: "view",
                      name: "View Subject Rankings & Scores",
                      icon: Icons.eye,
                      description:
                        "Analyze class performance, view rankings, and export results.",
                      badge: "Analysis",
                    }}
                    onSelect={handleViewScores}
                    t={t}
                    isLast={true}
                    highlight
                  />
                </div>
              </div>

              {/* Contextual Information */}
              <div
                style={{
                  background: t.surfaceAlt,
                  borderLeft: `3px solid ${t.accent}`,
                  padding: "12px 16px",
                  borderRadius: "0 6px 6px 0",
                  fontSize: 12,
                  color: t.textSub,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    color: t.accent,
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4m0-4h.01" />
                  </svg>
                </div>
                <div>
                  <strong>System Note:</strong> Ensure all learner profiles are
                  created in the Directory before entering scores. Empty classes
                  will not allow score entry.
                </div>
              </div>
            </div>
          )}

          {!selectedClass && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: t.textMuted,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto 16px",
                  color: t.border,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
                Awaiting Class Selection
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Select a class above to unlock assessment types and entry
                methods.
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}

// ==================== COMPONENTS ====================

interface ClassButtonProps {
  cls: any;
  selected: boolean;
  onSelect: () => void;
  t: Theme;
}

function ClassButton({ cls, selected, onSelect, t }: ClassButtonProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "12px 16px",
        borderRadius: 6,
        border: `1px solid ${selected ? t.accent : t.border}`,
        background: selected ? t.surfaceAlt : t.surface,
        color: selected ? t.accent : t.text,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            t.textMuted;
          (e.currentTarget as HTMLButtonElement).style.background =
            t.surfaceAlt;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;
          (e.currentTarget as HTMLButtonElement).style.background = t.surface;
        }
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{cls.className}</div>
        <div
          style={{
            fontSize: 11,
            color: t.textMuted,
            marginTop: 2,
            fontWeight: 500,
          }}
        >
          {(cls as any).educationLevel || "Primary"}
        </div>
      </div>
      {selected && (
        <div style={{ width: 16, height: 16, color: t.accent }}>
          {Icons.check}
        </div>
      )}
    </button>
  );
}

interface TestTypeCardProps {
  test: any;
  selected: boolean;
  onSelect: () => void;
  t: Theme;
}

function TestTypeCard({ test, selected, onSelect, t }: TestTypeCardProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "16px",
        borderRadius: 8,
        border: `1px solid ${selected ? t.accent : t.border}`,
        background: selected ? t.surfaceAlt : t.surface,
        color: t.text,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            t.textMuted;
          (e.currentTarget as HTMLButtonElement).style.background =
            t.surfaceAlt;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;
          (e.currentTarget as HTMLButtonElement).style.background = t.surface;
        }
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: selected ? t.accentBg : t.borderSub,
          color: selected ? t.accent : t.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 20, height: 20 }}>{test.icon}</div>
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: selected ? t.accent : t.text,
          }}
        >
          {test.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: t.textMuted,
            marginTop: 2,
            marginBottom: 6,
          }}
        >
          {test.description}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: t.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {test.badge}
        </div>
      </div>
    </button>
  );
}

interface ActionRowProps {
  method: any;
  onSelect: () => void;
  t: Theme;
  isLast: boolean;
  highlight?: boolean;
}

function ActionRow({ method, onSelect, t, isLast, highlight }: ActionRowProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "16px 20px",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${t.border}`,
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = t.surfaceAlt;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          color: highlight ? t.accent : t.textMuted,
        }}
      >
        {method.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: highlight ? t.accent : t.text,
          }}
        >
          {method.name}
        </div>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
          {method.description}
        </div>
      </div>
      <div style={{ width: 16, height: 16, color: t.textMuted }}>
        {Icons.arrowRight}
      </div>
    </button>
  );
}
