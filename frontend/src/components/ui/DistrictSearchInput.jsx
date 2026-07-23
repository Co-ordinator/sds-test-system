import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import {
  ESWATINI_TOWNS_BY_REGION,
  REGION_FROM_BACKEND,
  getTownsForRegion,
  normalizeRegionKey,
} from '../../data/eswatiniLocations';

/**
 * DistrictSearchInput
 *
 * Props:
 *   value        - display string (district/town name)
 *   onChange(name) - called when selection changes
 *   placeholder  - input placeholder
 *   region       - selected region, either display label or backend value
 *   inputClassName - extra class on the input
 *   error        - truthy to show error border
 */
export default function DistrictSearchInput({
  value = '',
  onChange,
  placeholder = 'Search for district or town...',
  region = '',
  inputClassName = '',
  error = false,
  inputId,
  errorId,
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchDistrictsAndTowns = useCallback((searchQuery) => {
    const regionKey = normalizeRegionKey(region);
    const q = String(searchQuery || '').toLowerCase().trim();

    if (!regionKey && q.length < 1) {
      setResults([]);
      return;
    }

    const searchRegions = regionKey && ESWATINI_TOWNS_BY_REGION[regionKey]
      ? [[regionKey, getTownsForRegion(regionKey)]]
      : Object.entries(ESWATINI_TOWNS_BY_REGION).map(([key]) => [key, getTownsForRegion(key)]);

    const matches = [];

    if (!regionKey) {
      Object.keys(ESWATINI_TOWNS_BY_REGION).forEach((district) => {
        const label = REGION_FROM_BACKEND[district] || district;
        if (label.toLowerCase().includes(q)) {
          matches.push({
            type: 'district',
            name: label,
            value: district,
          });
        }
      });
    }

    searchRegions.forEach(([district, towns]) => {
      towns.forEach((town) => {
        if (!q || town.toLowerCase().includes(q)) {
          matches.push({
            type: 'town',
            name: town,
            district: REGION_FROM_BACKEND[district] || district,
            value: town,
          });
        }
      });
    });

    const dedupedMatches = matches.filter((match, index, allMatches) => (
      index === allMatches.findIndex((candidate) => (
        candidate.type === match.type
        && candidate.name.toLowerCase() === match.name.toLowerCase()
        && candidate.district === match.district
      ))
    ));

    dedupedMatches.sort((a, b) => {
      const aExact = a.name.toLowerCase() === q;
      const bExact = b.name.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    setResults(dedupedMatches.slice(0, 10));
  }, [region]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(val.trim().length > 0 || Boolean(normalizeRegionKey(region)));
    onChange(val);
    searchDistrictsAndTowns(val);
  };

  const handleSelect = (result) => {
    setQuery(result.name);
    setOpen(false);
    onChange(result.name);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onChange('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: GOV.textHint }}
          aria-hidden
        />
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim() || normalizeRegionKey(region)) {
              setOpen(true);
              searchDistrictsAndTowns(query);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`form-control-with-icon pl-8 pr-8 ${inputClassName}`}
          style={{ color: GOV.text, ...(error && { borderColor: GOV.error }) }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
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

      {open && (
        <ul
          className="absolute z-20 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-48 bg-white shadow-sm"
          style={{ borderColor: GOV.border }}
        >
          {results.length === 0 && (
            <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
              No town found for the selected region. Try another search term.
            </li>
          )}
          {results.map((result, index) => (
            <li key={`${result.value}-${index}`}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 ${TYPO.bodySmall} hover:bg-gray-50 transition-colors flex items-center gap-2`}
                style={{ color: GOV.text }}
                onClick={() => handleSelect(result)}
              >
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOV.textHint }} />
                <span>{result.name}</span>
                <span className="ml-auto flex items-center gap-1">
                  {result.type === 'town' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
                      {result.district}
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: GOV.borderLight, color: GOV.textMuted }}>
                    {result.type === 'district' ? 'Region' : 'Town'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
