import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '../hooks/useClassManager';
import { db, TestScoreEntity, LearnerEntity, ClassEntity, SubjectEntity } from '../db';
import { v4 as uuidv4 } from 'uuid';

const LIGHT = {
  bg: '#F2F5F2', surface: '#FFFFFF', surfaceAlt: '#EFF4EF',
  border: '#DDE8DD', borderSub: '#EEF4EE',
  text: '#0D1A0D', textSub: '#3A5A3A', textMuted: '#7A9A7A',
  accent: '#198A00', accentBg: '#E4F5E0', accentText: '#0A5000',
  red: '#EF3340', redBg: '#FDECEE', redText: '#8A0010',
  orange: '#E07200', orangeBg: '#FFF0E0', orangeText: '#7A3A00',
  topbar: '#FFFFFF', shadow: 'rgba(25,138,0,0.10)',
};

const DARK = {
  bg: '#0A140A', surface: '#121E12', surfaceAlt: '#182418',
  border: '#243024', borderSub: '#1A241A',
  text: '#E0EEE0', textSub: '#80A880', textMuted: '#4A6A4A',
  accent: '#34C000', accentBg: '#0A2008', accentText: '#80E060',
  red: '#FF5060', redBg: '#280A0E', redText: '#FF9098',
  orange: '#FF9030', orangeBg: '#281600', orangeText: '#FFB870',
  topbar: '#121E12', shadow: 'rgba(52,192,0,0.14)',
};

type Theme = typeof LIGHT;

function FlagStrip() {
  return (
    <div style={{ display: 'flex', height: 3, width: '100%', flexShrink: 0 }}>
      {['#198A00', '#EF3340', '#1A1A1A', '#FF8200'].map(c => (
        <div key={c} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#3A5A3A', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#7A9A7A', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

interface SubjectForm {
  subjectName: string;
  subjectId: number;
  classId: number;
  maxMark: number;
}

export default function SubjectManagementScreen() {
  const navigate = useNavigate();

  const [dark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const t = dark ? DARK : LIGHT;

  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<SubjectForm>({
    subjectName: '',
    subjectId: 0,
    classId: 0,
    maxMark: 100,
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await db.getAllSubjects();
      setSubjects(data || []);
      setError('');
    } catch (err) {
      setError('Failed to load subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'subjectId' || name === 'classId' || name === 'maxMark')
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.subjectName.trim()) {
        setError('Subject name is required');
        setSaving(false);
        return;
      }

      if (editingId) {
        await db.updateSubject({
          id: editingId,
          ...formData,
          syncId: `sync_${Date.now()}`,
        });
      } else {
        await db.addSubject({
          ...formData,
          syncId: uuidv4(),
        });
      }

      setFormData({ subjectName: '', subjectId: 0, classId: 0, maxMark: 100 });
      setEditingId(null);
      setShowForm(false);
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject: SubjectEntity) => {
    setFormData({
      subjectName: subject.subjectName,
      subjectId: subject.subjectId || 0,
      classId: subject.classId || 0,
      maxMark: subject.maxMark || 100,
    });
    setEditingId(subject.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await db.deleteSubject(id);
      await loadSubjects();
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: t.surfaceAlt, border: `1px solid ${t.border}`,
    borderRadius: 9, fontSize: 13, color: t.text,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100dvh', width: '100%', background: t.bg,
      fontFamily: "'DM Sans','Outfit','Segoe UI',system-ui,sans-serif",
      color: t.text,
    }}>
      <FlagStrip />

      {/* Topbar */}
      <header style={{
        background: t.topbar, borderBottom: `1px solid ${t.border}`,
        padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: t.textMuted, display: 'flex', padding: 4,
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Manage Subjects</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>{subjects.length} subjects</div>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>
        {/* Error */}
        {error && (
          <div style={{
            background: t.redBg, border: `1px solid ${t.red}40`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 18,
            fontSize: 13, color: t.redText,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Search & Add Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 18 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: 34,
              }}
            />
            <svg
              viewBox="0 0 20 20" fill="currentColor"
              width={16} height={16}
              style={{
                position: 'absolute', left: 10, top: '50%',
                transform: 'translateY(-50%)', color: t.textMuted,
              }}
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 16px', borderRadius: 10,
              border: 'none', background: t.accent, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 16, padding: '24px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${t.borderSub}` }}>
              {editingId ? 'Edit Subject' : 'Add New Subject'}
            </div>

            <Field label="Subject Name *">
              <input
                type="text" name="subjectName"
                value={formData.subjectName}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <Field label="Subject ID">
                <input
                  type="number" name="subjectId"
                  value={formData.subjectId || ''}
                  onChange={handleInputChange}
                  placeholder="101"
                  style={inputStyle}
                />
              </Field>
              <Field label="Max Mark">
                <input
                  type="number" name="maxMark"
                  value={formData.maxMark}
                  onChange={handleInputChange}
                  min="1"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ subjectName: '', subjectId: 0, classId: 0, maxMark: 100 });
                }}
                disabled={saving}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: `1px solid ${t.border}`, background: t.surfaceAlt,
                  color: t.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', opacity: saving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg,#198A00,#0D5800)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', opacity: saving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
                      <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                    </svg>
                    {editingId ? 'Update' : 'Create'} Subject
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Subjects List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textMuted }}>
            Loading subjects…
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredSubjects.map(subject => (
              <div
                key={subject.id}
                style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 12, padding: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>
                    {subject.subjectName}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>
                    ID: {subject.subjectId} • Max: {subject.maxMark}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEdit(subject)}
                    style={{
                      background: t.accentBg, border: 'none',
                      borderRadius: 8, padding: '6px 10px',
                      color: t.accentText, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => subject.id && handleDelete(subject.id)}
                    style={{
                      background: t.redBg, border: 'none',
                      borderRadius: 8, padding: '6px 10px',
                      color: t.redText, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '32px', textAlign: 'center',
            color: t.textMuted,
          }}>
            {searchTerm ? 'No subjects match your search' : 'No subjects yet. Create one to get started!'}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}