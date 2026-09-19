// src/pages/ImageGalleryPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, Search, ZoomIn, Calendar, ImageIcon, X, Loader2, Trash2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getSourceImages, deleteSourceImage } from '../api/sources';

export default function ImageGalleryPage() {
  const [searchParams] = useSearchParams();
  const sourceIdParam  = searchParams.get('sourceId');

  const [images, setImages]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchImages = async () => {
    setLoading(true);
    try {
      if (sourceIdParam) {
        const imgs = await getSourceImages(sourceIdParam);
        setImages(Array.isArray(imgs) ? imgs : []);
      } else {
        // Fetch from source 1 default or list
        const imgs = await getSourceImages(1);
        setImages(Array.isArray(imgs) ? imgs : []);
      }
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [sourceIdParam]);

  const handleDelete = async (imageId) => {
    if (!imageId) return;
    setDeletingId(imageId);
    setErrorMessage('');
    
    // Store snapshot in case rollback is needed
    const previousImages = [...images];
    
    // Optimistic UI update
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeleteConfirmId(null);

    try {
      await deleteSourceImage(imageId);
    } catch (err) {
      // Revert if failed
      setImages(previousImages);
      setErrorMessage(err.message || 'Failed to delete image explanation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredImages = images.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.prompt && item.prompt.toLowerCase().includes(q)) ||
      (item.explanation && item.explanation.toLowerCase().includes(q))
    );
  });

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
            <img src={lightboxUrl} alt="Full resolution view" className="max-h-[85vh] max-w-full object-contain rounded-xl mx-auto" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Grid className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Saved Image Explanations Gallery</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Browse all saved image analysis records, diagrams, and vision insights.
          </p>
        </div>

        {/* Search filter input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved explanations..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      {/* Error alert if deletion or request fails */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-red-700 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-500 hover:text-red-700 font-semibold text-xs ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Saved Image Explanations Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery ? 'No explanations match your filter.' : 'Upload and explain images in the Vision Studio to populate your gallery.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => {
            const srcUrl = img.imageUrl?.startsWith('http')
              ? img.imageUrl
              : `http://localhost:8080${img.imageUrl}`;

            const isDeleting = deletingId === img.id;
            const isConfirming = deleteConfirmId === img.id;

            return (
              <div
                key={img.id || img.createdAt}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col relative group/card"
              >
                {/* Image Thumbnail Container */}
                <div
                  onClick={() => setLightboxUrl(srcUrl)}
                  className="relative group cursor-pointer h-48 bg-gray-900 flex items-center justify-center overflow-hidden"
                >
                  <img src={srcUrl} alt="Visual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-semibold">
                    <ZoomIn className="w-4 h-4" /> View Full Image
                  </div>

                  {/* Top-right trash button overlay */}
                  <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
                    {isConfirming ? (
                      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-xs text-slate-200 font-semibold pl-1 pr-0.5">Delete?</span>
                        <button
                          onClick={() => handleDelete(img.id)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs font-medium cursor-pointer transition-all active:scale-95"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(img.id)}
                        disabled={isDeleting}
                        title="Delete image explanation"
                        className="w-8 h-8 rounded-xl bg-slate-900/70 hover:bg-red-600 text-slate-200 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md border border-slate-700/40 active:scale-95"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {img.prompt ? (
                      <div className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 rounded-lg px-2.5 py-1">
                        <span>💬 {img.prompt}</span>
                      </div>
                    ) : (
                      <div className="mb-2 text-[11px] font-medium text-gray-400 italic">No prompt specified</div>
                    )}
                    <div className="prose prose-xs max-w-none text-xs text-gray-700 max-h-36 overflow-y-auto">
                      <ReactMarkdown>{img.explanation}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Footer Date & Actions */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(img.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Saved</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
