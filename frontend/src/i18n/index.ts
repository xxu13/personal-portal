import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // Load translations from /public/locales
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Supported languages
    supportedLngs: ['zh', 'en'],
    
    // Fallback language
    fallbackLng: 'zh',
    
    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // LocalStorage key
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Backend options for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // React options
    react: {
      // Wait for translations to load
      useSuspense: true,
    },
    
    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
  });

export default i18n;

// Helper function to change language
export const changeLanguage = (lng: 'zh' | 'en') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
};

// Get current language
export const getCurrentLanguage = (): 'zh' | 'en' => {
  return (i18n.language?.substring(0, 2) as 'zh' | 'en') || 'zh';
};

