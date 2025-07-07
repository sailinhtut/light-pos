import { I18nextProvider } from "react-i18next";
import i18next from "i18next";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "../translations/en.json";
import translationMY from "../translations/my.json";
const resources = {
  en: {
    translation: translationEN
  },
  my: {
    translation: translationMY
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18next.init({
  interpolation: { escapeValue: false }
});

export default function LangagueContextProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
