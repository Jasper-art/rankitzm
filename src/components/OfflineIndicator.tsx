import React from "react";
import { useOffline } from "../context/OfflineContext";
import { useTheme } from "../hooks/useTheme";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

/**
 * OfflineIndicator Component - RankItZM v1.2.0
 * Displays online/offline status badge in the topbar
 * Shows green when online, red when offline, blue when syncing
 * Updated: March 2026 - Eastern Province Edition
 *
 * Improvements:
 * - Added spinning loader icon during sync
 * - Enhanced visual hierarchy with pulse animation
 * - Better color consistency with app theme
 * - Improved accessibility with ARIA labels
 */
export function OfflineIndicator() {
  const { t } = useTheme();
  const { isOnline, isOffline, syncingData, pendingChanges } = useOffline();

  // Determine display state
  const showIndicator = isOffline || syncingData || pendingChanges > 0;

  if (!showIndicator) {
    return null;
  }

  // Status colors matching RankItZM theme
  const statusColor = isOffline
    ? "#DC2626" // Red for offline
    : syncingData
      ? "#0284C7" // Blue for syncing
      : "#10B981"; // Green for online with pending

  const bgColor = isOffline
    ? "#FEE2E2" // Light red
    : syncingData
      ? "#DBEAFE" // Light blue
      : "#DCFCE7"; // Light green

  const borderColor = isOffline
    ? "#FECACA"
    : syncingData
      ? "#93C5FD"
      : "#86EFAC";

  const statusText = isOffline
    ? "OFFLINE"
    : syncingData
      ? "SYNCING"
      : "PENDING";

  const getAriaLabel = () => {
    if (isOffline) {
      return `Offline mode. ${pendingChanges} pending changes.`;
    }
    if (syncingData) {
      return "Syncing data to server.";
    }
    return `Online. ${pendingChanges} pending changes to sync.`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 20,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        transition: "all 0.3s ease",
      }}
      title={getAriaLabel()}
      role="status"
      aria-label={getAriaLabel()}
    >
      {/* Icon with conditional animation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          color: statusColor,
        }}
      >
        {syncingData ? (
          <Loader2
            size={14}
            style={{
              animation: "spin 1s linear infinite",
            }}
          />
        ) : isOffline ? (
          <WifiOff size={14} />
        ) : (
          <Wifi size={14} />
        )}
      </div>

      {/* Status Text */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: statusColor,
          whiteSpace: "nowrap",
          letterSpacing: "0.5px",
        }}
      >
        {statusText}
      </span>

      {/* Pending changes badge */}
      {pendingChanges > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "#FFFFFF",
            background: statusColor,
            padding: "2px 7px",
            borderRadius: 12,
            marginLeft: 2,
            minWidth: 18,
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          title={`${pendingChanges} pending ${pendingChanges === 1 ? "change" : "changes"} to sync`}
        >
          {pendingChanges > 99 ? "99+" : pendingChanges}
        </span>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
