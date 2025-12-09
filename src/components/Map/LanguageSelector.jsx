import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

function LanguageSelector({ currentLanguage, onLanguageChange, isMobile }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (languageCode) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3 py-2 bg-heritage-50 dark:bg-neutral-700/50 rounded-lg hover:bg-heritage-100 dark:hover:bg-neutral-700 transition-all border border-heritage-200 dark:border-neutral-600 w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedLanguage.flag}</span>
          <span className="font-medium text-heritage-900 dark:text-heritage-100 text-sm">
            {selectedLanguage.name}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-heritage-700 dark:text-heritage-300 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute top-full mt-2 ${isMobile ? 'left-0 right-0' : 'right-0'} bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50 ${isMobile ? 'w-full' : 'min-w-[220px]'}`}>
            <div className="py-2">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleSelect(language.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-heritage-50 dark:hover:bg-neutral-700/50 transition-colors ${
                    language.code === currentLanguage ? 'bg-heritage-100 dark:bg-heritage-900/30' : ''
                  }`}
                >
                  <span className="text-xl">{language.flag}</span>
                  <span className="flex-1 text-left font-medium text-neutral-900 dark:text-white text-sm">
                    {language.name}
                  </span>
                  {language.code === currentLanguage && (
                    <Check className="w-4 h-4 text-heritage-700 dark:text-heritage-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
