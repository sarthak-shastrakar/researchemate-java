// src/components/SourceCard.jsx
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink, Trash2, ChevronDown, ChevronUp,
  Plus, Quote, Sparkles, RefreshCw, X, Loader2, BookOpen, ImageIcon, UploadCloud,
  ZoomIn, Send,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TagBadge from './TagBadge';
import HighlightCard from './HighlightCard';
import LoadingSpinner from './LoadingSpinner';
import { getHighlightsBySource, createHighlight, deleteHighlight } from '../api/highlights';
import { getTagsBySource, addTag, removeTag } from '../api/tags';
import {
  summarizeSource,
  explainSource,
  explainImage,
  getSourceImages,
  deleteSourceImage,
} from '../api/sources';

const SOURCE_TYPE_STYLES = {
  ARTICLE: 'bg-blue-100 text-blue-700',
  DOCS:    'bg-emerald-100 text-emerald-700',
  GITHUB:  'bg-gray-100 text-gray-700',
  PDF:     'bg-orange-100 text-orange-700',
  VIDEO:   'bg-rose-100 text-rose-700',
};

// ── Shared Markdown renderer (compact card-friendly styles) ──────────────────
const MD_COMPONENTS = {
  h1: ({ children }) => <p className="text-xs font-bold text-gray-800 mt-2 mb-0.5">{children}</p>,
  h2: ({ children }) => <p className="text-xs font-bold text-gray-800 mt-2 mb-0.5">{children}</p>,
  h3: ({ children }) => <p className="text-xs font-semibold text-gray-700 mt-1.5 mb-0.5">{children}</p>,
  p:  ({ children }) => <p className="text-xs text-gray-700 leading-relaxed mb-1">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
  em:     ({ children }) => <em className="italic text-gray-600">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1 text-xs text-gray-700">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1 text-xs text-gray-700">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-500 my-1 text-xs">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 text-gray-700 rounded px-1 py-0.5 text-[10px] font-mono">{children}</code>
  ),
};

function MarkdownContent({ text }) {
  return <ReactMarkdown components={MD_COMPONENTS}>{text}</ReactMarkdown>;
}

// ── Image Lightbox Modal ──────────────────────────────────────────────────────
function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center cursor-pointer transition-colors"
          title="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt="Full Preview"
          className="max-h-[82vh] max-w-full object-contain rounded-xl mx-auto"
        />
      </div>
    </div>
  );
}

// ── AI Summary Box ──────────────────────────────────────────────────────────
function SummaryBox({ summary, onResummarize }) {
  return (
    <div className="mt-3 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 px-3.5 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
            AI Summary
          </span>
        </div>
        <button
          onClick={onResummarize}
          title="Re-summarize"
          className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-700 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Re-summarize
        </button>
      </div>
      <MarkdownContent text={summary} />
    </div>
  );
}

