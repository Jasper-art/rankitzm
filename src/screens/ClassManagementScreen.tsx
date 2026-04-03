import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClasses, useLearners } from '../hooks/useClassManager';
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

interface ClassForm {
  className: string;
  level: string;
  academicYear: number;
  educationLevel: 'primary' | 'secondary' | 'tertiary';
  maximumPupils: number | '';
  subjectsOffered: string;
}

export default function ClassManagementScreen() {
  const navigate = useNavigate();
  const { classes, loading, error: hookError, addClass, updateClass, deleteClass } = useClasses();
  const { learners, getLearnersByClass } = useLearners();

  const [dark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const t = dark ? DARK : LIGHT;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<ClassForm>({
    className: '',
    level: '',
    academicYear: currentYear,
    educationLevel: 'primary',
    maximumPupils: '',
    subjectsOffered: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'academicYear' || name === 'maximumPupils')
        ? (name === 'maximumPupils' && !value ? '' : (name === 'maximumPupils' ? parseInt(value) : parseInt(value)))
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.className.trim()) {
        setError('Class name is required');
        setSaving(false);
        return;
      }
      if (!formData.level.trim()) {
        setError('Class level is required');
        setSaving(false);
        return;
      }

      const classData: any = {
        className: formData.className.trim(),
        level: formData.level.trim(),
        academicYear: formData.academicYear,
        educationLevel: formData.educationLevel,
        maximumPupils: formData.maximumPupils ? parseInt(formData.maximumPupils.toString()) : null,
        subjectsOffered: formData.subjectsOffered,
        syncId: uuidv4(),
      };

      if (editingId) {
        await updateClass({ id: editingId, ...classData });
      } else {
        await addClass(classData);
      }

      setFormData({
        className: '',
        level: '',
        academicYear: currentYear,
        educationLevel: 'primary',
        maximumPupils: '',
        subjectsOffered: '',
      });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (classItem: any) => {
    setFormData({
      className: classItem.className,
      level: classItem.level,
      academicYear: classItem.academicYear,
      educationLevel: classItem.educationLevel,
      maximumPupils: classItem.maximumPupils || '',
      subjectsOffered: classItem.subjectsOffered,
    });
    setEditingId(classItem.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await deleteClass(id);
    } catch (err) {
      setError('Failed to delete class');
    }
  };

  const filteredClasses = classes.filter(c =>
    c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.level.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Manage Classes</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>{classes.length} classes</div>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>
        {/* Error Messages */}
        {(error || hookError) && (
          <div style={{
            background: t.redBg, border: `1px solid ${t.red}40`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 18,
            fontSize: 13, color: t.redText,
          }}>
            ⚠ {error || hookError}
          </div>
        )}

        {/* Search & Add Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 18 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search classes..."
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
              {editingId ? 'Edit Class' : 'Add New Class'}
            </div>

            <Field label="Class Name *" hint="e.g., Grade 10A, Form 3 Blue">
              <input
                type="text" name="className"
                value={formData.className}
                onChange={handleInputChange}
                placeholder="e.g., Class 1A"
                style={inputStyle}
              />
            </Field>

            <Field label="Class Level *" hint="e.g., Grade 1, Form 3">
              <input
                type="text" name="level"
                value={formData.level}
                onChange={handleInputChange}
                placeholder="e.g., Grade 1"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <Field label="Education Level *">
                <select
                  name="educationLevel" value={formData.educationLevel}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </Field>
              <Field label="Academic Year *">
                <select
                  name="academicYear" value={formData.academicYear}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Maximum Pupils" hint="Leave blank for unlimited">
              <input
                type="number" name="maximumPupils"
                value={formData.maximumPupils}
                onChange={handleInputChange}
                placeholder="e.g., 50"
                min="1"
                style={inputStyle}
              />
            </Field>

            <Field label="Subjects Offered" hint="Comma-separated list">
              <textarea
                name="subjectsOffered"
                value={formData.subjectsOffered}
                onChange={handleInputChange}
                placeholder="Mathematics, English, Science"
                rows={2}
                style={{ ...inputStyle, resize: 'none' as const }}
              />
            </Field>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    className: '',
                    level: '',
                    academicYear: currentYear,
                    educationLevel: 'primary',
                    maximumPupils: '',
                    subjectsOffered: '',
                  });
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
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {editingId ? 'Update' : 'Create'} Class
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Classes List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textMuted }}>
            Loading classes…
          </div>
        ) : filteredClasses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredClasses.map(classItem => {
              const classLearners = getLearnersByClass(classItem.id || 0);
              return (
                <div
                  key={classItem.id}
                  style={{
                    background: t.surface, border: `1px solid ${t.border}`,
                    borderRadius: 12, padding: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>
                      {classItem.className}
                    </div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 6 }}>
                      {classItem.level} • {classItem.educationLevel} • {classItem.academicYear}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSub }}>
                      👥 {classLearners.length} learners {classItem.maximumPupils ? `/ ${classItem.maximumPupils}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                    <button
                      onClick={() => handleEdit(classItem)}
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
                      onClick={() => classItem.id && handleDelete(classItem.id)}
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
              );
            })}
          </div>
        ) : (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '32px', textAlign: 'center',
            color: t.textMuted,
          }}>
            {searchTerm ? 'No classes match your search' : 'No classes yet. Create one to get started!'}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}