import React, { useState, useEffect, useRef } from "react";
import { useLearners, useClasses } from "../hooks/useClassManager";
import { v4 as uuidv4 } from "uuid";

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
  shadow: "rgba(0,0,0,0.2)",
  shadowMd: "rgba(0,0,0,0.3)",
  shadowLg: "rgba(0,0,0,0.4)",
};

// --- useResponsive hook ---
function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// --- useKeyboardOffset: tracks visible viewport height so content slides above keyboard ---
function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!("visualViewport" in window)) return;
    const vv = window.visualViewport!;
    const update = () => {
      const hidden = window.innerHeight - vv.height;
      setOffset(hidden > 50 ? hidden : 0); // only react when keyboard is clearly up
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return offset;
}

type Theme = typeof LIGHT;

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
}

type Mode = "quick" | "paste" | "csv";

export default function BulkAddModal({
  isOpen,
  onClose,
  classId,
}: BulkAddModalProps) {
  const { isMobile, isTablet } = useResponsive();
  const keyboardOffset = useKeyboardOffset();
  const contentRef = useRef<HTMLDivElement>(null);

  const [dark] = useState(() => {
    const saved = localStorage.getItem("rankitz-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const t = dark ? DARK : LIGHT;

  const { addLearner, learners } = useLearners();
  const { classes } = useClasses();

  const [mode, setMode] = useState<Mode>("quick");
  const [addedCount, setAddedCount] = useState(0);

  // Quick Add
  const [quickName, setQuickName] = useState("");
  const [quickGender, setQuickGender] = useState("male");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  // Paste
  const [pasteText, setPasteText] = useState("");
  const [parsedList, setParsedList] = useState<
    { name: string; phone: string; gender: string }[]
  >([]);
  const [pasteLoading, setPasteLoading] = useState(false);

  // CSV
  const [csvData, setCsvData] = useState<
    { name: string; phone: string; gender: string }[]
  >([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const selectedClass = classes.find((c) => c.id === classId);

  // Scroll active input into view when keyboard appears
  useEffect(() => {
    if (keyboardOffset > 0 && contentRef.current) {
      const focused = contentRef.current.querySelector(
        ":focus",
      ) as HTMLElement | null;
      if (focused)
        focused.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [keyboardOffset]);

  const parseList = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    const parsed = lines.map((line) => {
      let cleaned = line.replace(/^[\d.\-*\s]+/, "").trim();
      let phone = "";
      let gender = "other";

      // Split by comma FIRST to properly isolate fields
      const parts = cleaned.split(",").map((p) => p.trim());
      let name = parts[0] || "";

      // Process remaining parts for phone and gender
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].toLowerCase();

        // Check if it's a phone number
        if (part.match(/(\+?260\d{9}|0\d{9})/)) {
          phone = part;
        }
        // Check if it's gender
        else if (part === "m" || part === "male" || part === "m:") {
          gender = "male";
        } else if (part === "f" || part === "female" || part === "f:") {
          gender = "female";
        }
        // If not phone or gender, assume it's phone if nothing else matches
        else if (!phone && part.match(/\d/)) {
          phone = part;
        }
      }

      return { name, phone, gender };
    });
    setParsedList(parsed);
  };

  const handleQuickAdd = async () => {
    if (!quickName.trim()) return;
    setQuickLoading(true);
    try {
      const studentName = quickName.trim().toLowerCase();
      const isDuplicate = learners
        .filter((l) => l.classId === classId)
        .some((l) => l.name.toLowerCase() === studentName);
      if (!isDuplicate) {
        await addLearner({
          name: quickName.trim(),
          classId,
          gender: quickGender,
          parentPhone: quickPhone.trim(),
          syncId: uuidv4(),
        });
        setAddedCount((p) => p + 1);
        setQuickName("");
        setQuickGender("male");
        setQuickPhone("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickLoading(false);
    }
  };

  const handlePasteAddAll = async () => {
    if (!classId) {
      alert("Please select a class first");
      return;
    }
    setPasteLoading(true);
    try {
      let count = 0;
      for (const item of parsedList) {
        if (!item.name.trim()) continue;
        const isDuplicate = learners
          .filter((l) => l.classId === classId)
          .some((l) => l.name.toLowerCase() === item.name.trim().toLowerCase());
        if (!isDuplicate) {
          await addLearner({
            name: item.name.trim(),
            classId,
            gender: item.gender,
            parentPhone: item.phone.trim(),
            syncId: uuidv4(),
          });
          count++;
        }
      }
      setAddedCount((p) => p + count);
      setPasteText("");
      setParsedList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setPasteLoading(false);
    }
  };

  const handleCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        setCsvData(
          lines.slice(1).map((line) => {
            const parts = line.split(",").map((p) => p.trim());
            return {
              name: parts[0] || "",
              phone: parts[1] || "",
              gender: parts[2] || "other",
            };
          }),
        );
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVAddAll = async () => {
    setCsvLoading(true);
    try {
      let count = 0;
      for (const item of csvData) {
        if (!item.name.trim()) continue;
        const isDuplicate = learners
          .filter((l) => l.classId === classId)
          .some((l) => l.name.toLowerCase() === item.name.trim().toLowerCase());
        if (!isDuplicate) {
          await addLearner({
            name: item.name.trim(),
            classId,
            gender: item.gender,
            parentPhone: item.phone.trim(),
            syncId: uuidv4(),
          });
          count++;
        }
      }
      setAddedCount((p) => p + count);
      setCsvData([]);
    } catch (err) {
      console.error(err);
    } finally {
      setCsvLoading(false);
    }
  };

  if (!isOpen) return null;

  // Responsive modal geometry
  const isSmall = isMobile || isTablet;
  const modalWidth = isMobile ? "100%" : isTablet ? "92%" : "600px";
  const modalRadius = isMobile ? "20px 20px 0 0" : "14px";
  const modalMaxH = isMobile ? `calc(100% - ${keyboardOffset}px)` : "90vh";
  const inputPad = isSmall ? "14px 16px" : "11px 14px";
  const inputFont = isSmall ? 15 : 13;
  const btnPad = isSmall ? "14px 0" : "11px 0"; // ≥48px on mobile
  const labelFont = isSmall ? 13 : 12;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 200,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        style={{
          background: t.surface,
          borderRadius: modalRadius,
          width: modalWidth,
          maxWidth: isMobile ? "100%" : 600,
          maxHeight: modalMaxH,
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: isMobile ? "slideUp 0.3s ease" : "popIn 0.25s ease",
          display: "flex",
          flexDirection: "column",
          // Shift up when keyboard is open on mobile
          marginBottom: isMobile ? 0 : undefined,
          transition: "transform 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAG HANDLE — mobile only */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 4px",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: t.border,
              }}
            />
          </div>
        )}

        {/* HEADER */}
        <div
          style={{
            padding: isSmall ? "16px 20px" : "24px",
            borderBottom: `1.5px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: t.surface,
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: isSmall ? 16 : 18,
                fontWeight: 800,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              Bulk Add Students
            </div>
            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              📚 {selectedClass?.className} · {selectedClass?.educationLevel}
            </div>
            <div
              style={{
                fontSize: 10,
                color: t.textMuted,
                marginTop: 4,
                fontWeight: 500,
              }}
            >
              ✓ Added: {addedCount} students
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: t.surfaceAlt,
              border: "none",
              color: t.textMuted,
              width: 44,
              height: 44,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* CLASS BANNER */}
        <div style={{ padding: `12px ${isSmall ? 20 : 24}px 0` }}>
          {selectedClass ? (
            <div
              style={{
                background: t.accentLighter,
                border: `1.5px solid ${t.accent}`,
                borderLeft: `4px solid ${t.accent}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>✓</span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.accentText,
                    letterSpacing: "-0.2px",
                  }}
                >
                  ADDING TO: {selectedClass.className.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: t.accentText,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  {selectedClass.className} ({selectedClass.educationLevel})
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: t.redBg,
                border: `1.5px solid ${t.red}`,
                borderLeft: `4px solid ${t.red}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div
                  style={{ fontSize: 11, fontWeight: 700, color: t.redText }}
                >
                  NO CLASS SELECTED
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: t.redText,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  Go back and select a class first
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODE TABS */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: `16px ${isSmall ? 20 : 24}px`,
            borderBottom: `1.5px solid ${t.border}`,
            overflowX: "auto",
          }}
        >
          {[
            { id: "quick", label: "⚡ Quick Add" },
            { id: "paste", label: "📋 Paste List" },
            { id: "csv", label: "📊 CSV Upload" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as Mode)}
              style={{
                padding: isSmall ? "10px 14px" : "8px 12px",
                borderRadius: 8,
                border: `1.5px solid ${mode === tab.id ? t.accent : t.border}`,
                background: mode === tab.id ? t.accentLighter : "transparent",
                color: mode === tab.id ? t.accent : t.textMuted,
                fontSize: isSmall ? 13 : 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                minHeight: 44,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div
          style={{
            padding: isSmall ? "20px" : "24px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* ── QUICK ADD ── */}
          {mode === "quick" && (
            <div>
              <p
                style={{
                  fontSize: isSmall ? 13 : 12,
                  color: t.textMuted,
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                Add one student at a time. Perfect for registering a few
                students quickly.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: labelFont,
                    fontWeight: 700,
                    color: t.textMuted,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Student Name *
                </label>
                <input
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  placeholder="e.g., Chanda Mwale"
                  style={{
                    width: "100%",
                    padding: inputPad,
                    fontSize: inputFont,
                    background: t.surfaceAlt,
                    border: `1.5px solid ${t.border}`,
                    borderRadius: 8,
                    color: t.text,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    minHeight: 48,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: labelFont,
                    fontWeight: 700,
                    color: t.textMuted,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Gender
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  {["male", "female", "other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setQuickGender(g)}
                      style={{
                        padding: isSmall ? "12px 0" : "8px 0",
                        borderRadius: 6,
                        minHeight: 48,
                        border: `1.5px solid ${quickGender === g ? t.accent : t.border}`,
                        background:
                          quickGender === g ? t.accentLighter : "transparent",
                        color: quickGender === g ? t.accent : t.textMuted,
                        fontSize: isSmall ? 13 : 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textTransform: "capitalize",
                      }}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontSize: labelFont,
                    fontWeight: 700,
                    color: t.textMuted,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder="+260978123456"
                  style={{
                    width: "100%",
                    padding: inputPad,
                    fontSize: inputFont,
                    background: t.surfaceAlt,
                    border: `1.5px solid ${t.border}`,
                    borderRadius: 8,
                    color: t.text,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    minHeight: 48,
                  }}
                />
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={!quickName.trim() || quickLoading}
                style={{
                  width: "100%",
                  padding: btnPad,
                  borderRadius: 8,
                  border: "none",
                  background: t.accent,
                  color: "#fff",
                  fontSize: isSmall ? 14 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 52,
                  opacity: !quickName.trim() || quickLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {quickLoading ? "⏳ Adding..." : "➕ Add Student"}
              </button>
            </div>
          )}

          {/* ── PASTE LIST ── */}
          {mode === "paste" && (
            <div>
              <p
                style={{
                  fontSize: isSmall ? 13 : 12,
                  color: t.textMuted,
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                Paste a list of students (one per line).
                <br />
                e.g., <code>1. Chanda Mwale, +260978123456, M</code>
              </p>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: labelFont,
                    fontWeight: 700,
                    color: t.textMuted,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Student List
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    parseList(e.target.value);
                  }}
                  placeholder={
                    "1. Chanda Mwale\n2. Grace Nawa\n3. John Smith\n..."
                  }
                  style={{
                    width: "100%",
                    minHeight: isSmall ? 120 : 150,
                    padding: inputPad,
                    fontSize: inputFont,
                    background: t.surfaceAlt,
                    border: `1.5px solid ${t.border}`,
                    borderRadius: 8,
                    color: t.text,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                    resize: "vertical",
                  }}
                />
              </div>

              {parsedList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: labelFont,
                      fontWeight: 700,
                      color: t.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    Preview ({parsedList.length} students)
                  </div>
                  <div
                    style={{
                      maxHeight: 160,
                      overflowY: "auto",
                      background: t.surfaceAlt,
                      borderRadius: 8,
                      border: `1.5px solid ${t.border}`,
                      padding: 12,
                    }}
                  >
                    {parsedList.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 0",
                          borderBottom:
                            i < parsedList.length - 1
                              ? `1px solid ${t.border}`
                              : "none",
                          fontSize: isSmall ? 13 : 11,
                          color: t.text,
                        }}
                      >
                        {i + 1}. {item.name || "(empty)"}{" "}
                        {item.gender !== "other" && `· ${item.gender}`}{" "}
                        {item.phone && `· ${item.phone}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handlePasteAddAll}
                disabled={parsedList.length === 0 || pasteLoading}
                style={{
                  width: "100%",
                  padding: btnPad,
                  borderRadius: 8,
                  border: "none",
                  background: t.accent,
                  color: "#fff",
                  fontSize: isSmall ? 14 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 52,
                  opacity: parsedList.length === 0 || pasteLoading ? 0.6 : 1,
                }}
              >
                {pasteLoading
                  ? "⏳ Adding all..."
                  : `➕ Add All (${parsedList.length})`}
              </button>
            </div>
          )}

          {/* ── CSV UPLOAD ── */}
          {mode === "csv" && (
            <div>
              <p
                style={{
                  fontSize: isSmall ? 13 : 12,
                  color: t.textMuted,
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                Upload CSV file. Columns: <strong>Name</strong>, Phone
                (optional), Gender (optional)
              </p>

              <div
                style={{
                  border: `2px dashed ${dragOver ? t.accent : t.border}`,
                  borderRadius: 8,
                  padding: isSmall ? "24px 16px" : "32px",
                  textAlign: "center",
                  marginBottom: 16,
                  cursor: "pointer",
                  background: dragOver ? t.accentLighter : "transparent",
                  transition: "all 0.2s",
                  minHeight: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleCSVFile(f);
                }}
                onClick={() => document.getElementById("csv-input")?.click()}
              >
                <div style={{ fontSize: 28 }}>📤</div>
                <div
                  style={{
                    fontSize: isSmall ? 13 : 12,
                    fontWeight: 700,
                    color: t.text,
                  }}
                >
                  {isMobile
                    ? "Tap to browse CSV file"
                    : "Drag CSV here or click to browse"}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted }}>
                  .csv files supported
                </div>
              </div>

              <input
                id="csv-input"
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCSVFile(e.target.files[0]);
                }}
                style={{ display: "none" }}
              />

              {csvData.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: labelFont,
                      fontWeight: 700,
                      color: t.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    Preview ({csvData.length} students)
                  </div>
                  <div
                    style={{
                      maxHeight: 160,
                      overflowY: "auto",
                      background: t.surfaceAlt,
                      borderRadius: 8,
                      border: `1.5px solid ${t.border}`,
                      padding: 12,
                    }}
                  >
                    {csvData.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 0",
                          borderBottom:
                            i < csvData.length - 1
                              ? `1px solid ${t.border}`
                              : "none",
                          fontSize: isSmall ? 13 : 12,
                          color: t.text,
                        }}
                      >
                        {i + 1}. {item.name || "(empty)"}{" "}
                        {item.phone && `· ${item.phone}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleCSVAddAll}
                disabled={csvData.length === 0 || csvLoading}
                style={{
                  width: "100%",
                  padding: btnPad,
                  borderRadius: 8,
                  border: "none",
                  background: t.accent,
                  color: "#fff",
                  fontSize: isSmall ? 14 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 52,
                  opacity: csvData.length === 0 || csvLoading ? 0.6 : 1,
                }}
              >
                {csvLoading
                  ? "⏳ Adding all..."
                  : `➕ Add All (${csvData.length})`}
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: isSmall ? "16px 20px" : "16px 24px",
            borderTop: `1.5px solid ${t.border}`,
            display: "flex",
            gap: 10,
            // Stick above keyboard on mobile
            position: "sticky",
            bottom: 0,
            background: t.surface,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: btnPad,
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: isSmall ? 14 : 12,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 52,
            }}
          >
            Close
          </button>
          {addedCount > 0 && (
            <div
              style={{
                flex: 1,
                padding: btnPad,
                borderRadius: 8,
                border: "none",
                background: t.accentLighter,
                color: t.accent,
                fontSize: isSmall ? 14 : 12,
                fontWeight: 700,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✓ Added {addedCount}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popIn   { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
