import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface ClassComparison {
  classId: string;
  className: string;
  totalLearners: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  subjectPerformance: Record<string, number>;
}

export default function ClassComparisonScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassComparison[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchClassesAndPerformance();
  }, []);

  const fetchClassesAndPerformance = async () => {
    try {
      const classesData = await db.getAllClasses();
      const learnersData = await db.getAllLearners();
      const scoresData = await db.getAllScores();
      
      const classPerformance: ClassComparison[] = classesData.map(classItem => {
        const classLearners = learnersData.filter(l => l.classId === classItem.id);
        const classScores = scoresData.filter(s => 
          classLearners.some(l => l.id === s.learnerId)
        );
        
        let totalScore = 0;
        let passCount = 0;
        const subjectMap: Record<string, number[]> = {};
        let highestScore = 0;
        let lowestScore = 100;
        
        classScores.forEach(score => {
          totalScore += score.score;
          highestScore = Math.max(highestScore, score.score);
          lowestScore = Math.min(lowestScore, score.score);
          if (score.score >= 50) passCount++;
          
          if (!subjectMap[score.subjectId]) {
            subjectMap[score.subjectId] = [];
          }
          subjectMap[score.subjectId].push(score.score);
        });
        
        const averageScore = classScores.length > 0 ? totalScore / classScores.length : 0;
        const passRate = classScores.length > 0 ? (passCount / classScores.length) * 100 : 0;
        
        const subjectPerformance: Record<string, number> = {};
        Object.entries(subjectMap).forEach(([subjectId, scores]) => {
          subjectPerformance[subjectId] = scores.length > 0 ? 
            scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        });
        
        return {
          classId: classItem.id?.toString() || '',
          className: classItem.className || 'Class',
          totalLearners: classLearners.length,
          averageScore: Math.round(averageScore * 10) / 10,
          passRate: Math.round(passRate * 10) / 10,
          highestScore: classScores.length > 0 ? highestScore : 0,
          lowestScore: classScores.length > 0 ? lowestScore : 0,
          subjectPerformance,
        };
      });
      
      setClasses(classPerformance);
      setSelectedClasses(classPerformance.slice(0, 3).map(c => c.classId));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class performance:', error);
      setLoading(false);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const filteredClasses = classes.filter(c => selectedClasses.includes(c.classId));

  const handleExport = () => {
    let csv = `Class Comparison Report\n\nComparison Data\nClass,Total Learners,Average Score,Pass Rate %,Highest,Lowest\n`;
    csv += filteredClasses
      .map(
        c =>
          `${c.className},${c.totalLearners},${c.averageScore},${c.passRate},${c.highestScore},${c.lowestScore}`
      )
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'class-comparison.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const radarData = filteredClasses.map(c => ({
    class: c.className,
    'Avg Score': c.averageScore,
    'Pass Rate': c.passRate,
    Learners: (c.totalLearners / Math.max(...classes.map(cl => cl.totalLearners))) * 100,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Class Comparison
          </h1>
        </div>
        <button onClick={handleExport} className="hover:opacity-80">
          <Download className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Class Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Classes</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {classes.map(classItem => (
              <label
                key={classItem.classId}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(classItem.classId)}
                  onChange={() => toggleClassSelection(classItem.classId)}
                  className="w-5 h-5 text-primary rounded cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{classItem.className}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classItem.totalLearners} learners • Avg: {classItem.averageScore}%
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Comparison Charts */}
        {filteredClasses.length > 0 && (
          <>
            {/* Average Score Comparison */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Average Score Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredClasses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="className" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="averageScore" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pass Rate Comparison */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pass Rate Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredClasses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="className" stroke="#6b7280" />
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
                  <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart - Multi-dimensional Comparison */}
            {radarData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Performance Radar</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="class" stroke="#6b7280" />
                    <PolarRadiusAxis stroke="#6b7280" />
                    <Radar
                      name="Avg Score"
                      dataKey="Avg Score"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Pass Rate"
                      dataKey="Pass Rate"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
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

            {/* Comparison Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm overflow-x-auto">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Detailed Comparison</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Class</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">Learners</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">Avg Score</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">Pass Rate</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClasses.map((classItem, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 font-semibold text-gray-900 dark:text-white">
                        {classItem.className}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-900 dark:text-white">
                        {classItem.totalLearners}
                      </td>
                      <td className="px-4 py-2 text-center font-bold text-primary">
                        {classItem.averageScore}%
                      </td>
                      <td className="px-4 py-2 text-center font-bold text-green-600">
                        {classItem.passRate}%
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                        {classItem.lowestScore}% - {classItem.highestScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md">
                <p className="text-sm opacity-90">Best Class Average</p>
                <p className="text-3xl font-bold">
                  {Math.max(...filteredClasses.map(c => c.averageScore))}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-md">
                <p className="text-sm opacity-90">Best Pass Rate</p>
                <p className="text-3xl font-bold">
                  {Math.max(...filteredClasses.map(c => c.passRate))}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-md">
                <p className="text-sm opacity-90">Lowest Class Average</p>
                <p className="text-3xl font-bold">
                  {Math.min(...filteredClasses.map(c => c.averageScore))}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4 shadow-md">
                <p className="text-sm opacity-90">Avg of All Compared</p>
                <p className="text-3xl font-bold">
                  {(
                    filteredClasses.reduce((sum, c) => sum + c.averageScore, 0) /
                    filteredClasses.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}