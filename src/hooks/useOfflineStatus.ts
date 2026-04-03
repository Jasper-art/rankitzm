import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useOfflineStatus Hook - RankItZM v1.2.0
 * Detects whether the user is online or offline
 * Listens to window online/offline events
 * Updated: March 2026 - Eastern Province Edition
 * 
 * Enhancements:
 * - Improved connection detection with debouncing
 * - Connection quality metrics
 * - Enhanced logging with emoji indicators
 * - Custom event dispatching for sync coordination
 * - Better SSR/hydration handling
 * - Performance optimizations
 */

interface OfflineStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  lastStatusChange: number;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'offline';
  isSlowConnection?: boolean;
}

export const useOfflineStatus = (): OfflineStatusReturn => {
  // Initialize with safe defaults for SSR
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to online for SSR
  });

  const [lastStatusChange, setLastStatusChange] = useState<number>(Date.now());
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);

  // Use ref to prevent stale closures
  const statusChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  /**
   * Detect connection quality using Network Information API
   * Falls back gracefully if API unavailable
   */
  const detectConnectionQuality = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        
        if (connection) {
          const effectiveType = connection.effectiveType;
          const downlink = connection.downlink; // in Mbps
          const rtt = connection.rtt; // round-trip time in ms
          const saveData = connection.saveData; // user's data saver preference

          // Log connection details in development
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 RankItZM Connection Quality:', {
              effectiveType,
              downlink: `${downlink}Mbps`,
              rtt: `${rtt}ms`,
              saveData,
            });
          }

          // Determine quality level
          if (effectiveType === '4g' && downlink >= 5) {
            setConnectionQuality('excellent');
            setIsSlowConnection(false);
          } else if (effectiveType === '4g' || effectiveType === '3g') {
            setConnectionQuality('good');
            setIsSlowConnection(false);
          } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
            setConnectionQuality('poor');
            setIsSlowConnection(true);
            console.warn('⚠️ RankItZM: Slow connection detected (2G) - sync may be delayed');
          } else {
            // Fallback to good if type unknown
            setConnectionQuality('good');
            setIsSlowConnection(false);
          }

          // Monitor for connection changes
          connection.addEventListener('change', detectConnectionQuality);
          return () => connection.removeEventListener('change', detectConnectionQuality);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Connection Quality API unavailable:', error);
      }
      setConnectionQuality('good'); // Safe default
      setIsSlowConnection(false);
    }
  }, []);

  /**
   * Handle online event - debounced to prevent false positives
   */
  const handleOnline = useCallback(() => {
    // Clear any pending timeout
    if (statusChangeTimeoutRef.current) {
      clearTimeout(statusChangeTimeoutRef.current);
    }

    // Debounce - verify connection is stable after 500ms
    statusChangeTimeoutRef.current = setTimeout(() => {
      if (navigator.onLine) {
        console.log('🟢 ONLINE - Internet connection restored');
        setIsOnline(true);
        setLastStatusChange(Date.now());
        detectConnectionQuality();

        // Dispatch custom event for sync coordination
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('connection-status-changed', {
              detail: {
                isOnline: true,
                timestamp: Date.now(),
                connectionQuality,
              },
            })
          );

          // Dispatch sync-ready event if there are pending changes
          window.dispatchEvent(
            new CustomEvent('sync-ready', {
              detail: { timestamp: Date.now() },
            })
          );
        }
      }
    }, 500);
  }, [connectionQuality, detectConnectionQuality]);

  /**
   * Handle offline event - immediate, no debounce needed
   */
  const handleOffline = useCallback(() => {
    // Clear any pending timeout
    if (statusChangeTimeoutRef.current) {
      clearTimeout(statusChangeTimeoutRef.current);
    }

    console.log('🔴 OFFLINE - Internet connection lost');
    setIsOnline(false);
    setLastStatusChange(Date.now());
    setConnectionQuality('offline');
    setIsSlowConnection(true);

    // Dispatch custom event for offline coordination
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('connection-status-changed', {
          detail: {
            isOnline: false,
            timestamp: Date.now(),
            connectionQuality: 'offline',
          },
        })
      );

      // Dispatch offline-mode event
      window.dispatchEvent(
        new CustomEvent('offline-mode-activated', {
          detail: { timestamp: Date.now() },
        })
      );
    }
  }, []);

  /**
   * Setup event listeners on mount
   */
  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    if (typeof window !== 'undefined') {
      // Initial connection quality detection
      detectConnectionQuality();

      // Add event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup function
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);

        // Clear any pending timeouts
        if (statusChangeTimeoutRef.current) {
          clearTimeout(statusChangeTimeoutRef.current);
        }
      };
    }
  }, [handleOnline, handleOffline, detectConnectionQuality]);

  /**
   * Monitor connection quality changes while online
   */
  useEffect(() => {
    if (isOnline && typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;

      const handleConnectionChange = () => {
        detectConnectionQuality();
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [isOnline, detectConnectionQuality]);

  /**
   * Log state changes in development mode
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const statusText = isOnline ? 'ONLINE' : 'OFFLINE';
      console.log(`📡 RankItZM Status: ${statusText} | Quality: ${connectionQuality} | Changed: ${new Date(lastStatusChange).toLocaleTimeString()}`);
    }
  }, [isOnline, connectionQuality, lastStatusChange]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastStatusChange,
    connectionQuality,
    isSlowConnection,
  };
};