import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { useAccessibility } from '../../context/AccessibilityContext';
import { glossaryService } from '../../services/glossaryService';

const GlossaryTooltip = ({ term, children, className = '' }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState(null);
  const [error, setError] = useState(null);
  const { getAriaLabel, screenReaderMode } = useAccessibility();
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  const fetchDefinition = useCallback(async () => {
    if (!term) return;
    
    setLoading(true);
    setError(null);
    try {
      const terms = await glossaryService.listTerms('general', term);
      const found = terms.find(t => t.term.toLowerCase() === term.toLowerCase());
      if (found) {
        setDefinition(found);
      } else {
        setError('No definition found');
      }
    } catch (err) {
      setError('Unable to load definition');
    } finally {
      setLoading(false);
    }
  }, [term]);

  const handleToggle = useCallback(() => {
    if (!tooltipOpen && !definition && !loading) {
      fetchDefinition();
    }
    setTooltipOpen(prev => !prev);
  }, [tooltipOpen, definition, loading, fetchDefinition]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && tooltipOpen) {
        setTooltipOpen(false);
        buttonRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tooltipOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target) && 
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setTooltipOpen(false);
      }
    };

    if (tooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [tooltipOpen]);

  return (
    <span className={`inline-block ${className}`}>
      {/* Skip link for screen readers */}
      {screenReaderMode && (
        <a 
          href="#glossary-section" 
          className="sr-only"
          aria-label={`Jump to glossary definition of ${term}`}
        >
          Jump to glossary definition of {term}
        </a>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded px-1 py-0.5 transition-colors"
        aria-label={getAriaLabel(`Get definition for ${term}`, 'Glossary')}
        aria-expanded={tooltipOpen}
        aria-describedby={tooltipOpen ? 'glossary-tooltip-content' : undefined}
      >
        {children}
        <BookOpen className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      </button>

      {tooltipOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{ top: '100%', left: 0, marginTop: '4px' }}
          id="glossary-tooltip-content"
          role="tooltip"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900" style={{ color: GOV.text }}>
              {term}
            </h3>
            <button
              type="button"
              onClick={() => setTooltipOpen(false)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
              aria-label="Close definition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <p className="text-sm text-gray-500" style={{ color: GOV.textMuted }}>
              Loading definition...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600" style={{ color: GOV.error }}>
              {error}
            </p>
          )}

          {definition && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: GOV.text }}>
                {definition.definition}
              </p>
              
              {definition.example && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: GOV.textMuted }}>
                    Example:
                  </p>
                  <p className="text-xs italic" style={{ color: GOV.text }}>
                    {definition.example}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs" style={{ color: GOV.textHint }}>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                  {definition.section}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default GlossaryTooltip;
