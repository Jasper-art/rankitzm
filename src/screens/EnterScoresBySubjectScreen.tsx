import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useLearners,
  useSubjects,
  useTestScores,
  useClasses,
} from "../hooks/useClassManager";
import { getGradeLabel, isPassingGrade } from "../lib/grading";
import { addActivity } from "../lib/activityLogger";
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
  success: "#10B981",
  successBg: "#D1FAE5",
  successText: "#065F46",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  red: "#EF4444",
  redBg: "#FEE2E2",
  redText: "#991B1B",
  topbar: "#FFFFFF",
  shadow: "rgba(17, 24, 39, 0.04)",
  shadowMd: "rgba(17, 24, 39, 0.08)",
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
  success: "#34D399",
  successBg: "#064E3B",
  successText: "#A7F3D0",
  warning: "#FBBF24",
  warningBg: "#78350F",
  red: "#F87171",
  redBg: "#7F1D1D",
  redText: "#FECACA",
  topbar: "#1E293B",
  shadow: "rgba(0, 0, 0, 0.2)",
  shadowMd: "rgba(0, 0, 0, 0.3)",
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
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  trending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
};

interface NotificationState {
  type: "success" | "error" | null;
  message: string;
}

interface Stats {
  avg: number;
  highest: number;
  lowest: number;
  passCount: number;
  passRate: number;
}

