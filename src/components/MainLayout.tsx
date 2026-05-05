import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  Users2,
  BookOpenCheck,
  PieChart,
  Settings2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Search,
  User,
  Menu,
  X,
  Calendar,
  Sparkles,
} from "lucide-react";
import { openDB, DBSchema, IDBPDatabase } from "idb";

// --- DATABASE TYPES & SCHEMA ---

export interface ClassEntity {
  id?: number;
  className: string;
  academicYear: number;
  subjectsOffered: string;
  maximumPupils: number | null;
  level: string;
  educationLevel: string;
  syncId: string;
}

export interface LearnerEntity {
  id?: number;
  name: string;
  classId: number;
  gender: string;
  parentPhone: string;
  syncId: string;
}

export interface SubjectEntity {
  id?: number;
  subjectName: string;
  subjectId: number;
  classId: number;
  maxMark: number | null;
  syncId: string;
}

export interface TestScoreEntity {
  learnerId: number;
  subjectId: number;
  testType: string;
  score: number;
  term: string;
  year: number;
  weekNumber: number;
  dateEntered: number;
}

export interface UserEntity {
  id?: number;
  username: string;
  hashedPassword: string;
  recoveryAnswer: string;
}

export interface SchoolSettingsEntity {
  id?: string;
  term: string;
  year: number;
  lastModified: number;
}

interface RankItSchema extends DBSchema {
  classes: {
    key: number;
    value: ClassEntity;
    indexes: { "by-year": number; "by-level": string };
  };
  learners: {
    key: number;
    value: LearnerEntity;
    indexes: { "by-class": number };
  };
  subjects: {
    key: number;
    value: SubjectEntity;
    indexes: { "by-class": number };
  };
  testScores: {
    key: [number, number, string, string, number, number];
    value: TestScoreEntity;
    indexes: {
      "by-learner": number;
      "by-subject": number;
      "by-test-type": string;
      "by-term-year": [string, number];
      "by-learner-term": [number, string, number];
    };
  };
  users: { key: number; value: UserEntity };
  schoolSettings: { key: string; value: SchoolSettingsEntity };
}

class RankItDatabase {
  private dbPromise: Promise<IDBPDatabase<RankItSchema>> | null = null;

  private getDB(): Promise<IDBPDatabase<RankItSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<RankItSchema>("RankItZM", 1, {
        upgrade(db: IDBPDatabase<RankItSchema>) {
          if (!db.objectStoreNames.contains("classes")) {
            const s = db.createObjectStore("classes", {
              keyPath: "id",
              autoIncrement: true,
            });
            s.createIndex("by-year", "academicYear");
            s.createIndex("by-level", "educationLevel");
          }
          if (!db.objectStoreNames.contains("learners")) {
            db.createObjectStore("learners", {
              keyPath: "id",
              autoIncrement: true,
            }).createIndex("by-class", "classId");
          }
          if (!db.objectStoreNames.contains("subjects")) {
            db.createObjectStore("subjects", {
              keyPath: "id",
              autoIncrement: true,
            }).createIndex("by-class", "classId");
          }
          if (!db.objectStoreNames.contains("testScores")) {
            const s = db.createObjectStore("testScores", {
              keyPath: [
                "learnerId",
                "subjectId",
                "testType",
                "term",
                "year",
                "weekNumber",
              ],
            });
            s.createIndex("by-learner", "learnerId");
            s.createIndex("by-subject", "subjectId");
            s.createIndex("by-test-type", "testType");
            s.createIndex("by-term-year", ["term", "year"]);
            s.createIndex("by-learner-term", ["learnerId", "term", "year"]);
          }
          if (!db.objectStoreNames.contains("users")) {
            db.createObjectStore("users", {
              keyPath: "id",
              autoIncrement: true,
            });
          }
          if (!db.objectStoreNames.contains("schoolSettings")) {
            db.createObjectStore("schoolSettings", { keyPath: "id" });
          }
        },
      });
    }
    return this.dbPromise!;
  }

  async getAllUsers(): Promise<UserEntity[]> {
    const db = await this.getDB();
    return db.getAll("users");
  }

  async getLatestSettings(): Promise<SchoolSettingsEntity | undefined> {
    const db = await this.getDB();
    const all = await db.getAll("schoolSettings");
    return all.sort(
      (a: SchoolSettingsEntity, b: SchoolSettingsEntity) =>
        b.lastModified - a.lastModified,
    )[0];
  }
}

