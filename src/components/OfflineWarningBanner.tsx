import React, { useState, useEffect } from "react";
import { useOffline } from "../context/OfflineContext";
import { useTheme } from "../hooks/useTheme";
import { AlertTriangle, X, Wifi, Database } from "lucide-react";

/**
 * OfflineWarningBanner Component - RankItZM v1.2.0
 * Shows a prominent banner when user loses internet connection
 * Allows user to dismiss the warning
 * Updated: March 2026 - Eastern Province Edition
 *
 * New Features:
 * - Auto-dismiss after 10 seconds
 * - Offline duration timer
 * - Animated connection status icon
 * - Better mobile responsiveness
 * - Enhanced accessibility
 */
export function OfflineWarningBanner() {
  const { t } = useTheme();
  const { isOffline, showOfflineWarning, setShowOfflineWarning } = useOffline();
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [offlineStartTime, setOfflineStartTime] = useState<number | null>(null);

  // Track offline duration
  useEffect(() => {
    if (isOffline && !offlineStartTime) {
      setOfflineStartTime(Date.now());
    } else if (!isOffline) {
      setOfflineStartTime(null);
      setOfflineDuration(0);
    }
  }, [isOffline, offlineStartTime]);

  // Update duration counter
  useEffect(() => {
    if (!isOffline || !offlineStartTime) return;

    const interval = setInterval(() => {
      setOfflineDuration(Math.floor((Date.now() - offlineStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOffline, offlineStartTime]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (isOffline && showOfflineWarning) {
      const timer = setTimeout(() => {
        setShowOfflineWarning(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, showOfflineWarning, setShowOfflineWarning]);

  if (!isOffline || !showOfflineWarning) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
        color: "#FFF",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        zIndex: 45,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        animation: "slideDown 0.3s ease-out",
      }}
      role="alert"
      aria-live="assertive"
      aria-label="Offline mode notification"
    >
      {/* Left: Icon + Message */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Animated Warning Icon */}
        <div
          style={{
            flexShrink: 0,
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          <AlertTriangle size={22} strokeWidth={2.5} />
        </div>

        {/* Message Content */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.4,
                letterSpacing: "0.3px",
              }}
            >
              🔴 You are offline
            </p>
            {offlineDuration > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.2)",
                  padding: "2px 8px",
                  borderRadius: 8,
                  letterSpacing: "0.5px",
                }}
              >
                {formatDuration(offlineDuration)}
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              opacity: 0.95,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            <Database
              size={13}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: 4,
              }}
            />
            Working with cached data. Changes will be saved locally and synced
            when online.
          </p>
        </div>
      </div>

      {/* Right: Dismiss Button */}
      <button
        onClick={() => setShowOfflineWarning(false)}
        style={{
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#FFF",
          cursor: "pointer",
          padding: "8px",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.15)";
        }}
        title="Dismiss (auto-dismisses in 10s)"
        aria-label="Dismiss offline warning"
      >
        <X size={18} strokeWidth={2.5} />
      </button>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 640px) {
          [role="alert"] {
            padding: 12px 16px !important;
            font-size: 12px !important;
          }
          
          [role="alert"] p:first-of-type {
            font-size: 13px !important;
          }
          
          [role="alert"] p:last-of-type {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}
