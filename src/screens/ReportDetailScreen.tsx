import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LIGHT, DARK, Theme } from '../styles/rankitz-colors';

export default function ReportDetailScreen() {
  const navigate = useNavigate();
  const { classId, reportId } = useParams();
  const [dark] = React.useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const t: Theme = dark ? DARK : LIGHT;

  return (
    <div style={{ minHeight: '100dvh', width: '100%', background: t.bg, color: t.text }}>
      <header style={{
        background: t.topbar, borderBottom: `1px solid ${t.border}`,
        padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={() => navigate('/reports')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}
        >
          ←
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Report</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>
            Class: {classId || '—'} • Report: {reportId || '—'}
          </div>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Report Preview</h2>
          <p style={{ marginTop: 12, color: t.textMuted }}>
            This is a placeholder for the report screen. Replace this with the actual report rendering logic for &quot;{reportId}&quot; reports.
          </p>
          <button
            onClick={() => navigate('/reports')}
            style={{
              marginTop: 18,
              padding: '10px 14px',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Reports
          </button>
        </div>
      </main>
    </div>
  );
}
