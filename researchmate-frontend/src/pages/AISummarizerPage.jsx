// src/pages/AISummarizerPage.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, BookOpen, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { summarizeSource } from '../api/sources';

export default function AISummarizerPage() {
  const [searchParams] = useSearchParams();
  const sourceIdParam  = searchParams.get('sourceId');

  const [content, setContent]   = useState('');
  const [summary, setSummary]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const sourceId = sourceIdParam ? Number(sourceIdParam) : 1;
      const res = await summarizeSource(sourceId, content.trim());
      setSummary(res?.summary ?? res);
    } catch (err) {
      setError(err.message || 'Summarization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Summarizer Studio</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Generate instant, high-level structural summaries from research papers, articles, and documents.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Source Content Input</h2>
            <span className="text-xs font-medium text-gray-400">{wordCount} words</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste research text, article content, or document notes here..."
              rows={12}
              required
              disabled={loading}
              className="w-full border border-gray-200 rounded-xl p-4 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50 resize-y leading-relaxed disabled:opacity-60"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating AI Summary...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Summarize Content
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col min-h-[460px]">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-gray-800">Generated Summary</h3>
            </div>
            {summary && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900 bg-white border border-violet-200 px-3 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            )}
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {!summary && !loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-2">
                <BookOpen className="w-12 h-12 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No Summary Generated Yet</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Paste your text on the left and click "Summarize Content" to view the structured AI summary.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-violet-600 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs font-semibold">Reading content & extracting core insights...</p>
              </div>
            ) : (
              <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
