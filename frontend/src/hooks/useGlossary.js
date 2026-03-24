import { useState, useEffect, useCallback } from 'react';
import { glossaryService } from '../services/glossaryService';

/**
 * Hook for managing SDS glossary functionality
 * Handles user learning tracking, progressive disclosure, and smart highlighting
 * Now loads from database instead of static data
 */

const inferDifficultyFromSection = (section = 'general') => {
  if (section === 'riasec' || section === 'structure') return 'low';
  if (section === 'actions' || section === 'occupations') return 'medium';
  return 'medium';
};

const normalizeGlossaryTerm = (term) => {
  const normalizedCategory = term.category || term.section || 'general';

  return {
    ...term,
    category: normalizedCategory,
    section: term.section || normalizedCategory,
    difficulty: term.difficulty || inferDifficultyFromSection(term.section || normalizedCategory),
    related: Array.isArray(term.related) ? term.related : []
  };
};

export const useGlossary = () => {
  const [learnedTerms, setLearnedTerms] = useState(new Set());
  const [termInteractions, setTermInteractions] = useState({});
  const [highlightedTerms, setHighlightedTerms] = useState(new Set());
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load glossary terms from database
  useEffect(() => {
    const loadGlossaryTerms = async () => {
      try {
        setLoading(true);
        const terms = await glossaryService.listTerms();
        setGlossaryTerms((terms || []).map(normalizeGlossaryTerm));
      } catch (error) {
        console.warn('Failed to load glossary terms from database:', error);
        // Fallback to empty array - will show no glossary terms
        setGlossaryTerms([]);
      } finally {
        setLoading(false);
      }
    };

    loadGlossaryTerms();
  }, []);

  // Load user's learned terms from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sds-glossary-learned');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLearnedTerms(new Set(parsed.terms || []));
        setTermInteractions(parsed.interactions || {});
      }
    } catch (error) {
      console.warn('Failed to load glossary progress:', error);
    }
  }, []);

  // Save learned terms to localStorage
  const saveProgress = useCallback((terms, interactions) => {
    try {
      localStorage.setItem('sds-glossary-learned', JSON.stringify({
        terms: Array.from(terms),
        interactions: interactions || {}
      }));
    } catch (error) {
      console.warn('Failed to save glossary progress:', error);
    }
  }, []);

  // Mark term as learned
  const markTermAsLearned = useCallback((termKey) => {
    setLearnedTerms(prev => {
      const newSet = new Set(prev);
      newSet.add(termKey);
      return newSet;
    });
    
    setTermInteractions(prev => ({
      ...prev,
      [termKey]: {
        ...prev[termKey],
        seen: true,
        lastSeen: Date.now(),
        viewCount: (prev[termKey]?.viewCount || 0) + 1
      }
    }));
  }, []);

  // Record term interaction
  const recordInteraction = useCallback((termKey, interactionType = 'view') => {
    setTermInteractions(prev => ({
      ...prev,
      [termKey]: {
        ...prev[termKey],
        [interactionType]: (prev[termKey]?.[interactionType] || 0) + 1,
        lastSeen: Date.now()
      }
    }));
  }, []);

  // Check if term should be highlighted
  const shouldHighlight = useCallback((termKey) => {
    const term = glossaryTerms.find(t => t.term.toLowerCase() === termKey.toLowerCase());
    if (!term) return false;
    
    // Don't highlight if already learned
    if (learnedTerms.has(termKey)) return false;
    
    // Highlight based on interaction count
    const interactions = termInteractions[termKey] || {};
    const viewCount = interactions.view || 0;
    
    return viewCount < 3; // Show 3 times, then reduce prominence
  }, [learnedTerms, termInteractions, glossaryTerms]);

  // Get term definition (must stay pure to avoid render loops)
  const getTermDefinition = useCallback((termKey) => {
    const term = glossaryTerms.find(t => t.term.toLowerCase() === termKey.toLowerCase());
    return term || null;
  }, [glossaryTerms]);

  // Process text to add glossary markers
  const processTextForGlossary = useCallback((text) => {
    if (!text || typeof text !== 'string' || loading) {
      return { processedText: text, markedTerms: [] };
    }

    const markedTerms = [];
    let processedText = text;

    // Sort by term length (longer first) to avoid partial matches
    const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length);

    for (const term of sortedTerms) {
      if (shouldHighlight(term.term.toLowerCase())) {
        const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
        const matches = processedText.match(regex);
        
        if (matches) {
          markedTerms.push({
            termKey: term.term.toLowerCase(),
            term: term.term,
            definition: term.definition,
            section: term.section,
            example: term.example,
            id: term.id
          });
        }
      }
    }

    return { processedText, markedTerms };
  }, [glossaryTerms, shouldHighlight, loading]);

  // Get user's glossary statistics
  const getStats = useCallback(() => {
    const totalTerms = glossaryTerms.length;
    const learnedCount = learnedTerms.size;
    const interactionCount = Object.keys(termInteractions).length;
    
    return {
      totalTerms,
      learnedCount,
      interactionCount,
      progressPercentage: totalTerms > 0 ? Math.round((learnedCount / totalTerms) * 100) : 0
    };
  }, [learnedTerms, termInteractions, glossaryTerms]);

  // Reset user progress
  const resetProgress = useCallback(() => {
    setLearnedTerms(new Set());
    setTermInteractions({});
    localStorage.removeItem('sds-glossary-learned');
  }, []);

  // Save progress when learned terms or interactions change
  useEffect(() => {
    saveProgress(learnedTerms, termInteractions);
  }, [learnedTerms, termInteractions, saveProgress]);

  // Database-backed glossary utils
  const dbGlossaryUtils = {
    // Get all terms from database
    getAllTerms: () => glossaryTerms,
    
    // Backward-compatible category access used by glossary UI
    getTermsByCategory: (category) => {
      if (!category || category === 'all') return glossaryTerms;
      return glossaryTerms.filter(term => term.category === category);
    },

    // Get terms by section
    getTermsBySection: (section) => {
      return glossaryTerms.filter(term => term.section === section);
    },

    // Backward-compatible difficulty filter
    getTermsByDifficulty: (difficulty) => {
      return glossaryTerms.filter(term => term.difficulty === difficulty);
    },
    
    // Search terms
    searchTerms: (query) => {
      if (!query.trim()) return glossaryTerms;
      
      const lowerQuery = query.toLowerCase();
      return glossaryTerms.filter(term => 
        term.term.toLowerCase().includes(lowerQuery) ||
        term.definition.toLowerCase().includes(lowerQuery) ||
        (term.example && term.example.toLowerCase().includes(lowerQuery))
      );
    },
    
    // Find term by key
    findTerm: (key) => {
      if (!key) return null;
      return glossaryTerms.find(t => t.term.toLowerCase() === key.toLowerCase());
    },

    // Backward-compatible related terms accessor
    getRelatedTerms: (termKey) => {
      const term = dbGlossaryUtils.findTerm(termKey);
      if (!term || !Array.isArray(term.related) || term.related.length === 0) {
        return [];
      }
      return term.related
        .map(relatedKey => dbGlossaryUtils.findTerm(relatedKey))
        .filter(Boolean);
    },
    
    // Get terms that should be highlighted
    getHighlightableTerms: () => {
      return glossaryTerms.filter(term => shouldHighlight(term.term.toLowerCase()));
    }
  };

  return {
    // Data
    learnedTerms,
    termInteractions,
    glossaryTerms,
    loading,
    
    // Actions
    markTermAsLearned,
    recordInteraction,
    getTermDefinition,
    processTextForGlossary,
    shouldHighlight,
    
    // Utilities
    getStats,
    resetProgress,
    
    // Database-backed utils
    glossaryUtils: dbGlossaryUtils
  };
};

export default useGlossary;