const localDb = new RankItDatabase();

// --- useResponsive HOOK ---
function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// --- UI TYPES ---

interface UserProfile {
  name: string;
  role: string;
}

interface AcademicInfo {
  term: string;
  year: number | string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface MainLayoutProps {
  children?: React.ReactNode;
  isOnline?: boolean;
  user?: UserProfile;
  logout?: () => void;
}

// --- THEME ---
const LIGHT_THEME = {
  sidebarBg: "#1e1b4b",
  sidebarText: "#94a3b8",
  sidebarTextActive: "#ffffff",
  itemActive: "#6366f1",
  accentGreen: "#10b981",
  accentRed: "#f43f5e",
  headerBg: "rgba(255,255,255,0.85)",
  headerBorder: "#f1f5f9",
  headerText: "#1e293b",
  headerTextMuted: "#94a3b8",
  headerTextSub: "#64748b",
  searchBg: "#f1f5f9",
  searchText: "#1e293b",
  avatarBg: "#eef2ff",
  avatarColor: "#4f46e5",
  termBg: "#ecfdf5",
  termBorder: "#d1fae5",
  termText: "#065f46",
  divider: "#f1f5f9",
  toggleBg: "#f8fafc",
  mainBg: "#f8fafc",
  breadcrumbMuted: "#94a3b8",
  breadcrumbActive: "#4f46e5",
};

const DARK_THEME = {
  sidebarBg: "#0f0e23",
  sidebarText: "#94a3b8",
  sidebarTextActive: "#ffffff",
  itemActive: "#818cf8",
  accentGreen: "#10b981",
  accentRed: "#f43f5e",
  headerBg: "rgba(15,23,42,0.92)",
  headerBorder: "#1e293b",
  headerText: "#f1f5f9",
  headerTextMuted: "#64748b",
  headerTextSub: "#475569",
  searchBg: "#1e293b",
  searchText: "#f1f5f9",
  avatarBg: "#1e1b4b",
  avatarColor: "#818cf8",
  termBg: "#052e16",
  termBorder: "#064e3b",
  termText: "#34d399",
  divider: "#1e293b",
  toggleBg: "#1e293b",
  mainBg: "#0f172a",
  breadcrumbMuted: "#475569",
  breadcrumbActive: "#818cf8",
};

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Dashboard",
    icon: <LayoutDashboard size={19} />,
    path: "/home",
  },
  {
    id: "classes",
    label: "Class Management",
    icon: <School size={19} />,
    path: "/classes",
  },
  {
    id: "learners",
    label: "Learner Directory",
    icon: <Users2 size={19} />,
    path: "/learners",
  },
  {
    id: "tests",
    label: "Examinations",
    icon: <BookOpenCheck size={19} />,
    path: "/tests",
  },
  {
    id: "reports",
    label: "Academic Insights",
    icon: <PieChart size={19} />,
    path: "/reports",
  },
  {
    id: "ai-tools",
    label: "AI Teaching Tools",
    icon: <Sparkles size={19} />,
    path: "/ai-tools",
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: <Sparkles size={19} strokeWidth={2.5} />,
    path: "/ai-assistant",
  },
  {
    id: "settings",
    label: "System Config",
    icon: <Settings2 size={19} />,
    path: "/settings",
  },
];

const menuGroups = [
  { title: "Overview", items: navigationItems.slice(0, 3) },
  { title: "Academic Performance", items: navigationItems.slice(3, 5) },
  { title: "AI Tools", items: navigationItems.slice(5, 7) },
];
const systemGroup = navigationItems.slice(7, 8);

// Bottom tab bar shows only the 4 most-used nav items on mobile
const bottomTabItems = navigationItems.slice(0, 4);

