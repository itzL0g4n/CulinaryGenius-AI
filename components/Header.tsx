import React from 'react';
import { Theme, Language } from '../types';
import { TRANSLATIONS, LANGUAGES } from '../constants';

interface Props {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Header: React.FC<Props> = ({ theme, toggleTheme, language, setLanguage }) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="w-full py-6 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative">
      <div className="text-center md:text-left animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 drop-shadow-sm">
          {t.title}
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4 glass px-4 py-2 rounded-full shadow-sm dark:bg-gray-800/30">
        {/* Language Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
          {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                language === lang
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-600 dark:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;