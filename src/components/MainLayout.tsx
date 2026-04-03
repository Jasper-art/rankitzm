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
const THEME = {
  sidebarBg: "#1e1b4b",
  sidebarText: "#94a3b8",
  sidebarTextActive: "#ffffff",
  itemActive: "#6366f1",
  accentGreen: "#10b981",
  accentRed: "#f43f5e",
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
    id: "settings",
    label: "System Config",
    icon: <Settings2 size={19} />,
    path: "/settings",
  },
];

const menuGroups = [
  { title: "Overview", items: navigationItems.slice(0, 3) },
  { title: "Academic Performance", items: navigationItems.slice(3, 5) },
];
const systemGroup = navigationItems.slice(5, 6);

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

  const t = THEME;

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
        height: 60,
        background: "#1e1b4b",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 60,
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
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active ? "#818cf8" : "rgba(148,163,184,0.6)",
              minHeight: 48,
              padding: "6px 0",
            }}
          >
            {item.icon}
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {item.label.split(" ")[0]}
            </span>
            {active && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: 24,
                  height: 2,
                  background: "#6366f1",
                  borderRadius: 2,
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
        background: "#f8fafc",
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
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${mainPadding}px`,
            zIndex: 30,
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
                background: "#f8fafc",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
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
                <span style={{ color: "#94a3b8" }}>Main</span>
                <ChevronRight size={14} color="#cbd5e1" />
                <span style={{ color: "#4f46e5" }}>Dashboard</span>
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
                    background: "#f1f5f9",
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
                  background: "#ecfdf5",
                  border: "1px solid #d1fae5",
                  borderRadius: 16,
                  color: "#065f46",
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
              <div style={{ width: 1, height: 32, background: "#f1f5f9" }} />
            )}

            {/* User profile button */}
            <button
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
              {/* Name + role — desktop only */}
              {isDesktop && (
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    {currentUser.name}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#94a3b8",
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
                  background: "#eef2ff",
                  border: "1px solid #e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4f46e5",
                }}
              >
                <User size={20} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: mainPadding,
            paddingBottom: isMobile ? mainPadding + 60 : mainPadding, // space for bottom tab bar
            background: "#f8fafc",
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
