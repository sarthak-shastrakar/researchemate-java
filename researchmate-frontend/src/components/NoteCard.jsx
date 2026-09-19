// src/components/NoteCard.jsx
import { useState } from 'react';
import { Pencil, Trash2, Check, X, FileText } from 'lucide-react';

export default function NoteCard({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(note.id, { title, content });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(note.title || '');
    setContent(note.content || '');
    setEditing(false);
  };

  return (
    <div id={`note-card-${note.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md">
      {editing ? (
        <div className="space-y-2">
          <input
            id={`note-title-edit-${note.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Note title"
          />
          <textarea
            id={`note-content-edit-${note.id}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            placeholder="Note content"
          />
          <div className="flex gap-2">
            <button
              id={`note-save-btn-${note.id}`}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              id={`note-cancel-btn-${note.id}`}
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">{note.title}</h4>
              {note.content && (
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                id={`note-edit-btn-${note.id}`}
                onClick={() => setEditing(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                title="Edit note"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                id={`note-delete-btn-${note.id}`}
                onClick={() => onDelete(note.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
