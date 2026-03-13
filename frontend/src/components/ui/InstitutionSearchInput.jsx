import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Building2, X } from 'lucide-react';
import api from '../../services/api';
import { GOV, TYPO } from '../../theme/government';

/**
 * InstitutionSearchInput
 *
 * Props:
 *   value        — display string (institution name)
 *   institutionId — UUID of the selected institution
 *   onChange(name, id) — called when selection or text changes
 *   placeholder  — input placeholder
 *   inputClassName — extra class on the input
 *   error        — truthy to show error border
 *   allowClear   — show clear button
 */
export default function InstitutionSearchInput({
  value = '',
  institutionId = null,
  onChange,
  placeholder = 'Search for institution...',
  inputClassName = '',
  error = false,
  allowClear = true,
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
      const res = await api.get(`/api/v1/institutions/search?q=${encodeURIComponent(q.trim())}`);
      setResults(res.data?.data?.institutions || []);
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
    // Notify parent: searching, no institution ID yet
    onChange(val, null);
    // Debounce API call
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 280);
  };

  const handleSelect = (institution) => {
    setQuery(institution.name);
    setOpen(false);
    onChange(institution.name, institution.id);
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
          className={`form-control-with-icon pl-8 ${allowClear && query ? 'pr-8' : ''} ${inputClassName}`}
          style={{ borderBottomColor: borderColor, color: GOV.text }}
        />
        {allowClear && query && (
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

      {/* Matched institution badge */}
      {institutionId && (
        <p className={`mt-1 flex items-center gap-1 ${TYPO.hint}`} style={{ color: '#059669' }}>
          <Building2 className="w-3 h-3" />
          Institution selected
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
              No institution found. Try a different search term.
            </li>
          )}
          {!loading && results.map((inst) => (
            <li key={inst.id}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 ${TYPO.bodySmall} hover:bg-gray-50 transition-colors flex items-center gap-2`}
                style={{ color: GOV.text }}
                onClick={() => handleSelect(inst)}
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOV.textHint }} />
                <span>{inst.name}</span>
                {inst.region && (
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
                    {inst.region}
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
