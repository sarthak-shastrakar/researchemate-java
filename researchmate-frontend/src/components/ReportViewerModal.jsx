// src/components/ReportViewerModal.jsx
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Copy, Download, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { downloadReportPdf, downloadReportDocx } from '../api/projects';

// ── tiny inline spinner ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
  );
}

// ── helper: trigger browser download from a Blob ────────────────────────────
function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── ReactMarkdown custom renderers ───────────────────────────────────────────
const markdownComponents = {
  // All links open in new tab with safety attributes
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 inline-flex items-center gap-0.5"
    >
      {children}
      <ExternalLink className="w-3 h-3 inline-block flex-shrink-0 ml-0.5" />
    </a>
  ),
  // Headings
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-gray-800 mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-1.5">{children}</h3>
  ),
  // Paragraphs
  p: ({ children }) => (
    <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
  ),
  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-gray-700 leading-relaxed">{children}</li>
  ),
  // Code
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
    ) : (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs font-mono mb-3">
        <code>{children}</code>
      </pre>
    ),
  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-violet-300 pl-4 italic text-gray-500 text-sm my-3">
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => <hr className="border-gray-200 my-5" />,
  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  // Table (GFM)
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-gray-50 border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-3 py-1.5 text-gray-700">{children}</td>
  ),
};

export default function ReportViewerModal({ report, onClose }) {
  const overlayRef = useRef(null);

  // track which download button is in-flight: null | 'pdf' | 'docx'
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  const safeFilename = (name) =>
    name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const handleDownloadMd = () => {
    // Include YAML frontmatter for proper metadata
    const frontmatter = `---\ntitle: "${report.title}"\ndate: "${new Date(report.createdAt).toISOString()}"\n---\n\n`;
    const blob = new Blob([frontmatter + report.content], { type: 'text/markdown' });
    triggerBlobDownload(blob, `${safeFilename(report.title)}.md`);
  };

  const handleDownloadPdf = async () => {
    setDownloading('pdf');
    setDownloadError('');
    try {
      const blob = await downloadReportPdf(report.projectId, report.id);
      triggerBlobDownload(blob, `${safeFilename(report.title)}.pdf`);
    } catch {
      setDownloadError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDocx = async () => {
    setDownloading('docx');
    setDownloadError('');
    try {
      const blob = await downloadReportDocx(report.projectId, report.id);
      triggerBlobDownload(blob, `${safeFilename(report.title)}.docx`);
    } catch {
      setDownloadError('Failed to download DOCX. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const formattedDate = new Date(report.createdAt).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4 py-10"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{report.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Generated on {formattedDate}</p>
          </div>
          <button
            id="report-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
          {/* Copy Markdown */}
          <button
            id="report-copy-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
          >
            <span>{copied ? '✓ Copied!' : 'Copy Markdown'}</span>
          </button>

          {/* Download .md */}
          <button
            id="report-download-md-btn"
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download .md
          </button>

          {/* Download PDF */}
          <button
            id="report-download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={downloading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading === 'pdf' ? <Spinner /> : <Download className="w-3.5 h-3.5" />}
            {downloading === 'pdf' ? 'Downloading…' : 'Download PDF'}
          </button>

          {/* Download DOCX */}
          <button
            id="report-download-docx-btn"
            onClick={handleDownloadDocx}
            disabled={downloading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading === 'docx' ? <Spinner /> : <Download className="w-3.5 h-3.5" />}
            {downloading === 'docx' ? 'Downloading…' : 'Download DOCX'}
          </button>
        </div>

        {/* Download error */}
        {downloadError && (
          <div className="flex items-center gap-2 mx-5 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {downloadError}
            <button
              onClick={() => setDownloadError('')}
              className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Rendered Markdown content */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          <div className="prose-report">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {report.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
