import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClasses, useLearners } from "../hooks/useClassManager";
import { useAuth } from "../context/AuthContext";
import { useOffline, useConnectionStatus } from "../context/OfflineContext";
import { offlineLogger } from "../lib/offlineLogger";
import {
  useActivityLog,
  getActivityIcon,
  getActivityColor,
} from "../hooks/useActivityLog";
import { formatRelativeTime } from "../lib/activityLogger";

// ─── Theme System ──────────────────────────────────────────────────
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
  topbar: "#1E293B",
  shadow: "rgba(0, 0, 0, 0.2)",
  shadowMd: "rgba(0, 0, 0, 0.3)",
  shadowLg: "rgba(0, 0, 0, 0.4)",
};

type Theme = typeof LIGHT;

// ─── Media Query Hook ──────────────────────────────────────────────────
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// ─── Responsive Layout Hook ────────────────────────────────────────────
function useResponsive() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return { isMobile, isTablet, isDesktop };
}

// ─── Icons ─────────────────────────────────────────────────────────────
const Icons = {
  students: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  classes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  scores: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M9 20h6"></path>
      <circle cx="12" cy="20" r="1"></circle>
    </svg>
  ),
  wifiOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
      <path d="M10.88 16.92v2.01h2.24v-2.01"></path>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
};

// ─── Stat Card Component (Mobile-Optimized) ────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  t,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  t: Theme;
}) {
  const { isMobile } = useResponsive();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? "16px" : "24px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered && !isMobile ? "translateY(-4px)" : "none",
        boxShadow:
          hovered && !isMobile
            ? `0 12px 24px ${t.shadowMd}`
            : `0 2px 6px ${t.shadow}`,
      }}
    >
      <div
        style={{
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48,
          borderRadius: 12,
          background: color + "15",
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }}>
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: isMobile ? 20 : 32,
          fontWeight: 800,
          color: t.text,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: isMobile ? 11 : 13,
          color: t.textMuted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Activity Item Component ────────────────────────────────────────
function ActivityItem({
  icon,
  color,
  title,
  subtitle,
  time,
  t,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  time: string;
  t: Theme;
}) {
  const { isMobile } = useResponsive();

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: isMobile ? "12px" : "16px",
        borderRadius: 12,
        background: t.surface,
        border: `1px solid ${t.border}`,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: isMobile ? 36 : 40,
          height: isMobile ? 36 : 40,
          borderRadius: "50%",
          background: color + "15",
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }}>
          {icon}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 700,
            color: t.text,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: isMobile ? 12 : 13,
            color: t.textMuted,
            marginBottom: 4,
          }}
        >
          {subtitle}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
          {time}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────
