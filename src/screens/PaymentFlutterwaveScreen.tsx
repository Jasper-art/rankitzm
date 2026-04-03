import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIGHT, DARK, Theme } from '../styles/rankitz-colors';

export default function PaymentFlutterwaveScreen() {
  const navigate = useNavigate();
  const [dark] = useState(() => {
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
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}
        >
          ←
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Flutterwave Payment</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>Complete your payment via Flutterwave</div>
        </div>
      </header>
      <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 }}>
          <p style={{ color: t.textMuted }}>This is a placeholder screen. Replace with actual Flutterwave integration.</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back
          </button>
        </div>
      </main>
    </div>
  );
}
