import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState('normal'); // small, normal, large, extra-large
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        setFontSize(prefs.fontSize || 'normal');
        setHighContrast(prefs.highContrast || false);
        setScreenReaderMode(prefs.screenReaderMode || false);
        setReducedMotion(prefs.reducedMotion || false);
      }
    } catch (_) {
      // Ignore localStorage errors
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify({
        fontSize,
        highContrast,
        screenReaderMode,
        reducedMotion,
      }));
    } catch (_) {
      // Ignore localStorage errors
    }
  }, [fontSize, highContrast, screenReaderMode, reducedMotion]);

  const updateFontSize = (size) => {
    const validSizes = ['small', 'normal', 'large', 'extra-large'];
    if (validSizes.includes(size)) {
      setFontSize(size);
    }
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(prev => !prev);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
  };

  // Generate CSS classes based on settings
  const getAccessibilityClasses = () => {
    const classes = [];
    
    if (fontSize !== 'normal') {
      classes.push(`font-size-${fontSize}`);
    }
    
    if (highContrast) {
      classes.push('high-contrast');
    }
    
    if (screenReaderMode) {
      classes.push('screen-reader-mode');
    }
    
    if (reducedMotion) {
      classes.push('reduced-motion');
    }
    
    return classes.join(' ');
  };

  // Get ARIA labels for screen readers
  const getAriaLabel = (text, context = '') => {
    if (!screenReaderMode) return text;
    
    // Add context for better screen reader experience
    const prefix = context ? `${context}: ` : '';
    return `${prefix}${text}`;
  };

  const value = {
    fontSize,
    highContrast,
    screenReaderMode,
    reducedMotion,
    updateFontSize,
    toggleHighContrast,
    toggleScreenReaderMode,
    toggleReducedMotion,
    getAccessibilityClasses,
    getAriaLabel,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div className={getAccessibilityClasses()}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext;
