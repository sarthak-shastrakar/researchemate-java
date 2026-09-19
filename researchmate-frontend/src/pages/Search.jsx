// src/pages/Search.jsx
import { useState, useRef } from 'react';
import { Search as SearchIcon, X, ExternalLink } from 'lucide-react';
import { searchSources } from '../api/sources';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import TagBadge from '../components/TagBadge';

const SOURCE_TYPE_STYLES = {
  ARTICLE:  'bg-blue-100 text-blue-700',
  DOCS:     'bg-emerald-100 text-emerald-700',
  GITHUB:   'bg-gray-100 text-gray-700',
  PDF:      'bg-orange-100 text-orange-700',
  VIDEO:    'bg-rose-100 text-rose-700',
};

function SourceResult({ source }) {
  const typeStyle = SOURCE_TYPE_STYLES[source.sourceType] || 'bg-gray-100 text-gray-600';
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>
              {source.sourceType}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm">{source.title}</h3>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1 truncate"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{source.url}</span>
          </a>
          {source.tags && source.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {source.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await searchSources(q);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setKeyword('');
    setResults([]);
    setSearched(false);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Search Sources</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Find sources across all your projects by title, URL, or tags
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title, URL, or tag name…"
            className="w-full border border-gray-200 rounded-2xl pl-11 pr-24 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
          />
          {keyword && (
            <button
              type="button"
              id="search-clear-btn"
              onClick={clearSearch}
              className="absolute right-20 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            id="search-submit-btn"
            disabled={!keyword.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No results found"
          description={`No sources matching "${keyword}" were found.`}
        />
      ) : results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{keyword}&rdquo;
          </p>
          {results.map((s) => (
            <SourceResult key={s.id} source={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
