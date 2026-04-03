import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, TestScoreEntity, SubjectEntity, ClassEntity, LearnerEntity } from '../db';
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from '../styles/rankitz-colors';

interface SubjectStats {
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  classPerformance: { className: string; avg: number; passRate: number; learnerCount: number }[];
  topPerformers: { name: string; score: number }[];
}

export default function SubjectAnalysisScreen() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      analyzeSubject();
    }
  }, [selectedSubject, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const subjectsData = await db.getAllSubjects();
      setSubjects(subjectsData);
      if (subjectsData.length > 0) {
        setSelectedSubject(subjectsData[0].id || null);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSubject = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      const [scoresData, classesData, learnersData] = await Promise.all([
        db.getAllScores(),
        db.getAllClasses(),
        db.getAllLearners(),
      ]);

      let subjectScores = scoresData.filter(s => s.subjectId === selectedSubject && s.year === selectedYear);

      if (subjectScores.length === 0) {
        setStats({
          averageScore: 0,
          passRate: 0,
          highestScore: 0,
          lowestScore: 0,
          classPerformance: [],
          topPerformers: [],
        });
        setLoading(false);
        return;
      }

      const scoresArray = subjectScores.map(s => s.score);
      const avg = Math.round((scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) * 10) / 10;
      const passRate = Math.round((subjectScores.filter(s => s.score >= 50).length / subjectScores.length) * 100);
      const highest = Math.max(...scoresArray);
      const lowest = Math.min(...scoresArray);

      // Class performance
      const classStats = new Map<number, { scores: number[]; learners: Set<number> }>();
      subjectScores.forEach(s => {
        if (!classStats.has(s.learnerId)) {
          const learner = learnersData.find(l => l.id === s.learnerId);
          if (learner) {
            const key = learner.classId;
            if (!classStats.has(key)) {
              classStats.set(key, { scores: [], learners: new Set() });
            }
            classStats.get(key)!.learners.add(s.learnerId);
          }
        }
      });

      subjectScores.forEach(s => {
        const learner = learnersData.find(l => l.id === s.learnerId);
        if (learner) {
          const data = classStats.get(learner.classId);
          if (data) {
            data.scores.push(s.score);
          }
        }
      });

      const classPerformance = Array.from(classStats.entries())
        .map(([classId, data]) => {
          const cls = classesData.find(c => c.id === classId);
          const classAvg = data.scores.length > 0 
            ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
            : 0;
          const classPassing = data.scores.filter(s => s >= 50).length;
          const classPassRate = data.scores.length > 0 
            ? Math.round((classPassing / data.scores.length) * 100)
            : 0;
          return {
            className: cls?.className || 'Unknown',
            avg: classAvg,
            passRate: classPassRate,
            learnerCount: data.learners.size,
          };
        })
        .sort((a, b) => b.avg - a.avg);

      // Top performers
      const learnerScores = new Map<number, number[]>();
      subjectScores.forEach(s => {
        if (!learnerScores.has(s.learnerId)) {
          learnerScores.set(s.learnerId, []);
        }
        learnerScores.get(s.learnerId)!.push(s.score);
      });

      const topPerformers = Array.from(learnerScores.entries())
        .map(([learnerId, scores]) => ({
          name: learnersData.find(l => l.id === learnerId)?.name || 'Unknown',
          score: Math.max(...scores),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setStats({
        averageScore: avg,
        passRate,
        highestScore: highest,
        lowestScore: lowest,
        classPerformance,
        topPerformers,
      });
    } catch (error) {
      console.error('Error analyzing subject:', error);
    } finally {
      setLoading(false);
    }
  };

  const icons = {
    back: <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>,
    sun: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>,
    moon: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>,
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
            onClick={() => navigate('/reports')}
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
              Subject Analysis
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
              Deep dive subject performance
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

        {/* Selectors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 12,
          marginBottom: 18,
        }}>
          <select
            value={selectedSubject || ''}
            onChange={e => setSelectedSubject(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.subjectName}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              fontSize: 13,
              outline: 'none',
            }}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

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
            Analyzing subject…
          </div>
        ) : !stats ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: t.textMuted,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>
              No data available
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 18,
            }}>
              <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6, fontWeight: 700 }}>
                  Average
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: t.accent }}>
                  {stats.averageScore}
                </div>
              </div>

              <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6, fontWeight: 700 }}>
                  Pass Rate
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: stats.passRate >= 75 ? t.accent : stats.passRate >= 50 ? t.orange : t.red,
                }}>
                  {stats.passRate}%
                </div>
              </div>

              <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6, fontWeight: 700 }}>
                  Highest
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: t.accent }}>
                  {stats.highestScore}
                </div>
              </div>

              <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6, fontWeight: 700 }}>
                  Lowest
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: stats.lowestScore >= 50 ? t.orange : t.red,
                }}>
                  {stats.lowestScore}
                </div>
              </div>
            </div>

            {/* Class Performance */}
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: '16px',
              marginBottom: 18,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
                📍 Class Performance
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 300,
                  fontSize: 12,
                }}>
                  <thead>
                    <tr style={{ background: t.surfaceAlt }}>
                      <th style={{
                        padding: '10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}>Class</th>
                      <th style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}>Avg</th>
                      <th style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}>Pass %</th>
                      <th style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                      }}>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.classPerformance.map((cp, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${t.borderSub}` }}>
                        <td style={{ padding: '10px', color: t.text, fontWeight: 600 }}>{cp.className}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: t.accent }}>
                          {cp.avg}
                        </td>
                        <td style={{
                          padding: '10px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: cp.passRate >= 75 ? t.accent : cp.passRate >= 50 ? t.orange : t.red,
                        }}>
                          {cp.passRate}%
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: t.textSub }}>
                          {cp.learnerCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Performers */}
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: '16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
                ⭐ Top 5 Performers
              </div>
              {stats.topPerformers.map((p, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: idx < stats.topPerformers.length - 1 ? `1px solid ${t.borderSub}` : 'none',
                }}>
                  <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>
                    {idx + 1}. {p.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{p.score}</div>
                </div>
              ))}
            </div>
          </>
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