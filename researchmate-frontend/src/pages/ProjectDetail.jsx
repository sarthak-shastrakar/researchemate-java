// src/pages/ProjectDetail.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Plus, Check, X,
  Link2, FileText, BookMarked, Layers, ScrollText, Sparkles, Calendar, AlertCircle, Network
} from 'lucide-react';
import { getProjectById, updateProject, deleteProject, generateReport, getReports, deleteReport } from '../api/projects';
import { getSourcesByProject, createSource, deleteSource } from '../api/sources';
import { getNotesByProject, createNote, updateNote, deleteNote } from '../api/notes';
import SourceCard from '../components/SourceCard';
import NoteCard from '../components/NoteCard';
import ReportViewerModal from '../components/ReportViewerModal';
import KnowledgeGraphView from '../components/KnowledgeGraphView';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const SOURCE_TYPES = ['ARTICLE', 'DOCS', 'GITHUB', 'PDF', 'VIDEO'];

const TABS = [
  { id: 'sources',         label: 'Sources',         icon: Link2 },
  { id: 'notes',           label: 'Notes',           icon: FileText },
  { id: 'reports',         label: 'Reports',         icon: ScrollText },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState('sources');

  // Edit project state
  const [editingProject, setEditingProject]   = useState(false);
  const [editName, setEditName]               = useState('');
  const [editDesc, setEditDesc]               = useState('');
  const [savingProject, setSavingProject]     = useState(false);

  // Add source form
  const [showAddSource, setShowAddSource]     = useState(false);
  const [sourceForm, setSourceForm]           = useState({ url: '', title: '', sourceType: 'ARTICLE' });
  const [addingSource, setAddingSource]       = useState(false);
  const [sourceError, setSourceError]         = useState('');

  // Add note form
  const [showAddNote, setShowAddNote]         = useState(false);
  const [noteForm, setNoteForm]               = useState({ title: '', content: '' });
  const [addingNote, setAddingNote]           = useState(false);
  const [noteError, setNoteError]             = useState('');

  // ── Reports state ──────────────────────────────────────────────────────────
  const [reports, setReports]                 = useState([]);
  const [reportsLoading, setReportsLoading]   = useState(false);
  const [reportsError, setReportsError]       = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [reportTitle, setReportTitle]         = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError]         = useState('');
  const [viewingReport, setViewingReport]     = useState(null);

  // ── ConfirmModal state ────────────────────────────────────────────────────
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: () => {},
  });

  const openConfirm = useCallback(({ title, message, confirmText = 'Delete', onConfirm }) => {
    setConfirm({ isOpen: true, title, message, confirmText, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proj, srcs, nts] = await Promise.all([
        getProjectById(id),
        getSourcesByProject(id),
        getNotesByProject(id),
      ]);
      setProject(proj);
      setEditName(proj.name || '');
      setEditDesc(proj.description || '');
      setSources(Array.isArray(srcs) ? srcs : []);
      setNotes(Array.isArray(nts) ? nts : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const data = await getReports(id);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      // Show visible error instead of silently failing
      setReportsError(err.message || 'Failed to load reports. Please try again.');
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch reports only when the tab is first activated
  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchReports]);

  // --- Project actions ---
  const handleSaveProject = async () => {
    setSavingProject(true);
    try {
      const updated = await updateProject(id, { name: editName, description: editDesc });
      setProject(updated);
      setEditingProject(false);
      toast('Project updated successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update project', 'error');
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = () => {
    openConfirm({
      title: `Delete "${project?.name}"?`,
      message: 'This will permanently delete the project, all its sources, notes, and reports. This cannot be undone.',
      confirmText: 'Delete Project',
      onConfirm: async () => {
        try {
          await deleteProject(id);
          toast('Project deleted', 'success');
          navigate('/');
        } catch (err) {
          toast(err.message || 'Failed to delete project', 'error');
        }
      },
    });
  };

  // --- Source actions ---
  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!sourceForm.url.trim() || !sourceForm.title.trim()) {
      setSourceError('URL and title are required.');
      return;
    }
    // Basic URL safety check — block javascript: URIs
    try {
      const parsed = new URL(sourceForm.url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setSourceError('Only http:// and https:// URLs are allowed.');
        return;
      }
    } catch {
      setSourceError('Please enter a valid URL (e.g. https://example.com).');
      return;
    }
    setAddingSource(true);
    setSourceError('');
    try {
      const created = await createSource({ ...sourceForm, projectId: Number(id) });
      setSources((prev) => [created, ...prev]);
      setSourceForm({ url: '', title: '', sourceType: 'ARTICLE' });
      setShowAddSource(false);
      toast('Source added successfully', 'success');
    } catch (err) {
      setSourceError(err.message);
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = (sourceId, sourceTitle) => {
    openConfirm({
      title: 'Delete source?',
      message: `"${sourceTitle}" will be permanently removed from this project.`,
      confirmText: 'Delete Source',
      onConfirm: async () => {
        try {
          await deleteSource(sourceId);
          setSources((prev) => prev.filter((s) => s.id !== sourceId));
          toast('Source deleted', 'success');
        } catch (err) {
          toast(err.message || 'Failed to delete source', 'error');
        }
      },
    });
  };

  // --- Note actions ---
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) {
      setNoteError('Title is required.');
      return;
    }
    setAddingNote(true);
    setNoteError('');
    try {
      const created = await createNote({ ...noteForm, projectId: Number(id) });
      setNotes((prev) => [created, ...prev]);
      setNoteForm({ title: '', content: '' });
      setShowAddNote(false);
      toast('Note saved', 'success');
    } catch (err) {
      setNoteError(err.message);
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateNote = async (noteId, data) => {
    try {
      const updated = await updateNote(noteId, data);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      toast('Note updated', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update note', 'error');
    }
  };

  const handleDeleteNote = (noteId, noteTitle) => {
    openConfirm({
      title: 'Delete note?',
      message: `"${noteTitle}" will be permanently removed.`,
      confirmText: 'Delete Note',
      onConfirm: async () => {
        try {
          await deleteNote(noteId);
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
          toast('Note deleted', 'success');
        } catch (err) {
          toast(err.message || 'Failed to delete note', 'error');
        }
      },
    });
  };

  // --- Report actions ---
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGeneratingReport(true);
    setReportError('');
    try {
      const created = await generateReport(id, reportTitle.trim());
      setReports((prev) => [created, ...prev]);
      setReportTitle('');
      setShowGenerateForm(false);
      toast('Report generated successfully!', 'success');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('no summarized sources or notes')) {
        setReportError(
          '⚠️ No summarized sources or notes found. Please summarize at least one source first (use the "Summarize" feature on any source card), then try again.'
        );
      } else {
        setReportError(msg || 'Failed to generate report. Please try again.');
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDeleteReport = (report) => {
    openConfirm({
      title: 'Delete report?',
      message: `"${report.title}" will be permanently deleted.`,
      confirmText: 'Delete Report',
      onConfirm: async () => {
        try {
          await deleteReport(report.projectId, report.id);
          setReports((prev) => prev.filter((r) => r.id !== report.id));
          toast('Report deleted', 'success');
        } catch (err) {
          toast(err.message || 'Failed to delete report', 'error');
        }
      },
    });
  };

  // --- Render ---
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
          <span>⚠️ {error}</span>
          <button onClick={fetchAll} className="text-red-600 font-medium underline cursor-pointer whitespace-nowrap">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* ConfirmModal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        danger
      />

      {/* Back button */}
      <button
        id="back-btn"
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Project header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        {editingProject ? (
          <div className="space-y-3">
            <input
              id="edit-project-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xl font-bold border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Project name"
            />
            <textarea
              id="edit-project-desc"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Description"
            />
            <div className="flex gap-2">
              <button
                id="save-project-btn"
                onClick={handleSaveProject}
                disabled={savingProject}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" /> {savingProject ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditingProject(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
              {project?.description && (
                <p className="text-sm text-gray-500 mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                id="edit-project-btn"
                onClick={() => setEditingProject(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                title="Edit project"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                id="delete-project-btn"
                onClick={handleDeleteProject}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Sources', count: sources.length, color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Notes',   count: notes.length,   color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Reports', count: reports.length,  color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
            <span className={`text-2xl font-bold ${color}`}>{count}</span>
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            id={`tab-${tabId}`}
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tabId
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* === SOURCES TAB === */}
      {activeTab === 'sources' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Sources</h2>
            <button
              id="add-source-btn"
              onClick={() => { setShowAddSource((s) => !s); setSourceError(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Source
            </button>
          </div>

          {/* Add source form */}
          {showAddSource && (
            <form
              onSubmit={handleAddSource}
              className="bg-white border border-indigo-100 rounded-xl p-4 mb-4 space-y-3 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-700">New Source</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="source-title-input"
                    value={sourceForm.title}
                    onChange={(e) => setSourceForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Source title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    id="source-type-select"
                    value={sourceForm.sourceType}
                    onChange={(e) => setSourceForm((f) => ({ ...f, sourceType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="source-url-input"
                  type="url"
                  value={sourceForm.url}
                  onChange={(e) => setSourceForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {sourceError && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{sourceError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  id="add-source-submit-btn"
                  disabled={addingSource}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" /> {addingSource ? 'Adding…' : 'Add Source'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSource(false)}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {sources.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No sources yet"
              description="Add your first source — articles, docs, GitHub repos, PDFs, or videos."
              action={
                <button
                  onClick={() => setShowAddSource(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Source
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sources.map((s) => (
                <SourceCard
                  key={s.id}
                  source={s}
                  onDelete={(sid) => handleDeleteSource(sid, s.title)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* === NOTES TAB === */}
      {activeTab === 'notes' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Notes</h2>
            <button
              id="add-note-btn"
              onClick={() => { setShowAddNote((s) => !s); setNoteError(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>

          {/* Add note form */}
          {showAddNote && (
            <form
              onSubmit={handleAddNote}
              className="bg-white border border-amber-100 rounded-xl p-4 mb-4 space-y-3 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-700">New Note</h3>
              <input
                id="note-title-input"
                value={noteForm.title}
                onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Note title"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <textarea
                id="note-content-input"
                value={noteForm.content}
                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write your note here…"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              {noteError && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{noteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  id="add-note-submit-btn"
                  disabled={addingNote}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" /> {addingNote ? 'Saving…' : 'Save Note'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {notes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="Capture your thoughts, summaries, and ideas for this project."
              action={
                <button
                  onClick={() => setShowAddNote(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Note
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onUpdate={handleUpdateNote}
                  onDelete={(nid) => handleDeleteNote(nid, n.title)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* === REPORTS TAB === */}
      {activeTab === 'reports' && (
        <section>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Research Reports</h2>
            <button
              id="generate-report-btn"
              onClick={() => { setShowGenerateForm((s) => !s); setReportError(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Generate New Report
            </button>
          </div>

          {/* Reports fetch error banner */}
          {reportsError && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{reportsError}</span>
              <button
                onClick={fetchReports}
                className="text-red-600 font-medium underline cursor-pointer whitespace-nowrap"
              >
                Retry
              </button>
              <button onClick={() => setReportsError('')} className="text-red-400 hover:text-red-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Generate report form */}
          {showGenerateForm && (
            <form
              onSubmit={handleGenerateReport}
              className="bg-white border border-violet-100 rounded-xl p-5 mb-5 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Generate AI Research Report</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                The AI will synthesize all summarized sources and notes in this project into a structured Markdown report with a References section containing clickable links to all your sources.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Report Title <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="report-title-input"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Q3 AI Agents Research Summary"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  disabled={generatingReport}
                />
              </div>

              {/* Loading state */}
              {generatingReport && (
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-sm text-violet-700">
                    Generating your report… this may take a few seconds while the AI reads your sources.
                  </p>
                </div>
              )}

              {/* Error */}
              {reportError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">{reportError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  id="generate-report-submit-btn"
                  disabled={generatingReport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {generatingReport ? 'Generating…' : 'Generate Report'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowGenerateForm(false); setReportError(''); }}
                  disabled={generatingReport}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reports list */}
          {reportsLoading ? (
            <LoadingSpinner size="md" className="py-16" />
          ) : reports.length === 0 && !reportsError ? (
            <EmptyState
              icon={ScrollText}
              title="No reports yet"
              description="Generate your first AI research report by synthesizing your summarized sources and notes."
              action={
                <button
                  onClick={() => setShowGenerateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Generate Report
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-violet-100 transition-all flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <ScrollText className="w-5 h-5 text-violet-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{report.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      id={`view-report-${report.id}`}
                      onClick={() => setViewingReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      id={`delete-report-${report.id}`}
                      onClick={() => handleDeleteReport(report)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* === KNOWLEDGE GRAPH TAB === */}
      {activeTab === 'knowledge-graph' && (
        <section>
          <KnowledgeGraphView projectId={id} projectName={project?.name} />
        </section>
      )}

      {/* Report viewer modal */}
      {viewingReport && (
        <ReportViewerModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  );
}
