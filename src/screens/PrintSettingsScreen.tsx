import React, { useState } from 'react';
import { ArrowLeft, Printer, Settings, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrintSettings {
  paperSize: string;
  orientation: string;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  headerFooter: boolean;
  pageNumbers: boolean;
  schoolName: boolean;
  date: boolean;
  colors: boolean;
  fontSize: number;
}

export default function PrintSettingsScreen() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 15,
      right: 15,
    },
    headerFooter: true,
    pageNumbers: true,
    schoolName: true,
    date: true,
    colors: true,
    fontSize: 11,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Print settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    window.print();
  };

  const handleReset = () => {
    if (window.confirm('Reset to default settings?')) {
      setSettings({
        paperSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 20,
          bottom: 20,
          left: 15,
          right: 15,
        },
        headerFooter: true,
        pageNumbers: true,
        schoolName: true,
        date: true,
        colors: true,
        fontSize: 11,
      });
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
          <Printer className="w-6 h-6" />
          Print Settings
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Preview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-primary/20">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Print Preview</h2>
          <div
            className={`bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center`}
            style={{
              aspectRatio: settings.orientation === 'portrait' ? '8.5 / 11' : '11 / 8.5',
              maxHeight: '400px',
            }}
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {settings.paperSize} {settings.orientation}
            </p>
            {settings.schoolName && (
              <p className="text-xl font-bold text-gray-900 dark:text-white">School Name</p>
            )}
            {settings.date && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {new Date().toLocaleDateString()}
              </p>
            )}
            <div className="mt-8 space-y-2 text-left px-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Sample Report</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Lorem ipsum dolor sit amet...</p>
            </div>
            {settings.pageNumbers && (
              <p className="absolute bottom-4 right-4 text-xs text-gray-600 dark:text-gray-400">
                Page 1
              </p>
            )}
          </div>
          <button
            onClick={handlePreview}
            className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Preview & Print
          </button>
        </div>

        {/* Paper & Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Page Setup
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Paper Size
              </label>
              <select
                value={settings.paperSize}
                onChange={e => setSettings({ ...settings, paperSize: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Orientation
              </label>
              <select
                value={settings.orientation}
                onChange={e => setSettings({ ...settings, orientation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Margins (mm)
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'top', label: 'Top' },
                { key: 'bottom', label: 'Bottom' },
                { key: 'left', label: 'Left' },
                { key: 'right', label: 'Right' },
              ].map(margin => (
                <div key={margin.key}>
                  <label className="text-xs text-gray-600 dark:text-gray-400">{margin.label}</label>
                  <input
                    type="number"
                    value={settings.margins[margin.key as keyof typeof settings.margins]}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        margins: {
                          ...settings.margins,
                          [margin.key]: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none mt-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Font Size: {settings.fontSize}pt
            </label>
            <input
              type="range"
              min="8"
              max="16"
              value={settings.fontSize}
              onChange={e => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Content Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Options</h2>

          {[
            { key: 'headerFooter', label: 'Header & Footer' },
            { key: 'pageNumbers', label: 'Page Numbers' },
            { key: 'schoolName', label: 'School Name' },
            { key: 'date', label: 'Print Date' },
            { key: 'colors', label: 'Print Colors' },
          ].map(option => (
            <label
              key={option.key}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={settings[option.key as keyof PrintSettings] as boolean}
                onChange={e =>
                  setSettings({
                    ...settings,
                    [option.key]: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary rounded"
              />
              <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
            </label>
          ))}
        </div>

        {/* Presets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Presets</h2>
          <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold text-sm">
            📄 Standard Report
          </button>
          <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold text-sm">
            📊 Class Report
          </button>
          <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold text-sm">
            👤 Learner Report
          </button>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}