function QuickActionBtn({
  icon,
  color,
  label,
  subtitle,
  onClick,
  t,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  subtitle: string;
  onClick: () => void;
  t: Theme;
}) {
  const { isMobile } = useResponsive();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hovered && !isMobile ? color : t.border}`,
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? "14px 12px" : "20px",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 12 : 16,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered && !isMobile ? "translateY(-4px)" : "none",
        boxShadow:
          hovered && !isMobile
            ? `0 12px 24px ${t.shadowMd}`
            : `0 2px 6px ${t.shadow}`,
      }}
    >
      <div
        style={{
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48,
          borderRadius: 12,
          background: color + (hovered && !isMobile ? "25" : "15"),
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.3s",
        }}
      >
        <div style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }}>
          {icon}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: isMobile ? 13 : 15,
            fontWeight: 700,
            color: t.text,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: isMobile ? 11 : 12,
            color: t.textMuted,
            marginTop: 2,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
      </div>
      {!isMobile && (
        <div
          style={{
            color: t.textMuted,
            flexShrink: 0,
            width: 20,
            height: 20,
          }}
        >
          {Icons.arrowRight}
        </div>
      )}
    </button>
  );
}

// ─── Bottom Navigation (Mobile Only) ────────────────────────────────
function BottomNav({ t }: { t: Theme }) {
  const { isMobile } = useResponsive();
  const [active, setActive] = useState(0);

  if (!isMobile) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: t.surface,
        borderTop: `1px solid ${t.border}`,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        padding: "12px 8px",
        zIndex: 20,
      }}
    >
      {["Home", "Classes", "Learners", "More"].map((label, i) => (
        <button
          key={i}
          onClick={() => setActive(i)}
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            fontSize: 10,
            fontWeight: active === i ? 700 : 500,
            color: active === i ? t.accent : t.textMuted,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard Component ──────────────────────────────────────
export default function HomeScreen() {
  const navigate = useNavigate();
  const { username, schoolId } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  const { isOnline, pendingChanges } = useOffline();
  const connectionStatus = useConnectionStatus();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t = dark ? DARK : LIGHT;
  const { classes, loading: classesLoading } = useClasses();
  const { learners, loading: learnersLoading } = useLearners();
  const { activities, loading: activitiesLoading } = useActivityLog(
    schoolId || "default",
  );

  const [schoolName, setSchoolName] = useState("RankIT School");

  useEffect(() => {
    const s = localStorage.getItem("schoolName");
    if (s) setSchoolName(s);
  }, []);

  useEffect(() => {
    offlineLogger.log("data_change", "HomeScreen loaded", {
      connectionStatus: isOnline ? "online" : "offline",
      device: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    });
  }, [isOnline, isMobile, isTablet]);

  const tableRows = classes.slice(0, 5).map((cls) => ({
    name: cls.className,
    level: (cls as any).educationLevel ?? "—",
    students: learners.filter((l) => l.classId === cls.id).length,
  }));

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: t.bg,
        fontFamily:
          "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', sans-serif",
        color: t.text,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "12px 16px" : "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 16 : 20,
            fontWeight: 800,
            color: t.text,
          }}
        >
          RankIT
        </div>
        {!isMobile && (
          <>
            <button
              onClick={() => navigate("/ai-assistant")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1.5px solid ${t.border}`,
                background: t.accentBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: t.accent,
                fontSize: 18,
              }}
              title="AI Assistant"
            >
              🤖
            </button>
            <button
              onClick={() => navigate("/settings/school")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "transparent",
                border: "none",
                color: t.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 20, height: 20 }}>☰</div>
            </button>
          </>
        )}
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "12px" : "32px",
          paddingBottom: isMobile ? "80px" : "32px",
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          maxWidth: isMobile ? "100%" : 1400,
          margin: "0 auto",
        }}
      >
        {/* Welcome Banner */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <h1
            style={{
              fontSize: isMobile ? 20 : 32,
              fontWeight: 800,
              color: t.text,
              margin: "0 0 8px 0",
            }}
          >
            Welcome back, {username || "Admin"} 👋
          </h1>
          <p
            style={{
              fontSize: isMobile ? 13 : 15,
              color: t.textMuted,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {isMobile
              ? "Your school update"
              : `Here's what's happening at ${schoolName} today.`}
          </p>
        </div>

        {/* Stats Grid (Responsive) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr 1fr"
              : isTablet
                ? "repeat(3, 1fr)"
                : "repeat(4, 1fr)",
            gap: isMobile ? 12 : 20,
            marginBottom: isMobile ? 20 : 32,
          }}
        >
          <StatCard
            label={isMobile ? "Students" : "Total Students"}
            value={learners.length}
            icon={Icons.students}
            color={t.accent}
            t={t}
          />
          <StatCard
            label={isMobile ? "Classes" : "Active Classes"}
            value={classes.length}
            icon={Icons.classes}
            color="#3B82F6"
            t={t}
          />
          {/* Pass Rate and Scores stats removed */}
        </div>

        {/* AI School Summary */}
        <AISchoolSummaryCard
          schoolName={schoolName}
          totalClasses={classes.length}
          totalLearners={learners.length}
          tableRows={tableRows}
          t={t}
          isMobile={isMobile}
        />

        {/* Classes Section (Mobile: Stacked Cards | Desktop: Table) */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <h2
            style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 800,
              color: t.text,
              margin: "0 0 12px 0",
            }}
          >
            Classes
          </h2>

          {isMobile ? (
            // Mobile: Stacked card layout
            <div>
              {tableRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 12,
                    padding: "12px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, color: t.text }}
                  >
                    {row.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: t.textMuted,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          background: t.accentLighter,
                          color: t.accentText,
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {row.level}
                      </span>
                    </div>
                    <div>{row.students} students</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Table layout
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: t.surfaceAlt }}>
                    {["Class Name", "Level", "Students"].map((head) => (
                      <th
                        key={head}
                        style={{
                          padding: "12px 16px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: t.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: `2px solid ${t.borderSub}`,
                          textAlign: "left",
                        }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom:
                          i === tableRows.length - 1
                            ? "none"
                            : `1px solid ${t.borderSub}`,
                      }}
                    >
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 700,
                          color: t.text,
                        }}
                      >
                        {row.name}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: t.accentLighter,
                            color: t.accentText,
                            textTransform: "uppercase",
                          }}
                        >
                          {row.level}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: t.textSub }}>
                        {row.students}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <h2
            style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 800,
              color: t.text,
              margin: "0 0 12px 0",
            }}
          >
            Activity
          </h2>
          {activitiesLoading ? (
            <div style={{ textAlign: "center", color: t.textMuted }}>
              Loading...
            </div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: "center", color: t.textMuted }}>
              No recent activity
            </div>
          ) : (
            <div>
              {activities.slice(0, isMobile ? 3 : 5).map((activity) => (
                <ActivityItem
                  key={activity.id}
                  icon={getActivityIcon(activity.type)}
                  color={getActivityColor(activity.type, t)}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  time={formatRelativeTime(activity.timestamp)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2
            style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 800,
              color: t.text,
              margin: "0 0 12px 0",
            }}
          >
            Quick Actions
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(260px, 1fr))",
              gap: isMobile ? 12 : 20,
            }}
          >
            <QuickActionBtn
              icon={Icons.classes}
              color={t.accent}
              label="Add Class"
              subtitle="Create new class"
              onClick={() => navigate("/classes/add")}
              t={t}
            />
            <QuickActionBtn
              icon={Icons.students}
              color="#3B82F6"
              label="Enroll Student"
              subtitle="Register learner"
              onClick={() => navigate("/learners/add")}
              t={t}
            />
            {!isMobile && (
              <>
                <QuickActionBtn
                  icon={Icons.scores}
                  color={t.orange}
                  label="Test Scores"
                  subtitle="Enter marks"
                  onClick={() => navigate("/tests")}
                  t={t}
                />
                <QuickActionBtn
                  icon={Icons.reports}
                  color="#8B5CF6"
                  label="Reports"
                  subtitle="View analytics"
                  onClick={() => navigate("/reports")}
                  t={t}
                />
                <QuickActionBtn
                  icon="🤖"
                  color={t.accent}
                  label="AI Assistant"
                  subtitle="Chat with AI"
                  onClick={() => navigate("/ai-assistant")}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav t={t} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* Touch-friendly tap targets (min 48px) */
        button { min-height: 44px; }
        
        /* Smooth scroll on mobile */
        @media (max-width: 640px) {
          body { -webkit-user-select: none; }
          main { scroll-behavior: smooth; }
        }
      `}</style>
    </div>
  );
}
function AISchoolSummaryCard({
  schoolName,
  totalClasses,
  totalLearners,
  tableRows,
  t,
  isMobile,
}: {
  schoolName: string;
  totalClasses: number;
  totalLearners: number;
  tableRows: { name: string; level: string; students: number }[];
  t: Theme;
  isMobile: boolean;
}) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    const classBreakdown = tableRows
      .map((r) => `${r.name} (${r.level}, ${r.students} students)`)
      .join(", ");

    const prompt = `You are a Zambian school management assistant. Write a 2-3 sentence professional school overview summary for the headteacher's dashboard.

SCHOOL: ${schoolName}
TOTAL CLASSES: ${totalClasses}
TOTAL LEARNERS: ${totalLearners}
CLASSES: ${classBreakdown || "No classes yet"}

Write a warm, professional summary suitable for a school dashboard. Be specific about the numbers. Keep it concise.`;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(import.meta as any).env?.VITE_GROQ_API_KEY || ""}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.6,
          }),
        },
      );

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setSummary(data.choices?.[0]?.message?.content?.trim() || "");
      setGenerated(true);
    } catch (err) {
      setError("Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: t.surface,
        border: `1.5px solid ${t.accent}30`,
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? 14 : 20,
        marginBottom: isMobile ? 20 : 32,
        boxShadow: `0 2px 6px ${t.shadow}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: t.accentLighter,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🤖
          </div>
          <div>
            <div
              style={{
                fontSize: isMobile ? 13 : 14,
                fontWeight: 700,
                color: t.text,
              }}
            >
              AI School Summary
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
              Instant overview for headteacher
            </div>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: isMobile ? "7px 12px" : "8px 16px",
            borderRadius: 8,
            border: "none",
            background: loading ? t.border : t.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "..." : generated ? "🔄 Refresh" : "✨ Generate"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            background: t.redBg,
            color: t.red,
            padding: 10,
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: t.textMuted,
            fontSize: 13,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: `2px solid ${t.border}`,
              borderTopColor: t.accent,
              animation: "spin 0.8s linear infinite",
            }}
          />
          Generating summary...
        </div>
      )}

      {summary && !loading && (
        <p
          style={{
            marginTop: 14,
            fontSize: isMobile ? 13 : 14,
            color: t.text,
            lineHeight: 1.7,
            margin: "14px 0 0",
            fontWeight: 500,
          }}
        >
          {summary}
        </p>
      )}
    </div>
  );
}
