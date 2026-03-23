import React, { useState, useCallback, useEffect } from 'react';
import { X, Volume2, ChevronRight, Search, Filter } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useGlossary } from '../../hooks/useGlossary';

/**
 * Bottom sheet for deep-dive glossary definitions
 * Features: search, filtering, related terms, full glossary access
 */
const GlossaryBottomSheet = ({ 
  isOpen, 
  onClose, 
  initialTerm = null,
  className = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { getAriaLabel, screenReaderMode, highContrast } = useAccessibility();
  const { glossaryUtils, markTermAsLearned } = useGlossary();

  // Filter terms based on search and category
  const filteredTerms = useCallback(() => {
    let terms = glossaryUtils.getAllTerms();
    
    // Category filter
    if (selectedCategory !== 'all') {
      terms = terms.filter(term => term.category === selectedCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(term => 
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query) ||
        (term.example && term.example.toLowerCase().includes(query))
      );
    }
    
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedCategory, glossaryUtils]);

  // Handle text-to-speech
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window && !isSpeaking) {
      setIsSpeaking(true);
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking]);

  // Handle term selection
  const handleTermSelect = useCallback((term) => {
    setSelectedTerm(term);
    markTermAsLearned(term.term.toLowerCase());
  }, [markTermAsLearned]);

  // Handle initial term
  useEffect(() => {
    if (initialTerm && isOpen) {
      const term = glossaryUtils.findTerm(initialTerm.toLowerCase());
      if (term) {
        handleTermSelect(term);
      }
    }
  }, [initialTerm, isOpen, glossaryUtils, handleTermSelect]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const categories = [
    { value: 'all', label: 'All Terms', count: glossaryUtils.getAllTerms().length },
    { value: 'riasec', label: 'RIASEC Types', count: glossaryUtils.getTermsByCategory('riasec').length },
    { value: 'structure', label: 'Assessment Terms', count: glossaryUtils.getTermsByCategory('structure').length },
    { value: 'actions', label: 'Activity Words', count: glossaryUtils.getTermsByCategory('actions').length },
    { value: 'occupations', label: 'Occupations', count: glossaryUtils.getTermsByCategory('occupations').length }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Bottom sheet */}
      <div 
        className={`
          relative bg-white w-full max-h-[85vh] rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-out transform translate-y-0
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-sheet-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-4 border-b" style={{ borderColor: GOV.borderLight }}>
          <div className="flex items-center justify-between mb-4">
            <h2 
              id="glossary-sheet-title"
              className="text-xl font-bold" 
              style={{ color: GOV.text }}
            >
              SDS Glossary
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label="Close glossary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search terms, definitions, examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: GOV.border, color: GOV.text }}
              />
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                    ${selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {category.label}
                  <span className="ml-1 text-xs opacity-75">
                    ({category.count})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {selectedTerm ? (
            /* Term detail view */
            <div className="p-4 h-full overflow-y-auto">
              <button
                onClick={() => setSelectedTerm(null)}
                className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to all terms
              </button>

              <div className="space-y-4">
                {/* Term header */}
                <div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: GOV.text }}>
                    {selectedTerm.term}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: selectedTerm.difficulty === 'high' ? '#fef2f2' : 
                                       selectedTerm.difficulty === 'medium' ? '#fef3c7' : '#f0fdf4',
                        color: selectedTerm.difficulty === 'high' ? '#dc2626' : 
                              selectedTerm.difficulty === 'medium' ? '#d97706' : '#16a34a'
                      }}
                    >
                      {selectedTerm.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedTerm.difficulty} difficulty
                    </span>
                  </div>
                </div>

                {/* Definition */}
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: GOV.text }}>Definition</h4>
                  <p className="text-base leading-relaxed" style={{ color: GOV.text }}>
                    {selectedTerm.definition}
                  </p>
                </div>

                {/* Example */}
                {selectedTerm.example && (
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: GOV.text }}>Example</h4>
                    <p className="text-base italic" style={{ color: GOV.textMuted }}>
                      {selectedTerm.example}
                    </p>
                  </div>
                )}

                {/* Related terms */}
                {selectedTerm.related && selectedTerm.related.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: GOV.text }}>Related Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.related.map(relatedTerm => {
                        const related = glossaryUtils.findTerm(relatedTerm);
                        return related ? (
                          <button
                            key={relatedTerm}
                            onClick={() => handleTermSelect(related)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                          >
                            {related.term}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Text-to-speech */}
                {!screenReaderMode && (
                  <button
                    onClick={() => speakText(`${selectedTerm.term}. ${selectedTerm.definition}${selectedTerm.example ? `. Example: ${selectedTerm.example}` : ''}`)}
                    disabled={isSpeaking}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Term list view */
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                {filteredTerms().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No terms found matching your search.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTerms().map(term => (
                      <button
                        key={`${term.category}-${term.term}`}
                        onClick={() => handleTermSelect(term)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        style={{ borderColor: GOV.borderLight }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1" style={{ color: GOV.text }}>
                              {term.term}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {term.definition}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: term.difficulty === 'high' ? '#fef2f2' : 
                                                 term.difficulty === 'medium' ? '#fef3c7' : '#f0fdf4',
                                  color: term.difficulty === 'high' ? '#dc2626' : 
                                        term.difficulty === 'medium' ? '#d97706' : '#16a34a'
                                }}
                              >
                                {term.category}
                              </span>
                              {term.difficulty && (
                                <span className="text-xs text-gray-500">
                                  {term.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlossaryBottomSheet;
