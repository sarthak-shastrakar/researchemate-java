// src/pages/AIImageStudioPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImageIcon, UploadCloud, Send, RefreshCw, ZoomIn, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { explainImage } from '../api/sources';

const SAMPLE_PROMPTS = [
  'Summarize the main content shown in this image',
  'Explain any diagrams, charts, or figures step by step',
  'Identify key entities, text, or equations in this image',
  'What are the key takeaways from this visual material?'
];

export default function AIImageStudioPage() {
  const [searchParams] = useSearchParams();
  const sourceIdParam = searchParams.get('sourceId');

  const [imageFile, setImageFile]     = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [prompt, setPrompt]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [dragging, setDragging]       = useState(false);

  // Chat conversation thread history
  const [chatThread, setChatThread]   = useState([]);
  const [followUp, setFollowUp]       = useState('');
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  // Lightbox modal preview
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileInputRef                  = useRef(null);
  const chatEndRef                    = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 5MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setChatThread([]);
  };

  const handleInitialSubmit = async (e) => {
    e?.preventDefault();
    if (!imageFile) return;
    setLoading(true);
    setError('');
    try {
      // Use parameter sourceId or fallback to 1 if standalone studio call
      const sourceId = sourceIdParam ? Number(sourceIdParam) : 1;
      const res = await explainImage(sourceId, imageFile, prompt);
      const text = res?.explanation ?? res;
      setChatThread([{ id: Date.now(), role: 'user', text: prompt || 'Analyze this image' }, { id: Date.now() + 1, role: 'ai', text }]);
    } catch (err) {
      setError(err.message || 'Failed to explain image. Please check your network or OpenRouter API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUp.trim() || !imageFile) return;
    const currentQuestion = followUp.trim();
    setFollowUp('');
    setLoadingFollowUp(true);
    setError('');
    
    // Add user question to thread immediately
    setChatThread((prev) => [...prev, { id: Date.now(), role: 'user', text: currentQuestion }]);

    try {
      const sourceId = sourceIdParam ? Number(sourceIdParam) : 1;
      const res = await explainImage(sourceId, imageFile, currentQuestion);
      const text = res?.explanation ?? res;
      setChatThread((prev) => [...prev, { id: Date.now(), role: 'ai', text }]);
    } catch (err) {
      setError(err.message || 'Failed to get follow-up answer.');
    } finally {
      setLoadingFollowUp(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread, loadingFollowUp]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxUrl} alt="Full view" className="max-h-[85vh] max-w-full object-contain rounded-xl mx-auto" />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Vision Studio</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Upload images, diagrams, research figures, or formulas to get instant multi-turn AI analysis.
          </p>
        </div>
        {previewUrl && (
          <button
            onClick={() => { setImageFile(null); setPreviewUrl(null); setChatThread([]); setPrompt(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl cursor-pointer transition-colors w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Start New Image Session
          </button>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Dropzone & Config */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-teal-600" /> Upload Image
            </h2>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                dragging ? 'border-teal-500 bg-teal-50/80 scale-[0.99]' : 'border-gray-300 bg-gray-50/50 hover:bg-teal-50/40 hover:border-teal-400'
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {previewUrl ? (
                <div className="relative w-full flex flex-col items-center gap-3">
                  <div
                    onClick={(e) => { e.stopPropagation(); setLightboxUrl(previewUrl); }}
                    className="relative group cursor-pointer max-h-64 overflow-hidden rounded-xl border border-teal-200"
                  >
                    <img src={previewUrl} alt="Upload Preview" className="max-h-60 w-full object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setPreviewUrl(null);
                        setChatThread([]);
                        setPrompt('');
                      }}
                      className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-all shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-semibold">
                      <ZoomIn className="w-4 h-4" /> Click to Expand
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800 truncate max-w-xs">{imageFile?.name}</p>
                    <p className="text-[11px] text-gray-400">{(imageFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-1">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Drop your research image here</p>
                  <p className="text-xs text-gray-400">Supports PNG, JPG, WebP up to 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>

            {/* Prompt Input & Presets */}
            {previewUrl && chatThread.length === 0 && (
              <form onSubmit={handleInitialSubmit} className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700">Custom Question / Instructions (Optional)</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. What does the diagram show?"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />

                {/* Sample Presets */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Prompts:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(p)}
                        className="text-[11px] bg-teal-50/70 hover:bg-teal-100 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-100 text-left transition-colors cursor-pointer"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !imageFile}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Analyze & Explain Image
                    </>
                  )}
                </button>
              </form>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Q&A Chat Canvas */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col min-h-[500px] max-h-[750px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/60 to-cyan-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <h3 className="text-sm font-bold text-gray-800">Vision AI Chat Thread</h3>
              </div>
              <span className="text-[11px] text-teal-700 bg-teal-100/70 font-semibold px-2.5 py-0.5 rounded-full">
                {chatThread.length > 0 ? `${chatThread.length / 2 | 0} Turn(s)` : 'Awaiting Image'}
              </span>
            </div>

            {/* Thread Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/30">
              {chatThread.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-2">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No Image Analysis Yet</p>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Upload an image on the left and click "Analyze & Explain" to start an interactive vision session.
                  </p>
                </div>
              ) : (
                chatThread.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-teal-600 text-white font-medium rounded-br-none'
                          : 'bg-white border border-teal-100 text-gray-800 rounded-bl-none space-y-1'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p>{msg.text}</p>
                      ) : (
                        <div className="prose prose-xs max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {loadingFollowUp && (
                <div className="flex items-center gap-2 text-xs text-teal-600 font-medium bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5 w-fit animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>Thinking & processing your question...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Follow-up Question Input Bar */}
            {chatThread.length > 0 && (
              <form onSubmit={handleFollowUpSubmit} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Ask a follow-up question about this image..."
                  disabled={loadingFollowUp || !imageFile}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loadingFollowUp || !followUp.trim() || !imageFile}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
