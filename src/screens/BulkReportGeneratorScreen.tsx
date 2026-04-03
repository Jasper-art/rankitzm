import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Loader, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
interface ReportJob {
  id: string;
  name: string;
  reportType: string;
  classes: string[];
  subjects: string[];
  terms: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  progress: number;
}

export default function BulkReportGeneratorScreen() {
  const navigate = useNavigate();
const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportJobs, setReportJobs] = useState<ReportJob[]>([
    {
      id: '1',
      name: 'Term 1 Class Reports',
      reportType: 'class_performance',
      classes: ['10A', '10B', '11A'],
      subjects: ['Mathematics', 'English', 'Science'],
      terms: ['Term 1'],
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 82800000),
      progress: 100,
    },
    {
      id: '2',
      name: 'Subject Analysis 2024',
      reportType: 'subject_analysis',
      classes: ['10A', '10B', '10C', '11A', '11B'],
      subjects: ['Mathematics', 'English', 'Science', 'History'],
      terms: ['Term 1', 'Term 2'],
      status: 'processing',
      createdAt: new Date(Date.now() - 3600000),
      progress: 65,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reportName: '',
    reportType: 'class_performance',
    classes: [] as string[],
    subjects: [] as string[],
    terms: [] as string[],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch classes and subjects for form
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!formData.reportName) {
      alert('Please enter a report name');
      return;
    }

    const newJob: ReportJob = {
      id: String(reportJobs.length + 1),
      name: formData.reportName,
      reportType: formData.reportType,
      classes: formData.classes,
      subjects: formData.subjects,
      terms: formData.terms,
      status: 'pending',
      createdAt: new Date(),
      progress: 0,
    };

    setReportJobs([newJob, ...reportJobs]);
    setFormData({
      reportName: '',
      reportType: 'class_performance',
      classes: [],
      subjects: [],
      terms: [],
    });
    setShowForm(false);

    // Simulate processing
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setReportJobs(prev =>
          prev.map(job =>
            job.id === newJob.id
              ? {
                  ...job,
                  status: 'completed',
                  progress: 100,
                  completedAt: new Date(),
                }
              : job
          )
        );
      } else {
        setReportJobs(prev =>
          prev.map(job =>
            job.id === newJob.id
              ? {
                  ...job,
                  status: 'processing',
                  progress: Math.floor(progress),
                }
              : job
          )
        );
      }
    }, 500);
  };

  const handleDownloadReport = (jobId: string) => {
    const job = reportJobs.find(j => j.id === jobId);
    if (!job) return;

    const content = `Bulk Report: ${job.name}
Report Type: ${job.reportType}
Generated: ${new Date().toISOString()}
Classes: ${job.classes.join(', ')}
Subjects: ${job.subjects.join(', ')}
Terms: ${job.terms.join(', ')}

Report Data...`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `report-${jobId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert('Report downloaded!');
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Delete this report job?')) {
      setReportJobs(reportJobs.filter(j => j.id !== jobId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader className="w-8 h-8 animate-spin text-primary" />
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
          <h1 className="text-xl font-bold">Bulk Report Generator</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-white text-primary px-3 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
        >
          <Plus className="w-5 h-5" />
          New
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Generate Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generate New Report</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Report Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Term 1 All Classes"
                value={formData.reportName}
                onChange={e => setFormData({ ...formData, reportName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Report Type *
              </label>
              <select
                value={formData.reportType}
                onChange={e => setFormData({ ...formData, reportType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="class_performance">Class Performance</option>
                <option value="subject_analysis">Subject Analysis</option>
                <option value="learner_rankings">Learner Rankings</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Terms to Include
              </label>
              <div className="flex gap-2">
                {['Term 1', 'Term 2', 'Term 3'].map(term => (
                  <label key={term} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.terms.includes(term)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData({ ...formData, terms: [...formData.terms, term] });
                        } else {
                          setFormData({
                            ...formData,
                            terms: formData.terms.filter(t => t !== term),
                          });
                        }
                      }}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{term}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleGenerateReport}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
              >
                Generate Report
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-primary">{reportJobs.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Jobs</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">
              {reportJobs.filter(j => j.status === 'completed').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completed</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">
              {reportJobs.filter(j => j.status === 'processing').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Processing</p>
          </div>
        </div>

        {/* Report Jobs List */}
        <div className="space-y-3">
          {reportJobs.length > 0 ? (
            reportJobs.map(job => (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-white">{job.name}</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status === 'completed' && '✓ Completed'}
                        {job.status === 'processing' && '⏳ Processing'}
                        {job.status === 'pending' && '⏸ Pending'}
                        {job.status === 'failed' && '✗ Failed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Type: {job.reportType} • Created: {job.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && (
                      <button
                        onClick={() => handleDownloadReport(job.id)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Progress</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{job.progress}%</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                  <p>
                    Classes: {job.classes.length > 0 ? job.classes.join(', ') : 'All'} • Terms:{' '}
                    {job.terms.length > 0 ? job.terms.join(', ') : 'All'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No report jobs yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}