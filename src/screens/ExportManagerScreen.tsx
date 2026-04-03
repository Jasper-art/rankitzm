import React, { useState } from 'react';
import { ArrowLeft, Download, Trash2, Share2, Eye, FileJson, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Export {
  id: string;
  name: string;
  type: string;
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  size: string;
  status: 'completed' | 'failed';
  createdAt: Date;
  dataPoints: number;
}

export default function ExportManagerScreen() {
  const navigate = useNavigate();
  const [exports, setExports] = useState<Export[]>([
    {
      id: '1',
      name: 'All Class Data - 2024',
      type: 'class_data',
      format: 'json',
      size: '4.2 MB',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000),
      dataPoints: 1245,
    },
    {
      id: '2',
      name: 'Learner Scores - Term 1',
      type: 'scores',
      format: 'csv',
      size: '1.8 MB',
      status: 'completed',
      createdAt: new Date(Date.now() - 172800000),
      dataPoints: 5623,
    },
    {
      id: '3',
      name: 'Performance Report',
      type: 'reports',
      format: 'pdf',
      size: '3.5 MB',
      status: 'completed',
      createdAt: new Date(Date.now() - 259200000),
      dataPoints: 892,
    },
    {
      id: '4',
      name: 'Subject Analysis',
      type: 'analysis',
      format: 'xlsx',
      size: '2.1 MB',
      status: 'completed',
      createdAt: new Date(Date.now() - 345600000),
      dataPoints: 3456,
    },
  ]);

  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    exportName: '',
    exportType: 'class_data',
    exportFormat: 'json',
  });

  const toggleSelect = (id: string) => {
    setSelectedExports(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExports.length === exports.length) {
      setSelectedExports([]);
    } else {
      setSelectedExports(exports.map(e => e.id));
    }
  };

  const handleCreateExport = async () => {
    if (!formData.exportName) {
      alert('Please enter an export name');
      return;
    }

    const newExport: Export = {
      id: String(exports.length + 1),
      name: formData.exportName,
      type: formData.exportType,
      format: formData.exportFormat as any,
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      status: 'completed',
      createdAt: new Date(),
      dataPoints: Math.floor(Math.random() * 5000 + 1000),
    };

    setExports([newExport, ...exports]);
    setFormData({
      exportName: '',
      exportType: 'class_data',
      exportFormat: 'json',
    });
    setShowForm(false);
    alert('Export created successfully!');
  };

  const handleDownloadExport = (exp: Export) => {
    const content = `Export: ${exp.name}
Type: ${exp.type}
Format: ${exp.format.toUpperCase()}
Created: ${exp.createdAt.toISOString()}
Data Points: ${exp.dataPoints}

[Export data content...]`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `export-${exp.id}.${exp.format}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDeleteExports = () => {
    if (selectedExports.length === 0) {
      alert('Please select exports to delete');
      return;
    }

    if (window.confirm(`Delete ${selectedExports.length} export(s)?`)) {
      setExports(exports.filter(e => !selectedExports.includes(e.id)));
      setSelectedExports([]);
      alert('Exports deleted successfully!');
    }
  };

  const handleBatchDownload = () => {
    if (selectedExports.length === 0) {
      alert('Please select exports to download');
      return;
    }

    selectedExports.forEach(id => {
      const exp = exports.find(e => e.id === id);
      if (exp) {
        handleDownloadExport(exp);
      }
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileJson className="w-5 h-5 text-blue-600" />;
      case 'csv':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'xlsx':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <Download className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Export Manager</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-white text-primary px-3 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
        >
          <Plus className="w-5 h-5" />
          New Export
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Export Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Export</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Export Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Term 1 Class Data"
                value={formData.exportName}
                onChange={e => setFormData({ ...formData, exportName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Data Type *
              </label>
              <select
                value={formData.exportType}
                onChange={e => setFormData({ ...formData, exportType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="class_data">Class Data</option>
                <option value="scores">Scores</option>
                <option value="learners">Learners</option>
                <option value="subjects">Subjects</option>
                <option value="reports">Reports</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Export Format *
              </label>
              <select
                value={formData.exportFormat}
                onChange={e => setFormData({ ...formData, exportFormat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateExport}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
              >
                Create Export
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
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-primary">{exports.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">
              {exports.filter(e => e.format === 'json').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">JSON</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">
              {exports.filter(e => e.format === 'csv').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">CSV</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-orange-600">
              {exports.filter(e => e.format === 'pdf').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">PDF</p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedExports.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {selectedExports.length} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBatchDownload}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
              >
                Download Selected
              </button>
              <button
                onClick={handleDeleteExports}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Exports List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 p-4 bg-gray-100 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-gray-600">
            <div className="col-span-1 text-center">
              <input
                type="checkbox"
                checked={selectedExports.length === exports.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-primary rounded"
              />
            </div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Format</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {exports.map(exp => (
              <div
                key={exp.id}
                className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="col-span-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedExports.includes(exp.id)}
                    onChange={() => toggleSelect(exp.id)}
                    className="w-4 h-4 text-primary rounded"
                  />
                </div>
                <div className="col-span-5">
                  <p className="font-semibold text-gray-900 dark:text-white">{exp.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {exp.type} • {exp.size} • {exp.dataPoints} records
                  </p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {getFormatIcon(exp.format)}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {exp.format.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {exp.createdAt.toLocaleDateString()}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleDownloadExport(exp)}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => alert('Share feature coming soon!')}
                    className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg transition"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => alert('Details: ' + exp.name)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition"
                    title="View"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4">
          <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">💡 Export Tips</h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
            <li>Use JSON for maximum compatibility and data integrity</li>
            <li>CSV format is ideal for spreadsheet applications</li>
            <li>PDF exports are perfect for printing and sharing</li>
            <li>Clean up old exports to save storage space</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { Plus } from 'lucide-react';