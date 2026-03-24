import React, { useState, useMemo, useEffect } from 'react';
import { Search, Volume2, X, Filter, BookOpen, GraduationCap, Briefcase, Users } from 'lucide-react';
import { GOV, TYPO } from '../theme/government';
import { useAccessibility } from '../context/AccessibilityContext';
import { useGlossary } from '../hooks/useGlossary';

/**
 * Full-page glossary with search, filtering, and detailed term views
 * Features: category filtering, search, text-to-speech, learning tracking
 */
const GlossaryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { getAriaLabel, screenReaderMode, highContrast } = useAccessibility();
  const { glossaryUtils, markTermAsLearned, glossaryTerms, handleTermView, getStats } = useGlossary();

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    let terms = [...glossaryTerms]; // Clone to avoid mutation

    // Category filter
    if (selectedCategory !== 'all') {
      terms = terms.filter(term => term.section === selectedCategory);
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
  }, [searchQuery, selectedCategory, glossaryTerms]);

  // Memoize categories to prevent re-renders
  const categories = useMemo(() => {
    const allTerms = glossaryTerms;
    return [
      { value: 'all', label: 'All Terms', count: allTerms.length, icon: BookOpen },
      { value: 'riasec', label: 'RIASEC Types', count: allTerms.filter(term => term.section === 'riasec').length, icon: Users },
      { value: 'structure', label: 'Assessment Terms', count: allTerms.filter(term => term.section === 'structure').length, icon: GraduationCap },
      { value: 'actions', label: 'Activity Words', count: allTerms.filter(term => term.section === 'actions').length, icon: Briefcase },
      { value: 'occupations', label: 'Occupations', count: allTerms.filter(term => term.section === 'occupations').length, icon: Briefcase }
    ];
  }, [glossaryTerms]);

  // Handle text-to-speech
  const speakText = (text) => {
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
  };

  // Handle term selection
  const handleTermSelect = (term) => {
    setSelectedTerm(term);
    markTermAsLearned(term.term.toLowerCase());
  };

  // Track term views when a term is selected
  useEffect(() => {
    if (selectedTerm) {
      handleTermView(selectedTerm.term.toLowerCase());
    }
  }, [selectedTerm, handleTermView]);

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: GOV.background }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: GOV.borderLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: GOV.text }}>
                SDS Glossary
              </h1>
              <p className="mt-2 text-lg" style={{ color: GOV.textMuted }}>
                Comprehensive career development and assessment terminology
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm" style={{ color: GOV.textMuted }}>
                Learning Progress
              </div>
              <div className="text-2xl font-bold" style={{ color: GOV.primary }}>
                {stats.progressPercentage}%
              </div>
              <div className="text-sm" style={{ color: GOV.textMuted }}>
                {stats.learnedCount} of {stats.totalTerms} terms learned
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b" style={{ borderColor: GOV.borderLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search terms, definitions, examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                style={{ borderColor: GOV.border, color: GOV.text }}
              />
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors
                      ${selectedCategory === category.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                    <span className="text-sm opacity-75">
                      ({category.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Terms List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: GOV.borderLight }}>
              <div className="p-4 border-b" style={{ borderColor: GOV.borderLight }}>
                <h2 className="text-lg font-semibold" style={{ color: GOV.text }}>
                  Terms ({filteredTerms.length})
                </h2>
              </div>
              <div className="max-h-96 lg:max-h-[600px] overflow-y-auto">
                {filteredTerms.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No terms found matching your search.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: GOV.borderLight }}>
                    {filteredTerms.map(term => (
                      <button
                        key={`${term.section}-${term.term}`}
                        onClick={() => handleTermSelect(term)}
                        className={`
                          w-full text-left p-4 hover:bg-gray-50 transition-colors
                          ${selectedTerm?.term === term.term ? 'bg-blue-50' : ''}
                        `}
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
                                {term.section}
                              </span>
                              {term.difficulty && (
                                <span className="text-xs text-gray-500">
                                  {term.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Term Detail */}
          <div className="lg:col-span-2">
            {selectedTerm ? (
              <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: GOV.borderLight }}>
                <div className="p-6 border-b" style={{ borderColor: GOV.borderLight }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2" style={{ color: GOV.text }}>
                        {selectedTerm.term}
                      </h2>
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
                          {selectedTerm.section}
                        </span>
                        <span className="text-sm text-gray-500">
                          {selectedTerm.difficulty} difficulty
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTerm(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                      aria-label="Close term details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Definition */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: GOV.text }}>Definition</h3>
                    <p className="text-base leading-relaxed" style={{ color: GOV.text }}>
                      {selectedTerm.definition}
                    </p>
                  </div>

                  {/* Example */}
                  {selectedTerm.example && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: GOV.text }}>Example</h3>
                      <p className="text-base italic" style={{ color: GOV.textMuted }}>
                        {selectedTerm.example}
                      </p>
                    </div>
                  )}

                  {/* Related terms */}
                  {selectedTerm.related && selectedTerm.related.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: GOV.text }}>Related Terms</h3>
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
                            </button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text-to-speech */}
                  {!screenReaderMode && (
                    <div>
                      <button
                        onClick={() => speakText(`${selectedTerm.term}. ${selectedTerm.definition}${selectedTerm.example ? `. Example: ${selectedTerm.example}` : ''}`)}
                        disabled={isSpeaking}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                        {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: GOV.borderLight }}>
                <div className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: GOV.text }}>
                    Select a Term
                  </h3>
                  <p className="text-gray-500">
                    Choose a term from the list to view its detailed definition and examples.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;
