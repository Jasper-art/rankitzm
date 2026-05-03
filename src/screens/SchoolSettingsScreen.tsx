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
  surfaceAlt: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  textSub: "#374151",
  textMuted: "#6B7280",
  accent: "#10B981",
  accentLight: "#D1FAE5",
  accentLighter: "#ECFDF5",
  accentDark: "#059669",
  red: "#EF4444",
  redBg: "#FEE2E2",
  redText: "#7F1D1D",
  infoBg: "#EFF6FF",
  infoText: "#0369A1",
  successBg: "#DCFCE7",
  successText: "#166534",
};

const DARK = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#334155",
  border: "#475569",
  text: "#F1F5F9",
  textSub: "#CBD5E1",
  textMuted: "#94A3B8",
  accent: "#10B981",
  accentLight: "#064E3B",
  accentLighter: "#052E16",
  accentDark: "#34D399",
  red: "#F87171",
  redBg: "#7F1D1D",
  redText: "#FCA5A5",
  infoBg: "#0C4A6E",
  infoText: "#7DD3FC",
  successBg: "#164E63",
  successText: "#86EFAC",
};

type Theme = typeof LIGHT;

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

  const [activeTab, setActiveTab] = useState("institution");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // All fields from activation screen + extra settings fields
  const [settings, setSettings] = useState({
    // Step 1 — School Info (from activation)
    schoolName: "",
    schoolAddress: "",
    schoolPhone: "",
    schoolEmail: "",

    // Step 2 — Admin Account (from activation)
    adminUsername: "",

    // Step 3 — Security (from activation)
    securityQuestion: "What is your mother's maiden name?",
    // Note: security answer is hashed in DB, so we only allow re-setting it
    newSecurityAnswer: "",

    // Academic settings
    headteacherName: "",
    deputyHeadteacherName: "",
    primaryPassRate: 50,
    secondaryPassRate: 40,
    academicYear: new Date().getFullYear(),

    // Extra contact
    adminEmail: "",
    adminPhone: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load school basic info (set during activation Step 1)
        const school = await db.getSchool(1);

        // Load school settings (academic info)
        const currentYear = new Date().getFullYear();
        const termsToTry = ["Term1", "Term2", "Term3"];
        let schoolSettings = null;
        for (const term of termsToTry) {
          schoolSettings = await db.getSchoolSettings(term, currentYear);
          if (schoolSettings) break;
        }

        // Load admin user (set during activation Step 2)
        const allUsers = await db.getAllUsers();
        const adminUser = allUsers[0]; // First user created during activation

        // Load cached extra settings
        const cached = localStorage.getItem("rankitz-school-settings");
        let cachedData: any = {};
        if (cached) {
          try {
            cachedData = JSON.parse(cached);
          } catch (e) {}
        }

        setSettings((prev) => ({
          ...prev,

          // From activation Step 1 — School Info
          schoolName:
            school?.schoolName || cachedData.schoolName || prev.schoolName,
          schoolAddress: school?.schoolAddress || prev.schoolAddress,
          schoolPhone:
            school?.schoolPhone || cachedData.schoolPhone || prev.schoolPhone,
          schoolEmail:
            school?.schoolEmail || cachedData.schoolEmail || prev.schoolEmail,

          // From activation Step 2 — Admin Account
          adminUsername:
            adminUser?.username ||
            cachedData.adminUsername ||
            prev.adminUsername,

          // From activation Step 3 — Security Question
          securityQuestion:
            cachedData.securityQuestion || prev.securityQuestion,

          // From academic settings
          headteacherName:
            schoolSettings?.headteacherName ||
            cachedData.headteacherName ||
            prev.headteacherName,
          deputyHeadteacherName:
            schoolSettings?.deputyHeadteacherName ||
            cachedData.deputyHeadteacherName ||
            prev.deputyHeadteacherName,
          primaryPassRate:
            schoolSettings?.primaryPassingRate || prev.primaryPassRate,
          secondaryPassRate:
            schoolSettings?.secondaryPassingRate || prev.secondaryPassRate,
          academicYear: schoolSettings?.year || prev.academicYear,

          // Extra cached
          adminEmail: cachedData.adminEmail || prev.adminEmail,
          adminPhone: cachedData.adminPhone || prev.adminPhone,
        }));
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      // Save academic/school settings
      const schoolSettings = {
        term: "Term1",
        year: settings.academicYear,
        primaryPassingRate: settings.primaryPassRate,
        secondaryPassingRate: settings.secondaryPassRate,
        useEducationLevelRates: true,
        headteacherName: settings.headteacherName,
        deputyHeadteacherName: settings.deputyHeadteacherName,
        lastModified: Date.now(),
        modifiedBy: settings.adminUsername || "admin",
      };
      await db.updateSchoolSettings(schoolSettings as any);

      // Save school info
      const schoolData = {
        id: 1,
        schoolName: settings.schoolName,
        schoolAddress: settings.schoolAddress,
        schoolPhone: settings.schoolPhone,
        schoolEmail: settings.schoolEmail,
        logoUri: undefined,
      };
      await db.updateSchool(schoolData);

      // Update admin username if changed
      const allUsers = await db.getAllUsers();
      const adminUser = allUsers[0];
      if (adminUser && adminUser.username !== settings.adminUsername) {
        // Check the new username isn't taken by another user
        const existing = await db.getUserByUsername(settings.adminUsername);
        if (existing && existing.id !== adminUser.id) {
          setError("That username is already taken. Please choose another.");
          setSaving(false);
          return;
        }
        await db.updateUser({
          ...adminUser,
          username: settings.adminUsername.trim(),
        });
      }

      // Cache everything for quick retrieval
      const cacheData = {
        schoolName: settings.schoolName,
        schoolPhone: settings.schoolPhone,
        schoolEmail: settings.schoolEmail,
        headteacherName: settings.headteacherName,
        deputyHeadteacherName: settings.deputyHeadteacherName,
        academicYear: settings.academicYear,
        adminUsername: settings.adminUsername,
        adminEmail: settings.adminEmail,
        adminPhone: settings.adminPhone,
        securityQuestion: settings.securityQuestion,
      };
      localStorage.setItem(
        "rankitz-school-settings",
        JSON.stringify(cacheData),
      );
      localStorage.setItem("rankit_school_name", settings.schoolName);

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
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save settings";
      setError(errorMsg);
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    background: t.surface,
    border: `0.5px solid ${t.border}`,
    borderRadius: "6px",
    fontSize: "14px",
    color: t.text,
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: t.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "0.5rem",
  };

  const focusHandlers = (bgOverride?: string) => ({
    onFocus: (e: React.FocusEvent<any>) => {
      e.currentTarget.style.borderColor = t.accent;
      e.currentTarget.style.background = bgOverride || t.surfaceAlt;
    },
    onBlur: (e: React.FocusEvent<any>) => {
      e.currentTarget.style.borderColor = t.border;
      e.currentTarget.style.background = t.surface;
    },
  });

  const tabs = [
    { id: "institution", label: "Institution" },
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
    { id: "academic", label: "Academic" },
    { id: "appearance", label: "Appearance" },
  ];

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
      }}
    >
      {/* Header */}
      <header
        style={{
          background: t.surface,
          borderBottom: `0.5px solid ${t.border}`,
          padding: isMobile ? "1rem 1.25rem" : "1.25rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: `0.5px solid ${t.border}`,
              width: "40px",
              height: "40px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.textMuted,
              transition: "all 0.2s",
              fontSize: "18px",
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
            ←
          </button>
          <div>
            <h1
              style={{
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: 500,
                color: t.text,
                margin: 0,
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: t.textMuted,
                margin: "0.25rem 0 0 0",
              }}
            >
              Manage your institution and admin profile
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "1.5rem 1.25rem" : "2rem",
          overflowY: "auto",
          maxWidth: isMobile ? "100%" : "1000px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: t.redBg,
              border: `0.5px solid ${t.red}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              fontSize: "13px",
              color: t.redText,
              fontWeight: 500,
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
            }}
          >
            <span style={{ flexShrink: 0, fontSize: "16px" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div
            style={{
              background: t.successBg,
              border: `0.5px solid ${t.accent}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              fontSize: "13px",
              color: t.successText,
              fontWeight: 500,
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
            }}
          >
            <span style={{ flexShrink: 0, fontSize: "16px" }}>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: isMobile ? "0" : "0",
            borderBottom: `0.5px solid ${t.border}`,
            marginBottom: "2rem",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: isMobile ? "0.75rem 1rem" : "1rem 1.5rem",
                border: "none",
                background: "transparent",
                color: activeTab === tab.id ? t.accent : t.textMuted,
                fontWeight: activeTab === tab.id ? 500 : 400,
                fontSize: isMobile ? "12px" : "14px",
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid ${t.accent}`
                    : `2px solid transparent`,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── INSTITUTION TAB (Activation Step 1) ── */}
        {activeTab === "institution" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <label style={labelStyle}>School Name</label>
              <input
                type="text"
                name="schoolName"
                value={settings.schoolName}
                onChange={handleInputChange}
                placeholder="e.g. Lusaka Central High"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                name="schoolPhone"
                value={settings.schoolPhone}
                onChange={handleInputChange}
                placeholder="+260..."
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
              <label style={labelStyle}>Physical Address</label>
              <textarea
                name="schoolAddress"
                value={settings.schoolAddress}
                onChange={handleInputChange}
                placeholder="Complete location address..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                name="schoolEmail"
                value={settings.schoolEmail}
                onChange={handleInputChange}
                placeholder="school@example.com"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB (Activation Step 2) ── */}
        {activeTab === "account" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            {/* Info notice */}
            <div
              style={{
                gridColumn: isMobile ? "1" : "1 / -1",
                background: t.infoBg,
                border: `0.5px solid ${t.accent}`,
                borderRadius: "8px",
                padding: "1rem",
                fontSize: "13px",
                color: t.infoText,
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ flexShrink: 0 }}>ℹ️</span>
              <span>
                This is the admin account created during activation. Changing
                the username here updates it in the database immediately on
                save.
              </span>
            </div>

            <div>
              <label style={labelStyle}>Administrative Username</label>
              <input
                type="text"
                name="adminUsername"
                value={settings.adminUsername}
                onChange={handleInputChange}
                placeholder="Username"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Admin Email</label>
              <input
                type="email"
                name="adminEmail"
                value={settings.adminEmail}
                onChange={handleInputChange}
                placeholder="admin@school.com"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Admin Phone</label>
              <input
                type="tel"
                name="adminPhone"
                value={settings.adminPhone}
                onChange={handleInputChange}
                placeholder="+260..."
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>
          </div>
        )}

        {/* ── SECURITY TAB (Activation Step 3) ── */}
        {activeTab === "security" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            {/* Warning notice */}
            <div
              style={{
                background: t.infoBg,
                border: `0.5px solid ${t.accent}`,
                borderRadius: "8px",
                padding: "1rem",
                fontSize: "13px",
                color: t.infoText,
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ flexShrink: 0 }}>🔒</span>
              <span>
                Your security answer is stored as a one-way hash and cannot be
                displayed. You can update the question and set a new answer
                below. Leave the answer field blank to keep the existing one.
              </span>
            </div>

            <div>
              <label style={labelStyle}>Security Question</label>
              <select
                name="securityQuestion"
                value={settings.securityQuestion}
                onChange={handleInputChange}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  cursor: "pointer",
                }}
                {...focusHandlers()}
              >
                <option>What is your mother's maiden name?</option>
                <option>What was the name of your first pet?</option>
                <option>In what city were you born?</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>New Security Answer</label>
              <input
                type="text"
                name="newSecurityAnswer"
                value={settings.newSecurityAnswer}
                onChange={handleInputChange}
                placeholder="Leave blank to keep existing answer"
                style={inputStyle}
                {...focusHandlers()}
              />
              <p
                style={{
                  fontSize: "11px",
                  color: t.textMuted,
                  marginTop: "0.4rem",
                  marginLeft: "0.25rem",
                }}
              >
                Case insensitive — will be hashed before saving.
              </p>
            </div>
          </div>
        )}

        {/* ── ACADEMIC TAB ── */}
        {activeTab === "academic" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <label style={labelStyle}>Headteacher Name</label>
              <input
                type="text"
                name="headteacherName"
                value={settings.headteacherName}
                onChange={handleInputChange}
                placeholder="Full name"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Deputy Headteacher</label>
              <input
                type="text"
                name="deputyHeadteacherName"
                value={settings.deputyHeadteacherName}
                onChange={handleInputChange}
                placeholder="Full name"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Primary Pass Rate (%)</label>
              <input
                type="number"
                name="primaryPassRate"
                value={settings.primaryPassRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Secondary Pass Rate (%)</label>
              <input
                type="number"
                name="secondaryPassRate"
                value={settings.secondaryPassRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>

            <div>
              <label style={labelStyle}>Academic Year</label>
              <input
                type="number"
                name="academicYear"
                value={settings.academicYear}
                onChange={handleInputChange}
                min="2000"
                style={inputStyle}
                {...focusHandlers()}
              />
            </div>
          </div>
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeTab === "appearance" && (
          <div
            style={{
              background: t.surfaceAlt,
              border: `0.5px solid ${t.border}`,
              borderRadius: "10px",
              padding: "2rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: isMobile ? "column" : "row",
              gap: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: t.text,
                  margin: "0 0 0.25rem 0",
                }}
              >
                Theme Mode
              </h3>
              <p style={{ fontSize: "12px", color: t.textMuted, margin: 0 }}>
                Currently using <strong>{dark ? "dark" : "light"} mode</strong>
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("rankitz-theme", dark ? "light" : "dark");
                window.location.reload();
              }}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                background: t.accent,
                color: "#fff",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                width: isMobile ? "100%" : "auto",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accentDark;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accent;
              }}
            >
              Switch to {dark ? "light" : "dark"} mode
            </button>
          </div>
        )}

        {/* Info Banner */}
        {activeTab !== "appearance" && (
          <div
            style={{
              background: t.infoBg,
              border: `0.5px solid ${t.accent}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "2rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
            }}
          >
            <span style={{ flexShrink: 0, fontSize: "16px" }}>ℹ️</span>
            <p
              style={{
                fontSize: "13px",
                color: t.infoText,
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              All changes are saved to the database and reflected immediately
              across the system.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              border: `0.5px solid ${t.border}`,
              background: "transparent",
              color: t.text,
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "13px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "all 0.2s",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              if (!saving)
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.surfaceAlt;
            }}
            onMouseLeave={(e) => {
              if (!saving)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: t.accent,
              color: "#fff",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              minWidth: isMobile ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              if (!saving)
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accentDark;
            }}
            onMouseLeave={(e) => {
              if (!saving)
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.accent;
            }}
          >
            {saving ? (
              <>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, textarea:focus, select:focus { outline: none; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}
