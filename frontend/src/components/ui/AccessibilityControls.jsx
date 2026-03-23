import React from 'react';
import { Eye, EyeOff, Type, Zap, Volume2 } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { GOV, TYPO } from '../../theme/government';

const AccessibilityControls = ({ className = '' }) => {
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

  const fontSizes = [
    { value: 'small', label: 'Small', size: '14px' },
    { value: 'normal', label: 'Normal', size: '16px' },
    { value: 'large', label: 'Large', size: '18px' },
    { value: 'extra-large', label: 'Extra Large', size: '20px' },
  ];

  return (
    <div className={`p-4 bg-white border rounded-lg ${className}`} style={{ borderColor: GOV.border }}>
      <h3 className="font-semibold mb-4" style={{ color: GOV.text }}>Accessibility Options</h3>
      
      {/* Font Size Controls */}
      <div className="mb-4">
        <label className="flex items-center gap-2 mb-2" style={{ color: GOV.textMuted }}>
          <Type className="w-4 h-4" />
          <span className="text-sm font-medium">Text Size</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {fontSizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => updateFontSize(size.value)}
              className={`px-3 py-1 text-sm border rounded transition-colors ${
                fontSize === size.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              style={{
                borderColor: fontSize === size.value ? GOV.blue : GOV.border,
                backgroundColor: fontSize === size.value ? GOV.blue : '#ffffff',
                color: fontSize === size.value ? '#ffffff' : GOV.text,
              }}
              aria-label={`Set text size to ${size.label}`}
              aria-pressed={fontSize === size.value}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* High Contrast Toggle */}
      <div className="mb-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm" style={{ color: GOV.text }}>
            <Eye className="w-4 h-4" />
            High Contrast
          </span>
          <button
            type="button"
            onClick={toggleHighContrast}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              highContrast ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            style={{ backgroundColor: highContrast ? GOV.blue : GOV.borderLight }}
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
        </label>
        <p className="text-xs mt-1" style={{ color: GOV.textHint }}>
          Increases contrast for better visibility
        </p>
      </div>

      {/* Screen Reader Mode Toggle */}
      <div className="mb-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm" style={{ color: GOV.text }}>
            <Volume2 className="w-4 h-4" />
            Screen Reader Mode
          </span>
          <button
            type="button"
            onClick={toggleScreenReaderMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            style={{ backgroundColor: screenReaderMode ? GOV.blue : GOV.borderLight }}
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
        </label>
        <p className="text-xs mt-1" style={{ color: GOV.textHint }}>
          Enhanced accessibility for screen readers
        </p>
      </div>

      {/* Reduced Motion Toggle */}
      <div className="mb-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm" style={{ color: GOV.text }}>
            <Zap className="w-4 h-4" />
            Reduce Motion
          </span>
          <button
            type="button"
            onClick={toggleReducedMotion}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            style={{ backgroundColor: reducedMotion ? GOV.blue : GOV.borderLight }}
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
        </label>
        <p className="text-xs mt-1" style={{ color: GOV.textHint }}>
          Minimizes animations and transitions
        </p>
      </div>

      {/* Current Settings Summary */}
      <div className="pt-3 border-t" style={{ borderColor: GOV.borderLight }}>
        <p className="text-xs" style={{ color: GOV.textHint }}>
          Current settings: {fontSize} text size
          {highContrast && ', high contrast'}
          {screenReaderMode && ', screen reader mode'}
          {reducedMotion && ', reduced motion'}
        </p>
      </div>
    </div>
  );
};

export default AccessibilityControls;
