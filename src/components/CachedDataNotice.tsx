import React from "react";
import { useTheme } from "../hooks/useTheme";
import { useOffline } from "../context/OfflineContext";
import { Database } from "lucide-react";

interface CachedDataNoticeProps {
  showWhen?: "always_offline" | "offline_or_old"; // When to show the notice
  lastUpdated?: number; // Timestamp of last update
  maxAgeMinutes?: number; // Max age before showing "data is old" notice
}

/**
 * CachedDataNotice Component - RankItZM v1.2.0
 * Shows a subtle notice that the user is viewing cached/offline data
 * Optionally shows if data is older than maxAgeMinutes
 * Updated: March 2026 - Eastern Province Edition
 */
export function CachedDataNotice({
  showWhen = "always_offline",
  lastUpdated,
  maxAgeMinutes = 60,
}: CachedDataNoticeProps) {
  const { t } = useTheme();
  const { isOffline } = useOffline();

  const isDataOld =
    lastUpdated && Date.now() - lastUpdated > maxAgeMinutes * 60 * 1000;

  const shouldShow =
    showWhen === "always_offline" ? isOffline : isOffline || isDataOld;

  if (!shouldShow) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        background: isDataOld ? "#FEF3E2" : "#DBEAFE",
        border: `1px solid ${isDataOld ? "#FCD34D" : "#93C5FD"}`,
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
      {/* Icon */}
      <Database
        size={16}
        style={{
          color: isDataOld ? "#D97706" : "#0284C7",
          flexShrink: 0,
        }}
      />

      {/* Message */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: isDataOld ? "#92400E" : "#0C4A6E",
          lineHeight: 1.4,
        }}
      >
        {isOffline ? (
          <>
            <strong>📡 Offline Mode:</strong> Viewing cached data
            {lastUpdated && <> (last updated {formatTime(lastUpdated)})</>}
          </>
        ) : isDataOld ? (
          <>
            <strong>⏰ Cached Data:</strong> This data is from{" "}
            {lastUpdated && formatTime(lastUpdated)}. Go online to refresh.
          </>
        ) : null}
      </div>
    </div>
  );
}
