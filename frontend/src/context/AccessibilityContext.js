import React, { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AccessibilityContext = createContext();
const STORAGE_KEY_PREFIX = 'accessibility-preferences-v2';
const LEGACY_STORAGE_KEY = 'accessibility-preferences';
const VALID_FONT_SIZES = ['small', 'normal', 'large', 'extra-large'];
const FONT_SIZE_IN_PIXELS = {
  small: 14,
  normal: 16,
  large: 18,
  'extra-large': 20,
};

const normalizePreferences = (raw) => {
  const source = raw && typeof raw === 'object'
    ? (raw.uiPreferences && typeof raw.uiPreferences === 'object' ? raw.uiPreferences : raw)
    : {};
  const fontSize = VALID_FONT_SIZES.includes(source.fontSize) ? source.fontSize : 'normal';
  return {
    fontSize,
    highContrast: Boolean(source.highContrast),
    screenReaderMode: Boolean(source.screenReaderMode),
    reducedMotion: Boolean(source.reducedMotion),
  };
};

const getStorageKeyForScope = (scopeKey) => `${STORAGE_KEY_PREFIX}:${scopeKey}`;

const getStoredPreferences = (scopeKey) => {
  try {
    const saved = localStorage.getItem(getStorageKeyForScope(scopeKey));
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return normalizePreferences(parsed);
  } catch (_) {
    return null;
  }
};

const getLegacyStoredPreferences = () => {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return normalizePreferences(parsed);
  } catch (_) {
    return null;
  }
};

