import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Moon,
  Sun,
  ShieldCheck,
  Users2,
  School,
  BookOpenCheck,
  PieChart,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { LIGHT, DARK, Theme } from "../styles/rankitz-colors";

// ─── Responsive Hook ──────────────────────────────────────────────────
function useResponsive() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 640 && window.innerWidth < 1024,
  );

  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return { isMobile, isTablet };
}

export default function AboutRankitScreen() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const t: Theme = dark ? DARK : LIGHT;
  const accentColor = "#1e1b4b";
  const appVersion = "1.2.0";
  const buildLocation = "Sinda, Eastern Province";
  const buildDate = "March 2026";

  const features = [
    {
      icon: <Users2 size={24} />,
      title: "Learner Directory",
      description: "Student profiles and parent contact records.",
      color: "#6366f1",
    },
    {
      icon: <School size={24} />,
      title: "Class Management",
      description: "Classroom organization with subject allocation.",
      color: "#10b981",
    },
    {
      icon: <BookOpenCheck size={24} />,
      title: "Examinations",
      description: "Score entry for Weekly, Mid-Term, and End-of-Term.",
      color: "#f59e0b",
    },
    {
      icon: <PieChart size={24} />,
      title: "Academic Insights",
      description: "Real-time analytics and performance trends.",
      color: "#f43f5e",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Data Security",
      description: "Offline-first with local encryption and cloud sync.",
      color: "#8b5cf6",
    },
    {
      icon: <School size={24} />,
      title: "Admin Portal",
      description: "School configuration and grading management.",
      color: "#3b82f6",
    },
  ];

  const changelog = [
    {
      version: "1.2.0",
      date: "March 2026",
      status: "Latest",
      changes: [
        "Midnight Indigo production theme",
        "Lucide-React icons",
        "Offline performance",
        "Zambian grading logic",
        "Top-Nav term tracking",
        "Responsive transitions",
      ],
    },
    {
      version: "1.0.0",
      date: "July 2025",
      status: "Legacy",
      changes: [
        "Initial release",
        "Core management",
        "IndexedDB implementation",
      ],
    },
  ];

  return (
    <div
      style={{
        background: t.bg,
        minHeight: "100vh",
        color: t.text,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: isMobile ? 64 : 76,
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 40,
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
            onClick={() => navigate("/settings")}
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              color: accentColor,
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = t.border)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = t.surfaceAlt)
            }
          >
            <ChevronLeft size={isMobile ? 18 : 20} />
          </button>
          <div>
            <h1
              style={{
                fontSize: isMobile ? 16 : 18,
                fontWeight: 800,
                letterSpacing: "-0.5px",
              }}
            >
              About
            </h1>
            <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
              Version & Support
            </p>
          </div>
        </div>

        <button
          onClick={() => setDark(!dark)}
          style={{
            width: isMobile ? 36 : 42,
            height: isMobile ? 36 : 42,
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.surfaceAlt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: accentColor,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = t.border)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = t.surfaceAlt)
          }
        >
          {dark ? (
            <Sun size={isMobile ? 16 : 18} />
          ) : (
            <Moon size={isMobile ? 16 : 18} />
          )}
        </button>
      </header>

      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: isMobile
            ? "20px 12px"
            : isTablet
              ? "32px 24px"
              : "40px 32px",
        }}
      >
        {/* Zambia Flag Bar */}
        <div
          style={{
            display: "flex",
            height: 3,
            width: "100%",
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: isMobile ? 24 : 32,
            opacity: 0.7,
          }}
        >
          <div style={{ flex: 1, background: "#15803d" }} />
          <div style={{ flex: 1, background: "#dc2626" }} />
          <div style={{ flex: 1, background: "#000000" }} />
          <div style={{ flex: 1, background: "#f97316" }} />
        </div>

        {/* Hero Section */}
        <section
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, #312e81 100%)`,
            borderRadius: isMobile ? 16 : 24,
            padding: isMobile ? "32px 20px" : "60px 40px",
            textAlign: "center",
            marginBottom: isMobile ? 32 : 48,
            color: "white",
            boxShadow: "0 20px 25px -5px rgba(30, 27, 75, 0.2)",
          }}
        >
          <div
            style={{
              width: isMobile ? 64 : 80,
              height: isMobile ? 64 : 80,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <ShieldCheck size={isMobile ? 36 : 48} strokeWidth={2.5} />
          </div>
          <h2
            style={{
              fontSize: isMobile ? 24 : 32,
              fontWeight: 900,
              marginBottom: 8,
            }}
          >
            RankItZM
          </h2>
          <p
            style={{
              fontSize: isMobile ? 14 : 16,
              opacity: 0.9,
              fontWeight: 500,
              marginBottom: isMobile ? 16 : 24,
            }}
          >
            Education Standard for Zambia
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {["v" + appVersion, "Stable", "Eastern Province"].map((label) => (
              <span
                key={label}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: isMobile ? "4px 10px" : "6px 14px",
                  borderRadius: 10,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section style={{ marginBottom: isMobile ? 32 : 56 }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: accentColor,
              marginBottom: isMobile ? 16 : 24,
            }}
          >
            Core Capabilities
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "1fr 1fr"
                  : "repeat(3, 1fr)",
              gap: isMobile ? 12 : 20,
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: isMobile ? 14 : 20,
                  padding: isMobile ? 16 : 24,
                  transition: "transform 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  !isMobile &&
                  (e.currentTarget.style.transform = "translateY(-4px)")
                }
                onMouseLeave={(e) =>
                  !isMobile &&
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${f.color}15`,
                    color: f.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  {f.icon}
                </div>
                <h4
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  {f.title}
                </h4>
                <p
                  style={{
                    fontSize: isMobile ? 12 : 13,
                    color: t.textMuted,
                    lineHeight: 1.5,
                  }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Support Card */}
        <section style={{ marginBottom: isMobile ? 32 : 56 }}>
          <div
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: isMobile ? 16 : 24,
              padding: isMobile ? 20 : 40,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 20 : 32,
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 900,
                  color: accentColor,
                  marginBottom: 10,
                }}
              >
                Support
              </h3>
              <p
                style={{
                  color: t.textMuted,
                  fontSize: isMobile ? 13 : 14,
                  lineHeight: 1.6,
                  marginBottom: isMobile ? 16 : 24,
                }}
              >
                Technical support team in Sinda for Eastern Province schools.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Mail size={16} color={accentColor} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    pearjasper@outlook.com
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Phone size={16} color={accentColor} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    +260 77 729 8220
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                background: t.surface,
                padding: isMobile ? 16 : 24,
                borderRadius: isMobile ? 14 : 20,
                border: `1px solid ${t.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <MapPin size={16} color="#f43f5e" />
                <span style={{ fontSize: 12, fontWeight: 800 }}>
                  Build Info
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  ["Origin", buildLocation],
                  ["Compiled", buildDate],
                  ["License", "Enterprise Active"],
                ].map(([label, value], i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: t.textMuted }}>{label}:</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: label === "License" ? "#10b981" : t.text,
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Changelog */}
        <section style={{ marginBottom: isMobile ? 32 : 56 }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: accentColor,
              marginBottom: isMobile ? 16 : 24,
            }}
          >
            Release History
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {changelog.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === `v${idx}` ? null : `v${idx}`,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: isMobile ? 14 : 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: "3px 8px",
                        background: accentColor,
                        color: "white",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      v{entry.version}
                    </div>
                    <span
                      style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700 }}
                    >
                      {entry.date}
                    </span>
                    {entry.status === "Latest" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#10b981",
                          textTransform: "uppercase",
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform:
                        expandedSection === `v${idx}`
                          ? "rotate(180deg)"
                          : "none",
                      transition: "0.3s",
                      flexShrink: 0,
                    }}
                  />
                </button>
                {expandedSection === `v${idx}` && (
                  <div
                    style={{
                      padding: isMobile ? "12px 14px" : "16px 20px",
                      borderTop: `1px solid ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      {entry.changes.map((change, cIdx) => (
                        <div
                          key={cIdx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <CheckCircle2
                            size={14}
                            color="#10b981"
                            style={{ flexShrink: 0, marginTop: 1 }}
                          />
                          <span style={{ fontSize: 12, color: t.textSub }}>
                            {change}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: isMobile ? "32px 0" : "40px 0",
            borderTop: `1px solid ${t.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <ShieldCheck size={16} color={accentColor} />
            <span
              style={{
                fontSize: isMobile ? 13 : 14,
                fontWeight: 900,
                color: accentColor,
                letterSpacing: "-0.5px",
              }}
            >
              RankItZM
            </span>
          </div>
          <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 500 }}>
            &copy; 2026 RankIt Education Systems
          </p>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "center",
              gap: 12,
              fontSize: 11,
              fontWeight: 700,
              color: accentColor,
              flexWrap: "wrap",
            }}
          >
            <span>Privacy</span>
            <span>•</span>
            <span>Terms</span>
            <span>•</span>
            <span>Built in Zambia</span>
          </div>
        </footer>
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: ${accentColor}40; }
        
        main { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
