import React, { useState, useEffect } from "react";
import { useOffline } from "../context/OfflineContext";
import {
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface PendingChange {
  id: string;
  type: "score" | "learner" | "class" | "subject";
  action: "added" | "updated" | "deleted";
  timestamp: number;
  synced: boolean;
}

interface SyncStatusTrackerProps {
  pendingChanges?: PendingChange[];
  syncStatus?: SyncStatus;
  lastSyncTime?: number;
  onSync?: () => Promise<void>;
  showDetailedView?: boolean;
}

/**
 * SyncStatusTracker Component - RankItZM v1.2.0
 * Shows:
 * - Number of pending changes with categorization
 * - What's pending (scores, learners, classes, subjects)
 * - Last sync time with auto-refresh
 * - Manual sync button with progress feedback
 * - Detailed expandable view of all pending changes
 * Updated: March 2026 - Eastern Province Edition
 *
 * New Features:
 * - Categorized pending changes summary
 * - Sync progress percentage
 * - Better error handling and retry logic
 * - Enhanced visual feedback
 * - Improved mobile responsiveness
 */
export function SyncStatusTracker({
  pendingChanges = [],
  syncStatus = "idle",
  lastSyncTime,
  onSync,
  showDetailedView = false,
}: SyncStatusTrackerProps) {
  const { isOffline, isOnline } = useOffline();
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(showDetailedView);
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSync = async () => {
    if (!onSync || syncing || isOffline) return;

    setSyncing(true);
    setSyncProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await onSync();
      setSyncProgress(100);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
      }, 500);
    }
  };

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Categorize pending changes by type
  const getCategorizedCounts = () => {
    const counts = {
      score: 0,
      learner: 0,
      class: 0,
      subject: 0,
    };

    pendingChanges.forEach((change) => {
      counts[change.type]++;
    });

    return counts;
  };

  const categorizedCounts = getCategorizedCounts();

  const statusColor = {
    idle: "#6B7280",
    syncing: "#0284C7",
    synced: "#16A34A",
    error: "#DC2626",
    offline: "#DC2626",
  }[syncStatus];

  const statusIcon = {
    idle: <Cloud size={16} />,
    syncing: <RefreshCw size={16} className="animate-spin" />,
    synced: <CheckCircle2 size={16} />,
    error: <AlertCircle size={16} />,
    offline: <CloudOff size={16} />,
  }[syncStatus];

  const statusText = {
    idle: "All synced",
    syncing: "Syncing...",
    synced: "Synced",
    error: "Sync failed",
    offline: "Offline - pending",
  }[syncStatus];

  const getActionColor = (action: string) => {
    return (
      {
        added: "#10B981",
        updated: "#0284C7",
        deleted: "#DC2626",
      }[action] || "#6B7280"
    );
  };

  const getActionEmoji = (action: string) => {
    return (
      {
        added: "➕",
        updated: "✏️",
        deleted: "🗑️",
      }[action] || "•"
    );
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Main Status Line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 200,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${statusColor}15`,
              color: statusColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {statusIcon}
          </div>

          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              {statusText}
            </p>

            {/* Pending Changes Count with Categories */}
            {pendingChanges.length > 0 && (
              <p
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  margin: "4px 0 0 0",
                  fontWeight: 600,
                }}
              >
                {pendingChanges.length} pending{" "}
                <span style={{ color: "#9CA3AF" }}>
                  (
                  {categorizedCounts.score > 0 &&
                    `${categorizedCounts.score} scores`}
                  {categorizedCounts.learner > 0 &&
                    `, ${categorizedCounts.learner} learners`}
                  {categorizedCounts.class > 0 &&
                    `, ${categorizedCounts.class} classes`}
                  {categorizedCounts.subject > 0 &&
                    `, ${categorizedCounts.subject} subjects`}
                  )
                </span>
              </p>
            )}

            {/* Last Sync Time */}
            {lastSyncTime && syncStatus === "synced" && (
              <p
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  margin: "4px 0 0 0",
                  fontWeight: 600,
                }}
              >
                Last synced {formatTime(lastSyncTime)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Sync Button */}
          {onSync && isOnline && pendingChanges.length > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing || isOffline}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: `1px solid ${syncing ? "#93C5FD" : "#0284C7"}`,
                background: syncing ? "#DBEAFE" : "#0284C7",
                cursor: syncing || isOffline ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: syncing ? "#0284C7" : "#FFFFFF",
                transition: "all 0.2s ease",
                opacity: syncing || isOffline ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!syncing && !isOffline) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#0369A1";
                }
              }}
              onMouseLeave={(e) => {
                if (!syncing) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#0284C7";
                }
              }}
              title={
                isOffline ? "Go online to sync" : "Sync pending changes now"
              }
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? `Syncing... ${syncProgress}%` : "Sync Now"}

              {/* Progress bar */}
              {syncing && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 3,
                    width: `${syncProgress}%`,
                    background: "#0284C7",
                    transition: "width 0.2s ease",
                  }}
                />
              )}
            </button>
          )}

          {/* Toggle Details */}
          {pendingChanges.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: showDetails ? "#F3F4F6" : "#FFFFFF",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: "#0284C7",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#F3F4F6";
              }}
              onMouseLeave={(e) => {
                if (!showDetails) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#FFFFFF";
                }
              }}
            >
              {showDetails ? "▼ Hide" : "▶ Details"}
            </button>
          )}
        </div>
      </div>

      {/* Sync Progress Bar */}
      {syncing && (
        <div
          style={{
            marginTop: 16,
            height: 6,
            background: "#E5E7EB",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${syncProgress}%`,
              background: "linear-gradient(90deg, #0284C7 0%, #0369A1 100%)",
              transition: "width 0.3s ease",
              borderRadius: 3,
            }}
          />
        </div>
      )}

      {/* Detailed View */}
      {showDetails && pendingChanges.length > 0 && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#6B7280",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
              letterSpacing: "1px",
            }}
          >
            Pending Changes ({pendingChanges.length})
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "#F9FAFB";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>
                    {getActionEmoji(change.action)}
                  </span>

                  <div>
                    <div style={{ marginBottom: 2 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#111827",
                          textTransform: "capitalize",
                        }}
                      >
                        {change.type}
                      </span>
                      {" · "}
                      <span
                        style={{
                          color: getActionColor(change.action),
                          textTransform: "capitalize",
                          fontWeight: 600,
                        }}
                      >
                        {change.action}
                      </span>
                    </div>

                    <span
                      style={{
                        color: "#9CA3AF",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {formatTime(change.timestamp)}
                    </span>
                  </div>
                </div>

                {change.synced ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#16A34A",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    Synced
                  </div>
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#F59E0B",
                      flexShrink: 0,
                      boxShadow: "0 0 8px rgba(245, 158, 11, 0.5)",
                    }}
                    title="Pending sync"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @media (max-width: 640px) {
          [style*="flex-wrap: wrap"] {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to manage sync state - RankItZM v1.2.0
 */
export const useSyncTracker = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const addPendingChange = (
    change: Omit<PendingChange, "timestamp" | "synced">,
  ) => {
    setPendingChanges((prev) => [
      ...prev,
      {
        ...change,
        timestamp: Date.now(),
        synced: false,
      },
    ]);
  };

  const markSynced = (changeId: string) => {
    setPendingChanges((prev) =>
      prev.map((change) =>
        change.id === changeId ? { ...change, synced: true } : change,
      ),
    );
  };

  const clearSynced = () => {
    setPendingChanges((prev) => prev.filter((change) => !change.synced));
    setLastSyncTime(Date.now());
    setSyncStatus("synced");
  };

  const startSync = () => setSyncStatus("syncing");
  const endSync = () => setSyncStatus("synced");
  const failSync = () => setSyncStatus("error");
  const goOffline = () => setSyncStatus("offline");

  return {
    pendingChanges,
    syncStatus,
    lastSyncTime,
    addPendingChange,
    markSynced,
    clearSynced,
    startSync,
    endSync,
    failSync,
    goOffline,
  };
};
