import React, { useRef, useEffect, useCallback } from 'react';
import { X, Eye, EyeOff, Type, Zap, Volume2, Monitor, Keyboard } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { GOV, TYPO } from '../../theme/government';

const AccessibilityDialog = ({ isOpen, onClose, className = '' }) => {
  const {
    fontSize,
    highContrast,
    screenReaderMode,
    reducedMotion,
    updateFontSize,
    toggleHighContrast,
    toggleScreenReaderMode,
    toggleReducedMotion,
  } = useAccessibility();

  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const fontSizes = [
    { value: 'small', label: 'Small', size: '14px', description: 'Default text size' },
    { value: 'normal', label: 'Normal', size: '16px', description: 'Standard text size' },
    { value: 'large', label: 'Large', size: '18px', description: 'Increased text size' },
    { value: 'extra-large', label: 'Extra Large', size: '20px', description: 'Maximum text size' },
  ];

  // Handle focus management for WCAG compliance
  const trapFocus = useCallback((event) => {
    if (!dialogRef.current) return;
    
    const focusableElements = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, []);

  // Handle escape key
  const handleEscape = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Set up focus trap and keyboard listeners
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus first focusable element when dialog opens
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      firstElement?.focus();

      // Add event listeners
      document.addEventListener('keydown', trapFocus);
      document.addEventListener('keydown', handleEscape);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', trapFocus);
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, trapFocus, handleEscape]);

  // Return focus to trigger element when dialog closes
  useEffect(() => {
    if (!isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-dialog-title"
        aria-describedby="accessibility-dialog-description"
      >
        <div 
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
          style={{ backgroundColor: highContrast ? '#000000' : '#ffffff' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: highContrast ? '#ffffff' : GOV.borderLight }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: highContrast ? '#ffffff' : GOV.blueLightAlt }}
              >
                <Monitor className="w-5 h-5" style={{ color: highContrast ? '#000000' : GOV.blue }} />
              </div>
              <div>
                <h2 
                  id="accessibility-dialog-title"
                  className="text-xl font-bold"
                  style={{ color: highContrast ? '#ffffff' : GOV.text }}
                >
                  Accessibility Settings
                </h2>
                <p 
                  id="accessibility-dialog-description"
                  className="text-sm mt-1"
                  style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}
                >
                  Customize your viewing experience with these accessibility options
                </p>
              </div>
            </div>
            
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
              style={{ 
                color: highContrast ? '#ffffff' : GOV.textMuted,
                focusRingColor: GOV.blue
              }}
              aria-label="Close accessibility settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Font Size Controls */}
            <section aria-labelledby="font-size-heading">
              <h3 
                id="font-size-heading"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
                style={{ color: highContrast ? '#ffffff' : GOV.text }}
              >
                <Type className="w-5 h-5" style={{ color: highContrast ? '#ffffff' : GOV.blue }} />
                Text Size
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => updateFontSize(size.value)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      fontSize === size.value
                        ? 'ring-2 ring-offset-2'
                        : 'hover:border-opacity-70'
                    }`}
                    style={{
                      borderColor: fontSize === size.value 
                        ? GOV.blue 
                        : highContrast ? '#ffffff' : GOV.border,
                      backgroundColor: fontSize === size.value 
                        ? (highContrast ? '#ffffff' : GOV.blueLightAlt)
                        : 'transparent',
                      color: fontSize === size.value 
                        ? (highContrast ? '#000000' : GOV.blue)
                        : (highContrast ? '#ffffff' : GOV.text),
                      ringColor: GOV.blue
                    }}
                    aria-pressed={fontSize === size.value}
                    aria-describedby={`font-size-${size.value}-desc`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{size.label}</span>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          fontSize: size.size,
                          backgroundColor: highContrast ? '#333333' : GOV.borderLight,
                          color: highContrast ? '#ffffff' : GOV.textMuted
                        }}
                      >
                        Aa
                      </span>
                    </div>
                    <p 
                      id={`font-size-${size.value}-desc`}
                      className="text-xs mt-1"
                      style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}
                    >
                      {size.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Visual Settings */}
            <section aria-labelledby="visual-settings-heading">
              <h3 
                id="visual-settings-heading"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
                style={{ color: highContrast ? '#ffffff' : GOV.text }}
              >
                <Eye className="w-5 h-5" style={{ color: highContrast ? '#ffffff' : GOV.blue }} />
                Visual Settings
              </h3>
              
              <div className="space-y-4">
                {/* High Contrast Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                        High Contrast
                      </span>
                    </label>
                    <p className="text-sm mt-1" style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
                      Increases contrast for better visibility
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleHighContrast}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: highContrast ? GOV.blue : GOV.borderLight,
                      ringColor: GOV.blue
                    }}
                    role="switch"
                    aria-checked={highContrast}
                    aria-label="Toggle high contrast mode"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Interaction Settings */}
            <section aria-labelledby="interaction-settings-heading">
              <h3 
                id="interaction-settings-heading"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
                style={{ color: highContrast ? '#ffffff' : GOV.text }}
              >
                <Keyboard className="w-5 h-5" style={{ color: highContrast ? '#ffffff' : GOV.blue }} />
                Interaction Settings
              </h3>
              
              <div className="space-y-4">
                {/* Screen Reader Mode Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Volume2 className="w-4 h-4" style={{ color: highContrast ? '#ffffff' : GOV.blue }} />
                      <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                        Screen Reader Mode
                      </span>
                    </label>
                    <p className="text-sm mt-1" style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
                      Enhanced accessibility for screen readers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleScreenReaderMode}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: screenReaderMode ? GOV.blue : GOV.borderLight,
                      ringColor: GOV.blue
                    }}
                    role="switch"
                    aria-checked={screenReaderMode}
                    aria-label="Toggle screen reader mode"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Zap className="w-4 h-4" style={{ color: highContrast ? '#ffffff' : GOV.blue }} />
                      <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                        Reduce Motion
                      </span>
                    </label>
                    <p className="text-sm mt-1" style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
                      Minimizes animations and transitions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleReducedMotion}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: reducedMotion ? GOV.blue : GOV.borderLight,
                      ringColor: GOV.blue
                    }}
                    role="switch"
                    aria-checked={reducedMotion}
                    aria-label="Toggle reduced motion"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Current Settings Summary */}
            <section aria-labelledby="summary-heading">
              <h3 
                id="summary-heading"
                className="text-lg font-semibold mb-3"
                style={{ color: highContrast ? '#ffffff' : GOV.text }}
              >
                Current Settings
              </h3>
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: highContrast ? '#1a1a1a' : GOV.blueLightAlt,
                  borderColor: highContrast ? '#ffffff' : GOV.borderLight
                }}
              >
                <p className="text-sm" style={{ color: highContrast ? '#ffffff' : GOV.blue }}>
                  {fontSize === 'small' && 'Small'}{fontSize === 'normal' && 'Normal'}{fontSize === 'large' && 'Large'}{fontSize === 'extra-large' && 'Extra Large'} text size
                  {highContrast && ', high contrast'}
                  {screenReaderMode && ', screen reader mode'}
                  {reducedMotion && ', reduced motion'}
                  {fontSize === 'normal' && !highContrast && !screenReaderMode && !reducedMotion && 'Default settings applied'}
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div 
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: highContrast ? '#ffffff' : GOV.borderLight }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: GOV.blue,
                color: '#ffffff',
                ringColor: GOV.blue
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessibilityDialog;
