import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import { Globe } from 'lucide-react'

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { language, switchLanguage } = useLanguage()
  const t = useTranslations(language)
  const { textClass } = useLanguageStyles()

  const handleLanguageChange = () => {
    switchLanguage(language === 'en' ? 'km' : 'en')
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleLanguageChange}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${textClass}`}
        title={t.language}
      >
        <Globe className="h-4 w-4" />
        <span>{language === 'en' ? t.english : t.khmer}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
      <Globe className="h-4 w-4 text-gray-600" />
      <span className={`text-sm font-medium text-gray-700 ${textClass}`}>{t.language}:</span>
      <div className="flex rounded-md overflow-hidden border border-gray-300">
        <button
          onClick={() => switchLanguage('en')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${textClass} ${
            language === 'en'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t.english}
        </button>
        <button
          onClick={() => switchLanguage('km')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${textClass} ${
            language === 'km'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t.khmer}
        </button>
      </div>
    </div>
  )
}

export default LanguageSwitcher 