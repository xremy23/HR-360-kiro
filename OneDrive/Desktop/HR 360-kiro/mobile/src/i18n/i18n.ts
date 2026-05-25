import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import fil from './fil.json';

const resources = {
  en: { translation: en },
  fil: { translation: fil }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Default to English
        callback('en');
      }
    } catch (error) {
      callback('en');
    }
  },
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('app_language', language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
