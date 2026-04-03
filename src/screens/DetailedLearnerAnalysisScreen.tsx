import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, User, BarChart3, TrendingUp, BookOpen } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface LearnerAnalysis {
  learnerId: string;
  name: string;
  className: string;
  totalTests: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  trend: 'improving' | 'declining' | 'stable';
  subjectPerformance: Array<{
    subject: string;
    average: number;
    count: number;
  }>;
  scoreHistory: Array<{
    date: string;
    score: number;
    subject: string;
  }>;
  testTypePerformance: Array<{
    testType: string;
    average: number;
    count: number;
  }>;
  strengths: string[];
  weaknesses: string[];
}

export default function DetailedLearnerAnalysisScreen() {
  const navigate = useNavigate();
  const { learnerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<LearnerAnalysis | null>(null);

  useEffect(() => {
    fetchLearnerAnalysis();
  }, [learnerId]);

const fetchLearnerAnalysis = async () => {
  try {
    const learnerIdNum = learnerId ? parseInt(learnerId, 10) : null;
    if (!learnerIdNum) throw new Error('Invalid learner ID');

    const [learnersData, scoresData, classesData] = await Promise.all([
      db.getAllLearners(),
      db.getAllScores(),
      db.getAllClasses(),
    ]);

    const learnerData = learnersData.find(l => l.id === learnerIdNum);
    if (!learnerData) throw new Error('Learner not found');

    const learnerScores = scoresData.filter(s => s.learnerId === learnerIdNum);
    const classData = classesData.find(c => c.id === learnerData.classId);

    const scores: number[] = [];
    const subjectMap: Record<string, any> = {};
    const scoreHistory: any[] = [];
    const testTypeMap: Record<string, any> = {};
    let passCount = 0;

    learnerScores.forEach(scoreData => {
      const mark = scoreData.score;
      const subject = 'Subject'; // You may need to fetch subject names
      const testType = scoreData.testType;
      const testDate = new Date();

      scores.push(mark);
      if (mark >= 50) passCount++;

      // Subject performance
      if (!subjectMap[subject]) {
        subjectMap[subject] = { scores: [] };
      }
      subjectMap[subject].scores.push(mark);

      // Test type performance
      if (!testTypeMap[testType]) {
        testTypeMap[testType] = { scores: [] };
      }
      testTypeMap[testType].scores.push(mark);

      // Score history
      scoreHistory.push({
        date: testDate.toLocaleDateString(),
        score: mark,
        subject,
      });
    });

    // Calculate statistics
    const totalTests = scores.length;
    const averageScore = totalTests > 0 ? scores.reduce((a, b) => a + b, 0) / totalTests : 0;
    const passRate = totalTests > 0 ? (passCount / totalTests) * 100 : 0;
    const highestScore = Math.max(...scores, 0);
    const lowestScore = Math.min(...scores, 0);

    // Determine trend
    const recentScores = scoreHistory.slice(-5).map(s => s.score);
    const oldScores = scoreHistory.slice(0, 5).map(s => s.score);
    const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const oldAvg = oldScores.length > 0 ? oldScores.reduce((a, b) => a + b, 0) / oldScores.length : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > oldAvg + 5) trend = 'improving';
    else if (recentAvg < oldAvg - 5) trend = 'declining';

    // Subject performance
    const subjectPerf = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      average: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
      count: data.scores.length,
    }));

    // Sort to find strengths and weaknesses
    const sortedSubjects = [...subjectPerf].sort((a, b) => b.average - a.average);
    const strengths = sortedSubjects.slice(0, 2).map(s => s.subject);
    const weaknesses = sortedSubjects.slice(-2).map(s => s.subject);

    // Test type performance
    const testTypePerf = Object.entries(testTypeMap).map(([testType, data]) => ({
      testType,
      average: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
      count: data.scores.length,
    }));

    setAnalysisData({
      learnerId: learnerId || '',
      name: learnerData.name || 'Unknown',
      className: classData?.className || 'Unknown',
      totalTests,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      highestScore,
      lowestScore,
      trend,
      subjectPerformance: subjectPerf,
      scoreHistory: scoreHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      testTypePerformance: testTypePerf,
      strengths,
      weaknesses,
    });
    setLoading(false);
  } catch (error) {
    console.error('Error fetching learner analysis:', error);
    setLoading(false);
  }
};
  const handleExport = () => {
    if (!analysisData) return;
    const csv = `Detailed Learner Analysis Report
${analysisData.name}
Class: ${analysisData.className}

Summary Statistics
Total Tests,${analysisData.totalTests}
Average Score,${analysisData.averageScore}
Pass Rate %,${analysisData.passRate}
Highest Score,${analysisData.highestScore}
Lowest Score,${analysisData.lowestScore}
Trend,${analysisData.trend}

Subject Performance
Subject,Average,Count
${analysisData.subjectPerformance.map(s => `${s.subject},${s.average.toFixed(2)},${s.count}`).join('\n')}

Test Type Performance
Test Type,Average,Count
${analysisData.testTypePerformance.map(t => `${t.testType},${t.average.toFixed(2)},${t.count}`).join('\n')}`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `learner-analysis-${learnerId}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const radarData = analysisData.subjectPerformance.map(s => ({
    subject: s.subject,
    score: s.average,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{analysisData.name} Analysis</h1>
        </div>
        <button onClick={handleExport} className="hover:opacity-80">
          <Download className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Learner Card */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{analysisData.name}</h2>
                <p className="text-white/80">{analysisData.className}</p>
                <p className="text-sm text-white/70 mt-1 flex items-center gap-1">
                  {analysisData.trend === 'improving' && '📈 Improving'}
                  {analysisData.trend === 'declining' && '📉 Declining'}
                  {analysisData.trend === 'stable' && '➡️ Stable'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md">
            <p className="text-xs opacity-90">Average Score</p>
            <p className="text-3xl font-bold">{analysisData.averageScore}%</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-md">
            <p className="text-xs opacity-90">Pass Rate</p>
            <p className="text-3xl font-bold">{analysisData.passRate}%</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-md">
            <p className="text-xs opacity-90">Total Tests</p>
            <p className="text-3xl font-bold">{analysisData.totalTests}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4 shadow-md">
            <p className="text-xs opacity-90">Score Range</p>
            <p className="text-sm font-bold">{analysisData.lowestScore}% - {analysisData.highestScore}%</p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Strengths
            </h3>
            <div className="space-y-2">
              {analysisData.strengths.map((strength, idx) => (
                <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                  ✓ {strength}
                </p>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">Areas for Improvement</h3>
            <div className="space-y-2">
              {analysisData.weaknesses.map((weakness, idx) => (
                <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                  ! {weakness}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Score History */}
        {analysisData.scoreHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Score History
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysisData.scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subject Performance Radar */}
        {radarData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Subject Performance
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                <PolarRadiusAxis stroke="#6b7280" />
                <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subject Breakdown Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Subject Breakdown</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Subject</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">Average</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">Tests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {analysisData.subjectPerformance.map((subject, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-gray-900 dark:text-white">{subject.subject}</td>
                  <td className="px-4 py-2 text-center font-bold text-primary">
                    {subject.average.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                    {subject.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Test Type Performance */}
        {analysisData.testTypePerformance.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Performance by Test Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysisData.testTypePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="testType" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="average" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}