const hasPersistedAccessibilityPreferences = (rawNeeds) => {
  if (!rawNeeds || typeof rawNeeds !== 'object') return false;
  return ['fontSize', 'highContrast', 'screenReaderMode', 'reducedMotion']
    .some((key) => rawNeeds[key] !== undefined);
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(() => normalizePreferences({}));
  const [liveRegionState, setLiveRegionState] = useState({
    polite: '',
    assertive: '',
    politeTick: 0,
    assertiveTick: 0,
  });
  const [storageHydrated, setStorageHydrated] = useState(false);
  const suppressNextProfileSaveRef = useRef(false);
  const persistTimeoutRef = useRef(null);
  const activeScopeKeyRef = useRef('anonymous');
  const lastServerFingerprintByScopeRef = useRef({});
  const liveRegionTimerRefs = useRef({
    polite: null,
    assertive: null,
  });
  const speechResetTimerRef = useRef(null);

  const fontSize = preferences.fontSize;
  const highContrast = preferences.highContrast;
  const screenReaderMode = preferences.screenReaderMode;
  const reducedMotion = preferences.reducedMotion;
  const scopeKey = isAuthenticated && user?.id ? `user:${user.id}` : 'anonymous';

  const speakAnnouncement = useCallback((message) => {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;

    const text = String(message || '').trim();
    if (!text) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      // Keep voice characteristics aligned with glossary read-aloud.
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      // Ignore speech synthesis runtime issues and preserve live region behavior.
    }
  }, []);

  const announce = useCallback((message, options = {}) => {
    const text = String(message || '').trim();
    if (!text) return;

    const priority = options.priority === 'assertive' ? 'assertive' : 'polite';
    const clearAfterMs = Number.isFinite(options.clearAfterMs) && options.clearAfterMs > 0
      ? options.clearAfterMs
      : 1600;

    // Clear first, then publish so repeated messages are still announced.
    setLiveRegionState((prev) => ({ ...prev, [priority]: '' }));
    const publish = () => {
      setLiveRegionState((prev) => ({
        ...prev,
        [priority]: text,
        [`${priority}Tick`]: prev[`${priority}Tick`] + 1,
      }));
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(publish);
    } else {
      setTimeout(publish, 0);
    }

    if (liveRegionTimerRefs.current[priority]) {
      clearTimeout(liveRegionTimerRefs.current[priority]);
    }

    liveRegionTimerRefs.current[priority] = setTimeout(() => {
      setLiveRegionState((prev) => ({ ...prev, [priority]: '' }));
      liveRegionTimerRefs.current[priority] = null;
    }, clearAfterMs);
    const shouldSpeak = options.speak !== false && (options.forceSpeak || screenReaderMode);
    if (shouldSpeak) {
      if (speechResetTimerRef.current) {
        clearTimeout(speechResetTimerRef.current);
      }
      speechResetTimerRef.current = setTimeout(() => {
        speakAnnouncement(text);
        speechResetTimerRef.current = null;
      }, 50);
    }
  }, [screenReaderMode, speakAnnouncement]);

  // Mark local storage as ready after mount.
  useEffect(() => {
    setStorageHydrated(true);
  }, []);

  // Apply font size globally so rem-based text scales across all screens.
  useEffect(() => {
    const root = document.documentElement;
    const previousFontSize = root.style.fontSize;
    root.style.fontSize = `${FONT_SIZE_IN_PIXELS[fontSize] || FONT_SIZE_IN_PIXELS.normal}px`;
    return () => {
      root.style.fontSize = previousFontSize;
    };
  }, [fontSize]);

  // Hydrate preferences per account scope:
  // 1) Server profile settings (if present)
  // 2) Scoped local storage for current user/anonymous scope
  // 3) Legacy local storage for anonymous scope only
  // 4) Defaults
  useEffect(() => {
    if (!storageHydrated) return;

    const shouldHydrateFromServer = Boolean(
      isAuthenticated &&
      user?.id &&
      hasPersistedAccessibilityPreferences(user?.accessibilityNeeds)
    );

    const serverPrefs = shouldHydrateFromServer
      ? normalizePreferences(user.accessibilityNeeds)
      : null;
    const serverFingerprint = serverPrefs
      ? `${serverPrefs.fontSize}|${serverPrefs.highContrast}|${serverPrefs.screenReaderMode}|${serverPrefs.reducedMotion}`
      : '';

    const scopeChanged = activeScopeKeyRef.current !== scopeKey;
    const previousFingerprint = lastServerFingerprintByScopeRef.current[scopeKey] || '';
    const serverChanged = Boolean(serverFingerprint && serverFingerprint !== previousFingerprint);

    if (!scopeChanged && !serverChanged) return;

    const scopedStored = getStoredPreferences(scopeKey);
    const legacyStored = scopeKey === 'anonymous' ? getLegacyStoredPreferences() : null;
    const nextPreferences = serverPrefs || scopedStored || legacyStored || normalizePreferences({});

    suppressNextProfileSaveRef.current = true;
    setPreferences(nextPreferences);
    activeScopeKeyRef.current = scopeKey;

    if (serverFingerprint) {
      lastServerFingerprintByScopeRef.current[scopeKey] = serverFingerprint;
    }
  }, [isAuthenticated, scopeKey, storageHydrated, user]);

  // Save preferences to scoped localStorage whenever they change.
  useEffect(() => {
    if (!storageHydrated) return;
    try {
      localStorage.setItem(
        getStorageKeyForScope(activeScopeKeyRef.current || scopeKey),
        JSON.stringify(preferences)
      );
    } catch (_) {
      // Ignore localStorage errors
    }
  }, [preferences, scopeKey, storageHydrated]);

  // Persist accessibility preferences to authenticated profile (cross-device consistency).
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !storageHydrated) return;

    if (suppressNextProfileSaveRef.current) {
      suppressNextProfileSaveRef.current = false;
      return;
    }

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(async () => {
      const existingNeeds = (user.accessibilityNeeds && typeof user.accessibilityNeeds === 'object')
        ? user.accessibilityNeeds
        : {};
      const serverPrefs = normalizePreferences(existingNeeds);
      const serverMatchesLocal =
        serverPrefs.fontSize === preferences.fontSize &&
        serverPrefs.highContrast === preferences.highContrast &&
        serverPrefs.screenReaderMode === preferences.screenReaderMode &&
        serverPrefs.reducedMotion === preferences.reducedMotion;

      const computedRequiresAccessibility = Boolean(
        user.requiresAccessibility ||
        preferences.highContrast ||
        preferences.screenReaderMode ||
        preferences.reducedMotion ||
        preferences.fontSize !== 'normal'
      );

      if (serverMatchesLocal && Boolean(user.requiresAccessibility) === computedRequiresAccessibility) {
        return;
      }

      try {
        await api.patch('/api/v1/auth/me', {
          requiresAccessibility: computedRequiresAccessibility,
          accessibilityNeeds: {
            ...existingNeeds,
            ...preferences,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (_) {
        // Keep local settings even if profile sync fails.
      }
    }, 350);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [isAuthenticated, preferences, storageHydrated, user]);

  useEffect(() => () => {
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }
    if (liveRegionTimerRefs.current.polite) {
      clearTimeout(liveRegionTimerRefs.current.polite);
    }
    if (liveRegionTimerRefs.current.assertive) {
      clearTimeout(liveRegionTimerRefs.current.assertive);
    }
    if (speechResetTimerRef.current) {
      clearTimeout(speechResetTimerRef.current);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const updateFontSize = (size) => {
    if (VALID_FONT_SIZES.includes(size)) {
      setPreferences((prev) => ({ ...prev, fontSize: size }));
      if (screenReaderMode) {
        announce(`Text size set to ${size.replace('-', ' ')}`);
      }
    }
  };

  const toggleHighContrast = () => {
    setPreferences((prev) => {
      const nextHighContrast = !prev.highContrast;
      if (prev.screenReaderMode) {
        announce(nextHighContrast ? 'High contrast enabled' : 'High contrast disabled');
      }
      return { ...prev, highContrast: nextHighContrast };
    });
  };

  const toggleScreenReaderMode = () => {
    setPreferences((prev) => {
      const nextScreenReaderMode = !prev.screenReaderMode;
      if (nextScreenReaderMode) {
        setTimeout(() => {
          announce('Screen reader mode enabled. Accessibility announcements are active.', { priority: 'assertive', forceSpeak: true });
        }, 0);
      } else {
        announce('Screen reader mode disabled.', { priority: 'assertive', forceSpeak: true });
      }
      return { ...prev, screenReaderMode: nextScreenReaderMode };
    });
  };

  const toggleReducedMotion = () => {
    setPreferences((prev) => {
      const nextReducedMotion = !prev.reducedMotion;
      if (prev.screenReaderMode) {
        announce(nextReducedMotion ? 'Reduced motion enabled' : 'Reduced motion disabled');
      }
      return { ...prev, reducedMotion: nextReducedMotion };
    });
  };

  // Generate CSS classes based on settings
  const getAccessibilityClasses = useMemo(() => {
    const classes = [];
    
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
  }, [highContrast, reducedMotion, screenReaderMode]);

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
    getAccessibilityClasses: () => getAccessibilityClasses,
    getAriaLabel,
    announce,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div className={getAccessibilityClasses}>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveRegionState.politeTick > 0 ? liveRegionState.polite : ''}
        </div>
        <div className="sr-only" aria-live="assertive" aria-atomic="true" role="alert">
          {liveRegionState.assertiveTick > 0 ? liveRegionState.assertive : ''}
        </div>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext;
