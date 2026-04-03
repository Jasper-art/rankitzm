import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { db, SubjectEntity, ClassEntity } from "../db";

const Ic = {
  back: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
        clipRule="evenodd"
      />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.829.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  ),
  subject: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.669 0-3.218-.51-4.5-1.385A7.968 7.968 0 009 4.804z" />
    </svg>
  ),
  class: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path d="M10.5 1.5H9.5V1h1v.5zM20 10.5V9.5H10V0h1v9.5H20z" />
    </svg>
  ),
  school: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  ),
  numbers: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path
        fillRule="evenodd"
        d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.889-1H15a3 3 0 01-6 6v-2a1 1 0 10-2 0v2H6a1 1 0 100 2h7.889a4 4 0 00-7.889-1v2a3.5 3.5 0 01-.5-6.98z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export default function EditSubjectScreen() {
  const navigate = useNavigate();
  const { classId, subjectId } = useParams();
  const { t } = useTheme();

  const [subjectData, setSubjectData] = useState<SubjectEntity | null>(null);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [subjectName, setSubjectName] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassEntity | null>(null);
  const [maxMark, setMaxMark] = useState("");
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  // Load subject and classes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const id = subjectId ? parseInt(subjectId, 10) : null;
        if (!id) {
          setLoading(false);
          return;
        }

        const [subject, allClasses] = await Promise.all([
          db.getSubject(id),
          db.getAllClasses(),
        ]);

        if (subject) {
          setSubjectData(subject);
          setSubjectName(subject.subjectName);
          setMaxMark(subject.maxMark?.toString() || "");

          const classForSubject = allClasses.find(
            (c) => c.id === subject.classId,
          );
          if (classForSubject) {
            setSelectedClass(classForSubject);
          }
        }

        setClasses(allClasses || []);
      } catch (error) {
        console.error("Error loading subject:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [subjectId]);

  // Validation
  const isPrimary = selectedClass?.educationLevel?.toLowerCase() === "primary";
  const maxMarkNum = maxMark.trim() ? parseInt(maxMark, 10) : null;
  const maxMarkValid = !isPrimary || (maxMarkNum !== null && maxMarkNum >= 10);

  const canSave =
    subjectName.trim() !== "" &&
    selectedClass !== null &&
    maxMarkValid &&
    !saving &&
    !loading;

  // Save changes
  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      if (subjectData && selectedClass) {
        const updated: SubjectEntity = {
          ...subjectData,
          subjectName: subjectName.trim(),
          classId: selectedClass.id!,
          maxMark: isPrimary ? maxMarkNum : null,
        };

        await db.updateSubject(updated);
        setShowSuccess(true);

        setTimeout(() => {
          navigate(`/classes/${classId || ""}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error saving subject:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: t.bg,
          color: t.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `3px solid ${t.border}`,
            borderTopColor: t.accent,
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ color: t.textMuted, fontSize: 14 }}>
          Loading subject details...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!subjectData) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: t.bg,
          color: t.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Subject not found
          </div>
          <button
            onClick={() => navigate(`/classes/${classId}`)}
            style={{
              marginTop: 16,
              background: t.accent,
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate(`/classes/${classId}`)}
          style={{
            background: t.surfaceAlt,
            border: `1px solid ${t.border}`,
            color: t.text,
            width: 40,
            height: 40,
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = t.border;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              t.surfaceAlt;
          }}
        >
          {Ic.back}
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>
          Edit Subject
        </h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* Header Card */}
          <div
            style={{
              background: t.accentBg,
              border: `1px solid ${t.accent}40`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: t.accent,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {Ic.edit}
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.accent,
                  marginBottom: 4,
                }}
              >
                Subject Information
              </div>
              <div style={{ fontSize: 12, color: t.accentText }}>
                Update the details for this subject
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.text,
                marginBottom: 16,
                marginTop: 0,
              }}
            >
              Subject Details
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Subject Name Field */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: t.textMuted,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Subject Name *
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      color: t.accent,
                      fontSize: 16,
                    }}
                  >
                    {Ic.subject}
                  </span>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Enter subject name"
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surfaceAlt,
                      color: t.text,
                      fontSize: 13,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor =
                        t.accent;
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor =
                        t.border;
                    }}
                  />
                </div>
              </div>

              {/* Class Dropdown */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: t.textMuted,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Select Class *
                </label>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surfaceAlt,
                      color: selectedClass ? t.text : t.textMuted,
                      fontSize: 13,
                      fontFamily: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        t.accent;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        t.border;
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <span style={{ color: t.accent }}>{Ic.class}</span>
                      <span>
                        {selectedClass?.className || "Select a class"}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        transform: classDropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0)",
                        transition: "transform 0.2s",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {classDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 6,
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: 10,
                        boxShadow: `0 4px 12px ${t.shadow}`,
                        zIndex: 10,
                        maxHeight: 280,
                        overflowY: "auto",
                      }}
                    >
                      {classes.map((cls) => (
                        <button
                          key={cls.id || cls.className}
                          onClick={() => {
                            setSelectedClass(cls);
                            setClassDropdownOpen(false);
                            // Clear max mark if switching from non-primary to primary
                            if (
                              !cls.educationLevel
                                .toLowerCase()
                                .includes("primary")
                            ) {
                              setMaxMark("");
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "none",
                            background:
                              selectedClass?.id === cls.id
                                ? t.accentBg
                                : "transparent",
                            color:
                              selectedClass?.id === cls.id ? t.accent : t.text,
                            textAlign: "left",
                            cursor: "pointer",
                            borderBottom: `1px solid ${t.border}`,
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedClass?.id !== cls.id) {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = t.surfaceAlt;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedClass?.id !== cls.id) {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "transparent";
                            }
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                              {cls.className}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                opacity: 0.7,
                                marginTop: 2,
                              }}
                            >
                              {cls.educationLevel.charAt(0).toUpperCase() +
                                cls.educationLevel.slice(1)}{" "}
                              • {cls.academicYear}
                            </div>
                          </div>
                          {selectedClass?.id === cls.id && (
                            <span style={{ color: t.accent }}>{Ic.check}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Max Marks Field (Primary Only) */}
              {isPrimary && (
                <div
                  style={{
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.textMuted,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Total Marks (Minimum 10) *
                  </label>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 12,
                        color: maxMarkValid ? t.accent : t.red,
                        fontSize: 16,
                      }}
                    >
                      {Ic.numbers}
                    </span>
                    <input
                      type="number"
                      value={maxMark}
                      onChange={(e) => setMaxMark(e.target.value)}
                      placeholder="Enter total marks"
                      min="10"
                      style={{
                        width: "100%",
                        padding: "12px 12px 12px 40px",
                        borderRadius: 10,
                        border: `1px solid ${maxMarkValid ? t.border : t.red}`,
                        background: t.surfaceAlt,
                        color: t.text,
                        fontSize: 13,
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = maxMarkValid ? t.accent : t.red;
                      }}
                      onBlur={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = maxMarkValid ? t.border : t.red;
                      }}
                    />
                  </div>
                  {!maxMarkValid && (
                    <div
                      style={{
                        fontSize: 11,
                        color: t.red,
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        animation: "slideDown 0.2s ease-out",
                      }}
                    >
                      {Ic.warning}
                      Please enter a valid number (at least 10)
                    </div>
                  )}
                  <style>{`
                    @keyframes slideDown {
                      from {
                        opacity: 0;
                        transform: translateY(-8px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                </div>
              )}
            </div>
          </div>

          {/* Selected Class Info Card */}
          {selectedClass && (
            <div
              style={{
                background: t.orangeBg,
                border: `1px solid ${t.orange}40`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                animation: "slideDown 0.3s ease-out",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: t.orange,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {Ic.info}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: t.orange,
                  }}
                >
                  Selected Class
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <ClassInfoRow
                  icon={Ic.class}
                  label="Class Name"
                  value={selectedClass.className}
                  color={t.orange}
                />
                <ClassInfoRow
                  icon={Ic.school}
                  label="Education Level"
                  value={
                    selectedClass.educationLevel.charAt(0).toUpperCase() +
                    selectedClass.educationLevel.slice(1)
                  }
                  color={t.orange}
                />
                <ClassInfoRow
                  icon={Ic.calendar}
                  label="Academic Year"
                  value={selectedClass?.academicYear?.toString() || ""}
                  color={t.orange}
                />
              </div>

              <style>{`
                @keyframes slideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-8px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "none",
                background: canSave ? t.accent : t.border,
                color: canSave ? "#fff" : t.textMuted,
                fontSize: 14,
                fontWeight: 700,
                cursor: canSave ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (canSave) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    `0 4px 12px ${t.shadow}`;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (canSave) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "none";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }
              }}
            >
              {saving ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: `2px solid #fff`,
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  {Ic.save}
                  Update Subject
                </>
              )}
            </button>

            {!canSave && (
              <div
                style={{
                  background: t.redBg,
                  border: `1px solid ${t.red}40`,
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  animation: "slideDown 0.2s ease-out",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                <div style={{ fontSize: 12, color: t.redText }}>
                  Please fill in all required fields correctly
                </div>
              </div>
            )}

            {showSuccess && (
              <div
                style={{
                  background: t.accentBg,
                  border: `1px solid ${t.accent}40`,
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  animation: "slideDown 0.2s ease-out",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                <div style={{ fontSize: 12, color: t.accentText }}>
                  Subject updated successfully!
                </div>
              </div>
            )}
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CLASS INFO ROW COMPONENT
// ============================================================
interface ClassInfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function ClassInfoRow({ icon, label, value, color }: ClassInfoRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
      }}
    >
      <span style={{ color, opacity: 0.7, fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, color, opacity: 0.8, minWidth: 80 }}>
        {label}:
      </span>
      <span
        style={{ fontSize: 12, fontWeight: 600, color, marginLeft: "auto" }}
      >
        {value}
      </span>
    </div>
  );
}
