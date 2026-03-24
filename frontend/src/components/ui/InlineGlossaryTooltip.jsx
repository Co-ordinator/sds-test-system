import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BookOpen, X, Volume2, ChevronRight } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useGlossary } from '../../hooks/useGlossary';

/**
 * Production-grade inline glossary tooltip
 * Features: instant definitions, progressive disclosure, accessibility, text-to-speech
 */
const InlineGlossaryTooltip = ({ 
  term, 
  children, 
  className = '',
  showIcon = true,
  position = 'bottom',
  size = 'compact',
  onTermLearned = null 
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { getAriaLabel, screenReaderMode, highContrast } = useAccessibility();
  const { getTermDefinition, markTermAsLearned, shouldHighlight, recordInteraction, termInteractions } = useGlossary();
  
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);
  const timeoutRef = useRef(null);

  // Get term data with learning tracking
  const termData = getTermDefinition(term.toLowerCase());
  const shouldShowHighlight = shouldHighlight(term.toLowerCase());

  // Handle text-to-speech
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window && !isSpeaking) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking]);

  // Handle tooltip toggle with learning tracking
  const handleToggle = useCallback(() => {
    if (!tooltipOpen && termData) {
      const termKey = term.toLowerCase();
      recordInteraction(termKey, 'view');
      const viewCount = (termInteractions[termKey]?.view || 0) + 1;

      // Mark as viewed
      if (termData.difficulty === 'high' || termData.difficulty === 'medium' || viewCount >= 3) {
        markTermAsLearned(termKey);
        onTermLearned?.(termKey);
      }
    }
    setTooltipOpen(prev => !prev);
  }, [tooltipOpen, termData, markTermAsLearned, onTermLearned, term, recordInteraction, termInteractions]);

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

  // Handle hover for desktop (optional enhancement)
  const handleMouseEnter = useCallback(() => {
    if (!tooltipOpen && window.innerWidth > 768) {
      timeoutRef.current = setTimeout(() => {
        setTooltipOpen(true);
      }, 300);
    }
  }, [tooltipOpen]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Don't close on mouse leave for better UX
  }, []);

  // Position styles
  const getPositionStyles = () => {
    const base = {
      position: 'absolute',
      zIndex: 50,
      minWidth: size === 'compact' ? '280px' : '320px',
      maxWidth: '400px'
    };

    switch (position) {
      case 'top':
        return { ...base, bottom: '100%', left: 0, marginBottom: '8px' };
      case 'right':
        return { ...base, left: '100%', top: 0, marginLeft: '8px' };
      case 'left':
        return { ...base, right: '100%', top: 0, marginRight: '8px' };
      default: // bottom
        return { ...base, top: '100%', left: 0, marginTop: '8px' };
    }
  };

  if (!termData) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-block relative ${className}`}>
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
      
      {/* Trigger button with smart highlighting */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          inline-flex items-center gap-1 transition-all duration-200 
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 
          rounded px-1 py-0.5
          ${shouldShowHighlight 
            ? 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border-b-2 border-blue-400 border-dotted' 
            : 'text-blue-600 hover:text-blue-800'
          }
          ${highContrast ? 'border-2 border-black' : ''}
        `}
        aria-label={getAriaLabel(`Get definition for ${term}`, 'Glossary')}
        aria-expanded={tooltipOpen}
        aria-describedby={tooltipOpen ? 'glossary-tooltip-content' : undefined}
      >
        <span className="font-medium">{children}</span>
        {showIcon && (
          <BookOpen className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Tooltip content */}
      {tooltipOpen && (
        <div
          ref={tooltipRef}
          className={`
            bg-white border rounded-lg shadow-xl p-4 animate-in fade-in-0 zoom-in-95
            ${highContrast ? 'border-2 border-black' : 'border-gray-200'}
          `}
          style={getPositionStyles()}
          id="glossary-tooltip-content"
          role="tooltip"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900" style={{ color: GOV.text }}>
                {termData.term}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: termData.difficulty === 'high' ? '#fef2f2' : 
                                   termData.difficulty === 'medium' ? '#fef3c7' : '#f0fdf4',
                    color: termData.difficulty === 'high' ? '#dc2626' : 
                          termData.difficulty === 'medium' ? '#d97706' : '#16a34a'
                  }}
                >
                  {termData.category}
                </span>
                {termData.difficulty && (
                  <span className="text-xs text-gray-500">
                    {termData.difficulty}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Text-to-speech button */}
              {!screenReaderMode && (
                <button
                  type="button"
                  onClick={() => speakText(`${termData.term}. ${termData.definition}`)}
                  disabled={isSpeaking}
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Speak definition"
                  title="Read definition aloud"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                </button>
              )}
              
              {/* Close button */}
              <button
                type="button"
                onClick={() => setTooltipOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Close definition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Definition */}
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: GOV.text }}>
              {termData.definition}
            </p>
            
            {/* Example */}
            {termData.example && (
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: GOV.textMuted }}>
                  Example:
                </p>
                <p className="text-xs italic" style={{ color: GOV.text }}>
                  {termData.example}
                </p>
              </div>
            )}

            {/* Related terms */}
            {termData.related && termData.related.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: GOV.borderLight }}>
                <p className="text-xs font-semibold mb-2" style={{ color: GOV.textMuted }}>
                  Related terms:
                </p>
                <div className="flex flex-wrap gap-1">
                  {termData.related.slice(0, 3).map(relatedTerm => (
                    <span
                      key={relatedTerm}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                      style={{ color: GOV.text }}
                    >
                      {relatedTerm}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning feedback */}
            {shouldShowHighlight && (
              <div className="flex items-center gap-2 pt-2 text-xs" style={{ color: '#16a34a' }}>
                <span className="font-medium">✓ Got it</span>
                <span style={{ color: GOV.textMuted }}>
                  This term won't be highlighted again
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
};

export default InlineGlossaryTooltip;
