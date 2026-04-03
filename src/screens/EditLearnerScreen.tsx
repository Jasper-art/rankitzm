import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLearners, useClasses } from "../hooks/useClassManager";
import { LIGHT, DARK, Theme } from "../styles/rankitz-colors";

export default function EditLearnerScreen() {
  const navigate = useNavigate();
  const { learnerId } = useParams();
  const { learners, updateLearner, loading: updating } = useLearners();
  const { classes } = useClasses();

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const t = dark ? DARK : LIGHT;

  const [formData, setFormData] = useState({
    name: "",
    classId: 0,
    gender: "male",
    parentPhone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (learnerId) {
      const learner = learners.find((l) => l.id === parseInt(learnerId));
      if (learner) {
        setFormData({
          name: learner.name,
          classId: learner.classId,
          gender: learner.gender,
          parentPhone: learner.parentPhone || "",
        });
      }
      setLoading(false);
    }
  }, [learnerId, learners]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "classId" ? parseInt(value) : value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!formData.name.trim()) throw new Error("Student name is required");
      if (!formData.classId) throw new Error("Please select a class");

      const existingLearner = learners.find(
        (l) => l.id === parseInt(learnerId!),
      );
      if (!existingLearner) throw new Error("Student not found");

      await updateLearner({
        ...existingLearner,
        name: formData.name.trim(),
        classId: formData.classId,
        gender: formData.gender,
        parentPhone: formData.parentPhone.trim(),
      });

      setSuccess("Student updated successfully!");
      setTimeout(() => navigate("/learners"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student");
    }
  };

  const icons = {
    back: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        width={18}
        height={18}
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    ),
    user: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={18}
        height={18}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    phone: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={18}
        height={18}
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    school: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width={18}
        height={18}
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          background: t.bg,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${t.border}`,
            borderTopColor: t.accent,
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: t.bg,
        color: t.text,
        fontFamily: "'Inter', sans-serif",
        flexDirection: "column",
      }}
    >
      {/* Zambia Institutional Top Bar */}
      <div style={{ display: "flex", height: 4, width: "100%" }}>
        {["#198A00", "#EF3340", "#1A1A1A", "#FF8200"].map((c) => (
          <div key={c} style={{ flex: 1, background: c }} />
        ))}
      </div>

      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          height: 72,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <button
            onClick={() => navigate("/learners")}
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              color: t.textSub,
              padding: 8,
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "0.2s",
            }}
          >
            {icons.back}
          </button>
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Edit Profile
            </h1>
            <p
              style={{
                fontSize: 12,
                color: t.textMuted,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Learner ID: #{learnerId}
            </p>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: isMobile ? "24px 16px" : "40px 24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1000,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 32,
          }}
        >
          {/* Left Side: Summary Card */}
          <div style={{ flex: "0 0 320px" }}>
            <div
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
                boxShadow: t.shadow,
                position: "sticky",
                top: 100,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: t.accentBg,
                  color: t.accent,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 800,
                }}
              >
                {formData.name ? formData.name.charAt(0).toUpperCase() : "S"}
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
                {formData.name || "Student Name"}
              </h3>
              <p
                style={{ fontSize: 13, color: t.textMuted, margin: "0 0 20px" }}
              >
                Active Learner
              </p>

              <div
                style={{
                  borderTop: `1px solid ${t.border}`,
                  paddingTop: 20,
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: t.textMuted, fontWeight: 600 }}>
                    Gender:
                  </span>
                  <span
                    style={{ fontWeight: 700, textTransform: "capitalize" }}
                  >
                    {formData.gender}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: t.textMuted, fontWeight: 600 }}>
                    Status:
                  </span>
                  <span style={{ color: t.accent, fontWeight: 700 }}>
                    Enrolled
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form Content */}
          <div style={{ flex: 1 }}>
            <form
              onSubmit={handleSubmit}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: t.shadow,
              }}
            >
              <div style={{ padding: "32px" }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    marginBottom: 24,
                    color: t.accent,
                  }}
                >
                  Primary Details
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 24,
                  }}
                >
                  <FormField label="Full Name" icon={icons.user} t={t}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Chanda Mwila"
                      style={inputStyle(t)}
                    />
                  </FormField>

                  <FormField label="Gender" t={t}>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      style={inputStyle(t)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </FormField>

                  <FormField label="Assign Class" icon={icons.school} t={t}>
                    <select
                      name="classId"
                      value={formData.classId}
                      onChange={handleInputChange}
                      style={inputStyle(t)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.className}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Parent Phone" icon={icons.phone} t={t}>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      placeholder="097..."
                      style={inputStyle(t)}
                    />
                  </FormField>
                </div>

                {error && (
                  <p
                    style={{
                      color: t.red,
                      fontSize: 13,
                      fontWeight: 600,
                      marginTop: 20,
                    }}
                  >
                    ⚠️ {error}
                  </p>
                )}
                {success && (
                  <p
                    style={{
                      color: t.accent,
                      fontSize: 13,
                      fontWeight: 600,
                      marginTop: 20,
                    }}
                  >
                    ✅ {success}
                  </p>
                )}
              </div>

              <div
                style={{
                  padding: "20px 32px",
                  background: t.surfaceAlt,
                  borderTop: `1px solid ${t.border}`,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate("/learners")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: "transparent",
                    color: t.textSub,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: t.accent,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: updating ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
                    transition: "0.2s",
                  }}
                >
                  {updating ? "Saving Changes..." : "Update Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        button:hover { filter: brightness(0.95); transform: translateY(-1px); }
        input:focus, select:focus { border-color: #0F766E !important; box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1) !important; outline: none; }
      `}</style>
    </div>
  );
}

// Helper Components
function FormField({
  label,
  icon,
  children,
  t,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  t: Theme;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: t.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: t.textMuted,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ width: "100%" }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle = (t: Theme): React.CSSProperties => ({
  width: "100%",
  padding: "12px 14px 12px 40px",
  borderRadius: 12,
  border: `1px solid ${t.border}`,
  background: t.surfaceAlt,
  color: t.text,
  fontSize: 14,
  fontWeight: 600,
  transition: "all 0.2s ease",
  fontFamily: "inherit",
});
