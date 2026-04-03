import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, TestScoreEntity, LearnerEntity, ClassEntity, SubjectEntity } from '../db';
import { LIGHT, DARK, Theme, ZAMBIA_FLAG } from '../styles/rankitz-colors';

interface ScoreRow {
  learnerId: number;
  learnerName: string;
  className: string;
  subjectId: number;
  subjectName: string;
  score: number;
  testType: string;
  term: string;
  year: number;
  status: 'Pass' | 'Fail';
}

export default function ScoresTableScreen() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [filteredScores, setFilteredScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTestType, setFilterTestType] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('learner');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);

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
    applyFilters();
  }, [scores, searchTerm, filterClass, filterSubject, filterTestType, filterTerm, minScore, maxScore, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scoresData, learnersData, classesData, subjectsData] = await Promise.all([
        db.getAllScores(),
        db.getAllLearners(),
        db.getAllClasses(),
        db.getAllSubjects(),
      ]);

      setClasses(classesData);
      setSubjects(subjectsData);

      // Map scores to row format
      const rows = scoresData.map(s => ({
        learnerId: s.learnerId,
        learnerName: learnersData.find(l => l.id === s.learnerId)?.name || 'Unknown',
        className: classesData.find(c => 
          learnersData.find(l => l.id === s.learnerId)?.classId === c.id
        )?.className || 'Unknown',
        subjectId: s.subjectId,
        subjectName: subjectsData.find(sb => sb.id === s.subjectId)?.subjectName || 'Unknown',
        score: s.score,
        testType: s.testType,
        term: s.term,
        year: s.year,
        status: s.score >= 50 ? 'Pass' as const : 'Fail' as const,
      }));

      setScores(rows);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...scores];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter(s => s.className === filterClass);
    }

    // Subject filter
    if (filterSubject) {
      filtered = filtered.filter(s => s.subjectName === filterSubject);
    }

    // Test type filter
    if (filterTestType) {
      filtered = filtered.filter(s => s.testType === filterTestType);
    }

    // Term filter
    if (filterTerm) {
      filtered = filtered.filter(s => s.term === filterTerm);
    }

    // Score range
    if (minScore) {
      filtered = filtered.filter(s => s.score >= parseInt(minScore, 10));
    }
    if (maxScore) {
      filtered = filtered.filter(s => s.score <= parseInt(maxScore, 10));
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareA: any = a[sortBy as keyof ScoreRow];
      let compareB: any = b[sortBy as keyof ScoreRow];

      if (typeof compareA === 'string') {
        compareA = compareA.toLowerCase();
        compareB = (compareB as string).toLowerCase();
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredScores(filtered);
    setPage(1);
  };

  const paginatedScores = filteredScores.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredScores.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Learner', 'Class', 'Subject', 'Score', 'Test Type', 'Term', 'Year', 'Status'];
    const rows = filteredScores.map(s => [
      s.learnerName,
      s.className,
      s.subjectName,
      s.score,
      s.testType,
      s.term,
      s.year,
      s.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `scores_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const icons = {
    back: <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>,
    download: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
    sun: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>,
    moon: <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16}><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>,
  };

  const uniqueClasses = Array.from(new Set(scores.map(s => s.className)));
  const uniqueSubjects = Array.from(new Set(scores.map(s => s.subjectName)));
  const uniqueTestTypes = Array.from(new Set(scores.map(s => s.testType)));
  const uniqueTerms = Array.from(new Set(scores.map(s => s.term)));

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
            onClick={() => navigate('/tests')}
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
              Scores Table
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
              {filteredScores.length} records
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={exportToCSV}
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
            title="Export CSV"
          >
            {icons.download}
          </button>
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
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '14px 14px' : '22px 24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
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
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: '16px',
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>
            Filters
          </div>

          {/* Search */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search learner, class, subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Row 1 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 12,
          }}>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Row 2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 12,
          }}>
            <select
              value={filterTestType}
              onChange={e => setFilterTestType(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">All Test Types</option>
              {uniqueTestTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filterTerm}
              onChange={e => setFilterTerm(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">All Terms</option>
              {uniqueTerms.map(tm => (
                <option key={tm} value={tm}>
                  {tm}
                </option>
              ))}
            </select>
          </div>

          {/* Score Range */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: 10,
          }}>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min score"
              value={minScore}
              onChange={e => setMinScore(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max score"
              value={maxScore}
              onChange={e => setMaxScore(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterClass('');
                setFilterSubject('');
                setFilterTestType('');
                setFilterTerm('');
                setMinScore('');
                setMaxScore('');
              }}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: t.accentBg,
                color: t.accent,
                border: `1px solid ${t.accent}40`,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sorting */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 700 }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              fontSize: 12,
              outline: 'none',
            }}
          >
            <option value="learner">Learner</option>
            <option value="className">Class</option>
            <option value="subjectName">Subject</option>
            <option value="score">Score</option>
            <option value="term">Term</option>
          </select>

          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              fontSize: 12,
              outline: 'none',
            }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Table */}
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
            Loading scores…
          </div>
        ) : filteredScores.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: t.textMuted,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>
              No scores match your filters
            </div>
          </div>
        ) : (
          <>
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              overflow: 'hidden',
              overflowX: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 700,
              }}>
                <thead style={{ background: t.surfaceAlt}}>
                  <tr>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      textTransform: 'uppercase',
                    }}>
                      Learner
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      textTransform: 'uppercase',
                    }}>
                      Class
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      textTransform: 'uppercase',
                    }}>
                      Subject
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      textTransform: 'uppercase',
                    }}>
                      Score
                    </th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      textTransform: 'uppercase',
                    }}>
                      Status
                    </th>
                    {!isMobile && (
                      <>
                        <th style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: t.textMuted,
                          borderBottom: `1px solid ${t.border}`,
                          textTransform: 'uppercase',
                        }}>
                          Type
                        </th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: t.textMuted,
                          borderBottom: `1px solid ${t.border}`,
                          textTransform: 'uppercase',
                        }}>
                          Term
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedScores.map((row, idx) => (
                    <tr
                      key={idx}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = t.surfaceAlt;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                      style={{
                        borderBottom: `1px solid ${t.borderSub}`,
                        transition: 'background 0.1s',
                      }}
                    >
                      <td style={{
                        padding: '12px',
                        color: t.text,
                        fontWeight: 600,
                        fontSize: 13,
                      }}>
                        {row.learnerName}
                      </td>
                      <td style={{
                        padding: '12px',
                        color: t.textSub,
                        fontSize: 13,
                      }}>
                        {row.className}
                      </td>
                      <td style={{
                        padding: '12px',
                        color: t.textSub,
                        fontSize: 13,
                      }}>
                        {row.subjectName}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        color: row.score >= 75 ? t.accent : row.score >= 50 ? t.orange : t.red,
                      }}>
                        {row.score}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: row.status === 'Pass' ? t.accent : t.red,
                      }}>
                        {row.status}
                      </td>
                      {!isMobile && (
                        <>
                          <td style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: 12,
                            color: t.textSub,
                          }}>
                            {row.testType}
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: 12,
                            color: t.textSub,
                          }}>
                            {row.term}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 18,
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${t.border}`,
                    background: page === 1 ? t.surfaceAlt : t.surface,
                    color: t.text,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  ← Prev
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page > 2 ? page - 2 + i : i + 1;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: pageNum === page ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                        background: pageNum === page ? t.accentBg : t.surface,
                        color: pageNum === page ? t.accent : t.text,
                        cursor: 'pointer',
                        fontWeight: pageNum === page ? 700 : 500,
                        fontSize: 12,
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${t.border}`,
                    background: page === totalPages ? t.surfaceAlt : t.surface,
                    color: t.text,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Next →
                </button>

                <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 8 }}>
                  Page {page} of {totalPages}
                </span>
              </div>
            )}
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