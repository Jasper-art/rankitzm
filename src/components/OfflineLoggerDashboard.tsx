import React, { useState, useEffect, useCallback } from "react";
import { offlineLogger, useOfflineLogger } from "../lib/offlineLogger";
import { useOffline } from "../context/OfflineContext";
import {
  Trash2,
  RefreshCw,
  Download,
  Filter,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface OfflineLogEntry {
  id?: string;
  timestamp: number;
  type:
    | "offline"
    | "online"
    | "data_change"
    | "sync_start"
    | "sync_complete"
    | "sync_error"
    | "connection_quality";
  message: string;
  data?: any;
  duration?: number;
}

interface SyncMetrics {
  totalEvents: number;
  lastStatusChange: number;
  dataChanges: number;
  syncAttempts: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncDuration: number;
  lastSyncTime?: number;
  pendingItems: number;
}

/**
 * OfflineLoggerDashboard Component - RankItZM v1.2.0
 * Comprehensive offline event monitoring and debugging dashboard
 * Updated: March 2026 - Eastern Province Edition
 *
 * Features:
 * - Real-time event logging with auto-refresh
 * - Sync metrics and performance tracking
 * - Connection quality monitoring
 * - Export logs and metrics
 * - Filter by event type
 * - Session statistics
 * - Responsive design with dark header
 * - Performance alerts
 */
export function OfflineLoggerDashboard() {
  const { isOnline, connectionQuality, offlineDuration } = useOffline();
  const [logs, setLogs] = useState<OfflineLogEntry[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Load logs and metrics
  const loadLogsAndMetrics = useCallback(() => {
    const allLogs = offlineLogger.getAllLogs();
    const syncMetrics = offlineLogger.getSyncStatus();
    setLogs(allLogs);
    setMetrics(syncMetrics);
  }, []);

  useEffect(() => {
    loadLogsAndMetrics();

    // Auto-refresh every 3 seconds
    if (autoRefresh) {
      const interval = setInterval(loadLogsAndMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadLogsAndMetrics]);

  // Subscribe to offline logger events
  useEffect(() => {
    const unsubscribeSyncCompleted = offlineLogger.onLogEvent(
      "sync-completed",
      () => {
        loadLogsAndMetrics();
      },
    );

    const unsubscribeSyncFailed = offlineLogger.onLogEvent(
      "sync-failed",
      () => {
        loadLogsAndMetrics();
      },
    );

    return () => {
      unsubscribeSyncCompleted();
      unsubscribeSyncFailed();
    };
  }, [loadLogsAndMetrics]);

  const filteredLogs = logs.filter((log) =>
    filterType === "all" ? true : log.type === filterType,
  );

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatFullDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTypeColor = (type: string): string => {
    return (
      {
        offline: "#DC2626",
        online: "#16A34A",
        data_change: "#0284C7",
        sync_start: "#F59E0B",
        sync_complete: "#10B981",
        sync_error: "#EF4444",
        connection_quality: "#6366F1",
      }[type] || "#6B7280"
    );
  };

  const getTypeEmoji = (type: string): string => {
    return (
      {
        offline: "🔴",
        online: "🟢",
        data_change: "💾",
        sync_start: "⬆️",
        sync_complete: "✅",
        sync_error: "❌",
        connection_quality: "📊",
      }[type] || "•"
    );
  };

  const getConnectionQualityColor = (): string => {
    return (
      {
        excellent: "#10B981",
        good: "#3B82F6",
        poor: "#F59E0B",
        offline: "#DC2626",
      }[connectionQuality] || "#6B7280"
    );
  };

  const getConnectionQualityLabel = (): string => {
    return (
      {
        excellent: "Excellent (4G)",
        good: "Good (3G/4G)",
        poor: "Slow (2G)",
        offline: "No Connection",
      }[connectionQuality] || "Unknown"
    );
  };

  // Export logs with metrics
  const exportLogsWithMetrics = (): void => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      metrics,
      logs,
      summary: {
        connectionStatus: isOnline ? "online" : "offline",
        connectionQuality,
        offlineDuration,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rankitzm-offline-metrics-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ Logs and metrics exported successfully");
  };

  const clearAllLogs = (): void => {
    if (
      window.confirm(
        "Are you sure you want to clear all logs? This action cannot be undone.",
      )
    ) {
      offlineLogger.clearLogs();
      setLogs([]);
      setMetrics(null);
      console.log("✅ All logs cleared");
    }
  };

  // Calculate sync success rate
  const syncSuccessRate = metrics
    ? metrics.syncAttempts > 0
      ? Math.round((metrics.successfulSyncs / metrics.syncAttempts) * 100)
      : 0
    : 0;

  // Determine if there are performance issues
  const hasPerformanceIssues =
    metrics &&
    (metrics.failedSyncs > 0 ||
      metrics.averageSyncDuration > 5000 ||
      metrics.pendingItems > 10);

  if (!showDashboard) {
    return (
      <button
        onClick={() => setShowDashboard(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          padding: "10px 16px",
          borderRadius: 20,
          border: "1px solid #D1D5DB",
          background: "#FFFFFF",
          fontSize: 12,
          fontWeight: 600,
          color: "#6B7280",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 8px 12px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 6px rgba(0,0,0,0.1)";
        }}
        title="Show offline logs and metrics (Developer Tool)"
        aria-label="Show offline event logs and metrics"
      >
        <span>📋</span>
        <span>Logs ({logs.length})</span>
        {hasPerformanceIssues && (
          <span
            style={{
              width: 8,
              height: 8,
              background: "#EF4444",
              borderRadius: "50%",
              animation: "pulse 2s infinite",
            }}
          />
        )}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 600,
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "90vh",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        animation: "slideUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #E5E7EB",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "16px 16px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            📋 Offline Event Log
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(255,255,255,0.2)",
                padding: "3px 10px",
                borderRadius: 8,
              }}
            >
              v1.2.0
            </span>
          </h3>

          <div style={{ display: "flex", gap: 8 }}>
            {/* Export Button */}
            <button
              onClick={exportLogsWithMetrics}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
              }}
              title="Export logs and metrics to JSON"
            >
              <Download size={16} />
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadLogsAndMetrics}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
              }}
              title="Refresh logs and metrics"
            >
              <RefreshCw size={16} />
            </button>

            {/* Auto-refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${autoRefresh ? "#10B981" : "rgba(255,255,255,0.2)"}`,
                background: autoRefresh
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 14,
                transition: "all 0.2s ease",
              }}
              title={
                autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"
              }
            >
              {autoRefresh ? "🔄" : "⏸️"}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setShowDashboard(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(244, 63, 94, 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
              }}
              title="Close dashboard"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Connection Status and Metrics Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {/* Connection Status */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "10px 12px",
              borderRadius: 10,
              border: `2px solid ${getConnectionQualityColor()}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Connection
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{isOnline ? "🟢" : "🔴"}</span>
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
              }}
            >
              {getConnectionQualityLabel()}
            </div>
          </div>

          {/* Sync Attempts */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "10px 12px",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Sync Status
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {metrics
                ? `${metrics.successfulSyncs}/${metrics.syncAttempts}`
                : "0/0"}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
              }}
            >
              {syncSuccessRate}% success
            </div>
          </div>

          {/* Pending Items */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "10px 12px",
              borderRadius: 10,
              borderLeft:
                metrics && metrics.pendingItems > 0
                  ? "3px solid #FCD34D"
                  : "3px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Pending
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  metrics && metrics.pendingItems > 0 ? "#FCD34D" : "#FFFFFF",
              }}
            >
              {metrics?.pendingItems || 0} items
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
              }}
            >
              Waiting to sync
            </div>
          </div>

          {/* Avg Sync Time */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "10px 12px",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Avg Sync Time
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {metrics ? formatDuration(metrics.averageSyncDuration) : "N/A"}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
              }}
            >
              Per sync
            </div>
          </div>
        </div>

        {/* Performance Alert */}
        {hasPerformanceIssues && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 8,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={16} color="#FCA5A5" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#FCA5A5" }}>
              {metrics?.failedSyncs ? "Some syncs have failed. " : ""}
              {metrics?.averageSyncDuration > 5000
                ? "Sync times are slower than expected. "
                : ""}
              {metrics?.pendingItems ? "Items are pending sync. " : ""}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          background: "#F9FAFB",
        }}
      >
        <Filter size={14} color="#6B7280" />
        {[
          "all",
          "offline",
          "online",
          "data_change",
          "sync_start",
          "sync_complete",
          "sync_error",
          "connection_quality",
        ].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border:
                filterType === type ? "1px solid #0284C7" : "1px solid #D1D5DB",
              background: filterType === type ? "#DBEAFE" : "#F9FAFB",
              fontSize: 11,
              fontWeight: 700,
              color: filterType === type ? "#0284C7" : "#6B7280",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "capitalize",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (filterType !== type) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#F3F4F6";
              }
            }}
            onMouseLeave={(e) => {
              if (filterType !== type) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#F9FAFB";
              }
            }}
          >
            {type === "all" ? "All" : type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "#FAFAFA",
        }}
        className="custom-scroll"
      >
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: 12,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              No {filterType !== "all" ? filterType.replace(/_/g, " ") : ""}{" "}
              events logged yet
            </div>
            <div style={{ fontSize: 11, marginTop: 6, color: "#BDBDBD" }}>
              Events will appear here as they occur
            </div>
          </div>
        ) : (
          filteredLogs
            .slice()
            .reverse()
            .map((log, idx) => {
              const isExpanded = expandedLog === `${log.timestamp}-${idx}`;
              const logKey = `${log.timestamp}-${idx}`;

              return (
                <div
                  key={logKey}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 11,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                    cursor: log.data ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (log.data) {
                      setExpandedLog(isExpanded ? null : logKey);
                    }
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 4px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.05)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {getTypeEmoji(log.type)}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 6,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: getTypeColor(log.type),
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              fontSize: 10,
                            }}
                          >
                            {log.type.replace(/_/g, " ")}
                          </span>
                          {log.duration && (
                            <span
                              style={{
                                fontSize: 9,
                                background:
                                  log.duration > 5000
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(16, 185, 129, 0.1)",
                                color:
                                  log.duration > 5000 ? "#DC2626" : "#16A34A",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontWeight: 600,
                              }}
                            >
                              {formatDuration(log.duration)}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            color: "#9CA3AF",
                            flexShrink: 0,
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: "monospace",
                          }}
                          title={formatFullDateTime(log.timestamp)}
                        >
                          {formatTime(log.timestamp)}
                        </span>
                      </div>

                      <div
                        style={{
                          color: "#374151",
                          wordBreak: "break-word",
                          lineHeight: 1.5,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {log.message}
                      </div>

                      {log.data && (
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#6B7280",
                            fontSize: 10,
                          }}
                        >
                          <span
                            style={{
                              color: "#9CA3AF",
                            }}
                          >
                            {isExpanded ? "▼" : "▶"} Data (
                            {Object.keys(log.data).length} fields)
                          </span>
                        </div>
                      )}

                      {isExpanded && log.data && (
                        <div
                          style={{
                            color: "#6B7280",
                            fontSize: 10,
                            marginTop: 8,
                            background: "#F3F4F6",
                            padding: "8px 10px",
                            borderRadius: 6,
                            fontFamily: "monospace",
                            overflow: "auto",
                            maxHeight: 200,
                            border: "1px solid #E5E7EB",
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #E5E7EB",
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
          background: "#FFFFFF",
          borderRadius: "0 0 16px 16px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#9CA3AF",
            fontWeight: 600,
          }}
        >
          {filteredLogs.length} of {logs.length} events
          {metrics &&
            ` • Last sync: ${metrics.lastSyncTime ? formatTime(metrics.lastSyncTime) : "Never"}`}
        </div>

        <button
          onClick={clearAllLogs}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #FED7AA",
            background: "#FEF3C7",
            color: "#D97706",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#FDE68A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#FEF3C7";
          }}
        >
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
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
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 10px;
        }
        
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
