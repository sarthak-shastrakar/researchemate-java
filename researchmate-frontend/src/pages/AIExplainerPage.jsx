// src/pages/AIExplainerPage.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Loader2, Copy, Check, AlertCircle, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { explainSource } from '../api/sources';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Simple terms & everyday analogies' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Clear academic context' },
  { id: 'advanced', label: 'Advanced', desc: 'In-depth technical analysis' },
];

export default function AIExplainerPage() {
  const [searchParams] = useSearchParams();
  const sourceIdParam  = searchParams.get('sourceId');

  const [content, setContent]     = useState('');
  const [level, setLevel]         = useState('intermediate');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const sourceId = sourceIdParam ? Number(sourceIdParam) : 1;
      const res = await explainSource(sourceId, content.trim(), level);
      setExplanation(res?.explanation ?? res);
    } catch (err) {
      setError(err.message || 'Explanation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Text Explainer Studio</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Break down complex papers, formulas, or concepts into customized comprehension levels.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Source Content</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text, code snippets, or paper passages you want explained..."
              rows={9}
              required
              disabled={loading}
              className="w-full border border-gray-200 rounded-xl p-4 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 resize-y leading-relaxed disabled:opacity-60"
            />

            {/* Level Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Select Target Explanation Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      level === lvl.id
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <p className={`text-xs font-bold capitalize ${level === lvl.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {lvl.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{lvl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Explaining Content...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" /> Generate Explanation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col min-h-[460px]">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-800">Explanation Result</h3>
            </div>
            {explanation && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-3 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Explanation'}</span>
              </button>
            )}
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {!explanation && !loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-2">
                <BookOpen className="w-12 h-12 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No Explanation Generated Yet</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Select your target comprehension level and submit text on the left to view the tailored explanation.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-indigo-600 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs font-semibold">Generating {level} level explanation...</p>
              </div>
            ) : (
              <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
