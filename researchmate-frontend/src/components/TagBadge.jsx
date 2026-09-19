// src/components/TagBadge.jsx
import { X } from 'lucide-react';

const COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

function colorForTag(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function TagBadge({ tag, onRemove }) {
  const color = colorForTag(tag.tagName || tag.name || '');
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {tag.tagName || tag.name}
      {onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="ml-0.5 rounded-full hover:opacity-70 cursor-pointer"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
