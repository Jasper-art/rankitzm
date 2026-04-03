import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, TestScoreEntity, LearnerEntity, ClassEntity, SubjectEntity } from '../db';
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from '../styles/rankitz-colors';

interface LearnerRanking {
  id: number;
  name: string;
  averageScore: number;
  totalScore: number;
  rank: number;
}

export default function RankingScreen() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [classData, setClassData] = useState<ClassEntity | null>(null);
  const [rankings, setRankings] = useState<LearnerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    loadData();
  }, [classId, selectedTerm, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const cId = classId ? parseInt(classId, 10) : null;
      if (!cId) {
        setError('Invalid class ID');
        return;
      }

      // Get class data
      const classInfo = await db.getClass(cId);
      if (!classInfo) {
        setError('Class not found');
        return;
      }
      setClassData(classInfo);

      // Get learners in this class
      const learners = await db.getLearnersByClass(cId);
      if (!learners || learners.length === 0) {
        setRankings([]);
        return;
      }

      // Get test scores for all learners in this class
      const allScores: TestScoreEntity[] = [];
      for (const learner of learners) {
        if (learner.id) {
          const learnerScores = selectedTerm
            ? await db.getScoresByLearnerAndTerm(learner.id, selectedTerm, selectedYear)
            : await db.getScoresByLearner(learner.id);
          allScores.push(...learnerScores);
        }
      }

      // Calculate rankings
      const learnerRankings: LearnerRanking[] = learners.map(learner => {
        const learnerScores = allScores.filter(s => s.learnerId === learner.id);
        const totalScore = learnerScores.reduce((sum: number, s) => sum + (s.score || 0), 0);
        const averageScore = learnerScores.length > 0 ? totalScore / learnerScores.length : 0;

        return {
          id: learner.id!,
          name: learner.name,
          averageScore: Math.round(averageScore * 100) / 100,
          totalScore,
          rank: 0, // Will be set after sorting
        };
      });

      // Sort by average score descending
      learnerRankings.sort((a, b) => b.averageScore - a.averageScore);

      // Assign ranks
      learnerRankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });

      setRankings(learnerRankings);
    } catch (err) {
      setError('Failed to load rankings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div style={{
      minHeight: '100dvh', width: '100%', background: t.bg,
      fontFamily: "'DM Sans','Outfit','Segoe UI',system-ui,sans-serif",
      color: t.text,
    }}>
      {ZAMBIA_FLAG}

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
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
            Class Rankings
          </div>
          <div style={{ fontSize: 11, color: t.textMuted }}>
            {classData?.className || 'Loading...'}
          </div>
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

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: t.textSub, display: 'block', marginBottom: 6 }}>
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                width: '100%', padding: '8px 12px',
                background: t.surfaceAlt, border: `1px solid ${t.border}`,
                borderRadius: 8, fontSize: 13, color: t.text,
                outline: 'none',
              }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: t.textSub, display: 'block', marginBottom: 6 }}>
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px',
                background: t.surfaceAlt, border: `1px solid ${t.border}`,
                borderRadius: 8, fontSize: 13, color: t.text,
                outline: 'none',
              }}
            >
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>

        {/* Rankings List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textMuted }}>
            Loading rankings…
          </div>
        ) : rankings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankings.map((ranking, index) => (
              <div
                key={ranking.id}
                style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 12, padding: '16px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  ...(ranking.rank <= 3 && { borderColor: t.accent, background: t.accentBg + '20' }),
                }}
              >
                <div style={{
                  fontSize: 18, fontWeight: 700, color: t.text,
                  minWidth: 40, textAlign: 'center',
                }}>
                  {getRankIcon(ranking.rank)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 2 }}>
                    {ranking.name}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>
                    Average: {ranking.averageScore}% • Total: {ranking.totalScore}
                  </div>
                </div>
                {ranking.rank <= 3 && (
                  <div style={{
                    fontSize: 20,
                    ...(ranking.rank === 1 && { color: '#FFD700' }),
                    ...(ranking.rank === 2 && { color: '#C0C0C0' }),
                    ...(ranking.rank === 3 && { color: '#CD7F32' }),
                  }}>
                    {ranking.rank === 1 ? '👑' : ranking.rank === 2 ? '⭐' : '🎖️'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '32px', textAlign: 'center',
            color: t.textMuted,
          }}>
            No rankings available for the selected filters.
          </div>
        )}
      </main>
    </div>
  );
}