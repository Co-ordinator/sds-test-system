import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';

// Eswatini districts and their towns
const DISTRICTS_DATA = {
  hhohho: [
    'Mbabane', 'Piggs Peak', 'Manzini (Nhlangano area)', 'Lobamba', 'Matsapha',
    'Ezulwini', 'Malkerns', 'Motshane', 'Buhleni', 'Timphisini'
  ],
  manzini: [
    'Manzini', 'Matsapha', 'Lavumisa', 'Big Bend', 'Malkerns', 'Ngwenya',
    'Mhlambanyatsi', 'Kwaluseni', 'Sidvokodvo', 'Matsanjeni'
  ],
  lubombo: [
    'Siteki', 'Big Bend', 'Lavumisa', 'Matsanjeni', 'Mhlume', 'Tshaneni',
    'Dvokodvweni', 'Siphofaneni', 'Mpolonjeni', 'Nhlambeni'
  ],
  shiselweni: [
    'Nhlangano', 'Hlatikhulu', 'Golgotha', 'Matsamo', 'Matsanjeni', 'Zombodze',
    'Emvembili', 'Matsapha', 'Gege', 'Mavuso'
  ]
};

/**
 * DistrictSearchInput
 *
 * Props:
 *   value        - display string (district/town name)
 *   onChange(name) - called when selection changes
 *   placeholder  - input placeholder
 *   inputClassName - extra class on the input
 *   error        - truthy to show error border
 */
export default function DistrictSearchInput({
  value = '',
  onChange,
  placeholder = 'Search for district or town...',
  inputClassName = '',
  error = false,
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);

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

  const searchDistrictsAndTowns = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setResults([]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matches = [];

    // Search districts
    Object.keys(DISTRICTS_DATA).forEach(district => {
      if (district.toLowerCase().includes(q)) {
        matches.push({
          type: 'district',
          name: district.charAt(0).toUpperCase() + district.slice(1),
          value: district
        });
      }
    });

    // Search towns within districts
    Object.entries(DISTRICTS_DATA).forEach(([district, towns]) => {
      towns.forEach(town => {
        if (town.toLowerCase().includes(q)) {
          matches.push({
            type: 'town',
            name: town,
            district: district.charAt(0).toUpperCase() + district.slice(1),
            value: town
          });
        }
      });
    });

    // Sort by relevance (exact matches first, then alphabetical)
    matches.sort((a, b) => {
      const aExact = a.name.toLowerCase() === q;
      const bExact = b.name.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    setResults(matches.slice(0, 10)); // Limit to 10 results
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(val.trim().length > 0);
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
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim()) {
              setOpen(true);
              searchDistrictsAndTowns(query);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`form-control-with-icon pl-8 pr-8 ${inputClassName}`}
          style={{ color: GOV.text, ...(error && { borderColor: GOV.error }) }}
          aria-invalid={error ? 'true' : 'false'}
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

      {/* Dropdown */}
      {open && (
        <ul
          className="absolute z-20 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-48 bg-white shadow-sm"
          style={{ borderColor: GOV.border }}
        >
          {query.trim().length > 0 && results.length === 0 && (
            <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
              No district or town found. Try a different search term.
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
                    {result.type === 'district' ? 'District' : 'Town'}
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
