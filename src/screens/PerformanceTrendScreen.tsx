import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend, 
  ComposedChart, 
  Bar 
} from 'recharts';

/**
 * FIXED: Inline theme definitions to resolve the "Could not resolve '../styles/rankitz-colors'" error.
 * This makes the file self-contained and runnable in the preview environment.
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
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;
}

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

interface TrendData {
  period: string;
  averageScore: number;
  passRate: number;
  testCount: number;
  highestScore: number;
  lowestScore: number;
}

interface SubjectTrend {
  subject: string;
  data: TrendData[];
}

// Named App to satisfy the React entry point requirement
export default function PerformanceTrendScreen() {
  const navigate = useNavigate();
  const { classId } = useParams();

  // Theme State
  const [dark] = useState(() => {
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [subjectTrends, setSubjectTrends] = useState<SubjectTrend[]>([]);
  const [timeRange, setTimeRange] = useState('semester'); // semester | term | year
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const t: Theme = dark ? DARK : LIGHT;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetchTrendData();
    return () => window.removeEventListener('resize', handleResize);
  }, [classId, timeRange]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);

      /**
       * MOCK DATA
       * Simulating local database retrieval (Dexie/IndexedDB)
       */
      const mockScores = [
        { subject: 'Mathematics', mark: 75, testDate: '2023-03-15' },
        { subject: 'Mathematics', mark: 45, testDate: '2023-04-10' },
        { subject: 'English', mark: 82, testDate: '2023-03-15' },
        { subject: 'Science', mark: 55, testDate: '2023-08-20' },
        { subject: 'Mathematics', mark: 88, testDate: '2023-09-05' },
        { subject: 'English', mark: 65, testDate: '2023-09-10' },
      ];

      const trendMap: Record<string, any> = {};
      const subjectMap: Record<string, Record<string, any>> = {};
      const subjectsSet = new Set<string>();

      mockScores.forEach(scoreData => {
        const testDate = new Date(scoreData.testDate);
        const subject = scoreData.subject;
        const mark = scoreData.mark;
        subjectsSet.add(subject);

        let periodKey = '';
        if (timeRange === 'semester') {
          periodKey = testDate.getMonth() < 6 ? `Sem 1 ${testDate.getFullYear()}` : `Sem 2 ${testDate.getFullYear()}`;
        } else if (timeRange === 'term') {
          const m = testDate.getMonth();
          const term = m < 3 ? 'T1' : m < 7 ? 'T2' : 'T3';
          periodKey = `${term} ${testDate.getFullYear()}`;
        } else {
          periodKey = testDate.getFullYear().toString();
        }

        if (!trendMap[periodKey]) trendMap[periodKey] = { scores: [], passCount: 0 };
        trendMap[periodKey].scores.push(mark);
        if (mark >= 50) trendMap[periodKey].passCount++;

        if (!subjectMap[subject]) subjectMap[subject] = {};
        if (!subjectMap[subject][periodKey]) subjectMap[subject][periodKey] = { scores: [], passCount: 0 };
        subjectMap[subject][periodKey].scores.push(mark);
        if (mark >= 50) subjectMap[subject][periodKey].passCount++;
      });

      const sortedPeriods = Object.keys(trendMap).sort();
      
      const trends = sortedPeriods.map(period => {
        const data = trendMap[period];
        const avg = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
        return {
          period,
          averageScore: Math.round(avg),
          passRate: Math.round((data.passCount / data.scores.length) * 100),
          testCount: data.scores.length,
          highestScore: Math.max(...data.scores),
          lowestScore: Math.min(...data.scores),
        };
      });

      setTrendData(trends);
      setSubjects(Array.from(subjectsSet));

      // Create subject trends for the filtered view
      const subTrends: SubjectTrend[] = Object.entries(subjectMap).map(([subject, periods]) => ({
        subject,
        data: sortedPeriods.map(period => {
          const data = periods[period];
          if (!data) return { period, averageScore: 0, passRate: 0, testCount: 0, highestScore: 0, lowestScore: 0 };
          const avg = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
          return {
            period,
            averageScore: Math.round(avg),
            passRate: Math.round((data.passCount / data.scores.length) * 100),
            testCount: data.scores.length,
            highestScore: Math.max(...data.scores),
            lowestScore: Math.min(...data.scores),
          };
        })
      }));

      setSubjectTrends(subTrends);
      setLoading(false);
    } catch (error) {
      console.error('Trend fetch error:', error);
      setLoading(false);
    }
  };

  const handleExport = () => {
    let csv = `Period,Average Score,Pass Rate %,Test Count\n`;
    trendData.forEach(d => {
      csv += `${d.period},${d.averageScore},${d.passRate},${d.testCount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-trend.csv`;
    a.click();
  };

  const displayData = selectedSubject === 'all' 
    ? trendData 
    : subjectTrends.find(st => st.subject === selectedSubject)?.data || [];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: t.bg,
      color: t.text,
      fontFamily: "'Inter', system-ui, sans-serif",
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
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: t.textSub, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20}>
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Performance Trends</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>{selectedSubject === 'all' ? 'Class Overview' : selectedSubject}</div>
          </div>
        </div>
        <button onClick={handleExport} style={{ background: 'none', border: 'none', color: t.textSub, cursor: 'pointer', padding: 4 }}>
          <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20}>
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      <main style={{ flex: 1, padding: isMobile ? '14px' : '22px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {/* Zambia flag accent */}
        <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
          {ZAMBIA_FLAG.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        </div>

        {/* Filters Card */}
        <div style={{ background: t.surface, borderRadius: 12, padding: 16, border: `1px solid ${t.border}`, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, display: 'block' }}>Time Range</label>
              <select 
                value={timeRange} 
                onChange={e => setTimeRange(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: t.bg, border: `1px solid ${t.border}`, color: t.text, outline: 'none' }}
              >
                <option value="semester">Semester</option>
                <option value="term">Term</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, display: 'block' }}>Subject</label>
              <select 
                value={selectedSubject} 
                onChange={e => setSelectedSubject(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: t.bg, border: `1px solid ${t.border}`, color: t.text, outline: 'none' }}
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: t.textMuted }}>Loading analytics...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Average Score Trend Chart */}
            <div style={{ background: t.surface, borderRadius: 12, padding: 16, border: `1px solid ${t.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                Average Score Trend
                <span style={{ color: t.accent }}>{displayData[displayData.length - 1]?.averageScore || 0}%</span>
              </h3>
              <div style={{ height: 250, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayData}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={t.accent} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={t.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                    <XAxis dataKey="period" stroke={t.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={t.textMuted} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} 
                      itemStyle={{ color: t.accent }}
                    />
                    <Area type="monotone" dataKey="averageScore" stroke={t.accent} fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pass Rate Trend Chart */}
            <div style={{ background: t.surface, borderRadius: 12, padding: 16, border: `1px solid ${t.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Pass Rate Progress</h3>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                    <XAxis dataKey="period" stroke={t.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={t.textMuted} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="passRate" stroke={t.success} strokeWidth={3} dot={{ r: 4, fill: t.success }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Range Distribution */}
            <div style={{ background: t.surface, borderRadius: 12, padding: 16, border: `1px solid ${t.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Score Range (High/Low)</h3>
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                    <XAxis dataKey="period" stroke={t.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={t.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="highestScore" fill={t.success} radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                    <Bar dataKey="lowestScore" fill={t.error} radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                    <Line type="monotone" dataKey="averageScore" stroke={t.accent} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}dd)`, color: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Current Avg</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{displayData[displayData.length - 1]?.averageScore || 0}%</div>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${t.success}, #059669)`, color: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Current Pass</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{displayData[displayData.length - 1]?.passRate || 0}%</div>
              </div>
              <div style={{ background: t.surface, padding: 16, borderRadius: 12, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, color: t.textMuted }}>Total Tests</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: t.text }}>{displayData.reduce((acc, curr) => acc + curr.testCount, 0)}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}