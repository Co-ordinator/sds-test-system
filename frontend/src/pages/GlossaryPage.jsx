import React, { useState, useMemo, useEffect } from 'react';
import { Search, Volume2, X, BookOpen, GraduationCap, Briefcase, Users } from 'lucide-react';
import { GOV } from '../theme/government';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { useGlossary } from '../hooks/useGlossary';
import AppShell from '../components/layout/AppShell';

/**
 * Full-page glossary with search, filtering, and detailed term views
 * Features: category filtering, search, text-to-speech, learning tracking
 */
const SECTION_META = {
  riasec: { label: 'RIASEC Types', icon: Users },
  structure: { label: 'Assessment Terms', icon: GraduationCap },
  actions: { label: 'Action Words', icon: Briefcase },
  activities: { label: 'Activities', icon: BookOpen },
  competencies: { label: 'Competencies', icon: GraduationCap },
  occupations: { label: 'Occupations', icon: Briefcase },
  self_estimates: { label: 'Self Estimates', icon: Users },
  general: { label: 'General', icon: BookOpen }
};

const SECTION_ORDER = [
  'riasec',
  'structure',
  'actions',
  'activities',
  'competencies',
  'occupations',
  'self_estimates',
  'general'
];

const normalizeSection = (section) => String(section || 'general').trim().toLowerCase();
const getSectionMeta = (section) => SECTION_META[normalizeSection(section)] || SECTION_META.general;
const getSearchText = (term) => {
  const sectionMeta = getSectionMeta(term.section);
  return [
    term.term,
    term.definition,
    term.example,
    term.section,
    sectionMeta.label
  ].filter(Boolean).join(' ').toLowerCase();
};

const GlossaryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { getAriaLabel, highContrast } = useAccessibility();
  const { user } = useAuth();
  const { glossaryUtils, markTermAsLearned, glossaryTerms, loading, handleTermView, getStats } = useGlossary();

  const role = user?.role || 'Test Taker';
  const backTo = role === 'System Administrator'
    ? '/admin/dashboard'
    : role === 'Test Administrator'
      ? '/test-administrator'
      : '/dashboard';

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    let terms = [...glossaryTerms]; // Clone to avoid mutation

    // Category filter
    if (selectedCategory !== 'all') {
      terms = terms.filter(term => normalizeSection(term.section) === selectedCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      terms = terms.filter(term => getSearchText(term).includes(query));
    }
    
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedCategory, glossaryTerms]);

  // Memoize categories to prevent re-renders
  const categories = useMemo(() => {
    const counts = glossaryTerms.reduce((acc, term) => {
      const section = normalizeSection(term.section);
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    return [
      { value: 'all', label: 'All Terms', count: glossaryTerms.length, icon: BookOpen },
      ...SECTION_ORDER
        .filter(section => counts[section] > 0)
        .map(section => ({
          value: section,
          label: SECTION_META[section].label,
          count: counts[section],
          icon: SECTION_META[section].icon
        }))
    ];
  }, [glossaryTerms]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some(category => category.value === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  // Speech stays non-blocking: pressing the button again stops it, and
  // navigating away cancels any active utterance.
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

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
    <AppShell breadcrumbs={[{ label: 'Dashboard', to: backTo }, { label: 'Glossary' }]}>
    <div style={{ backgroundColor: highContrast ? '#000000' : GOV.background }}>
      {/* Page title */}
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
                aria-label={getAriaLabel('Search glossary terms', 'Glossary search')}
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
                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Loading glossary terms...</p>
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No terms found matching your search.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: GOV.borderLight }}>
                    {filteredTerms.map(term => {
                      const sectionMeta = getSectionMeta(term.section);
                      const isSelected = selectedTerm?.id
                        ? selectedTerm.id === term.id
                        : selectedTerm?.term === term.term && selectedTerm?.section === term.section;

                      return (
                        <button
                          key={term.id || `${term.section}-${term.term}`}
                          onClick={() => handleTermSelect(term)}
                          className={`
                            w-full text-left p-4 hover:bg-gray-50 transition-colors
                            ${isSelected ? 'bg-blue-50' : ''}
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
                                    backgroundColor: '#eff6ff',
                                    color: GOV.primary
                                  }}
                                >
                                  {sectionMeta.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
                            backgroundColor: '#eff6ff',
                            color: GOV.primary
                          }}
                        >
                          {getSectionMeta(selectedTerm.section).label}
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
                  <div>
                    <button
                      onClick={() => speakText(`${selectedTerm.term}. ${selectedTerm.definition}${selectedTerm.example ? `. Example: ${selectedTerm.example}` : ''}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label={isSpeaking ? 'Stop reading glossary term aloud' : 'Read selected glossary term aloud'}
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                    </button>
                  </div>
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
    </AppShell>
  );
};

export default GlossaryPage;