export default function EnterScoresBySubjectScreen() {
  const navigate = useNavigate();
  const { testType, classId } = useParams();
  const { learners } = useLearners();
  const { subjects } = useSubjects();
  const { addScore } = useTestScores();
  const { classes } = useClasses();
  const { schoolId, userId } = useAuth();

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t = dark ? DARK : LIGHT;

  // Responsive state
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const classIdNum = parseInt(classId || "0");
  const classLearners = learners.filter((l) => l.classId === classIdNum);
  const classInfo = classes.find((c) => c.id === classIdNum);
  const classSubjects = subjects.filter((s) => s.classId === classIdNum);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [scores, setScores] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    type: null,
    message: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-select first subject on load
  useEffect(() => {
    if (selectedSubject === null && classSubjects.length > 0) {
      setSelectedSubject(classSubjects[0].id || null);
    }
  }, [classSubjects, selectedSubject]);

  const selectedSubjectInfo = useMemo(
    () => classSubjects.find((s) => s.id === selectedSubject),
    [selectedSubject, classSubjects],
  );

  const educationLevel =
    classInfo?.educationLevel?.toLowerCase() === "primary"
      ? "primary"
      : "secondary";
  const maxMark = selectedSubjectInfo?.maxMark || 100;

  const filteredSubjects = useMemo(() => {
    return classSubjects.filter((s) =>
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [classSubjects, searchTerm]);

  const currentTerm = "Term 1";
  const currentYear = new Date().getFullYear();
  const currentWeek = Math.ceil(new Date().getDate() / 7);

  const stats = useMemo((): Stats => {
    const values = classLearners
      .map((l) => parseInt(scores[l.id!] || "0"))
      .filter((s) => s > 0 && !isNaN(s));

    if (values.length === 0) {
      return { avg: 0, highest: 0, lowest: 0, passCount: 0, passRate: 0 };
    }

    const passThreshold = educationLevel === "primary" ? 40 : 50;
    const passCount = values.filter(
      (v) => (v / maxMark) * 100 >= passThreshold,
    ).length;

    return {
      avg: Math.round(values.reduce((a, b) => a + b) / values.length),
      highest: Math.max(...values),
      lowest: Math.min(...values),
      passCount,
      passRate: Math.round((passCount / values.length) * 100),
    };
  }, [scores, classLearners, educationLevel, maxMark]);

  const entriesCount = Object.values(scores).filter(
    (s) => s && s.trim(),
  ).length;

  const handleScoreChange = (learnerId: number, value: string) => {
    if (value === "") {
      setScores((prev) => ({ ...prev, [learnerId]: value }));
      return;
    }

    const numValue = parseInt(value);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxMark) {
      setScores((prev) => ({ ...prev, [learnerId]: value }));
    } else if (numValue > maxMark) {
      showNotification(
        "error",
        `Score cannot exceed ${maxMark} for ${selectedSubjectInfo?.subjectName}`,
      );
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: "" });
    }, 3000);
  };

  const handleSubmit = async (autoNext: boolean = true) => {
    if (!selectedSubject) {
      showNotification("error", "Please select a subject");
      return;
    }

    const hasScores = classLearners.some((learner) => scores[learner.id!]);
    if (!hasScores) {
      showNotification("error", "Please enter at least one score");
      return;
    }

    for (const learner of classLearners) {
      const score = scores[learner.id!];
      if (score && score.trim()) {
        const scoreValue = parseInt(score);
        if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > maxMark) {
          showNotification(
            "error",
            `Invalid score for ${learner.name}. Must be between 0 and ${maxMark}.`,
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      let savedCount = 0;

      for (const learner of classLearners) {
        const score = scores[learner.id!];
        if (score && score.trim()) {
          const scoreValue = parseInt(score);

          await addScore({
            learnerId: learner.id!,
            subjectId: selectedSubject,
            testType: testType || "weekly",
            term: currentTerm,
            year: currentYear,
            weekNumber: testType === "weekly" ? currentWeek : 0,
            score: scoreValue,
            dateEntered: Date.now(),
          });
          savedCount++;
        }
      }

      showNotification(
        "success",
        `Recorded ${savedCount} score(s) for ${selectedSubjectInfo?.subjectName}`,
      );

      await addActivity({
        type: "score_entered",
        title: "Scores entered",
        subtitle: `${selectedSubjectInfo?.subjectName} • ${classInfo?.className}`,
        timestamp: Date.now(),
        schoolId: schoolId || "default",
        userId: userId || undefined,
      });

      setScores({});

      if (autoNext) {
        const currentIndex = filteredSubjects.findIndex(
          (s) => s.id === selectedSubject,
        );
        if (currentIndex < filteredSubjects.length - 1) {
          setSelectedSubject(filteredSubjects[currentIndex + 1].id!);
          setTimeout(() => {
            firstInputRef.current?.focus();
          }, 50);
        } else {
          showNotification("success", "All visible subjects completed!");
        }
      }
    } catch (err) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Failed to save scores",
      );
    } finally {
      setLoading(false);
    }
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
      {/* Professional Topbar */}
      <header
        style={{
          background: t.topbar,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobileView ? "12px 16px" : "16px 24px",
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
            gap: isMobileView ? 8 : 16,
          }}
        >
          <button
            onClick={() => navigate("/tests")}
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
              minWidth: 36,
              minHeight: 36,
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
                fontSize: isMobileView ? 16 : 20,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              Data Entry
            </div>
            {!isMobileView && (
              <div
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  marginTop: 2,
                  fontWeight: 400,
                }}
              >
                {classInfo?.className} • By Subject
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        {isMobileView && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
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
              minWidth: 36,
              minHeight: 36,
            }}
          >
            <div style={{ width: 18, height: 18 }}>{Icons.menu}</div>
          </button>
        )}
      </header>

      {/* Master-Detail Layout */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: isMobileView ? "column" : "row",
        }}
      >
        {/* Left Sidebar: Subject List */}
        {(!isMobileView || showMobileMenu) && (
          <aside
            style={{
              width: isMobileView ? "100%" : 320,
              background: t.surface,
              borderRight: !isMobileView ? `1px solid ${t.border}` : "none",
              borderBottom: isMobileView ? `1px solid ${t.border}` : "none",
              display: "flex",
              flexDirection: "column",
              flexShrink: isMobileView ? 1 : 0,
              zIndex: 10,
              maxHeight: isMobileView ? "50vh" : "100%",
              overflowY: "auto",
            }}
          >
            <div
              style={{ padding: "16px", borderBottom: `1px solid ${t.border}` }}
            >
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
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: 6,
                    border: `1px solid ${t.border}`,
                    background: t.surfaceAlt,
                    color: t.text,
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = t.accent;
                    e.currentTarget.style.background = t.surface;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.background = t.surfaceAlt;
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  marginTop: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {filteredSubjects.length} Subjects
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubject(subject.id || null);
                      setScores({});
                      if (isMobileView) setShowMobileMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      border: "none",
                      borderLeft: `3px solid ${selectedSubject === subject.id ? t.accent : "transparent"}`,
                      background:
                        selectedSubject === subject.id
                          ? t.accentLighter
                          : "transparent",
                      color: t.text,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background 0.15s",
                      minHeight: 48,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSubject !== subject.id)
                        e.currentTarget.style.background = t.surfaceAlt;
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSubject !== subject.id)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight:
                            selectedSubject === subject.id ? 600 : 500,
                          color:
                            selectedSubject === subject.id
                              ? t.accentDark
                              : t.text,
                        }}
                      >
                        {subject.subjectName}
                      </div>
                      {!isMobileView && (
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              selectedSubject === subject.id
                                ? t.accentText
                                : t.textMuted,
                            marginTop: 2,
                          }}
                        >
                          Max: {subject.maxMark || 100}
                        </div>
                      )}
                    </div>
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
                  No subjects match your search.
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Right Content: Score Entry Grid */}
        <main
          style={{
            flex: 1,
            padding: isMobileView ? "20px 16px" : "32px 40px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {selectedSubject ? (
            <div
              style={{ width: "100%", maxWidth: isMobileView ? "100%" : 800 }}
            >
              {/* Subject Info Header */}
              <div
                style={{
                  marginBottom: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexDirection: isMobileView ? "column" : "row",
                  gap: isMobileView ? 12 : 0,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: isMobileView ? 18 : 24,
                      fontWeight: 700,
                      color: t.text,
                      letterSpacing: "-0.5px",
                      margin: 0,
                    }}
                  >
                    {selectedSubjectInfo?.subjectName}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: t.textMuted,
                      marginTop: 4,
                      margin: "4px 0 0 0",
                    }}
                  >
                    {classLearners.length} student
                    {classLearners.length !== 1 ? "s" : ""} • Max: {maxMark}
                  </p>
                </div>
              </div>

              {/* Live Statistics Cards - Hidden on mobile when no entries */}
              {entriesCount > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobileView
                      ? "repeat(2, 1fr)"
                      : "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: isMobileView ? 12 : 16,
                    marginBottom: 20,
                  }}
                >
                  <StatCard
                    label="Average"
                    value={stats.avg}
                    icon={Icons.trending}
                    color={t.accent}
                    bg={t.accentLighter}
                    t={t}
                  />
                  <StatCard
                    label="Highest"
                    value={stats.highest}
                    icon={Icons.check}
                    color={t.success}
                    bg={t.successBg}
                    t={t}
                  />
                  <StatCard
                    label="Lowest"
                    value={stats.lowest}
                    icon={Icons.alert}
                    color={t.red}
                    bg={t.redBg}
                    t={t}
                  />
                  <StatCard
                    label="Pass Rate"
                    value={`${stats.passRate}%`}
                    subtext={`${stats.passCount}/${entriesCount}`}
                    icon={Icons.check}
                    color={t.success}
                    bg={t.successBg}
                    t={t}
                  />
                </div>
              )}

              {/* Data Entry: Table on Desktop, Cards on Mobile */}
              {!isMobileView ? (
                // Desktop Table View
                <div
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: `0 4px 6px ${t.shadow}`,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: t.surfaceAlt,
                          borderBottom: `1px solid ${t.border}`,
                        }}
                      >
                        <th
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: t.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "12px 20px",
                            width: "40%",
                          }}
                        >
                          Student
                        </th>
                        <th
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: t.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "12px 20px",
                            width: "30%",
                          }}
                        >
                          Score
                        </th>
                        <th
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: t.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "12px 20px",
                            width: "30%",
                          }}
                        >
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classLearners.map((learner, index) => (
                        <ScoreTableRow
                          key={learner.id}
                          learner={learner}
                          index={index}
                          total={classLearners.length}
                          scores={scores}
                          onScoreChange={handleScoreChange}
                          educationLevel={educationLevel}
                          maxMark={maxMark}
                          t={t}
                          icons={Icons}
                          firstInputRef={
                            index === 0 ? firstInputRef : undefined
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Mobile Card View
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  {classLearners.map((learner, index) => (
                    <ScoreMobileCard
                      key={learner.id}
                      learner={learner}
                      scores={scores}
                      onScoreChange={handleScoreChange}
                      educationLevel={educationLevel}
                      maxMark={maxMark}
                      t={t}
                      icons={Icons}
                      firstInputRef={index === 0 ? firstInputRef : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: isMobileView ? "flex-end" : "space-between",
                  alignItems: isMobileView ? "flex-end" : "center",
                  flexDirection: isMobileView ? "column" : "row",
                  gap: isMobileView ? 8 : 12,
                }}
              >
                {!isMobileView && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: t.textMuted,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ width: 14, height: 14 }}>{Icons.info}</div>
                    Press{" "}
                    <kbd
                      style={{
                        background: t.surfaceAlt,
                        border: `1px solid ${t.border}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      Tab
                    </kbd>{" "}
                    to jump between rows. Stats update instantly.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    width: isMobileView ? "100%" : "auto",
                    flexDirection: isMobileView ? "column" : "row",
                  }}
                >
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={loading || entriesCount === 0}
                    style={{
                      padding: isMobileView ? "12px 16px" : "10px 16px",
                      borderRadius: 6,
                      border: `1px solid ${t.border}`,
                      background: t.surface,
                      color: t.text,
                      cursor:
                        loading || entriesCount === 0
                          ? "not-allowed"
                          : "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s",
                      opacity: loading || entriesCount === 0 ? 0.5 : 1,
                      flex: isMobileView ? 1 : "auto",
                      minHeight: isMobileView ? 44 : "auto",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && entriesCount > 0)
                        e.currentTarget.style.background = t.surfaceAlt;
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && entriesCount > 0)
                        e.currentTarget.style.background = t.surface;
                    }}
                  >
                    <div style={{ width: 16, height: 16 }}>{Icons.save}</div>
                    {!isMobileView && "Save Only"}
                  </button>

                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={loading || entriesCount === 0}
                    style={{
                      padding: isMobileView ? "12px 16px" : "10px 20px",
                      borderRadius: 6,
                      border: "none",
                      background: t.accent,
                      color: "#fff",
                      cursor:
                        loading || entriesCount === 0
                          ? "not-allowed"
                          : "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s",
                      opacity: loading || entriesCount === 0 ? 0.6 : 1,
                      boxShadow: `0 2px 4px ${t.shadowMd}`,
                      flex: isMobileView ? 1 : "auto",
                      minHeight: isMobileView ? 44 : "auto",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && entriesCount > 0) {
                        e.currentTarget.style.background = t.accentDark;
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && entriesCount > 0) {
                        e.currentTarget.style.background = t.accent;
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {loading
                      ? "Saving..."
                      : isMobileView
                        ? "Save & Next"
                        : "Save & Next Subject"}
                    {!loading && !isMobileView && (
                      <div style={{ width: 16, height: 16 }}>
                        {Icons.arrowRight}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: t.textMuted,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  marginBottom: 16,
                  opacity: 0.5,
                }}
              >
                {Icons.search}
              </div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  textAlign: "center",
                  paddingLeft: 20,
                  paddingRight: 20,
                }}
              >
                Select a subject from the list to begin entering scores.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Popup Notification */}
      {notification.type && (
        <PopupNotification notification={notification} t={t} icons={Icons} />
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
        input[type=number] { -moz-appearance: textfield; }
        
        @media (max-width: 768px) {
          button { -webkit-appearance: none; }
          input { -webkit-appearance: none; border-radius: 6px; }
        }
      `}</style>
    </div>
  );
}

// ==================== SCORE TABLE ROW COMPONENT ====================

interface ScoreTableRowProps {
  learner: any;
  index: number;
  total: number;
  scores: { [key: number]: string };
  onScoreChange: (learnerId: number, value: string) => void;
  educationLevel: "primary" | "secondary";
  maxMark: number;
  t: Theme;
  icons: any;
  firstInputRef?: React.RefObject<HTMLInputElement | null>;
}

function ScoreTableRow({
  learner,
  index,
  total,
  scores,
  onScoreChange,
  educationLevel,
  maxMark,
  t,
  icons,
  firstInputRef,
}: ScoreTableRowProps) {
  const scoreValue = scores[learner.id!];
  const hasScore = scoreValue && scoreValue.trim();
  const grade = hasScore
    ? getGradeLabel(parseInt(scoreValue), maxMark, educationLevel)
    : "";
  const isPass = hasScore
    ? isPassingGrade(parseInt(scoreValue), maxMark, educationLevel)
    : false;

  return (
    <tr
      style={{
        borderBottom: index < total - 1 ? `1px solid ${t.borderSub}` : "none",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = t.surfaceAlt)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      <td
        style={{
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 500,
          color: t.text,
        }}
      >
        {learner.name}
        <div
          style={{
            fontSize: 11,
            color: t.textMuted,
            marginTop: 2,
          }}
        >
          {learner.gender} • ID: {learner.id}
        </div>
      </td>
      <td style={{ padding: "12px 20px" }}>
        <div style={{ position: "relative", maxWidth: 120 }}>
          <input
            ref={firstInputRef}
            type="number"
            min="0"
            max={maxMark}
            value={scoreValue || ""}
            onChange={(e) => onScoreChange(learner.id!, e.target.value)}
            placeholder="—"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${
                scoreValue && parseInt(scoreValue) > maxMark
                  ? t.red + "60"
                  : hasScore
                    ? t.borderSub
                    : t.border
              }`,
              background:
                scoreValue && parseInt(scoreValue) > maxMark
                  ? t.redBg
                  : t.surface,
              color:
                scoreValue && parseInt(scoreValue) > maxMark ? t.red : t.text,
              fontSize: 15,
              fontWeight: 600,
              outline: "none",
              transition: "all 0.2s",
              textAlign: "right",
              paddingRight: "40px",
            }}
            onFocus={(e) => {
              const val = parseInt(scoreValue);
              if (val > maxMark) {
                e.currentTarget.style.borderColor = t.red;
              } else {
                e.currentTarget.style.borderColor = t.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accentLighter}`;
              }
            }}
            onBlur={(e) => {
              const val = parseInt(scoreValue);
              if (val > maxMark) {
                e.currentTarget.style.borderColor = t.red + "60";
              } else {
                e.currentTarget.style.borderColor = hasScore
                  ? t.borderSub
                  : t.border;
              }
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: t.textMuted,
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            /{maxMark}
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 20px" }}>
        {hasScore ? (
          parseInt(scoreValue) > maxMark ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: t.redBg,
                color: t.red,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${t.red}40`,
              }}
            >
              <div style={{ width: 12, height: 12 }}>{icons.alert}</div>
              Exceeds Max
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: isPass ? t.successBg : t.redBg,
                color: isPass ? t.successText : t.redText,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${isPass ? t.success + "40" : t.red + "40"}`,
              }}
            >
              Grade {grade}
            </div>
          )
        ) : (
          <span style={{ color: t.textMuted, fontSize: 13 }}>—</span>
        )}
      </td>
    </tr>
  );
}

