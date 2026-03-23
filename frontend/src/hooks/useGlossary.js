import { useState, useEffect, useCallback } from 'react';
import { SDS_GLOSSARY, glossaryUtils } from '../data/sdsGlossary';

/**
 * Hook for managing SDS glossary functionality
 * Handles user learning tracking, progressive disclosure, and smart highlighting
 */

export const useGlossary = () => {
  const [learnedTerms, setLearnedTerms] = useState(new Set());
  const [termInteractions, setTermInteractions] = useState({});
  const [highlightedTerms, setHighlightedTerms] = useState(new Set());

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
    const term = glossaryUtils.findTerm(termKey);
    if (!term) return false;
    
    // Don't highlight if already learned
    if (learnedTerms.has(termKey)) return false;
    
    // Highlight based on difficulty and interaction count
    const interactions = termInteractions[termKey] || {};
    const viewCount = interactions.view || 0;
    
    // Always highlight medium/high difficulty terms initially
    if (term.difficulty === 'high' || term.difficulty === 'medium') {
      return viewCount < 3; // Show 3 times, then reduce prominence
    }
    
    // Show low difficulty terms less frequently
    return viewCount < 1;
  }, [learnedTerms, termInteractions]);

  // Get term definition with learning tracking
  const getTermDefinition = useCallback((termKey) => {
    const term = glossaryUtils.findTerm(termKey);
    if (!term) return null;

    // Record view interaction
    recordInteraction(termKey, 'view');

    // Auto-mark as learned after multiple views
    const interactions = termInteractions[termKey] || {};
    if (interactions.view >= 3) {
      markTermAsLearned(termKey);
    }

    return term;
  }, [recordInteraction, markTermAsLearned, termInteractions]);

  // Process text to add glossary markers
  const processTextForGlossary = useCallback((text) => {
    if (!text || typeof text !== 'string') return { processedText: text, markedTerms: [] };

    const markedTerms = [];
    let processedText = text;

    // Get all terms that might appear in text
    const allTerms = glossaryUtils.getAllTerms();
    
    // Sort by term length (longer terms first) to avoid partial matches
    const sortedTerms = allTerms.sort((a, b) => b.term.length - a.term.length);

    for (const term of sortedTerms) {
      if (shouldHighlight(term.term.toLowerCase())) {
        const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
        const matches = processedText.match(regex);
        
        if (matches) {
          markedTerms.push({
            termKey: term.term.toLowerCase(),
            term: term.term,
            definition: term.definition,
            category: term.category,
            difficulty: term.difficulty
          });
        }
      }
    }

    return { processedText, markedTerms };
  }, [shouldHighlight]);

  // Get user's glossary statistics
  const getStats = useCallback(() => {
    const totalTerms = glossaryUtils.getAllTerms().length;
    const learnedCount = learnedTerms.size;
    const interactionCount = Object.keys(termInteractions).length;
    
    return {
      totalTerms,
      learnedCount,
      interactionCount,
      progressPercentage: totalTerms > 0 ? Math.round((learnedCount / totalTerms) * 100) : 0
    };
  }, [learnedTerms, termInteractions]);

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

  return {
    // Data
    learnedTerms,
    termInteractions,
    
    // Actions
    markTermAsLearned,
    recordInteraction,
    getTermDefinition,
    processTextForGlossary,
    shouldHighlight,
    
    // Utilities
    getStats,
    resetProgress,
    
    // Access to utils
    glossaryUtils
  };
};

export default useGlossary;
