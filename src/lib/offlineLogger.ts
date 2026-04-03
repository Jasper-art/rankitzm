/**
 * Offline Logger Utility - RankItZM v1.2.0
 * Tracks offline events, data changes, and sync status
 * Updated: March 2026 - Eastern Province Edition
 *
 * Features:
 * - Dual storage: localStorage + IndexedDB (fallback)
 * - Comprehensive sync tracking
 * - Performance metrics
 * - Automatic cleanup and rotation
 * - Development debugging utilities
 */

export interface OfflineLog {
  id?: string;
  timestamp: number;
  type: 'offline' | 'online' | 'data_change' | 'sync_start' | 'sync_complete' | 'sync_error' | 'connection_quality';
  message: string;
  data?: any;
  duration?: number; // For operations that took time
}

export interface SyncMetrics {
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

export interface LogEventListener {
  (detail: any): void;
}

class OfflineLogger {
  private logs: OfflineLog[] = [];
  private maxLogs = 200;
  private storageKey = 'rankit_offline_logs';
  private metricsKey = 'rankit_offline_metrics';
  private dbName = 'RankItZMOfflineDB';
  private dbStoreName = 'logs';
  private db: IDBDatabase | null = null;
  private useIndexedDB = true;
  private syncStartTime: number | null = null;
  private eventListeners: Map<string, Set<LogEventListener>> = new Map();

  constructor() {
    this.initializeStorage();
    this.loadLogs();
  }

  /**
   * Initialize IndexedDB for better performance and larger storage
   */
  private async initializeStorage() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      this.useIndexedDB = false;
      return;
    }

