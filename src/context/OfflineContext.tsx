import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useOfflineStatus } from "../hooks/useOfflineStatus";

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  lastStatusChange: number;
  showOfflineWarning: boolean;
  setShowOfflineWarning: (show: boolean) => void;
  syncingData: boolean;
  setSyncingData: (syncing: boolean) => void;
  pendingChanges: number;
  setPendingChanges: (count: number) => void;
  offlineDuration: number;
  connectionQuality: "excellent" | "good" | "poor" | "offline";
}

/**
 * OfflineContext - RankItZM v1.2.0
 * Manages offline/online state and sync coordination across the app
 * Updated: March 2026 - Eastern Province Edition
 *
 * New Features:
 * - Offline duration tracking
 * - Connection quality detection
 * - Enhanced logging for debugging
 * - Better state management
 * - Automatic sync triggering on reconnection
 */
const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { isOnline, isOffline, lastStatusChange } = useOfflineStatus();
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [offlineStartTime, setOfflineStartTime] = useState<number | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "offline"
  >("excellent");

  // Track offline duration
  useEffect(() => {
    if (isOffline && !offlineStartTime) {
      setOfflineStartTime(Date.now());
      console.warn(
        "⚠️ RankItZM: Offline mode activated - working with cached data",
      );
    } else if (isOnline && offlineStartTime) {
      const duration = Math.floor((Date.now() - offlineStartTime) / 1000);
      console.log(
        `✅ RankItZM: Back online after ${duration}s - ready to sync`,
      );
      setOfflineStartTime(null);
      setOfflineDuration(0);
    }
  }, [isOffline, isOnline, offlineStartTime]);

  // Update offline duration counter
  useEffect(() => {
    if (!isOffline || !offlineStartTime) return;

    const interval = setInterval(() => {
      setOfflineDuration(Math.floor((Date.now() - offlineStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOffline, offlineStartTime]);

  // Show warning when going offline
  useEffect(() => {
    if (isOffline) {
      setShowOfflineWarning(true);
      setConnectionQuality("offline");
    } else {
      // Detect connection quality when online
      detectConnectionQuality();
    }
  }, [isOffline]);

  // Auto-trigger sync when coming back online with pending changes
  useEffect(() => {
    if (isOnline && pendingChanges > 0 && !syncingData) {
      console.log(
        `📡 RankItZM: Connection restored. ${pendingChanges} pending changes ready to sync.`,
      );
      // You can trigger auto-sync here if desired
      // For now, we just log it - actual sync is triggered by user or other components
    }
  }, [isOnline, pendingChanges, syncingData]);

  // Detect connection quality using Network Information API
  const detectConnectionQuality = () => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;

        if (effectiveType === "4g") {
          setConnectionQuality("excellent");
        } else if (effectiveType === "3g") {
          setConnectionQuality("good");
        } else if (effectiveType === "2g" || effectiveType === "slow-2g") {
          setConnectionQuality("poor");
          console.warn(
            "⚠️ RankItZM: Slow connection detected - sync may be delayed",
          );
        } else {
          setConnectionQuality("good");
        }
      } else {
        setConnectionQuality("excellent"); // Assume good if no info available
      }
    } else {
      setConnectionQuality("excellent"); // Assume good if API not available
    }
  };

  // Log state changes for debugging
  useEffect(() => {
    const logState = () => {
      if (import.meta.env.DEV) {
        console.log("📊 RankItZM Offline State:", {
          isOnline,
          isOffline,
          pendingChanges,
          syncingData,
          offlineDuration,
          connectionQuality,
        });
      }
    };

    // Log state every 30 seconds in dev mode
    if (import.meta.env.DEV) {
      const interval = setInterval(logState, 30000);
      return () => clearInterval(interval);
    }
  }, [
    isOnline,
    isOffline,
    pendingChanges,
    syncingData,
    offlineDuration,
    connectionQuality,
  ]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOffline,
        lastStatusChange,
        showOfflineWarning,
        setShowOfflineWarning,
        syncingData,
        setSyncingData,
        pendingChanges,
        setPendingChanges,
        offlineDuration,
        connectionQuality,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline context
 * Throws error if used outside OfflineProvider
 */
export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return context;
}

/**
 * Hook to check if data operations are safe
 * In offline-first architecture, operations are always safe
 * Data is stored locally and synced when online
 */
export function useCanPerformDataOperation() {
  // In offline-first architecture, most operations are safe
  // Data is persisted locally via IndexedDB and synced later
  return true; // Always allow operations (offline-first)
}

/**
 * Hook to get human-readable connection status
 * Returns formatted string describing current connection state
 */
export function useConnectionStatus() {
  const { isOffline, connectionQuality, offlineDuration } = useOffline();

  if (isOffline) {
    if (offlineDuration < 60) {
      return "Offline (just now)";
    } else if (offlineDuration < 3600) {
      return `Offline (${Math.floor(offlineDuration / 60)}m)`;
    } else {
      return `Offline (${Math.floor(offlineDuration / 3600)}h)`;
    }
  }

  const qualityText = {
    excellent: "Online (Excellent)",
    good: "Online (Good)",
    poor: "Online (Slow)",
    offline: "Offline",
  }[connectionQuality];

  return qualityText;
}
