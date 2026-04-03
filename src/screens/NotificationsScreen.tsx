import React, { useState, useEffect } from 'react';

/**
 * FIXED: Expanded Theme interface to include the missing background and status colors.
 * This resolves the "Property does not exist on type 'Theme'" errors.
 */
interface Theme {
  bg: string;
  surface: string;
  topbar: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  accentText: string;
  red: string;
  // Status Colors
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;
}

// Mock Constants (Since they are imported in your original code)
const ZAMBIA_FLAG = ['#198a00', '#ff7d00', '#000000', '#ef3340'];

const LIGHT: Theme = {
  bg: '#f8fafc',
  surface: '#ffffff',
  topbar: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSub: '#475569',
  textMuted: '#94a3b8',
  accent: '#198a00',
  accentBg: '#f0fdf4',
  accentText: '#166534',
  red: '#ef4444',
  success: '#10b981',
  successBg: '#ecfdf5',
  warning: '#f59e0b',
  warningBg: '#fff7ed',
  error: '#ef4444',
  errorBg: '#fef2f2',
  info: '#3b82f6',
  infoBg: '#eff6ff',
};

const DARK: Theme = {
  bg: '#0f172a',
  surface: '#1e293b',
  topbar: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textSub: '#cbd5e1',
  textMuted: '#64748b',
  accent: '#22c55e',
  accentBg: '#064e3b',
  accentText: '#dcfce7',
  red: '#f87171',
  success: '#34d399',
  successBg: '#064e3b',
  warning: '#fbbf24',
  warningBg: '#451a03',
  error: '#f87171',
  errorBg: '#450a0a',
  info: '#60a5fa',
  infoBg: '#172554',
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  date: Date;
  read: boolean;
  relatedTo?: string;
}

export default function NotificationsScreen() {
  // In a real app, you'd use your actual navigate hook
  const navigate = (path: string | number) => console.log('Navigating to:', path);

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    loadNotifications();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Simulating DB fetch
      const mockData: Notification[] = [
        {
          id: 'n1',
          title: 'New Scores Entered',
          message: 'Grade 10A scores for Mathematics have been entered',
          type: 'success',
          date: new Date(Date.now() - 3600000),
          read: false,
        },
        {
          id: 'n2',
          title: 'Low Performance Alert',
          message: 'John Banda has 3 consecutive low scores in English',
          type: 'warning',
          date: new Date(Date.now() - 7200000),
          read: false,
        },
        {
          id: 'n3',
          title: 'Backup Completed',
          message: 'School data backup completed successfully',
          type: 'success',
          date: new Date(Date.now() - 86400000),
          read: true,
        },
      ];
      setNotifications(mockData);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  /**
   * REFACTORED COLOR GETTERS
   * Now using the typed Theme object and providing type-safe defaults.
   */
  const getBgColor = (type: Notification['type'], read: boolean) => {
    if (read) return t.surface;
    const backgrounds = {
      success: t.successBg,
      warning: t.warningBg,
      error: t.errorBg,
      info: t.infoBg,
    };
    return backgrounds[type] || t.surface;
  };

  const getBorderColor = (type: Notification['type']) => {
    const colors = {
      success: t.success,
      warning: t.warning,
      error: t.error,
      info: t.info,
    };
    return colors[type] || t.border;
  };

  const getIcon = (type: Notification['type']) => {
    const size = 20;
    const paths = {
      success: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
      warning: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
      error: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
      info: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
    };

    return (
      <svg viewBox="0 0 20 20" fill="currentColor" width={size} height={size}>
        <path fillRule="evenodd" d={paths[type]} clipRule="evenodd" />
      </svg>
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter !== 'all') return n.type === filter;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: t.bg,
      color: t.text,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: t.topbar,
        borderBottom: `1px solid ${t.border}`,
        padding: isMobile ? '0 14px' : '0 24px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: t.textSub, cursor: 'pointer', display: 'flex' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20}>
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Notifications</div>
            <div style={{ fontSize: 12, color: t.textMuted }}>{unreadCount} unread</div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: isMobile ? '14px' : '22px 24px' }}>
        <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
          {ZAMBIA_FLAG.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        </div>

        {loading ? (
          <div style={{ padding: 20, color: t.textMuted }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {unreadCount > 0 && <button onClick={markAllAsRead} style={{ flex: 1, padding: '10px', background: t.accent, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>}
              <button onClick={clearAll} style={{ flex: 1, padding: '10px', background: t.red, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Clear all</button>
            </div>

            <div style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 20, paddingBottom: 4 }}>
              {['all', 'unread', 'success', 'warning', 'error', 'info'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1px solid ${filter === f ? t.accent : t.border}`,
                    background: filter === f ? t.accent : t.surface,
                    color: filter === f ? '#fff' : t.textSub,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted }}>No notifications found</div>
              ) : (
                filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    style={{
                      background: getBgColor(n.type, n.read),
                      borderRadius: 12,
                      padding: '14px 16px',
                      borderLeft: !n.read ? `4px solid ${getBorderColor(n.type)}` : `1px solid ${t.border}`,
                      borderTop: `1px solid ${t.border}`,
                      borderRight: `1px solid ${t.border}`,
                      borderBottom: `1px solid ${t.border}`,
                      cursor: 'pointer',
                      transition: 'transform 0.1s'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ color: getBorderColor(n.type) }}>{getIcon(n.type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 2l1-1h6l1 1h4v2H2V2h4zM3 6h14l-1 12H4L3 6zm5 3v8h1v-8H8zm3 0v8h1v-8h-1z" />
                            </svg>
                          </button>
                        </div>
                        <div style={{ fontSize: 13, color: t.textSub, marginTop: 4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{n.date.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}