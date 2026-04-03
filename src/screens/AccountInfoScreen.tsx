import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from "../styles/rankitz-colors";

interface AccountInfo {
  username: string;
  email: string;
  role: string;
  joinDate: string;
  lastLogin: string;
  status: "Active" | "Inactive";
}

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

export default function AccountInfoScreen() {
  const navigate = useNavigate();
  const { username, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("closeSidebar", { detail: { from: "account" } }),
    );
  }, []);

  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    username: username || "Administrator",
    email: localStorage.getItem("userEmail") || "admin@rankitzm.zm",
    role: "School Administrator",
    joinDate: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString(),
    lastLogin:
      new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
    status: "Active",
  });

  const [editMode, setEditMode] = useState(false);
  const [editedInfo, setEditedInfo] = useState(accountInfo);
  const [passwordChange, setPasswordChange] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const t: Theme = dark ? DARK : LIGHT;
  const accentColor = t.accent;

  const handleSaveProfile = () => {
    setAccountInfo(editedInfo);
    localStorage.setItem("userEmail", editedInfo.email);
    setEditMode(false);
    setMessage("Profile updated!");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleChangePassword = () => {
    if (
      !passwordChange.current ||
      !passwordChange.new ||
      !passwordChange.confirm
    ) {
      setMessage("Please fill all fields");
      setMessageType("error");
      return;
    }
    if (passwordChange.new !== passwordChange.confirm) {
      setMessage("Passwords don't match");
      setMessageType("error");
      return;
    }
    if (passwordChange.new.length < 6) {
      setMessage("Password must be 6+ characters");
      setMessageType("error");
      return;
    }
    localStorage.setItem("userPassword", btoa(passwordChange.new));
    setPasswordChange({ current: "", new: "", confirm: "" });
    setShowPasswordForm(false);
    setMessage("Password changed!");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      logout();
      navigate("/login");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Delete account? Cannot undo!")) {
      if (window.confirm("Confirm deletion?")) {
        logout();
        localStorage.clear();
        navigate("/login");
      }
    }
  };

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
      {/* Header */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: isMobile ? "0 12px" : "0 32px",
          height: isMobile ? 64 : 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
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
            onClick={() => navigate("/settings")}
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              color: accentColor,
              cursor: "pointer",
              padding: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              width: isMobile ? 36 : 48,
              height: isMobile ? 36 : 48,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.accentLighter;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                accentColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                t.surfaceAlt;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                t.border;
            }}
          >
            ←
          </button>

          <div>
            <h1
              style={{
                fontSize: isMobile ? 16 : 20,
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              Account
            </h1>
            <p
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              Profile & Security
            </p>
          </div>
        </div>

        <button
          onClick={() => setDark(!dark)}
          style={{
            width: isMobile ? 36 : 48,
            height: isMobile ? 36 : 48,
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              t.accentLighter;
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              accentColor;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              t.surfaceAlt;
            (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;
          }}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile
            ? "16px 12px"
            : isTablet
              ? "24px 20px"
              : "40px 32px",
          overflowY: "auto",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Zambia Flag */}
        <div
          style={{
            display: "flex",
            height: 3,
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: isMobile ? 16 : 24,
          }}
        >
          {ZAMBIA_FLAG.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Alert */}
        {message && (
          <div
            style={{
              background: messageType === "success" ? t.accentBg : t.redBg,
              border: `1px solid ${messageType === "success" ? accentColor : t.red}40`,
              borderRadius: 12,
              padding: isMobile ? "12px 14px" : "16px 20px",
              fontSize: isMobile ? 12 : 13,
              color: messageType === "success" ? t.accentText : t.red,
              marginBottom: isMobile ? 16 : 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 600,
              animation: "slideDown 0.3s ease-out",
            }}
          >
            ✓ {message}
          </div>
        )}

        {/* Profile Card */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? 16 : 24,
            animation: "slideUp 0.4s ease-out backwards",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: isMobile ? 16 : 20,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 12 : 14,
              }}
            >
              <div
                style={{
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${accentColor}80, ${t.accentBg})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 700,
                  color: "#fff",
                  boxShadow: `0 8px 16px ${accentColor}20`,
                }}
              >
                {(accountInfo.username || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2
                  style={{
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {accountInfo.username}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: t.textMuted,
                    marginTop: 2,
                    fontWeight: 500,
                  }}
                >
                  {accountInfo.role}
                </p>
                <div
                  style={{
                    fontSize: 11,
                    color: accentColor,
                    fontWeight: 700,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ● {accountInfo.status}
                </div>
              </div>
            </div>

            {!editMode && (
              <button
                onClick={() => {
                  setEditMode(true);
                  setEditedInfo(accountInfo);
                }}
                style={{
                  padding: isMobile ? "8px 12px" : "10px 16px",
                  borderRadius: 8,
                  background: t.accentBg,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    accentColor;
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    t.accentBg;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    accentColor;
                }}
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {/* Profile Info */}
          {!editMode ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                    ? "1fr 1fr"
                    : "repeat(auto-fit, minmax(200px, 1fr))",
                gap: isMobile ? 12 : 16,
              }}
            >
              {[
                { label: "Username", value: accountInfo.username },
                { label: "Email", value: accountInfo.email },
                { label: "Role", value: accountInfo.role },
                { label: "Join Date", value: accountInfo.joinDate },
              ].map((field, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      fontWeight: 700,
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {field.label}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      color: t.text,
                      fontWeight: 600,
                    }}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                { label: "Username", key: "username", type: "text" },
                { label: "Email", key: "email", type: "email" },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      fontWeight: 700,
                      marginBottom: 6,
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={editedInfo[field.key as keyof AccountInfo]}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        [field.key]: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${t.border}`,
                      background: t.bg,
                      color: t.text,
                      fontSize: 13,
                      outline: "none",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor =
                        accentColor;
                      (e.currentTarget as HTMLInputElement).style.boxShadow =
                        `0 0 0 3px ${t.accentLighter}`;
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor =
                        t.border;
                      (e.currentTarget as HTMLInputElement).style.boxShadow =
                        "none";
                    }}
                  />
                </div>
              ))}

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px" : "12px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${accentColor}, ${t.accentDark || accentColor})`,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px" : "12px",
                    borderRadius: 8,
                    background: t.surfaceAlt,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.bg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.surfaceAlt;
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Section */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? 16 : 24,
            animation: "slideUp 0.4s ease-out 0.1s backwards",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              color: t.text,
              marginBottom: 14,
              letterSpacing: "-0.3px",
            }}
          >
            🔐 Security
          </h2>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              style={{
                width: "100%",
                padding: isMobile ? "10px" : "12px",
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  t.surfaceAlt;
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  accentColor;
                (e.currentTarget as HTMLButtonElement).style.color =
                  accentColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = t.bg;
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  t.border;
                (e.currentTarget as HTMLButtonElement).style.color = t.text;
              }}
            >
              🔑 Change Password
            </button>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 10,
                marginBottom: 12,
              }}
            >
              {[
                { label: "Current", key: "current" },
                { label: "New", key: "new" },
                { label: "Confirm", key: "confirm" },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      fontWeight: 700,
                      marginBottom: 6,
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="password"
                    value={
                      passwordChange[field.key as keyof typeof passwordChange]
                    }
                    onChange={(e) =>
                      setPasswordChange({
                        ...passwordChange,
                        [field.key]: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${t.border}`,
                      background: t.bg,
                      color: t.text,
                      fontSize: 13,
                      outline: "none",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor =
                        accentColor;
                      (e.currentTarget as HTMLInputElement).style.boxShadow =
                        `0 0 0 3px ${t.accentLighter}`;
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor =
                        t.border;
                      (e.currentTarget as HTMLInputElement).style.boxShadow =
                        "none";
                    }}
                  />
                </div>
              ))}

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
                <button
                  onClick={handleChangePassword}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px" : "12px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${accentColor}, ${t.accentDark || accentColor})`,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordChange({ current: "", new: "", confirm: "" });
                  }}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px" : "12px",
                    borderRadius: 8,
                    background: t.surfaceAlt,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.bg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      t.surfaceAlt;
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? 16 : 24,
            animation: "slideUp 0.4s ease-out 0.2s backwards",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              color: t.text,
              marginBottom: 14,
              letterSpacing: "-0.3px",
            }}
          >
            📤 Session
          </h2>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: isMobile ? "10px" : "12px",
              borderRadius: 8,
              background: t.orange,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            📤 Logout
          </button>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            background: t.redBg,
            border: `1px solid ${t.red}50`,
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "16px" : "24px",
            animation: "slideUp 0.4s ease-out 0.3s backwards",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              color: t.red,
              marginBottom: 10,
              letterSpacing: "-0.3px",
            }}
          >
            ⚠️ Danger Zone
          </h2>
          <p
            style={{
              fontSize: 12,
              color: t.red,
              marginBottom: 14,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            Deleting your account is permanent and cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            style={{
              width: "100%",
              padding: isMobile ? "10px" : "12px",
              borderRadius: 8,
              background: t.red,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            🗑️ Delete Account
          </button>
        </div>
      </main>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
      `}</style>
    </div>
  );
}
