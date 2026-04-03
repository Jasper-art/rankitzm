import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, TestScoreEntity, LearnerEntity, ClassEntity, SubjectEntity } from '../db';
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from '../styles/rankitz-colors';

interface PerformanceStats {
  totalLearners: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  topPerformers: { name: string; avg: number }[];
  bottomPerformers: { name: string; avg: number }[];
  subjectPerformance: { name: string; avg: number; passRate: number }[];
}

export default function ClassPerformanceScreen() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [classData, setClassData] = useState<ClassEntity | null>(null);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    loadData();
  }, [classId, selectedTerm, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const cId = classId ? parseInt(classId, 10) : null;
      if (!cId) return;

      const [cls, learnersData, scoresData, subjectsData] = await Promise.all([
        db.getClass(cId),
        db.getAllLearners(),
        db.getAllScores(),
        db.getAllSubjects(),
      ]);

      setClassData(cls || null);

      const classLearners = learnersData.filter(l => l.classId === cId);
      let classScores = scoresData.filter(s => classLearners.some(l => l.id === s.learnerId));

      if (selectedTerm) {
        classScores = classScores.filter(s => s.term === selectedTerm);
      }
      classScores = classScores.filter(s => s.year === selectedYear);

      if (classScores.length === 0) {
        setStats({
          totalLearners: classLearners.length,
          averageScore: 0,
          passRate: 0,
          highestScore: 0,
          lowestScore: 0,
          topPerformers: [],
          bottomPerformers: [],
          subjectPerformance: [],
        });
        setLoading(false);
        return;
      }

      // Calculate overall stats
      const scoresArray = classScores.map(s => s.score);
      const averageScore = Math.round((scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) * 10) / 10;
      const passRate = Math.round((classScores.filter(s => s.score >= 50).length / classScores.length) * 100);
      const highestScore = Math.max(...scoresArray);
      const lowestScore = Math.min(...scoresArray);

      // Top & bottom performers
      const learnerAvgs = new Map<number, { count: number; sum: number }>();
      classScores.forEach(s => {
        if (!learnerAvgs.has(s.learnerId)) {
          learnerAvgs.set(s.learnerId, { count: 0, sum: 0 });
        }
        const data = learnerAvgs.get(s.learnerId)!;
        data.count += 1;
        data.sum += s.score;
      });

      const learnerPerformance = Array.from(learnerAvgs.entries())
        .map(([learnerId, data]) => ({
          learnerId,
          name: learnersData.find(l => l.id === learnerId)?.name || 'Unknown',
          avgScore: Math.round((data.sum / data.count) * 10) / 10,
        }))
        .sort((a, b) => b.avgScore - a.avgScore);

      const topPerformers = learnerPerformance.slice(0, 3).map(p => ({
        name: p.name,
        avg: p.avgScore,
      }));
      const bottomPerformers = learnerPerformance.slice(-3).reverse().map(p => ({
        name: p.name,
        avg: p.avgScore,
      }));

      // Subject performance
      const subjectStats = new Map<number, { count: number; sum: number; passes: number }>();
      classScores.forEach(s => {
        if (!subjectStats.has(s.subjectId)) {
          subjectStats.set(s.subjectId, { count: 0, sum: 0, passes: 0 });
        }
        const data = subjectStats.get(s.subjectId)!;
        data.count += 1;
        data.sum += s.score;
        if (s.score >= 50) data.passes += 1;
      });

      const subjectPerformance = Array.from(subjectStats.entries())
        .map(([subjectId, data]) => ({
          name: subjectsData.find(s => s.id === subjectId)?.subjectName || `Subject ${subjectId}`,
          avg: Math.round((data.sum / data.count) * 10) / 10,
          passRate: Math.round((data.passes / data.count) * 100),
        }))
        .sort((a, b) => b.avg - a.avg);

      setStats({
        totalLearners: classLearners.length,
        averageScore,
        passRate,
        highestScore,
        lowestScore,
        topPerformers,
        bottomPerformers,
        subjectPerformance,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const icons = {
    back: <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>,
    sun: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>,
    moon: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>,
    star: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
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
            onClick={() => navigate('/classes')}
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
              Class Performance
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
              {classData?.className}
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

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 12,
          marginBottom: 18,
        }}>
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: t.surface,
                color: t.text,
                fontSize: 12,
                outline: 'none',
              }}
            >
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Year
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: t.surface,
                color: t.text,
                fontSize: 12,
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
            Loading analytics…
          </div>
        ) : !stats ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: t.textMuted,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>
              No data available
            </div>
          </div>
        ) : (
          <>
            {/* Key Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
              gap: isMobile ? 10 : 12,
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
                  Learners
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: t.accent }}>
                  {stats.totalLearners}
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
                  Avg Score
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

            {/* Two Columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 14,
              marginBottom: 18,
            }}>
              {/* Top Performers */}
              <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 14,
                padding: '16px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
                  ⭐ Top Performers
                </div>
                {stats.topPerformers.map((p, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: idx < stats.topPerformers.length - 1 ? `1px solid ${t.borderSub}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: t.accentBg,
                        color: t.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontSize: 12, color: t.text, fontWeight: 500, minWidth: 0 }}>
                        {p.name}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>
                      {p.avg}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Performers */}
              <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 14,
                padding: '16px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
                  📍 Needs Support
                </div>
                {stats.bottomPerformers.map((p, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: idx < stats.bottomPerformers.length - 1 ? `1px solid ${t.borderSub}` : 'none',
                  }}>
                    <div style={{ fontSize: 12, color: t.text, fontWeight: 500, flex: 1 }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: p.avg >= 50 ? t.orange : t.red,
                    }}>
                      {p.avg}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Performance */}
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: '16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
                📚 Subject Performance
              </div>
              {stats.subjectPerformance.map((s, idx) => (
                <div key={idx} style={{ marginBottom: idx < stats.subjectPerformance.length - 1 ? 14 : 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                      {s.name}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: s.avg >= 75 ? t.accent : s.avg >= 50 ? t.orange : t.red,
                    }}>
                      {s.avg} ({s.passRate}%)
                    </span>
                  </div>
                  <div style={{
                    height: 6,
                    background: t.border,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(s.avg / 100) * 100}%`,
                        background: s.avg >= 75 ? t.accent : s.avg >= 50 ? t.orange : t.red,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
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