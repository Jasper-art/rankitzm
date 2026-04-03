import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, SchoolEntity } from '../db';
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from '../styles/rankitz-colors';

interface SchoolInfo {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolCode: string;
  schoolWebsite: string;
  bankName: string;
  bankAccount: string;
  bankCode: string;
  logoUri: string | null;
}

export default function EditSchoolInfoScreen() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    schoolCode: '',
    schoolWebsite: '',
    bankName: '',
    bankAccount: '',
    bankCode: '',
    logoUri: null,
  });

  const [editedInfo, setEditedInfo] = useState<SchoolInfo>(schoolInfo);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    loadSchoolInfo();
  }, []);

  const loadSchoolInfo = async () => {
    try {
      setLoading(true);
      const savedName = localStorage.getItem('schoolName') || 'RankIT ZM School';
      const savedLogo = localStorage.getItem('logoUri');
      const savedAddress = localStorage.getItem('schoolAddress') || '';
      const savedPhone = localStorage.getItem('schoolPhone') || '';
      const savedEmail = localStorage.getItem('schoolEmail') || '';
      const savedCode = localStorage.getItem('schoolCode') || '';
      const savedWebsite = localStorage.getItem('schoolWebsite') || '';
      const savedBank = localStorage.getItem('bankName') || '';
      const savedAccount = localStorage.getItem('bankAccount') || '';
      const savedBankCode = localStorage.getItem('bankCode') || '';

      const info: SchoolInfo = {
        schoolName: savedName,
        schoolAddress: savedAddress,
        schoolPhone: savedPhone,
        schoolEmail: savedEmail,
        schoolCode: savedCode,
        schoolWebsite: savedWebsite,
        bankName: savedBank,
        bankAccount: savedAccount,
        bankCode: savedBankCode,
        logoUri: savedLogo,
      };

      setSchoolInfo(info);
      setEditedInfo(info);
      setLogoPreview(savedLogo);
    } catch (error) {
      console.error('Error loading school info:', error);
      setMessageType('error');
      setMessage('Failed to load school information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessageType('error');
        setMessage('Logo size must be less than 5MB');
        return;
      }

      setLogoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setEditedInfo({ ...editedInfo, logoUri: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editedInfo.schoolName.trim()) {
      setMessageType('error');
      setMessage('School name is required');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      // Save to localStorage
      localStorage.setItem('schoolName', editedInfo.schoolName);
      localStorage.setItem('schoolAddress', editedInfo.schoolAddress);
      localStorage.setItem('schoolPhone', editedInfo.schoolPhone);
      localStorage.setItem('schoolEmail', editedInfo.schoolEmail);
      localStorage.setItem('schoolCode', editedInfo.schoolCode);
      localStorage.setItem('schoolWebsite', editedInfo.schoolWebsite);
      localStorage.setItem('bankName', editedInfo.bankName);
      localStorage.setItem('bankAccount', editedInfo.bankAccount);
      localStorage.setItem('bankCode', editedInfo.bankCode);

      if (logoPreview && logoPreview.startsWith('data:')) {
        localStorage.setItem('logoUri', logoPreview);
      }

      setSchoolInfo(editedInfo);
      setMessageType('success');
      setMessage('School information saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving school info:', error);
      setMessageType('error');
      setMessage('Failed to save school information');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedInfo(schoolInfo);
    setLogoPreview(schoolInfo.logoUri);
    setLogoFile(null);
    setMessage('');
  };

  const icons = {
    back: <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>,
    upload: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
    sun: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>,
    moon: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>,
    checkmark: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>,
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100dvh',
      background: t.bg,
      color: t.text,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      flexDirection: 'column',
    } as React.CSSProperties}>
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
        flexShrink: 0,
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              color: t.textSub,
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            {icons.back}
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, letterSpacing: '-0.01em' }}>
              School Information
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
              Edit school details
            </div>
          </div>
        </div>

        <button
          onClick={() => setDark(v => !v)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            border: `1px solid ${t.border}`,
            background: t.surfaceAlt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: t.textSub,
          }}
        >
          {dark ? icons.sun : icons.moon}
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '14px 14px' : '22px 24px',
        overflowY: 'auto',
      } as React.CSSProperties}>
        {/* Zambia Flag */}
        <div style={{
          display: 'flex',
          height: 4,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 18,
        }}>
          {ZAMBIA_FLAG.map(c => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{
            background: messageType === 'success' ? t.accentBg : t.redBg,
            border: `1px solid ${messageType === 'success' ? t.accent + '40' : t.red + '40'}`,
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: messageType === 'success' ? t.accentText : t.red,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {messageType === 'success' ? icons.checkmark : '⚠️'}
            {message}
          </div>
        )}

        {loading ? (
          <div style={{
            background: t.accentBg,
            border: `1px solid ${t.accent}40`,
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            color: t.accentText,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: `2px solid ${t.accent}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            Loading school information…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 24,
          }}>
            {/* Left Column - Basic Info */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 16 }}>
                📋 Basic Information
              </div>

              {/* School Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  School Name *
                </label>
                <input
                  type="text"
                  value={editedInfo.schoolName}
                  onChange={e => setEditedInfo({ ...editedInfo, schoolName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  placeholder="Enter school name"
                />
              </div>

              {/* School Address */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  School Address
                </label>
                <textarea
                  value={editedInfo.schoolAddress}
                  onChange={e => setEditedInfo({ ...editedInfo, schoolAddress: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                    minHeight: 80,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  placeholder="Enter school address"
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  School Phone
                </label>
                <input
                  type="tel"
                  value={editedInfo.schoolPhone}
                  onChange={e => setEditedInfo({ ...editedInfo, schoolPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  placeholder="e.g., +260 XXX XXX XXX"
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  School Email
                </label>
                <input
                  type="email"
                  value={editedInfo.schoolEmail}
                  onChange={e => setEditedInfo({ ...editedInfo, schoolEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  placeholder="e.g., admin@school.zm"
                />
              </div>

              {/* School Code */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  School Code/Registration Number
                </label>
                <input
                  type="text"
                  value={editedInfo.schoolCode}
                  onChange={e => setEditedInfo({ ...editedInfo, schoolCode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  placeholder="Enter registration number"
                />
              </div>

              {/* Website */}
              <div>
                <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  School Website
                </label>
                <input
                  type="url"
                  value={editedInfo.schoolWebsite}
                  onChange={e => setEditedInfo({ ...editedInfo, schoolWebsite: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  placeholder="e.g., https://school.zm"
                />
              </div>
            </div>

            {/* Right Column - Logo & Bank */}
            <div>
              {/* Logo Section */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 16 }}>
                  🏫 School Logo
                </div>

                <div style={{
                  background: t.surface,
                  border: `2px dashed ${t.border}`,
                  borderRadius: 14,
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: 14,
                }}>
                  {logoPreview ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      <img
                        src={logoPreview}
                        alt="School Logo"
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `3px solid ${t.accent}`,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                          Logo Preview
                        </div>
                        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                          Click below to change
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 40,
                      marginBottom: 12,
                    }}>
                      🏢
                    </div>
                  )}

                  <input
                    type="file"
                    id="logoInput"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="logoInput"
                    style={{
                      display: 'inline-block',
                      padding: '10px 16px',
                      borderRadius: 8,
                      background: t.accentBg,
                      color: t.accent,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 12,
                      border: `1px solid ${t.accent}40`,
                    }}
                  >
                    {icons.upload} Choose Logo
                  </label>
                </div>

                <div style={{
                  fontSize: 11,
                  color: t.textMuted,
                  textAlign: 'center',
                }}>
                  PNG, JPG, or GIF up to 5MB
                </div>
              </div>

              {/* Bank Details Section */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 16 }}>
                  🏦 Bank Details
                </div>

                {/* Bank Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={editedInfo.bankName}
                    onChange={e => setEditedInfo({ ...editedInfo, bankName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surface,
                      color: t.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Enter bank name"
                  />
                </div>

                {/* Account Number */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={editedInfo.bankAccount}
                    onChange={e => setEditedInfo({ ...editedInfo, bankAccount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surface,
                      color: t.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Enter account number"
                  />
                </div>

                {/* Bank Code */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                    Bank Code/SWIFT
                  </label>
                  <input
                    type="text"
                    value={editedInfo.bankCode}
                    onChange={e => setEditedInfo({ ...editedInfo, bankCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surface,
                      color: t.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Enter SWIFT code"
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginTop: 24,
                }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: t.accent,
                      color: '#fff',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      opacity: saving ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {saving ? 'Saving...' : '✓ Save'}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: t.surfaceAlt,
                      color: t.text,
                      border: `1px solid ${t.border}`,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}