// ── Summarize Panel (content input) ────────────────────────────────────────
function SummarizePanel({ sourceId, onDone, onClose, initialContent = '' }) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await summarizeSource(sourceId, content.trim());
      onDone(result?.summary ?? result);
    } catch (err) {
      setError(err.message || 'Summarization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 px-3.5 py-3 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-violet-700">Paste source content</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        id={`summarize-content-${sourceId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste the article text, docs content, or any raw text you want summarized…"
        rows={5}
        required
        disabled={loading}
        className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y bg-white disabled:opacity-60"
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <span>⚠️</span> {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          id={`summarize-submit-btn-${sourceId}`}
          disabled={loading || !content.trim()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 text-white text-xs rounded-lg font-medium hover:bg-violet-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating summary…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Summarize
            </>
          )}
        </button>
        {!loading && (
          <span className="text-[10px] text-gray-400">
            {content.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        )}
      </div>
    </form>
  );
}

// ── AI Explanation Box ────────────────────────────────────────────────────
const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

function ExplanationBox({ explanation, level, onReExplain }) {
  return (
    <div className="mt-3 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-200 px-3.5 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
            AI Explanation ({LEVEL_LABELS[level] ?? level} level)
          </span>
        </div>
        <button
          onClick={onReExplain}
          title="Re-explain"
          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-700 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Re-explain
        </button>
      </div>
      <MarkdownContent text={explanation} />
    </div>
  );
}

// ── Explain Panel ─────────────────────────────────────────────────────────
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const LEVEL_ACTIVE  = 'bg-indigo-600 text-white';
const LEVEL_IDLE    = 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50';

function ExplainPanel({ sourceId, onDone, onClose, initialContent = '' }) {
  const [content, setContent] = useState(initialContent);
  const [level, setLevel]     = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await explainSource(sourceId, content.trim(), level);
      onDone(result?.explanation ?? result, result?.level ?? level);
    } catch (err) {
      setError(err.message || 'Explanation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-3 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">Explain this source</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        id={`explain-content-${sourceId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste the source text you want explained…"
        rows={5}
        required
        disabled={loading}
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-white disabled:opacity-60"
      />

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mr-1">Level:</span>
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            id={`explain-level-${lvl}-${sourceId}`}
            onClick={() => setLevel(lvl)}
            disabled={loading}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize cursor-pointer disabled:opacity-60 transition-colors ${
              level === lvl ? LEVEL_ACTIVE : LEVEL_IDLE
            }`}
          >
            {LEVEL_LABELS[lvl]}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <span>⚠️</span> {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          id={`explain-submit-btn-${sourceId}`}
          disabled={loading || !content.trim()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Explaining…
            </>
          ) : (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              Explain
            </>
          )}
        </button>
        {!loading && (
          <span className="text-[10px] text-gray-400">
            {content.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        )}
      </div>
    </form>
  );
}

// ── AI Image Explanation Box (Multi-turn Q&A & Clickable Preview) ────────────
function ImageExplanationBox({ sourceId, imageFile, initialExplanation, initialPrompt, thumbnailUrl, onReExplain, onClose, onPreviewImage }) {
  const [chatHistory, setChatHistory] = useState([
    { id: 1, prompt: initialPrompt || null, response: initialExplanation }
  ]);
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUpPrompt.trim() || !imageFile) return;
    const currentPrompt = followUpPrompt.trim();
    setFollowUpPrompt('');
    setLoadingFollowUp(true);
    setFollowUpError('');
    try {
      const result = await explainImage(sourceId, imageFile, currentPrompt);
      const answer = result?.explanation ?? result;
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now(), prompt: currentPrompt, response: answer }
      ]);
    } catch (err) {
      setFollowUpError(err.message || 'Failed to answer follow-up question. Try again.');
    } finally {
      setLoadingFollowUp(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 px-3.5 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-500">
            AI Image Explanation
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReExplain}
            title="Explain another image"
            className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-800 font-medium bg-teal-100/70 hover:bg-teal-200/80 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Explain New Image
          </button>
          <button
            onClick={onClose}
            title="Delete / Close explanation"
            className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-teal-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-start gap-3">
        {thumbnailUrl && (
          <div
            onClick={() => onPreviewImage(thumbnailUrl)}
            className="relative group cursor-pointer flex-shrink-0"
            title="Click to preview full image"
          >
            <img
              src={thumbnailUrl}
              alt="Explained"
              className="w-16 h-16 object-cover rounded-lg border border-teal-200 group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="w-4 h-4" />
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-3">
          {chatHistory.map((item, idx) => (
            <div key={item.id} className={idx > 0 ? "pt-2.5 border-t border-teal-200/50" : ""}>
              {item.prompt && (
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-100/70 border border-teal-200/60 rounded-md px-2.5 py-1 w-fit">
                  <span>💬 Q:</span>
                  <span>{item.prompt}</span>
                </div>
              )}
              <MarkdownContent text={item.response} />
            </div>
          ))}
          {loadingFollowUp && (
            <div className="flex items-center gap-2 text-xs text-teal-600 font-medium py-1 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
              <span>Thinking about your follow-up question...</span>
            </div>
          )}
          {followUpError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <span>⚠️</span> {followUpError}
            </p>
          )}
          <form onSubmit={handleFollowUpSubmit} className="pt-2 border-t border-teal-200/60 flex items-center gap-2">
            <input
              type="text"
              value={followUpPrompt}
              onChange={(e) => setFollowUpPrompt(e.target.value)}
              placeholder="Ask a follow-up question about this image..."
              disabled={loadingFollowUp || !imageFile}
              className="flex-1 border border-teal-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loadingFollowUp || !followUpPrompt.trim() || !imageFile}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Explain Image Panel ────────────────────────────────────────────────────
const MAX_IMAGE_MB = 5;

function ExplainImagePanel({ sourceId, onDone, onClose, onPreviewImage }) {
  const [imageFile, setImageFile]   = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prompt, setPrompt]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [dragging, setDragging]     = useState(false);
  const fileInputRef                = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, GIF, etc.)');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image is too large. Maximum size is ${MAX_IMAGE_MB}MB.`);
      return;
    }
    setError('');
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onFileInput = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    setLoading(true);
    setError('');
    try {
      const result = await explainImage(sourceId, imageFile, prompt);
      onDone(result?.explanation ?? result, previewUrl, imageFile, prompt);
    } catch (err) {
      setError(err.message || 'Image explanation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 px-3.5 py-3 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-xs font-semibold text-teal-700">Explain from Image</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragging
            ? 'border-teal-400 bg-teal-100'
            : 'border-teal-300 bg-white hover:bg-teal-50'
        } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
        style={{ minHeight: previewUrl ? 'auto' : '90px' }}
      >
        {previewUrl ? (
          <div className="relative p-2 w-full flex items-center gap-3">
            <div
              onClick={(e) => { e.stopPropagation(); onPreviewImage(previewUrl); }}
              className="relative group cursor-pointer flex-shrink-0"
              title="Click to view full image"
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-teal-200 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ZoomIn className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-teal-700 truncate">{imageFile?.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {(imageFile?.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreviewUrl(null); }}
                className="mt-1.5 text-[10px] text-red-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 flex flex-col items-center gap-1.5 text-teal-400">
            <UploadCloud className="w-6 h-6" />
            <span className="text-xs font-medium">Drop image here or click to browse</span>
            <span className="text-[10px] text-gray-400">JPEG, PNG, WebP • max {MAX_IMAGE_MB}MB</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          id={`explain-image-input-${sourceId}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInput}
          disabled={loading}
        />
      </div>

      <input
        id={`explain-image-prompt-${sourceId}`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something specific about this image (optional)"
        disabled={loading}
        className="w-full border border-teal-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white disabled:opacity-60"
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <span>⚠️</span> {error}
        </p>
      )}

      <button
        type="submit"
        id={`explain-image-submit-btn-${sourceId}`}
        disabled={loading || !imageFile}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 text-white text-xs rounded-lg font-medium hover:bg-teal-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing image…
          </>
        ) : (
          <>
            <ImageIcon className="w-3.5 h-3.5" />
            Explain Image
          </>
        )}
      </button>
    </form>
  );
}

export default function SourceCard({ source, onDelete }) {
  const [expanded, setExpanded]               = useState(false);
  const [highlights, setHighlights]           = useState([]);
  const [tags, setTags]                       = useState(source.tags || []);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [addingHighlight, setAddingHighlight] = useState(false);
  const [hlText, setHlText]                   = useState('');
  const [hlNote, setHlNote]                   = useState('');
  const [newTag, setNewTag]                   = useState('');
  const [savingTag, setSavingTag]             = useState(false);

  // Summary state — seed from backend if source already has one
  const [summary, setSummary]                   = useState(source.summary || null);
  const [showSummarizePanel, setShowSummarizePanel] = useState(false);
  // Shared content — reused between summarize & explain panels
  const [sharedContent, setSharedContent]       = useState('');

  // Text explanation state — local only, not persisted
  const [explanation, setExplanation]           = useState(null);
  const [explanationLevel, setExplanationLevel] = useState(null);
  const [showExplainPanel, setShowExplainPanel] = useState(false);

  // Image explanation state
  const [imageExplanation, setImageExplanation]       = useState(null);
  const [imageThumbnail, setImageThumbnail]           = useState(null);
  const [imageFile, setImageFile]                     = useState(null);
  const [imagePrompt, setImagePrompt]                 = useState('');
  const [showExplainImagePanel, setShowExplainImagePanel] = useState(false);
  const [previewModalUrl, setPreviewModalUrl]         = useState(null);
  const [savedImages, setSavedImages]                 = useState([]);
  const [deletingSavedImageId, setDeletingSavedImageId] = useState(null);
  const [confirmDeleteSavedImageId, setConfirmDeleteSavedImageId] = useState(null);
  const [deleteImageError, setDeleteImageError]       = useState('');

  const refreshSavedImages = async () => {
    try {
      const imgs = await getSourceImages(source.id);
      setSavedImages(Array.isArray(imgs) ? imgs : []);
    } catch { /* ignore */ }
  };

  const handleDeleteSavedImage = async (imageId) => {
    if (!imageId) return;
    setDeletingSavedImageId(imageId);
    setDeleteImageError('');
    const prevSaved = [...savedImages];

    // Optimistic update
    setSavedImages((prev) => prev.filter((img) => img.id !== imageId));
    setConfirmDeleteSavedImageId(null);

    try {
      await deleteSourceImage(imageId);
    } catch (err) {
      setSavedImages(prevSaved);
      setDeleteImageError(err.message || 'Failed to delete saved image explanation.');
    } finally {
      setDeletingSavedImageId(null);
    }
  };

  // ── Highlights / expand
  const toggleExpand = async () => {
    if (!expanded) {
      setExpanded(true);
      setLoadingHighlights(true);
      try {
        const [hl, tg, imgs] = await Promise.all([
          getHighlightsBySource(source.id),
          getTagsBySource(source.id),
          getSourceImages(source.id),
        ]);
        setHighlights(Array.isArray(hl) ? hl : []);
        setTags(Array.isArray(tg) ? tg : []);
        setSavedImages(Array.isArray(imgs) ? imgs : []);
      } catch { /* ignore */ } finally {
        setLoadingHighlights(false);
      }
    } else {
      setExpanded(false);
    }
  };

  const handleAddHighlight = async (e) => {
    e.preventDefault();
    if (!hlText.trim()) return;
    setAddingHighlight(true);
    try {
      const created = await createHighlight({ sourceId: source.id, selectedText: hlText, note: hlNote });
      setHighlights((prev) => [...prev, created]);
      setHlText('');
      setHlNote('');
    } finally {
      setAddingHighlight(false);
    }
  };

  const handleDeleteHighlight = async (id) => {
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  // ── Tags
  const handleAddTag = async (e) => {
    e.preventDefault();
    const trimmed = newTag.trim();
    if (!trimmed) return;
    setSavingTag(true);
    try {
      const created = await addTag({ sourceId: source.id, tagName: trimmed });
      setTags((prev) => [...prev, created]);
      setNewTag('');
    } finally {
      setSavingTag(false);
    }
  };

  const handleRemoveTag = async (tag) => {
    await removeTag(source.id, tag.id);
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
  };

  // ── Summarize
  const handleSummaryDone = (newSummary) => {
    setSummary(newSummary);
    setShowSummarizePanel(false);
  };

  // ── Explain
  const handleExplanationDone = (newExplanation, newLevel) => {
    setExplanation(newExplanation);
    setExplanationLevel(newLevel);
    setShowExplainPanel(false);
  };

  const handleOpenExplain = () => {
    setShowExplainPanel(true);
    setExplanation(null);
  };

  // ── Explain Image
  const handleImageExplanationDone = (newExplanation, thumbnailUrl, file, prompt) => {
    setImageExplanation(newExplanation);
    setImageThumbnail(thumbnailUrl);
    setImageFile(file);
    setImagePrompt(prompt);
    setShowExplainImagePanel(false);
    refreshSavedImages();
  };

  const handleOpenExplainImage = () => {
    setShowExplainImagePanel(true);
    setImageExplanation(null);
    setImageThumbnail(null);
    setImageFile(null);
    setImagePrompt('');
  };

  const handleClearImageExplanation = () => {
    setImageExplanation(null);
    setImageThumbnail(null);
    setImageFile(null);
    setImagePrompt('');
    setShowExplainImagePanel(false);
  };

  const typeStyle = SOURCE_TYPE_STYLES[source.sourceType] || 'bg-gray-100 text-gray-600';

  return (
    <div id={`source-card-${source.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md overflow-hidden">
      {/* ── Image Lightbox Modal ── */}
      {previewModalUrl && (
        <ImageModal imageUrl={previewModalUrl} onClose={() => setPreviewModalUrl(null)} />
      )}

      {/* ── Card header ── */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Type badge row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>
                {source.sourceType}
              </span>
            </div>

            {/* Title & URL */}
            <h4 className="font-medium text-gray-900 text-sm mt-1 truncate">{source.title}</h4>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1 truncate max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{source.url}</span>
            </a>

            {/* ── AI Actions row (Summarize + Explain + Explain Image buttons) ── */}
            {!summary && !showSummarizePanel && !showExplainPanel && !explanation
              && !showExplainImagePanel && !imageExplanation && (
              <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                <button
                  id={`summarize-btn-${source.id}`}
                  onClick={() => setShowSummarizePanel(true)}
                  className="flex items-center gap-1.5 text-xs text-violet-600 font-medium hover:text-violet-800 cursor-pointer group"
                >
                  <span className="w-5 h-5 rounded-md bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center">
                    <Sparkles className="w-3 h-3" />
                  </span>
                  Summarize with AI
                </button>
                <button
                  id={`explain-btn-${source.id}`}
                  onClick={handleOpenExplain}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 cursor-pointer group"
                >
                  <span className="w-5 h-5 rounded-md bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center">
                    <BookOpen className="w-3 h-3" />
                  </span>
                  Explain with AI
                </button>
                <button
                  id={`explain-image-btn-${source.id}`}
                  onClick={handleOpenExplainImage}
                  className="flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:text-teal-800 cursor-pointer group"
                >
                  <span className="w-5 h-5 rounded-md bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center">
                    <ImageIcon className="w-3 h-3" />
                  </span>
                  Explain Image
                </button>
                <Link
                  to={`/ai/image-studio?sourceId=${source.id}`}
                  className="flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2 py-0.5 rounded-lg font-medium transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" /> Studio View
                </Link>
              </div>
            )}

            {/* ── Summarize panel / Summary box ── */}
            {summary ? (
              <SummaryBox
                summary={summary}
                onResummarize={() => { setSummary(null); setShowSummarizePanel(true); }}
              />
            ) : showSummarizePanel ? (
              <SummarizePanel
                sourceId={source.id}
                onDone={handleSummaryDone}
                onClose={() => setShowSummarizePanel(false)}
                initialContent={sharedContent}
              />
            ) : null}

            {/* ── Explain panel / Explanation box ── */}
            {explanation && explanationLevel ? (
              <ExplanationBox
                explanation={explanation}
                level={explanationLevel}
                onReExplain={handleOpenExplain}
              />
            ) : showExplainPanel ? (
              <ExplainPanel
                sourceId={source.id}
                onDone={handleExplanationDone}
                onClose={() => setShowExplainPanel(false)}
                initialContent={sharedContent}
              />
            ) : null}

            {/* ── Explain Image panel / Image Explanation box ── */}
            {imageExplanation ? (
              <ImageExplanationBox
                sourceId={source.id}
                imageFile={imageFile}
                initialExplanation={imageExplanation}
                initialPrompt={imagePrompt}
                thumbnailUrl={imageThumbnail}
                onReExplain={handleOpenExplainImage}
                onClose={handleClearImageExplanation}
                onPreviewImage={(url) => setPreviewModalUrl(url)}
              />
            ) : showExplainImagePanel ? (
              <ExplainImagePanel
                sourceId={source.id}
                onDone={handleImageExplanationDone}
                onClose={() => setShowExplainImagePanel(false)}
                onPreviewImage={(url) => setPreviewModalUrl(url)}
              />
            ) : null}

            {/* Tags row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} onRemove={handleRemoveTag} />
              ))}
              <form onSubmit={handleAddTag} className="flex items-center gap-1">
                <input
                  id={`tag-input-${source.id}`}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="add tag…"
                  className="border border-dashed border-gray-300 rounded-full px-2 py-0.5 text-xs text-gray-600 focus:outline-none focus:border-indigo-400 w-20"
                />
                <button
                  type="submit"
                  disabled={savingTag}
                  className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          {/* Action buttons (right side) */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              id={`source-delete-btn-${source.id}`}
              onClick={() => onDelete(source.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
              title="Delete source"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`source-expand-btn-${source.id}`}
              onClick={toggleExpand}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
              title={expanded ? 'Collapse' : 'Show highlights'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expandable section (Past Image Explanations & Highlights) ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 space-y-4">
          {/* ── Past Image Explanations ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-700 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Past Image Explanations</span>
                {savedImages.length > 0 && (
                  <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {savedImages.length}
                  </span>
                )}
              </div>
            </div>

            {deleteImageError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 flex items-center justify-between">
                <span>{deleteImageError}</span>
                <button
                  onClick={() => setDeleteImageError('')}
                  className="text-red-500 hover:text-red-700 font-semibold cursor-pointer ml-2 text-[10px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loadingHighlights ? (
              <LoadingSpinner size="sm" className="py-2" />
            ) : savedImages.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2 bg-white/50 rounded-lg px-3 border border-dashed border-gray-200">
                No saved image explanations yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedImages.map((imgItem) => {
                  const srcUrl = imgItem.imageUrl?.startsWith('http')
                    ? imgItem.imageUrl
                    : `http://localhost:8080${imgItem.imageUrl}`;
                  const isDeleting = deletingSavedImageId === imgItem.id;
                  const isConfirming = confirmDeleteSavedImageId === imgItem.id;

                  return (
                    <div
                      key={imgItem.id || imgItem.createdAt}
                      className="bg-white rounded-xl border border-teal-100 p-3 shadow-xs space-y-2 relative group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => setPreviewModalUrl(srcUrl)}
                          className="relative group cursor-pointer flex-shrink-0"
                          title="Click to view image"
                        >
                          <img
                            src={srcUrl}
                            alt="Saved explanation"
                            className="w-16 h-16 object-cover rounded-lg border border-teal-200 group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            {imgItem.prompt ? (
                              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 rounded-md px-2 py-0.5 truncate max-w-[70%]">
                                💬 {imgItem.prompt}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No prompt provided</span>
                            )}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {imgItem.createdAt && (
                                <span className="text-[10px] text-gray-400">
                                  {new Date(imgItem.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              
                              {/* Delete button / inline confirmation */}
                              {isConfirming ? (
                                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg p-1 animate-in fade-in zoom-in-95 shadow-xs">
                                  <span className="text-[11px] text-red-700 font-semibold px-1">Delete?</span>
                                  <button
                                    onClick={() => handleDeleteSavedImage(imgItem.id)}
                                    disabled={isDeleting}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs active:scale-95"
                                  >
                                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteSavedImageId(null)}
                                    disabled={isDeleting}
                                    className="px-1 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[9px] cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteSavedImageId(imgItem.id)}
                                  disabled={isDeleting}
                                  title="Delete saved image explanation"
                                  className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <MarkdownContent text={imgItem.explanation} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Highlights Section ── */}
          <div className="space-y-3 pt-2 border-t border-gray-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Quote className="w-3 h-3" /> Highlights
            </div>

            {loadingHighlights ? (
              <LoadingSpinner size="sm" className="py-4" />
            ) : (
              <>
                {highlights.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No highlights yet.</p>
                ) : (
                  <div className="space-y-2">
                    {highlights.map((h) => (
                      <HighlightCard key={h.id} highlight={h} onDelete={handleDeleteHighlight} />
                    ))}
                  </div>
                )}

                {/* Add highlight form */}
                <form onSubmit={handleAddHighlight} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 mt-2">
                  <p className="text-xs font-medium text-gray-600">Add Highlight</p>
                  <textarea
                    id={`hl-text-${source.id}`}
                    value={hlText}
                    onChange={(e) => setHlText(e.target.value)}
                    placeholder="Selected text…"
                    rows={2}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                  <input
                    id={`hl-note-${source.id}`}
                    value={hlNote}
                    onChange={(e) => setHlNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={addingHighlight}
                    id={`hl-submit-btn-${source.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
                  >
                    <Plus className="w-3 h-3" />
                    {addingHighlight ? 'Saving…' : 'Add Highlight'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
