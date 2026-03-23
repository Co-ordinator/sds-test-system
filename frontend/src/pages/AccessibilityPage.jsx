import React from 'react';
import { Monitor, Eye, Type, Zap, Volume2, Keyboard, Info, RefreshCw } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const AccessibilityPage = () => {
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
    { value: 'small', label: 'Small', size: '14px', description: 'Default text size for users who prefer compact text' },
    { value: 'normal', label: 'Normal', size: '16px', description: 'Standard text size recommended for most users' },
    { value: 'large', label: 'Large', size: '18px', description: 'Increased text size for better readability' },
    { value: 'extra-large', label: 'Extra Large', size: '20px', description: 'Maximum text size for users with visual impairments' },
  ];

  const resetToDefaults = () => {
    updateFontSize('normal');
    if (highContrast) toggleHighContrast();
    if (screenReaderMode) toggleScreenReaderMode();
    if (reducedMotion) toggleReducedMotion();
  };

  const SectionCard = ({ icon: Icon, title, children, description }) => (
    <div 
      className="rounded-lg border p-6"
      style={{ 
        borderColor: highContrast ? '#ffffff' : GOV.border,
        backgroundColor: highContrast ? '#000000' : '#ffffff'
      }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: highContrast ? '#ffffff' : GOV.blueLightAlt }}
        >
          <Icon className="w-6 h-6" style={{ color: highContrast ? '#000000' : GOV.blue }} />
        </div>
        <div className="flex-1">
          <h2 className={`text-2xl font-bold mb-2`} style={{ color: highContrast ? '#ffffff' : GOV.text }}>
            {title}
          </h2>
          {description && (
            <p className={`${TYPO.body}`} style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  const ToggleControl = ({ 
    icon: Icon, 
    title, 
    description, 
    isEnabled, 
    onToggle, 
    ariaLabel 
  }) => (
    <div 
      className="flex items-center justify-between p-4 border rounded-lg"
      style={{ 
        borderColor: highContrast ? '#ffffff' : GOV.borderLight,
        backgroundColor: highContrast ? '#1a1a1a' : '#fafafa'
      }}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" style={{ color: highContrast ? '#ffffff' : GOV.blue }} />
        <div>
          <h3 className="font-semibold" style={{ color: highContrast ? '#ffffff' : GOV.text }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2"
        style={{ 
          backgroundColor: isEnabled ? GOV.blue : GOV.borderLight,
          ringColor: GOV.blue
        }}
        role="switch"
        aria-checked={isEnabled}
        aria-label={ariaLabel}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Accessibility' }]}>
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
        {/* Header */}
        <div 
          className="text-center py-8"
          style={{ backgroundColor: highContrast ? '#000000' : '#ffffff' }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: highContrast ? '#ffffff' : GOV.blueLightAlt }}
          >
            <Monitor className="w-8 h-8" style={{ color: highContrast ? '#000000' : GOV.blue }} />
          </div>
          <h1 className={`text-3xl font-bold mb-4`} style={{ color: highContrast ? '#ffffff' : GOV.text }}>
            Accessibility Settings
          </h1>
          <p className={`${TYPO.body} max-w-2xl mx-auto`} style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
            Customize your viewing experience with these accessibility options. These settings are saved locally and will apply across all pages of the SDS assessment system.
          </p>
        </div>

        {/* Text Size Settings */}
        <SectionCard 
          icon={Type} 
          title="Text Size"
          description="Adjust the text size to improve readability based on your visual preferences"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">{size.label}</span>
                  <span 
                    className="px-3 py-1 rounded text-sm"
                    style={{ 
                      fontSize: size.size,
                      backgroundColor: highContrast ? '#333333' : GOV.borderLight,
                      color: highContrast ? '#ffffff' : GOV.textMuted
                    }}
                  >
                    Sample
                  </span>
                </div>
                <p 
                  id={`font-size-${size.value}-desc`}
                  className="text-sm"
                  style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}
                >
                  {size.description}
                </p>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Visual Settings */}
        <SectionCard 
          icon={Eye} 
          title="Visual Settings"
          description="Enhance visual clarity and contrast for better visibility"
        >
          <div className="space-y-4">
            <ToggleControl
              icon={Eye}
              title="High Contrast"
              description="Increases contrast between text and background colors for better visibility"
              isEnabled={highContrast}
              onToggle={toggleHighContrast}
              ariaLabel="Toggle high contrast mode"
            />
          </div>
        </SectionCard>

        {/* Interaction Settings */}
        <SectionCard 
          icon={Keyboard} 
          title="Interaction Settings"
          description="Customize how you interact with the system for better accessibility"
        >
          <div className="space-y-4">
            <ToggleControl
              icon={Volume2}
              title="Screen Reader Mode"
              description="Enhanced accessibility features for screen reader users with improved announcements and navigation"
              isEnabled={screenReaderMode}
              onToggle={toggleScreenReaderMode}
              ariaLabel="Toggle screen reader mode"
            />
            
            <ToggleControl
              icon={Zap}
              title="Reduce Motion"
              description="Minimizes animations and transitions for users who prefer reduced motion or have vestibular disorders"
              isEnabled={reducedMotion}
              onToggle={toggleReducedMotion}
              ariaLabel="Toggle reduced motion"
            />
          </div>
        </SectionCard>

        {/* Current Settings Summary */}
        <SectionCard 
          icon={Info} 
          title="Current Settings Summary"
          description="Review your current accessibility configuration"
        >
          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: highContrast ? '#1a1a1a' : GOV.blueLightAlt,
              borderColor: highContrast ? '#ffffff' : GOV.borderLight
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.blue }}>
                  Text Size:
                </span>
                <span style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                  {fontSize === 'small' && 'Small'}{fontSize === 'normal' && 'Normal'}{fontSize === 'large' && 'Large'}{fontSize === 'extra-large' && 'Extra Large'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.blue }}>
                  High Contrast:
                </span>
                <span style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                  {highContrast ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.blue }}>
                  Screen Reader Mode:
                </span>
                <span style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                  {screenReaderMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: highContrast ? '#ffffff' : GOV.blue }}>
                  Reduced Motion:
                </span>
                <span style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                  {reducedMotion ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t" style={{ borderColor: highContrast ? '#ffffff' : GOV.borderLight }}>
              <button
                type="button"
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  color: highContrast ? '#ffffff' : GOV.blue,
                  border: `1px solid ${highContrast ? '#ffffff' : GOV.border}`
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Help & Support */}
        <SectionCard 
          icon={Info} 
          title="Help & Support"
          description="Learn more about accessibility features and get assistance"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3" style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                Keyboard Shortcuts
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
                <li><kbd className="px-2 py-1 rounded" style={{ backgroundColor: highContrast ? '#333333' : GOV.borderLight }}>Tab</kbd> Navigate to next element</li>
                <li><kbd className="px-2 py-1 rounded" style={{ backgroundColor: highContrast ? '#333333' : GOV.borderLight }}>Shift + Tab</kbd> Navigate to previous element</li>
                <li><kbd className="px-2 py-1 rounded" style={{ backgroundColor: highContrast ? '#333333' : GOV.borderLight }}>Enter</kbd> Activate buttons and links</li>
                <li><kbd className="px-2 py-1 rounded" style={{ backgroundColor: highContrast ? '#333333' : GOV.borderLight }}>Escape</kbd> Close dialogs and modals</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3" style={{ color: highContrast ? '#ffffff' : GOV.text }}>
                Additional Resources
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: highContrast ? '#cccccc' : GOV.textMuted }}>
                <li>• Settings are saved locally in your browser</li>
                <li>• Changes apply immediately across all pages</li>
                <li>• You can reset to default settings at any time</li>
                <li>• These settings work alongside your browser's accessibility features</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
};

export default AccessibilityPage;
