// src/components/HighlightCard.jsx
import { Trash2, Quote } from 'lucide-react';

export default function HighlightCard({ highlight, onDelete }) {
  return (
    <div
      id={`highlight-card-${highlight.id}`}
      className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Quote className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 italic line-clamp-4">
            "{highlight.selectedText}"
          </p>
          {highlight.note && (
            <p className="text-xs text-gray-500 mt-2 border-t border-indigo-100 pt-2">
              📝 {highlight.note}
            </p>
          )}
        </div>
        <button
          id={`highlight-delete-btn-${highlight.id}`}
          onClick={() => onDelete(highlight.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer flex-shrink-0"
          title="Delete highlight"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
