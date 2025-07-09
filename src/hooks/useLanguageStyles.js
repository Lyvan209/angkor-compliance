import { useLanguage } from '../contexts/LanguageContext'

export const useLanguageStyles = () => {
  const { language } = useLanguage()
  
  const getTextClass = (isHeader = false) => {
    if (language === 'km') {
      return isHeader ? 'text-khmer-header' : 'text-khmer'
    }
    return 'text-english'
  }
  
  const getFontClass = (isHeader = false) => {
    if (language === 'km') {
      return isHeader ? 'font-khmer-header' : 'font-khmer'
    }
    return 'font-english'
  }
  
  return {
    textClass: getTextClass(),
    headerClass: getTextClass(true),
    fontClass: getFontClass(),
    headerFontClass: getFontClass(true),
    isKhmer: language === 'km',
    isEnglish: language === 'en'
  }
} 