    try {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.dbStoreName)) {
          db.createObjectStore(this.dbStoreName, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ RankItZM: IndexedDB initialized for offline logging');
        }
      };

      request.onerror = () => {
        console.warn('⚠️ RankItZM: IndexedDB unavailable, using localStorage fallback');
        this.useIndexedDB = false;
      };
    } catch (err) {
      console.warn('⚠️ RankItZM: IndexedDB initialization failed:', err);
      this.useIndexedDB = false;
    }
  }

  /**
   * Load logs from localStorage (or IndexedDB if available)
   */
  private loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (err) {
      console.error('❌ RankItZM: Failed to load offline logs:', err);
      this.logs = [];
    }
  }

  /**
   * Save logs to storage (localStorage + IndexedDB)
   */
  private saveLogs() {
    try {
      // Keep only recent logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Save to localStorage
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      } catch (storageErr) {
        if (storageErr instanceof Error && storageErr.name === 'QuotaExceededError') {
          console.warn('⚠️ RankItZM: localStorage quota exceeded, clearing old logs');
          this.clearOldLogs();
          localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
        } else {
          throw storageErr;
        }
      }

      // Save to IndexedDB if available
      if (this.useIndexedDB && this.db) {
        try {
          const transaction = this.db.transaction([this.dbStoreName], 'readwrite');
          const store = transaction.objectStore(this.dbStoreName);
          this.logs.forEach((log) => {
            store.put(log);
          });
        } catch (idbErr) {
          console.warn('⚠️ RankItZM: IndexedDB save failed:', idbErr);
        }
      }
    } catch (err) {
      console.error('❌ RankItZM: Failed to save offline logs:', err);
    }
  }

  /**
   * Clear logs older than 7 days
   */
  private clearOldLogs() {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.logs = this.logs.filter((log) => log.timestamp > sevenDaysAgo);
  }

  /**
   * Dispatch custom event for log events
   */
  private dispatchLogEvent(eventName: string, detail?: any) {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent(`offline-logger:${eventName}`, {
            detail: {
              timestamp: Date.now(),
              ...detail,
            },
          }),
        );
      } catch (err) {
        console.warn('⚠️ RankItZM: Failed to dispatch log event:', err);
      }
    }

    // Also call internal listeners
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback({
            timestamp: Date.now(),
            ...detail,
          });
        } catch (err) {
          console.warn('⚠️ RankItZM: Error in log event listener:', err);
        }
      });
    }
  }

  /**
   * Log event with emoji indicators
   */
  log(
    type: OfflineLog['type'],
    message: string,
    data?: any,
    duration?: number,
  ) {
    const logEntry: OfflineLog = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message,
      data,
      duration,
    };

    this.logs.push(logEntry);
    this.saveLogs();

    // Console logging with emoji indicators
    const emoji = {
      offline: '🔴',
      online: '🟢',
      data_change: '💾',
      sync_start: '⬆️',
      sync_complete: '✅',
      sync_error: '❌',
      connection_quality: '📊',
    }[type];

    const suffix = duration ? ` (${duration}ms)` : '';
    console.log(`${emoji} [OFFLINE] ${message}${suffix}`, data || '');
  }

  /**
   * Log offline event
   */
  logOffline() {
    this.log('offline', 'Internet connection lost');
    this.dispatchLogEvent('offline-detected');
  }

  /**
   * Log online event
   */
  logOnline() {
    this.log('online', 'Internet connection restored');
    this.dispatchLogEvent('online-detected');
  }

  /**
   * Log connection quality change
   */
  logConnectionQuality(quality: 'excellent' | 'good' | 'poor' | 'offline') {
    const qualityMap = {
      excellent: 'Excellent connection (4G)',
      good: 'Good connection (3G/4G)',
      poor: 'Poor connection (2G)',
      offline: 'No connection',
    };
    this.log('connection_quality', qualityMap[quality], { quality });
  }

  /**
   * Log data change
   */
  logDataChange(entity: string, action: string, count: number = 1) {
    this.log('data_change', `${action} ${count} ${entity}(s)`, { entity, action, count });
  }

  /**
   * Log sync start and track timing
   */
  logSyncStart(itemCount: number) {
    this.syncStartTime = Date.now();
    this.log('sync_start', `Starting sync of ${itemCount} item(s)`, {
      itemCount,
      timestamp: this.syncStartTime,
    });
    this.dispatchLogEvent('sync-started', { itemCount });
  }

  /**
   * Log sync completion with metrics
   */
  logSyncComplete(successful: number, failed: number) {
    const duration = this.syncStartTime ? Date.now() - this.syncStartTime : 0;
    this.log(
      'sync_complete',
      `Sync complete: ${successful} successful, ${failed} failed`,
      { successful, failed, duration },
      duration,
    );
    this.syncStartTime = null;
    this.dispatchLogEvent('sync-completed', { successful, failed, duration });
  }

  /**
   * Log sync error with details
   */
  logSyncError(error: Error | string, itemCount: number = 0) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const duration = this.syncStartTime ? Date.now() - this.syncStartTime : 0;
    this.log(
      'sync_error',
      `Sync failed: ${errorMessage}`,
      { itemCount, errorStack: error instanceof Error ? error.stack : undefined },
      duration,
    );
    this.syncStartTime = null;
    this.dispatchLogEvent('sync-failed', { error: errorMessage, itemCount });
  }

  /**
   * Get all logs
   */
  getAllLogs(): OfflineLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: OfflineLog['type']): OfflineLog[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): OfflineLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs since timestamp
   */
  getLogsSince(timestamp: number): OfflineLog[] {
    return this.logs.filter((log) => log.timestamp >= timestamp);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.metricsKey);

      if (this.useIndexedDB && this.db) {
        const transaction = this.db.transaction([this.dbStoreName], 'readwrite');
        transaction.objectStore(this.dbStoreName).clear();
      }

      console.log('✅ RankItZM: Offline logs cleared');
    } catch (err) {
      console.error('❌ RankItZM: Failed to clear logs:', err);
    }
  }

  /**
   * Get comprehensive sync metrics
   */
  getSyncStatus(): SyncMetrics {
    const onlineLogs = this.getLogsByType('online');
    const offlineLogs = this.getLogsByType('offline');
    const syncStartLogs = this.getLogsByType('sync_start');
    const syncCompleteLogs = this.getLogsByType('sync_complete');
    const syncErrorLogs = this.getLogsByType('sync_error');
    const lastStatus = [...onlineLogs, ...offlineLogs].pop();

    // Calculate average sync duration
    const syncDurations = syncCompleteLogs
      .filter((log) => log.duration)
      .map((log) => log.duration!);
    const averageSyncDuration =
      syncDurations.length > 0
        ? Math.round(syncDurations.reduce((a, b) => a + b, 0) / syncDurations.length)
        : 0;

    // Get last sync time
    const lastSync = syncCompleteLogs[syncCompleteLogs.length - 1];
    const lastSyncTime = lastSync?.timestamp;

    return {
      totalEvents: this.logs.length,
      lastStatusChange: lastStatus?.timestamp || 0,
      dataChanges: this.getLogsByType('data_change').length,
      syncAttempts: syncStartLogs.length,
      successfulSyncs: syncCompleteLogs.length,
      failedSyncs: syncErrorLogs.length,
      averageSyncDuration,
      lastSyncTime,
      pendingItems: this.calculatePendingItems(),
    };
  }

  /**
   * Calculate pending items based on recent data changes
   */
  private calculatePendingItems(): number {
    const lastSyncTime = this.getLogsByType('sync_complete').pop()?.timestamp || 0;
    const recentChanges = this.getLogsByType('data_change').filter(
      (log) => log.timestamp > lastSyncTime,
    );

    return recentChanges.reduce((total, log) => total + (log.data?.count || 0), 0);
  }

  /**
   * Get performance summary for development
   */
  getPerformanceSummary() {
    const metrics = this.getSyncStatus();
    const recentLogs = this.getRecentLogs(20);

    return {
      metrics,
      recentLogs,
      storageInfo: {
        totalLogsStored: this.logs.length,
        maxLogs: this.maxLogs,
        usingIndexedDB: this.useIndexedDB,
      },
    };
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogsAsJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        metrics: this.getSyncStatus(),
        logs: this.getAllLogs(),
      },
      null,
      2,
    );
  }

  /**
   * Download logs as JSON file
   */
  downloadLogs() {
    const json = this.exportLogsAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rankit-offline-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('✅ RankItZM: Logs downloaded');
  }

  /**
   * Subscribe to log events
   * Returns unsubscribe function
   */
  onLogEvent(eventName: string, callback: LogEventListener): () => void {
    // Initialize listeners set if not exists
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }

    // Add listener
    const listeners = this.eventListeners.get(eventName)!;
    listeners.add(callback);

    // Also listen to window events
    const windowHandler = (event: Event) => {
      if (event instanceof CustomEvent) {
        callback(event.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(`offline-logger:${eventName}`, windowHandler);
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener(`offline-logger:${eventName}`, windowHandler);
      }
    };
  }
}

