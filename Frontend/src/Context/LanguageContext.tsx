import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import i18n from "../i18n";

type Lang = "ru" | "en" | "uz";

interface LanguageContextType {
  language: Lang;
  changeLanguage: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Lang>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved) {
      i18n.changeLanguage(saved);
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang: Lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      "useLanguage must be used inside <LanguageProvider>"
    );
  }
  return context;
};
