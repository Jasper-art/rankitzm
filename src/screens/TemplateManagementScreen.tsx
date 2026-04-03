import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Download, Loader, Copy, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  sections: string[];
  color: string;
  createdAt: Date;
  isDefault: boolean;
}

export default function TemplateManagementScreen() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Class Performance Report',
      type: 'class_performance',
      description: 'Standard class performance analysis template',
      sections: ['Summary', 'Subject Analysis', 'Rankings', 'Trends'],
      color: '#2563eb',
      createdAt: new Date(Date.now() - 86400000),
      isDefault: true,
    },
    {
      id: '2',
      name: 'Learner Progress Report',
      type: 'learner_progress',
      description: 'Individual learner progress template',
      sections: ['Overview', 'Subject Performance', 'Weaknesses', 'Recommendations'],
      color: '#7c3aed',
      createdAt: new Date(Date.now() - 172800000),
      isDefault: false,
    },
    {
      id: '3',
      name: 'Subject Analysis Report',
      type: 'subject_analysis',
      description: 'Deep dive subject analysis template',
      sections: ['Overview', 'Class Comparison', 'Trends', 'Top Performers'],
      color: '#16a34a',
      createdAt: new Date(Date.now() - 259200000),
      isDefault: false,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    description: '',
  });

  const handleAddTemplate = () => {
    if (!formData.name) {
      alert('Please enter a template name');
      return;
    }

    if (editingId) {
      setTemplates(prev =>
        prev.map(t =>
          t.id === editingId
            ? { ...t, name: formData.name, type: formData.type, description: formData.description }
            : t
        )
      );
      alert('Template updated successfully!');
    } else {
      const newTemplate: Template = {
        id: String(templates.length + 1),
        name: formData.name,
        type: formData.type,
        description: formData.description,
        sections: ['Section 1', 'Section 2'],
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        createdAt: new Date(),
        isDefault: false,
      };
      setTemplates([newTemplate, ...templates]);
      alert('Template created successfully!');
    }

    setFormData({ name: '', type: 'custom', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description,
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isDefault) {
      alert('Cannot delete default template');
      return;
    }

    if (window.confirm('Delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
      alert('Template deleted successfully!');
    }
  };

  const handleDuplicate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: String(templates.length + 1),
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      isDefault: false,
    };
    setTemplates([newTemplate, ...templates]);
    alert('Template duplicated successfully!');
  };

  const handleDownloadTemplate = (template: Template) => {
    const content = `Template: ${template.name}
Type: ${template.type}
Description: ${template.description}

Sections:
${template.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `template-${template.id}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSetDefault = (id: string) => {
    setTemplates(prev =>
      prev.map(t => ({
        ...t,
        isDefault: t.id === id,
      }))
    );
    alert('Default template set!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Manage Templates</h1>
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
        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Template' : 'Create New Template'}
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Semester Report"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Template Type *
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="class_performance">Class Performance</option>
                <option value="learner_progress">Learner Progress</option>
                <option value="subject_analysis">Subject Analysis</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                placeholder="Template description..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddTemplate}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setFormData({ name: '', type: 'custom', description: '' });
                  setEditingId(null);
                  setShowForm(false);
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-16 rounded-full"
                    style={{ backgroundColor: template.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-white">{template.name}</p>
                      {template.isDefault && (
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{template.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowPreview(template.id)}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition"
                    title="Preview"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg transition"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownloadTemplate(template)}
                    className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sections */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Sections:</p>
                <div className="flex flex-wrap gap-2">
                  {template.sections.map((section, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs rounded"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>

              {/* Set Default Button */}
              {!template.isDefault && (
                <button
                  onClick={() => handleSetDefault(template.id)}
                  className="w-full mt-3 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {templates.find(t => t.id === showPreview)?.name} Preview
                </h3>
                <button
                  onClick={() => setShowPreview(null)}
                  className="hover:opacity-80 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Template Details</h4>
                  {templates.find(t => t.id === showPreview) && (
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Type: </span>
                        {templates.find(t => t.id === showPreview)?.type}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Description: </span>
                        {templates.find(t => t.id === showPreview)?.description}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Created: </span>
                        {templates.find(t => t.id === showPreview)?.createdAt.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Sections</h4>
                  <div className="space-y-1">
                    {templates
                      .find(t => t.id === showPreview)
                      ?.sections.map((section, idx) => (
                        <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                          {idx + 1}. {section}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}