import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addActivity } from "../lib/activityLogger";
import { db } from "../db";

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
  save: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
};

interface SettingsTab {
  id: string;
  label: string;
  description: string;
}

export default function SchoolSettingsScreen() {
  const navigate = useNavigate();
  const { schoolId, userId } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  React.useEffect(() => {
    const event = new CustomEvent("closeSidebar", {
      detail: { from: "settings" },
    });
    window.dispatchEvent(event);
  }, []);

  const t = dark ? DARK : LIGHT;

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState({
    schoolName: "RankIT ZM School",
    schoolAddress: "123 Main Street, Lusaka",
    schoolPhone: "+260123456789",
    schoolEmail: "school@example.com",
    headteacherName: "Mr. John Smith",
    deputyHeadteacherName: "Mrs. Jane Doe",
    primaryPassRate: 50,
    secondaryPassRate: 60,
    academicYear: new Date().getFullYear(),
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const school = await db.getSchool(1);
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        let term = "Term1";
        if (currentMonth >= 4 && currentMonth < 8) {
          term = "Term2";
        } else if (currentMonth >= 8) {
          term = "Term3";
        }
        const schoolSettings = await db.getSchoolSettings(term, currentYear);
        if (school) {
          setSettings((prev) => ({
            ...prev,
            schoolName: school.schoolName || prev.schoolName,
            schoolAddress: school.schoolAddress || prev.schoolAddress,
          }));
        }
        if (schoolSettings) {
          setSettings((prev) => ({
            ...prev,
            headteacherName:
              schoolSettings.headteacherName || prev.headteacherName,
            deputyHeadteacherName:
              schoolSettings.deputyHeadteacherName ||
              prev.deputyHeadteacherName,
            primaryPassRate:
              schoolSettings.primaryPassingRate || prev.primaryPassRate,
            secondaryPassRate:
              schoolSettings.secondaryPassingRate || prev.secondaryPassRate,
            academicYear: schoolSettings.year || prev.academicYear,
          }));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        name === "primaryPassRate" ||
        name === "secondaryPassRate" ||
        name === "academicYear"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const schoolSettings = {
        term: "Term 1",
        year: settings.academicYear,
        primaryPassingRate: settings.primaryPassRate,
        secondaryPassingRate: settings.secondaryPassRate,
        useEducationLevelRates: true,
        headteacherName: settings.headteacherName,
        deputyHeadteacherName: settings.deputyHeadteacherName,
        lastModified: Date.now(),
        modifiedBy: "admin",
      };

      const settingsResult = await db.updateSchoolSettings(
        schoolSettings as any,
      );

      const schoolData = {
        id: 1,
        schoolName: settings.schoolName,
        schoolAddress: settings.schoolAddress,
        logoUri: undefined,
      };

      const schoolResult = await db.updateSchool(schoolData);

      const cacheData = {
        schoolName: settings.schoolName,
        headteacherName: settings.headteacherName,
        deputyHeadteacherName: settings.deputyHeadteacherName,
        academicYear: settings.academicYear,
      };
      localStorage.setItem(
        "rankitz-school-settings",
        JSON.stringify(cacheData),
      );

      try {
        await addActivity({
          type: "class_added",
          title: "Settings updated",
          subtitle: `School settings saved`,
          timestamp: Date.now(),
          schoolId: schoolId || "default",
          userId: userId || undefined,
        });
      } catch (activityErr) {
        console.warn("Activity logging failed (non-critical):", activityErr);
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save settings";
      setError(errorMsg);
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const tabs: SettingsTab[] = [
    {
      id: "general",
      label: "Institution",
      description: "School information",
    },
    {
      id: "academic",
      label: "Academic",
      description: "Academic settings",
    },
    {
      id: "theme",
      label: "Appearance",
      description: "Display preferences",
    },
  ];

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
          zIndex: 40,
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
            onClick={() => navigate(-1)}
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
              Settings
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
              Manage Institution
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
        {/* Success Modal */}
        {success && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                background: t.surface,
                borderRadius: isMobile ? 12 : 16,
                padding: isMobile ? "28px 20px" : "40px",
                maxWidth: isMobile ? "calc(100% - 32px)" : 400,
                textAlign: "center",
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.3)`,
                animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div
                style={{
                  width: isMobile ? 52 : 64,
                  height: isMobile ? 52 : 64,
                  margin: "0 auto 16px",
                  background: t.accentLighter,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 26 : 32,
                  color: t.accent,
                }}
              >
                {Icons.check}
              </div>
              <h2
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 800,
                  color: t.text,
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.3px",
                }}
              >
                Settings Saved ✓
              </h2>
              <p
                style={{
                  fontSize: isMobile ? 12 : 14,
                  color: t.textMuted,
                  margin: "0 0 20px 0",
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                Your school settings have been saved successfully.
              </p>
              <button
                onClick={() => setSuccess("")}
                style={{
                  padding: isMobile ? "10px 0" : "12px 32px",
                  borderRadius: 8,
                  border: "none",
                  background: t.accent,
                  color: "#fff",
                  fontSize: isMobile ? 11 : 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: `0 4px 12px ${t.shadowMd}`,
                  letterSpacing: "-0.2px",
                  textTransform: "uppercase",
                  width: isMobile ? "100%" : "auto",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.accentDark;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    `0 6px 16px ${t.shadowLg}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.accent;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    `0 4px 12px ${t.shadowMd}`;
                }}
              >
                Got It!
              </button>
            </div>
          </div>
        )}

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

        {/* Tab Navigation */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: isMobile ? 6 : 8,
            marginBottom: 20,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: isMobile ? "10px 8px" : "12px 14px",
                background: activeTab === tab.id ? t.accent : t.surfaceAlt,
                border: `1.5px solid ${activeTab === tab.id ? t.accent : t.border}`,
                cursor: "pointer",
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: activeTab === tab.id ? "#fff" : t.textMuted,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 4 : 6,
                letterSpacing: "-0.2px",
                textTransform: "uppercase",
                borderRadius: 8,
                minHeight: isMobile ? 48 : 56,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    t.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = t.accent;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    t.border;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    t.textMuted;
                }
              }}
            >
              <span style={{ fontSize: isMobile ? 14 : 16 }}>
                {tab.id === "general" && "🏢"}
                {tab.id === "academic" && "📚"}
                {tab.id === "theme" && "🎨"}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Card */}
        <div
          style={{
            background: t.surface,
            border: `1.5px solid ${t.border}`,
            borderRadius: 12,
            padding: isMobile ? "18px" : "24px",
            marginBottom: 20,
            boxShadow: `0 2px 8px ${t.shadowMd}`,
            minHeight: 300,
          }}
        >
          {/* General Tab */}
          {activeTab === "general" && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 800,
                  color: t.text,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: `1.5px solid ${t.border}`,
                  letterSpacing: "-0.3px",
                }}
              >
                Institution Details
              </div>

              <div style={{ display: "grid", gap: isMobile ? 12 : 16 }}>
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
                    School Name *
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={settings.schoolName}
                    onChange={handleInputChange}
                    placeholder="e.g., Government School"
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
                      (e.currentTarget as HTMLInputElement).style.boxShadow =
                        "none";
                    }}
                  />
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
                    Full Address *
                  </label>
                  <textarea
                    name="schoolAddress"
                    value={settings.schoolAddress}
                    onChange={handleInputChange}
                    placeholder="Street, City, Province"
                    rows={isMobile ? 2 : 3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: isMobile ? "70px" : "90px",
                    }}
                    onFocus={(e) => {
                      (
                        e.currentTarget as HTMLTextAreaElement
                      ).style.borderColor = t.accent;
                      (
                        e.currentTarget as HTMLTextAreaElement
                      ).style.background = t.surface;
                      (e.currentTarget as HTMLTextAreaElement).style.boxShadow =
                        `0 0 0 3px ${t.accentLighter}`;
                    }}
                    onBlur={(e) => {
                      (
                        e.currentTarget as HTMLTextAreaElement
                      ).style.borderColor = t.border;
                      (
                        e.currentTarget as HTMLTextAreaElement
                      ).style.background = t.surfaceAlt;
                      (e.currentTarget as HTMLTextAreaElement).style.boxShadow =
                        "none";
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 14,
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="schoolPhone"
                      value={settings.schoolPhone}
                      onChange={handleInputChange}
                      placeholder="+260..."
                      style={inputStyle}
                      onFocus={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.accent;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surface;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          `0 0 0 3px ${t.accentLighter}`;
                      }}
                      onBlur={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.border;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surfaceAlt;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          "none";
                      }}
                    />
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="schoolEmail"
                      value={settings.schoolEmail}
                      onChange={handleInputChange}
                      placeholder="contact@school.edu"
                      style={inputStyle}
                      onFocus={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.accent;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surface;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          `0 0 0 3px ${t.accentLighter}`;
                      }}
                      onBlur={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.border;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surfaceAlt;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          "none";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {activeTab === "academic" && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 800,
                  color: t.text,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: `1.5px solid ${t.border}`,
                  letterSpacing: "-0.3px",
                }}
              >
                Academic Configuration
              </div>

              <div style={{ display: "grid", gap: isMobile ? 12 : 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 14,
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
                      Headteacher Name *
                    </label>
                    <input
                      type="text"
                      name="headteacherName"
                      value={settings.headteacherName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                      style={inputStyle}
                      onFocus={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.accent;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surface;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          `0 0 0 3px ${t.accentLighter}`;
                      }}
                      onBlur={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.border;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surfaceAlt;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          "none";
                      }}
                    />
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
                      Deputy Headteacher Name *
                    </label>
                    <input
                      type="text"
                      name="deputyHeadteacherName"
                      value={settings.deputyHeadteacherName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                      style={inputStyle}
                      onFocus={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.accent;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surface;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          `0 0 0 3px ${t.accentLighter}`;
                      }}
                      onBlur={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = t.border;
                        (e.currentTarget as HTMLInputElement).style.background =
                          t.surfaceAlt;
                        (e.currentTarget as HTMLInputElement).style.boxShadow =
                          "none";
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 14,
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
                      Primary Pass Rate *
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <input
                        type="number"
                        name="primaryPassRate"
                        value={settings.primaryPassRate}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={(e) => {
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.borderColor = t.accent;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.background = t.surface;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.boxShadow = `0 0 0 3px ${t.accentLighter}`;
                        }}
                        onBlur={(e) => {
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.borderColor = t.border;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.background = t.surfaceAlt;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.boxShadow = "none";
                        }}
                      />
                      <span
                        style={{
                          fontSize: isMobile ? 12 : 13,
                          fontWeight: 700,
                          color: t.accent,
                          flexShrink: 0,
                        }}
                      >
                        %
                      </span>
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
                      Secondary Pass Rate *
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <input
                        type="number"
                        name="secondaryPassRate"
                        value={settings.secondaryPassRate}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={(e) => {
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.borderColor = t.accent;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.background = t.surface;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.boxShadow = `0 0 0 3px ${t.accentLighter}`;
                        }}
                        onBlur={(e) => {
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.borderColor = t.border;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.background = t.surfaceAlt;
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.boxShadow = "none";
                        }}
                      />
                      <span
                        style={{
                          fontSize: isMobile ? 12 : 13,
                          fontWeight: 700,
                          color: t.accent,
                          flexShrink: 0,
                        }}
                      >
                        %
                      </span>
                    </div>
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
                    Academic Year *
                  </label>
                  <input
                    type="number"
                    name="academicYear"
                    value={settings.academicYear}
                    onChange={handleInputChange}
                    min="2000"
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
                      (e.currentTarget as HTMLInputElement).style.boxShadow =
                        "none";
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === "theme" && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 800,
                  color: t.text,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: `1.5px solid ${t.border}`,
                  letterSpacing: "-0.3px",
                }}
              >
                Appearance & Display
              </div>

              <div
                style={{
                  background: t.surfaceAlt,
                  border: `1.5px solid ${t.border}`,
                  borderRadius: 8,
                  padding: isMobile ? "14px 12px" : "16px 14px",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: isMobile ? 12 : 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 700,
                      color: t.text,
                      marginBottom: 6,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Theme Mode
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? 11 : 12,
                      color: t.textMuted,
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    Currently using{" "}
                    <strong>{dark ? "Dark" : "Light"} mode</strong>
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem(
                      "rankitz-theme",
                      dark ? "light" : "dark",
                    );
                    window.location.reload();
                  }}
                  style={{
                    padding: isMobile ? "9px 12px" : "10px 16px",
                    borderRadius: 6,
                    background: t.accent,
                    color: "#fff",
                    border: "none",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.2px",
                    textTransform: "uppercase",
                    boxShadow: `0 2px 6px ${t.shadowMd}`,
                    flexShrink: 0,
                    width: isMobile ? "100%" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.accentDark;
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      `0 4px 12px ${t.shadowMd}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.accent;
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      `0 2px 6px ${t.shadowMd}`;
                  }}
                >
                  Switch to {dark ? "Light" : "Dark"} Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
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
            All changes are saved to the database and will be reflected
            immediately.
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
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{
              flex: 1,
              padding: isMobile ? "11px 0" : "12px 0",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              letterSpacing: "-0.2px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.border;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 4px 12px ${t.shadowMd}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
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
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: isMobile ? "11px 0" : "12px 0",
              borderRadius: 8,
              border: "none",
              background: t.accent,
              color: "#fff",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
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
              if (!saving) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accentDark;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 8px 20px ${t.shadowLg}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accent;
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 4px 12px ${t.shadowMd}`;
              }
            }}
          >
            {saving ? (
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
                <span>Saving…</span>
              </>
            ) : (
              <>
                <div style={{ width: 12, height: 12, flexShrink: 0 }}>
                  {Icons.save}
                </div>
                <span>Save Settings</span>
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

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
