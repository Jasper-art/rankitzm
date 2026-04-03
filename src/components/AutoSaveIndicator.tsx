import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: number;
  error?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "inline";
}

/**
 * AutoSaveIndicator Component - RankItZM v1.2.0
 * Shows visual feedback of save status
 * Displays: Saving... → Saved ✓ → Fades away
 * Updated: March 2026 - Eastern Province Edition
 */
export function AutoSaveIndicator({
  status,
  lastSaved,
  error,
  position = "top-right",
}: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" message for 2 seconds then fade
  useEffect(() => {
    if (status === "saved") {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === "idle" && !showSaved) {
    return null;
  }

  const positionStyles = {
    "top-right": {
      position: "fixed" as const,
      top: 80,
      right: 20,
      zIndex: 40,
    },
    "bottom-right": {
      position: "fixed" as const,
      bottom: 20,
      right: 20,
      zIndex: 40,
    },
    "top-left": {
      position: "fixed" as const,
      top: 80,
      left: 20,
      zIndex: 40,
    },
    inline: {
      display: "inline-flex" as const,
      position: "relative" as const,
    },
  };

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div
      style={{
        ...positionStyles[position],
        animation: showSaved
          ? "fadeOut 0.5s ease-out 1.5s forwards"
          : "fadeIn 0.3s ease-out",
      }}
    >
      {/* Saving State */}
      {status === "saving" && (
        <div
          style={{
            background: "#DBEAFE",
            border: "1px solid #93C5FD",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Loader2
            size={16}
            style={{
              color: "#0284C7",
              animation: "spin 1s linear infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#0284C7",
            }}
          >
            💾 Saving...
          </span>
        </div>
      )}

      {/* Saved State */}
      {status === "saved" && showSaved && (
        <div
          style={{
            background: "#DCFCE7",
            border: "1px solid #86EFAC",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2
            size={16}
            style={{
              color: "#16A34A",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#16A34A",
            }}
          >
            ✅ Saved{lastSaved && ` (${formatTime(lastSaved)})`}
          </span>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle
            size={16}
            style={{
              color: "#DC2626",
            }}
          />
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#DC2626",
            }}
          >
            ⚠️ Save failed
            {error && <div style={{ fontSize: 11, opacity: 0.8 }}>{error}</div>}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to manage auto-save state
 * RankItZM v1.2.0 - March 2026
 */
export const useAutoSave = () => {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const saving = () => {
    setStatus("saving");
    setError("");
  };

  const saved = () => {
    setStatus("saved");
    setLastSaved(Date.now());
    setError("");
  };

  const failed = (errorMsg?: string) => {
    setStatus("error");
    setError(errorMsg || "Failed to save");
  };

  const reset = () => {
    setStatus("idle");
    setError("");
  };

  return {
    status,
    lastSaved,
    error,
    saving,
    saved,
    failed,
    reset,
  };
};
