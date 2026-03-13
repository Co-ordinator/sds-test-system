import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Briefcase, X } from 'lucide-react';
import api from '../../services/api';
import { GOV, TYPO } from '../../theme/government';

/**
 * OccupationSearchInput
 *
 * Props:
 *   value        — display string (occupation name)
 *   occupationId — UUID of the matched occupation (null for free text)
 *   onChange(name, id) — called when selection or text changes
 *   placeholder  — input placeholder
 *   inputClassName — extra class on the input
 *   error        — truthy to show error border
 */
export default function OccupationSearchInput({
  value = '',
  occupationId = null,
  onChange,
  placeholder = 'Search for your occupation...',
  inputClassName = '',
  error = false,
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Keep local query in sync when value prop changes externally (e.g. form reset)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchResults = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/occupations/search?q=${encodeURIComponent(q.trim())}`);
      setResults(res.data?.data?.occupations || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    // Notify parent: free text, no occupation ID yet
    onChange(val, null);
    // Debounce API call
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 280);
  };

  const handleSelect = (occupation) => {
    setQuery(occupation.name);
    setOpen(false);
    onChange(occupation.name, occupation.id);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onChange('', null);
  };

  const borderColor = error ? GOV.error : GOV.border;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: GOV.textHint }}
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim()) {
              setOpen(true);
              fetchResults(query);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`form-control-with-icon pl-8 pr-8 ${inputClassName}`}
          style={{ borderBottomColor: borderColor, color: GOV.text }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
            tabIndex={-1}
            aria-label="Clear"
          >
            <X className="w-3.5 h-3.5" style={{ color: GOV.textHint }} />
          </button>
        )}
      </div>

      {/* Matched occupation badge */}
      {occupationId && (
        <p className={`mt-1 flex items-center gap-1 ${TYPO.hint}`} style={{ color: '#059669' }}>
          <Briefcase className="w-3 h-3" />
          Matched to a registered occupation
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <ul
          className="absolute z-20 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-48 bg-white shadow-sm"
          style={{ borderColor: GOV.border }}
        >
          {loading && (
            <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
              Searching...
            </li>
          )}
          {!loading && results.length === 0 && query.trim().length > 0 && (
            <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
              No registered occupation found — your entry will be saved as typed.
            </li>
          )}
          {!loading && results.map((occ) => (
            <li key={occ.id}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 ${TYPO.bodySmall} hover:bg-gray-50 transition-colors flex items-center gap-2`}
                style={{ color: GOV.text }}
                onClick={() => handleSelect(occ)}
              >
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOV.textHint }} />
                <span>{occ.name}</span>
                {occ.category && (
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
                    {occ.category}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