// ==================== MOBILE CARD COMPONENT ====================

interface ScoreMobileCardProps {
  learner: any;
  scores: { [key: number]: string };
  onScoreChange: (learnerId: number, value: string) => void;
  educationLevel: "primary" | "secondary";
  maxMark: number;
  t: Theme;
  icons: any;
  firstInputRef?: React.RefObject<HTMLInputElement | null>;
}

function ScoreMobileCard({
  learner,
  scores,
  onScoreChange,
  educationLevel,
  maxMark,
  t,
  icons,
  firstInputRef,
}: ScoreMobileCardProps) {
  const scoreValue = scores[learner.id!];
  const hasScore = scoreValue && scoreValue.trim();
  const grade = hasScore
    ? getGradeLabel(parseInt(scoreValue), maxMark, educationLevel)
    : "";
  const isPass = hasScore
    ? isPassingGrade(parseInt(scoreValue), maxMark, educationLevel)
    : false;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: `0 2px 4px ${t.shadow}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: t.text,
            }}
          >
            {learner.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: t.textMuted,
              marginTop: 2,
            }}
          >
            {learner.gender} • ID: {learner.id}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: t.textMuted,
              marginBottom: 4,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Score
          </label>
          <div style={{ position: "relative" }}>
            <input
              ref={firstInputRef}
              type="number"
              min="0"
              max={maxMark}
              value={scoreValue || ""}
              onChange={(e) => onScoreChange(learner.id!, e.target.value)}
              placeholder="—"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: `1px solid ${
                  scoreValue && parseInt(scoreValue) > maxMark
                    ? t.red + "60"
                    : hasScore
                      ? t.borderSub
                      : t.border
                }`,
                background:
                  scoreValue && parseInt(scoreValue) > maxMark
                    ? t.redBg
                    : t.surface,
                color:
                  scoreValue && parseInt(scoreValue) > maxMark ? t.red : t.text,
                fontSize: 16,
                fontWeight: 600,
                outline: "none",
                transition: "all 0.2s",
                textAlign: "center",
                paddingRight: "44px",
              }}
              onFocus={(e) => {
                const val = parseInt(scoreValue);
                if (val > maxMark) {
                  e.currentTarget.style.borderColor = t.red;
                } else {
                  e.currentTarget.style.borderColor = t.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accentLighter}`;
                }
              }}
              onBlur={(e) => {
                const val = parseInt(scoreValue);
                if (val > maxMark) {
                  e.currentTarget.style.borderColor = t.red + "60";
                } else {
                  e.currentTarget.style.borderColor = hasScore
                    ? t.borderSub
                    : t.border;
                }
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: t.textMuted,
                fontSize: 13,
                pointerEvents: "none",
                fontWeight: 600,
              }}
            >
              /{maxMark}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 120 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: t.textMuted,
              marginBottom: 4,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Result
          </label>
          {hasScore ? (
            parseInt(scoreValue) > maxMark ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: t.redBg,
                  color: t.red,
                  fontSize: 13,
                  fontWeight: 700,
                  border: `1px solid ${t.red}40`,
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 14, height: 14 }}>{icons.alert}</div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: isPass ? t.successBg : t.redBg,
                  color: isPass ? t.successText : t.redText,
                  fontSize: 13,
                  fontWeight: 700,
                  border: `1px solid ${isPass ? t.success + "40" : t.red + "40"}`,
                }}
              >
                {grade}
              </div>
            )
          ) : (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                background: t.surfaceAlt,
                color: t.textMuted,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              —
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== STAT CARD COMPONENT ====================

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  t: Theme;
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  color,
  bg,
  t,
}: StatCardProps) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${color}30`,
        borderRadius: 8,
        padding: 16,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: `0 2px 4px ${t.shadow}`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: color + "20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 18, height: 18 }}>{icon}</div>
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: t.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: t.text,
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        {subtext && (
          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== POPUP NOTIFICATION COMPONENT ====================

interface PopupNotificationProps {
  notification: { type: "success" | "error" | null; message: string };
  t: Theme;
  icons: any;
}

function PopupNotification({ notification, t, icons }: PopupNotificationProps) {
  const isSuccess = notification.type === "success";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        left: "auto",
        maxWidth: "calc(100% - 48px)",
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${isSuccess ? t.success + "40" : t.red + "40"}`,
          borderLeft: `4px solid ${isSuccess ? t.success : t.red}`,
          borderRadius: 8,
          padding: "16px 20px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          minWidth: 300,
          maxWidth: 400,
          boxShadow: `0 10px 25px ${t.shadowMd}`,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            color: isSuccess ? t.success : t.red,
            flexShrink: 0,
          }}
        >
          {isSuccess ? icons.check : icons.alert}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              color: t.text,
              margin: 0,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {notification.message}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