// --- MAIN COMPONENT ---
export function MainLayout({
  children,
  isOnline = true,
  user,
  logout = () => {},
}: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    user || { name: "Loading...", role: "System Admin" },
  );
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo>({
    term: "Loading...",
    year: "...",
  });

  const [dark] = useState(
    () => localStorage.getItem("rankitz-theme") === "dark",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const t = dark ? DARK_THEME : LIGHT_THEME;

  // Responsive values
  const mainPadding = isMobile ? 12 : isTablet ? 20 : 40;
  const headerHeight = isMobile ? 56 : 80;
  const titleSize = isMobile ? 20 : 32;
  const bodySize = isMobile ? 13 : 14;

  // Auto-close sidebar when switching to mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile, isTablet]);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) {
          const users = await localDb.getAllUsers();
          if (users && users.length > 0) {
            setCurrentUser({ name: users[0].username, role: "Administrator" });
          } else {
            setCurrentUser({ name: "Setup User", role: "Initial Admin" });
          }
        }
        const settings = await localDb.getLatestSettings();
        if (settings) {
          setAcademicInfo({ term: settings.term, year: settings.year });
        } else {
          setAcademicInfo({
            term: "Term Not Set",
            year: new Date().getFullYear(),
          });
        }
      } catch {
        setCurrentUser({ name: "Offline Admin", role: "Local Mode" });
      }
    }
    fetchData();
  }, [user]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile || isTablet) setSidebarOpen(false);
  };

  // --- NAV ITEM (sidebar) ---
  const NavItem = ({ item }: { item: NavigationItem }) => {
    const active = isActive(item.path);
    return (
      <button
        onClick={() => handleNavigation(item.path)}
        style={{
          width: "calc(100% - 24px)",
          margin: "4px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          cursor: "pointer",
          border: "none",
          borderRadius: 12,
          background: active ? "rgba(99, 102, 241, 0.15)" : "transparent",
          color: active ? t.sidebarTextActive : t.sidebarText,
          fontSize: bodySize,
          fontWeight: active ? 600 : 500,
          transition: "all 0.2s",
          outline: "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: active ? t.itemActive : "inherit" }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </div>
        {active && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#818cf8",
              boxShadow: "0 0 8px rgba(129,140,248,0.8)",
            }}
          />
        )}
      </button>
    );
  };

  // --- BOTTOM TAB BAR (mobile only) ---
  const BottomTabBar = () => (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        background: dark
          ? "linear-gradient(180deg, #0f0e23 0%, #1e1b4b 100%)"
          : "linear-gradient(180deg, #1e1b4b 0%, #0f0e23 100%)",
        borderTop: "1px solid rgba(99,102,241,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 60,
        paddingBottom: 4,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {bottomTabItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active ? "#818cf8" : "rgba(148,163,184,0.45)",
              minHeight: 48,
              padding: "6px 0",
              position: "relative",
              transition: "color 0.2s",
            }}
          >
            {/* Active pill background */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  width: 44,
                  height: 30,
                  borderRadius: 10,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{item.icon}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: active ? 800 : 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {item.label.split(" ")[0]}
            </span>
            {/* Active top bar */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  width: 28,
                  height: 2.5,
                  background: "linear-gradient(90deg, #6366f1, #818cf8)",
                  borderRadius: "0 0 4px 4px",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div
      style={{
        background: t.mainBg,
        minHeight: "100vh",
        display: "flex",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        fontSize: bodySize,
      }}
    >
      {/* MOBILE/TABLET OVERLAY */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
        />
      )}

      {/* SIDEBAR — conditionally mounted (not just hidden) on mobile */}
      {(!isMobile || sidebarOpen) && (
        <aside
          style={{
            width: sidebarOpen ? 280 : 0,
            background: t.sidebarBg,
            display: "flex",
            flexDirection: "column",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 50,
            overflow: "hidden",
            position: isMobile || isTablet ? "fixed" : "relative",
            height: "100vh",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* BRANDING */}
          <div style={{ padding: "32px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                  boxShadow: "0 10px 15px -3px rgba(30, 27, 75, 0.5)",
                }}
              >
                <ShieldCheck color="white" size={24} strokeWidth={2.5} />
              </div>
              <div style={{ whiteSpace: "nowrap" }}>
                <span
                  style={{
                    fontSize: titleSize > 20 ? 20 : titleSize,
                    fontWeight: 800,
                    color: "white",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  RankItZM
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(129, 140, 248, 0.8)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Portal
                </span>
              </div>
            </div>
            {/* NATIONAL STRIPE */}
            <div
              style={{
                display: "flex",
                height: 3,
                width: "100%",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 24,
                opacity: 0.6,
              }}
            >
              <div style={{ flex: 1, background: "#15803d" }} />
              <div style={{ flex: 1, background: "#dc2626" }} />
              <div style={{ flex: 1, background: "#000000" }} />
              <div style={{ flex: 1, background: "#f97316" }} />
            </div>
          </div>

          {/* NAV LINKS */}
          <nav
            style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}
            className="scrollbar-hide"
          >
            {menuGroups.map((group, idx) => (
              <div key={idx} style={{ marginBottom: 32 }}>
                <div style={{ padding: "0 32px", marginBottom: 12 }}>
                  <h3
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "rgba(148, 163, 184, 0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                    }}
                  >
                    {group.title}
                  </h3>
                </div>
                {group.items.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            ))}
            <div style={{ padding: "0 32px", marginBottom: 12 }}>
              <h3
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "rgba(148, 163, 184, 0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "2.5px",
                }}
              >
                System
              </h3>
            </div>
            {systemGroup.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>

          {/* SIDEBAR FOOTER */}
          <div
            style={{
              padding: 20,
              margin: "0 16px 24px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isOnline ? t.accentGreen : t.accentRed,
                    boxShadow: isOnline ? `0 0 10px ${t.accentGreen}` : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(148, 163, 184, 0.6)",
                    textTransform: "uppercase",
                  }}
                >
                  {isOnline ? "Network Live" : "Offline"}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(148, 163, 184, 0.4)" }}>
                v1.2.0
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 12,
                background: "rgba(244, 63, 94, 0.1)",
                color: "#fca5a5",
                border: "1px solid rgba(244, 63, 94, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* TOP HEADER */}
        <header
          style={{
            height: headerHeight,
            background: isMobile
              ? dark
                ? "linear-gradient(135deg, #0f0e23 0%, #1e1b4b 100%)"
                : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
              : t.headerBg,
            backdropFilter: "blur(12px)",
            borderBottom: isMobile
              ? "1px solid rgba(99,102,241,0.2)"
              : `1px solid ${t.headerBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${mainPadding}px`,
            zIndex: 30,
            boxShadow: isMobile ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 12 : 24,
            }}
          >
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: isMobile ? 8 : 10,
                borderRadius: 12,
                background: isMobile ? "rgba(255,255,255,0.08)" : t.toggleBg,
                border: isMobile ? "1px solid rgba(255,255,255,0.1)" : "none",
                cursor: "pointer",
                color: isMobile ? "rgba(255,255,255,0.85)" : t.headerTextSub,
                minHeight: 48,
                minWidth: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Breadcrumb — desktop only */}
            {isDesktop && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: t.breadcrumbMuted }}>Main</span>
                <ChevronRight size={14} color={t.headerTextMuted} />
                <span style={{ color: t.breadcrumbActive }}>
                  {navigationItems.find((n) => isActive(n.path))?.label ||
                    "Dashboard"}
                </span>
              </div>
            )}
          </div>

          {/* Search bar — tablet & desktop only */}
          {!isMobile && (
            <div style={{ flex: 1, maxWidth: 480, margin: "0 32px" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  placeholder="Search learners or records..."
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 48px",
                    borderRadius: 16,
                    border: "none",
                    background: t.searchBg,
                    color: t.searchText,
                    outline: "none",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 8 : 16,
            }}
          >
            {/* Term badge — tablet & desktop only */}
            {!isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: t.termBg,
                  border: `1px solid ${t.termBorder}`,
                  borderRadius: 16,
                  color: t.termText,
                }}
              >
                <Calendar size={14} strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {academicInfo.term}, {academicInfo.year}
                </span>
              </div>
            )}

            {!isMobile && (
              <div style={{ width: 1, height: 32, background: t.divider }} />
            )}

            {/* User profile button + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  minHeight: 48,
                }}
              >
                {isDesktop && (
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: t.headerText,
                        margin: 0,
                      }}
                    >
                      {currentUser.name}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: t.headerTextMuted,
                        textTransform: "uppercase",
                        margin: 2,
                      }}
                    >
                      {currentUser.role}
                    </p>
                  </div>
                )}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: isMobile ? "rgba(255,255,255,0.1)" : t.avatarBg,
                    border: isMobile
                      ? "1px solid rgba(255,255,255,0.15)"
                      : `1px solid ${profileOpen ? t.avatarColor : t.avatarBg}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isMobile ? "rgba(255,255,255,0.9)" : t.avatarColor,
                    transition: "border-color 0.2s",
                  }}
                >
                  <User size={20} strokeWidth={2.5} />
                </div>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <>
                  {/* Click-away backdrop */}
                  <div
                    onClick={() => setProfileOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 90 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      width: 280,
                      background: dark ? "#1e293b" : "#ffffff",
                      border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 16,
                      boxShadow: dark
                        ? "0 20px 40px rgba(0,0,0,0.4)"
                        : "0 20px 40px rgba(15,23,42,0.12)",
                      zIndex: 100,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                        padding: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        <User size={24} strokeWidth={2} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          {currentUser.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.7)",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginTop: 2,
                          }}
                        >
                          {currentUser.role}
                        </div>
                      </div>
                    </div>

                    {/* Info rows */}
                    <div style={{ padding: "12px 0" }}>
                      {[
                        {
                          icon: <Calendar size={14} />,
                          label: "Academic Term",
                          value: `${academicInfo.term}, ${academicInfo.year}`,
                        },
                        {
                          icon: <ShieldCheck size={14} />,
                          label: "Access Level",
                          value: "Full Administrator",
                        },
                      ].map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 20px",
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: dark ? "#334155" : "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#6366f1",
                              flexShrink: 0,
                            }}
                          >
                            {row.icon}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: dark ? "#64748b" : "#94a3b8",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {row.label}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: dark ? "#f1f5f9" : "#1e293b",
                                marginTop: 1,
                              }}
                            >
                              {row.value}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Divider */}
                      <div
                        style={{
                          height: 1,
                          background: dark ? "#334155" : "#f1f5f9",
                          margin: "8px 0",
                        }}
                      />

                      {/* Settings link */}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/settings");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 20px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: dark ? "#cbd5e1" : "#374151",
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = dark
                            ? "#334155"
                            : "#f8fafc")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: dark ? "#334155" : "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6366f1",
                          }}
                        >
                          <Settings2 size={14} />
                        </div>
                        System Settings
                      </button>

                      {/* Divider */}
                      <div
                        style={{
                          height: 1,
                          background: dark ? "#334155" : "#f1f5f9",
                          margin: "8px 0",
                        }}
                      />

                      {/* Sign out */}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          navigate("/login");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 20px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#f43f5e",
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = dark
                            ? "#7f1d1d22"
                            : "#fff1f2")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: dark ? "#7f1d1d33" : "#fff1f2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#f43f5e",
                          }}
                        >
                          <LogOut size={14} />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: mainPadding,
            paddingBottom: isMobile ? mainPadding + 60 : mainPadding,
            background: t.mainBg,
          }}
          className="custom-scroll"
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {children || (
              <div
                style={{
                  padding: "40px",
                  color: "#94a3b8",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                Dashboard content will be dynamically loaded here.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BOTTOM TAB BAR — mobile only (conditionally mounted) */}
      {isMobile && <BottomTabBar />}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}

export default MainLayout;
