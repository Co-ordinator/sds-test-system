import React, { useMemo } from 'react';
import InlineGlossaryTooltip from './InlineGlossaryTooltip';
import { useGlossary } from '../../hooks/useGlossary';

/**
 * Smart text highlighting component
 * Automatically identifies and highlights glossary terms in text
 * Features: progressive disclosure, context-aware highlighting, zero-friction interaction
 */
const SmartTextHighlighter = ({ 
  text, 
  className = '',
  maxHighlights = 5,
  showProgress = false,
  onTermHighlighted = null 
}) => {
  const { shouldHighlight, processTextForGlossary, glossaryUtils } = useGlossary();

  // Process text to identify highlightable terms
  const { processedText, markedTerms } = useMemo(() => {
    if (!text || typeof text !== 'string') {
      return { processedText: text, markedTerms: [] };
    }

    const result = processTextForGlossary(text);
    
    // Limit number of highlights per text to avoid overwhelming user
    const limitedTerms = result.markedTerms
      .filter(term => shouldHighlight(term.termKey))
      .slice(0, maxHighlights);

    return {
      processedText: text,
      markedTerms: limitedTerms
    };
  }, [text, processTextForGlossary, shouldHighlight, maxHighlights]);

  // If no terms to highlight, return plain text
  if (markedTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Render text with highlighted terms
  const renderHighlightedText = () => {
    let result = text;
    const replacements = [];

    // Sort by term length (longer first) to avoid partial matches
    const sortedTerms = [...markedTerms].sort((a, b) => b.term.length - a.term.length);

    for (const termInfo of sortedTerms) {
      const regex = new RegExp(`\\b${termInfo.term}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(result)) !== null) {
        const before = result.substring(0, match.index);
        const after = result.substring(match.index + match[0].length);
        
        // Check if this match is already within a replacement
        const isAlreadyReplaced = replacements.some(rep => 
          match.index >= rep.start && match.index < rep.end
        );
        
        if (!isAlreadyReplaced) {
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            termInfo,
            originalText: match[0]
          });
        }
      }
    }

    // Sort replacements by position
    replacements.sort((a, b) => a.start - b.start);

    // Build the final result with tooltips
    let finalResult = [];
    let lastIndex = 0;

    for (const replacement of replacements) {
      // Add text before the replacement
      if (replacement.start > lastIndex) {
        finalResult.push(
          <span key={`text-${lastIndex}`}>
            {result.substring(lastIndex, replacement.start)}
          </span>
        );
      }

      // Add the highlighted term with tooltip
      finalResult.push(
        <InlineGlossaryTooltip
          key={`term-${replacement.start}-${replacement.termInfo.term}`}
          term={replacement.termInfo.term}
          className="inline"
          onTermLearned={(termKey) => {
            onTermHighlighted?.(termKey, replacement.termInfo);
          }}
        >
          {replacement.originalText}
        </InlineGlossaryTooltip>
      );

      lastIndex = replacement.end;
    }

    // Add remaining text
    if (lastIndex < result.length) {
      finalResult.push(
        <span key="text-final">
          {result.substring(lastIndex)}
        </span>
      );
    }

    return finalResult;
  };

  return (
    <span className={className}>
      {renderHighlightedText()}
      {showProgress && markedTerms.length > 0 && (
        <span className="ml-2 text-xs text-gray-500">
          {markedTerms.length} term{markedTerms.length > 1 ? 's' : ''} highlighted
        </span>
      )}
    </span>
  );
};

/**
 * Higher-order component for wrapping question text with smart highlighting
 */
export const QuestionTextWithGlossary = ({ 
  questionText, 
  showRiasecBadge = true,
  riasecType = null,
  className = '' 
}) => {
  return (
    <div className={className}>
      <SmartTextHighlighter 
        text={questionText}
        className="text-2xl font-bold leading-relaxed"
        maxHighlights={3} // Limit highlights in questions to avoid distraction
      />
      
      {showRiasecBadge && riasecType && (
        <div className="mt-2">
          <SmartTextHighlighter 
            text={riasecType}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            maxHighlights={1}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Component for highlighting terms in descriptions and instructions
 */
export const DescriptionWithGlossary = ({ 
  text, 
  className = '',
  maxHighlights = 2 
}) => {
  return (
    <SmartTextHighlighter 
      text={text}
      className={`text-sm ${className}`}
      maxHighlights={maxHighlights}
    />
  );
};

export default SmartTextHighlighter;