// Export singleton instance
export const offlineLogger = new OfflineLogger();

/**
 * Development utility hook for debugging offline logger
 * Use in React components for quick access to logging functions
 */
export const useOfflineLogger = () => {
  return {
    log: offlineLogger.log.bind(offlineLogger),
    logOffline: offlineLogger.logOffline.bind(offlineLogger),
    logOnline: offlineLogger.logOnline.bind(offlineLogger),
    logDataChange: offlineLogger.logDataChange.bind(offlineLogger),
    logSyncStart: offlineLogger.logSyncStart.bind(offlineLogger),
    logSyncComplete: offlineLogger.logSyncComplete.bind(offlineLogger),
    logSyncError: offlineLogger.logSyncError.bind(offlineLogger),
    getSyncStatus: offlineLogger.getSyncStatus.bind(offlineLogger),
    getRecentLogs: offlineLogger.getRecentLogs.bind(offlineLogger),
    getAllLogs: offlineLogger.getAllLogs.bind(offlineLogger),
    clearLogs: offlineLogger.clearLogs.bind(offlineLogger),
    exportLogs: offlineLogger.exportLogsAsJson.bind(offlineLogger),
    downloadLogs: offlineLogger.downloadLogs.bind(offlineLogger),
    getPerformanceSummary: offlineLogger.getPerformanceSummary.bind(offlineLogger),
    onLogEvent: offlineLogger.onLogEvent.bind(offlineLogger),
  };
};