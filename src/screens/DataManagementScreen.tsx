import React, { useState } from 'react';
import { ArrowLeft, Download, Upload, Trash2, Database, Clock, FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface BackupRecord {
  id: string;
  date: Date;
  size: string;
  status: 'completed' | 'in_progress' | 'failed';
  records: number;
}

export default function DataManagementScreen() {
  const navigate = useNavigate();
  const { } = useAuth();
  const [backups, setBackups] = useState<BackupRecord[]>([
    {
      id: '1',
      date: new Date(Date.now() - 86400000),
      size: '2.4 MB',
      status: 'completed',
      records: 1245,
    },
    {
      id: '2',
      date: new Date(Date.now() - 172800000),
      size: '2.3 MB',
      status: 'completed',
      records: 1200,
    },
    {
      id: '3',
      date: new Date(Date.now() - 259200000),
      size: '2.1 MB',
      status: 'completed',
      records: 1180,
    },
  ]);
  const [creating, setCreating] = useState(false);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newBackup: BackupRecord = {
        id: String(backups.length + 1),
        date: new Date(),
        size: '2.5 MB',
        status: 'completed',
        records: 1300,
      };
      setBackups([newBackup, ...backups]);
      alert('Backup created successfully!');
    } catch (error) {
      alert('Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = (backupId: string) => {
    // Create a sample backup file
   const data = {
  backupDate: new Date(),
  backupId,
  records: 1245,
};
    const json = JSON.stringify(data, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json));
    element.setAttribute('download', `backup-${backupId}-${new Date().toISOString()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDeleteBackup = (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      setBackups(backups.filter(b => b.id !== backupId));
      alert('Backup deleted successfully!');
    }
  };

  const handleExportData = (format: 'csv' | 'json') => {
  const data = {
  exportDate: new Date(),
  format,
  records: 1245,
};
    const content = format === 'json' ? JSON.stringify(data, null, 2) : Object.values(data).join(',');
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      `data:text/${format};charset=utf-8,${encodeURIComponent(content)}`
    );
    element.setAttribute('download', `school-export-${new Date().toISOString()}.${format}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert(`Data exported as ${format.toUpperCase()}!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center gap-3 shadow-lg z-10">
        <button onClick={() => navigate(-1)} className="hover:opacity-80">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          Data Management
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md hover:shadow-lg transition disabled:opacity-50 flex flex-col items-center justify-center gap-2"
          >
            <Database className="w-6 h-6" />
            <span className="font-semibold text-sm">{creating ? 'Creating...' : 'Create Backup'}</span>
          </button>

          <div className="grid gap-4">
            <button
              onClick={() => handleExportData('csv')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-3 shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-1"
            >
              <Download className="w-5 h-5" />
              <span className="font-semibold text-sm">Export CSV</span>
            </button>
            <button
              onClick={() => handleExportData('json')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-1"
            >
              <Download className="w-5 h-5" />
              <span className="font-semibold text-sm">Export JSON</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-primary">12</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Backups</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-primary">28.5 MB</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Size</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-primary">1,245</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Records</p>
          </div>
        </div>

        {/* Backup History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Backup History
          </h2>

          {backups.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {backups.map(backup => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 dark:bg-primary/30 rounded-lg flex items-center justify-center">
                        <FileUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {backup.date.toLocaleDateString()} {backup.date.toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {backup.records} records • {backup.size}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                        backup.status
                      )}`}
                    >
                      {backup.status === 'completed' && '✓ Completed'}
                      {backup.status === 'in_progress' && '⏳ In Progress'}
                      {backup.status === 'failed' && '✗ Failed'}
                    </span>
                    <button
                      onClick={() => handleDownloadBackup(backup.id)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">No backups found</p>
          )}
        </div>

        {/* Import Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Data
          </h2>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition cursor-pointer">
            <input type="file" accept=".json,.csv" className="hidden" id="import-file" />
            <label htmlFor="import-file" className="cursor-pointer block">
              <FileUp className="w-12 h-12 text-primary/50 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Click to select or drag and drop
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Supported formats: JSON, CSV
              </p>
            </label>
          </div>
        </div>

        {/* Maintenance & Safety */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">💡 Backup Tips</h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
            <li>Create backups regularly to protect your data</li>
            <li>Keep multiple backup copies in different locations</li>
            <li>Test restore procedures periodically</li>
            <li>Export data before major system changes</li>
          </ul>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-bold text-red-800 dark:text-red-200 mb-3">⚠️ Danger Zone</h3>
          <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
            Delete All Data
          </button>
          <p className="text-xs text-red-700 dark:text-red-300 mt-2">
            This action is irreversible. Use with caution!
          </p>
        </div>
      </div>
    </div>
  );
}