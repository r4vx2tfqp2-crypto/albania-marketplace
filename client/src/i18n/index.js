import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import sq from './sq';
import en from './en';

const savedLang = typeof window !== 'undefined' 
  ? (localStorage.getItem('language') || 'sq') 
  : 'sq';

i18n
  .use(initReactI18next)
  .init({
    resources: { sq, en },
    lng: savedLang,
    fallbackLng: 'sq',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;