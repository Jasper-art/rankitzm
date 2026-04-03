import React, { useState, useEffect } from "react";
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
  sidebar: "#FFFFFF",
  sidebarBorder: "#E5E9EB",
  topbar: "#FFFFFF",
  statCard: "#FFFFFF",
  tableHead: "#F9FAFB",
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
  sidebar: "#1E293B",
  sidebarBorder: "#334155",
  topbar: "#1E293B",
  statCard: "#334155",
  tableHead: "#0F172A",
  shadow: "rgba(0, 0, 0, 0.2)",
  shadowMd: "rgba(0, 0, 0, 0.3)",
  shadowLg: "rgba(0, 0, 0, 0.4)",
};

type Theme = typeof LIGHT;

const Icons = {
  close: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M18 6l-12 12M6 6l12 12" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
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
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
};

interface ReportType {
  id: string;
  name: string;
  icon: string;
  description: string;
  category?: string;
  badge?: string;
  color?: string;
}

export default function ReportsScreen() {
  const navigate = useNavigate();
  const { classes, loading } = useClasses();
  const { schoolName } = useAuth();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [hoveredReport, setHoveredReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const t = dark ? DARK : LIGHT;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentTerm =
    currentMonth < 3
      ? "Term 1"
      : currentMonth < 6
        ? "Term 1"
        : currentMonth < 9
          ? "Term 2"
          : "Term 3";

  const reportTypes: ReportType[] = [
    {
      id: "end-of-term",
      name: "End of Term Report",
      icon: "📊",
      description:
        "Comprehensive performance assessment and detailed analytics for the entire term.",
      category: "Standard",
      badge: "Essential",
      color: "#3B82F6",
    },
    {
      id: "mid-term",
      name: "Mid-Term Report",
      icon: "📈",
      description:
        "Track student progress and performance at the midpoint of the semester.",
      category: "Standard",
      color: "#06B6D4",
    },
    {
      id: "weekly",
      name: "Weekly Assessment",
      icon: "📋",
      description:
        "Detailed summary and analysis of weekly assessment results and trends.",
      category: "Standard",
      color: "#8B5CF6",
    },
    {
      id: "progress",
      name: "Progress Analytics",
      icon: "📉",
      description:
        "Visualize and analyze student improvement patterns over extended periods.",
      category: "Advanced",
      color: "#EC4899",
    },
    {
      id: "analysis",
      name: "Performance Insights",
      icon: "🔍",
      description:
        "In-depth analytical insights into class performance metrics and patterns.",
      category: "Advanced",
      badge: "Pro",
      color: "#F59E0B",
    },
    {
      id: "custom",
      name: "Custom Builder",
      icon: "⚙️",
      description:
        "Create tailored reports with custom parameters and advanced filtering options.",
      category: "Advanced",
      color: "#6B7280",
    },
  ];

  const handleGenerateReport = (reportId: string) => {
    if (reportId === "progress") {
      navigate("/reports/progress");
      return;
    }

    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }

    if (reportId === "custom") {
      navigate("/reports/custom");
    } else if (reportId === "end-of-term") {
      navigate(
        `/reports/${selectedClass}/endofterm/${currentTerm}/${currentYear}`,
      );
    } else if (reportId === "mid-term") {
      navigate(
        `/reports/${selectedClass}/midterm/${currentTerm}/${currentYear}`,
      );
    } else if (reportId === "weekly") {
      navigate(
        `/reports/${selectedClass}/weekly/${currentTerm}/${currentYear}`,
      );
    } else {
      navigate(`/reports/${selectedClass}/${reportId}`);
    }
  };

  const standardReports = reportTypes.filter((r) => r.category === "Standard");
  const advancedReports = reportTypes.filter((r) => r.category === "Advanced");

  const filteredClasses = classes.filter((c) =>
    c.className.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);

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
      {/* Premium Topbar */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "12px 16px" : "16px 24px",
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
            gap: isMobile ? 12 : 16,
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
              borderRadius: 6,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.surfaceAlt;
              e.currentTarget.style.color = t.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = t.textMuted;
            }}
            title="Back to Home"
          >
            <div style={{ width: 18, height: 18 }}>{Icons.back}</div>
          </button>
          <div>
            <div
              style={{
                fontSize: isMobile ? 18 : 20,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              Reports & Analytics
            </div>
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
                marginTop: 2,
                fontWeight: 400,
              }}
            >
              {schoolName || "Academic Dashboard"}
            </div>
          </div>
        </div>
      </header>

      {/* Master-Detail Layout */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Left Sidebar: Class Selection */}
        {(!isMobile || !selectedClass) && (
          <aside
            style={{
              width: isMobile ? "100%" : 320,
              background: t.surface,
              borderRight: isMobile ? "none" : `1px solid ${t.border}`,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              zIndex: 10,
              height: "100%",
            }}
          >
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              {/* Academic Period Badge */}
              <div
                style={{
                  background: t.accentLighter,
                  border: `1px solid ${t.accent}40`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ width: 20, height: 20, color: t.accentDark }}>
                  {Icons.calendar}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.accentText,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Active Academic Period
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: t.text,
                      marginTop: 2,
                    }}
                  >
                    {currentTerm} • {currentYear}
                  </div>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: t.textMuted,
                    width: 14,
                    height: 14,
                  }}
                >
                  {Icons.search}
                </div>
                <input
                  type="text"
                  placeholder="Find a class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 34px",
                    borderRadius: 8,
                    border: `1px solid ${t.border}`,
                    background: t.surfaceAlt,
                    color: t.text,
                    fontSize: 13,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = t.accent;
                    e.currentTarget.style.background = t.surface;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accentLighter}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.background = t.surfaceAlt;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "0 8px",
                  marginBottom: 8,
                }}
              >
                Select Class
              </div>

              {loading ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: t.textMuted,
                    fontSize: 13,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${t.border}`,
                      borderTopColor: t.accent,
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Loading classes...
                </div>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id || null)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        selectedClass === cls.id
                          ? t.accentLighter
                          : "transparent",
                      color: t.text,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                      marginBottom: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedClass !== cls.id)
                        e.currentTarget.style.background = t.surfaceAlt;
                    }}
                    onMouseLeave={(e) => {
                      if (selectedClass !== cls.id)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: selectedClass === cls.id ? 700 : 600,
                          color:
                            selectedClass === cls.id ? t.accentDark : t.text,
                        }}
                      >
                        {cls.className}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color:
                            selectedClass === cls.id
                              ? t.accentText
                              : t.textMuted,
                          marginTop: 4,
                          fontWeight: 500,
                        }}
                      >
                        {(cls as any).educationLevel || "Primary Level"}
                      </div>
                    </div>
                    {selectedClass === cls.id && (
                      <div
                        style={{ width: 16, height: 16, color: t.accentDark }}
                      >
                        {Icons.chevronRight}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: t.textMuted,
                    fontSize: 13,
                  }}
                >
                  No classes match your search.
                </div>
              )}
            </div>

            {/* Global Actions (Always available at the bottom of the sidebar) */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: `1px solid ${t.border}`,
                background: t.surfaceAlt,
              }}
            >
              <button
                onClick={() => handleGenerateReport("progress")}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: t.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s",
                  fontSize: 14,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = t.accentDark)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = t.accent)
                }
              >
                <span>📉</span> Global Progress Analytics
              </button>
            </div>
          </aside>
        )}

        {/* Right Main Content Area */}
        {(!isMobile || selectedClass) && (
          <main
            style={{
              flex: 1,
              padding: isMobile ? "20px" : "40px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: selectedClass ? "flex-start" : "center",
              justifyContent: selectedClass ? "flex-start" : "center",
            }}
          >
            {isMobile && selectedClass && (
              <button
                onClick={() => setSelectedClass(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  color: t.textSub,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  marginBottom: 24,
                  padding: "8px 0",
                }}
              >
                <div style={{ width: 16, height: 16 }}>{Icons.back}</div> Back
                to Classes
              </button>
            )}

            {selectedClass ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: 1000,
                  margin: "0 auto",
                  animation: "fadeIn 0.4s ease-out",
                }}
              >
                {/* Header for Selected Class */}
                <div style={{ marginBottom: 40 }}>
                  <h1
                    style={{
                      fontSize: isMobile ? 24 : 28,
                      fontWeight: 800,
                      color: t.text,
                      letterSpacing: "-0.5px",
                      margin: 0,
                    }}
                  >
                    Generate Reports
                  </h1>
                  <p
                    style={{
                      fontSize: 14,
                      color: t.textMuted,
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    Select a report type below for{" "}
                    <strong style={{ color: t.accentDark }}>
                      {selectedClassInfo?.className}
                    </strong>
                    .
                  </p>
                </div>

                {/* Standard Reports Grid */}
                <div style={{ marginBottom: 48 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: t.text,
                      marginBottom: 16,
                      letterSpacing: "-0.2px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: t.accent,
                      }}
                    ></div>
                    Essential Reports
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {standardReports.map((report) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        t={t}
                        isMobile={isMobile}
                        hovered={hoveredReport === report.id}
                        onHover={setHoveredReport}
                        onClick={() => handleGenerateReport(report.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Advanced Reports Grid */}
                <div style={{ marginBottom: 48 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: t.text,
                      marginBottom: 16,
                      letterSpacing: "-0.2px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#8B5CF6",
                      }}
                    ></div>
                    Advanced Analytics
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {advancedReports.map((report) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        t={t}
                        isMobile={isMobile}
                        hovered={hoveredReport === report.id}
                        onHover={setHoveredReport}
                        onClick={() => handleGenerateReport(report.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Actions List */}
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: t.text,
                      marginBottom: 16,
                      letterSpacing: "-0.2px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: t.textMuted,
                      }}
                    ></div>
                    Quick Actions
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <button
                      onClick={() => navigate(`/sms/results`)}
                      style={{
                        padding: "16px 20px",
                        borderRadius: 10,
                        border: `1px solid ${t.border}`,
                        background: t.surface,
                        color: t.text,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        transition: "all 0.2s",
                        boxShadow: `0 1px 2px ${t.shadow}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = t.accent;
                        e.currentTarget.style.boxShadow = `0 4px 12px ${t.shadowMd}`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = t.border;
                        e.currentTarget.style.boxShadow = `0 1px 2px ${t.shadow}`;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: t.surfaceAlt,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        📱
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "-0.2px",
                          }}
                        >
                          Send Results via SMS
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.textMuted,
                            marginTop: 2,
                            fontWeight: 500,
                          }}
                        >
                          Notify parents instantly
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate("/settings/school")}
                      style={{
                        padding: "16px 20px",
                        borderRadius: 10,
                        border: `1px solid ${t.border}`,
                        background: t.surface,
                        color: t.text,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        transition: "all 0.2s",
                        boxShadow: `0 1px 2px ${t.shadow}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = t.accent;
                        e.currentTarget.style.boxShadow = `0 4px 12px ${t.shadowMd}`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = t.border;
                        e.currentTarget.style.boxShadow = `0 1px 2px ${t.shadow}`;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: t.surfaceAlt,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        ⚙️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "-0.2px",
                          }}
                        >
                          Configure Settings
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.textMuted,
                            marginTop: 2,
                            fontWeight: 500,
                          }}
                        >
                          Adjust grading criteria
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: t.textMuted,
                  maxWidth: 360,
                  animation: "fadeIn 0.4s ease-out",
                  display: isMobile ? "none" : "block", // Hidden on mobile because sidebar takes over
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: t.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: `0 8px 24px ${t.shadowLg}`,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <span style={{ fontSize: 36 }}>📊</span>
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: t.text,
                    marginBottom: 8,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Select a Class to Begin
                </h2>
                <p style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                  Choose a class from the sidebar to access comprehensive
                  performance reports and advanced analytics for this academic
                  period.
                </p>
              </div>
            )}
          </main>
        )}
      </div>

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}

// ==================== SUBCOMPONENTS ====================

interface ReportCardProps {
  report: ReportType;
  t: Theme;
  hovered: boolean;
  isMobile: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

function ReportCard({
  report,
  t,
  hovered,
  isMobile,
  onHover,
  onClick,
}: ReportCardProps) {
  const brandColor = report.color || t.accent;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(report.id)}
      onFocus={() => onHover(report.id)}
      onMouseLeave={() => onHover(null)}
      onBlur={() => onHover(null)}
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? brandColor : t.border}`,
        borderRadius: 12,
        padding: isMobile ? "16px" : "20px",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: hovered
          ? `0 12px 24px ${t.shadowMd}`
          : `0 2px 4px ${t.shadow}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 12 : 16,
        outline: "none",
      }}
    >
      {/* Top row: Icon & Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <div
          style={{
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            borderRadius: 12,
            background: `${brandColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? 20 : 24,
            transition: "all 0.3s",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        >
          {report.icon}
        </div>

        {report.badge && (
          <div
            style={{
              background: `${brandColor}15`,
              color: brandColor,
              fontSize: 10,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {report.badge}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: t.text,
            marginBottom: 6,
            letterSpacing: "-0.2px",
          }}
        >
          {report.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: t.textMuted,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {report.description}
        </div>
      </div>
    </button>
  );
}
