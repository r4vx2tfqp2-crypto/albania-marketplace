import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import sq from './sq';
import en from './en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      sq,
      en,
    },
    lng: localStorage.getItem('language') || 'sq',
    fallbackLng: 'sq',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;