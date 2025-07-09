import { useState } from 'react'
import { 
  Menu, 
  X, 
  CheckCircle, 
  , 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Star,
  ,
  Shield,
  Zap,
  Facebook,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import LanguageSwitcher from './LanguageSwitcher'

const LandingPage = ({ onNavigateToLogin }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const features = [
    {
      icon: CheckCircle,
      title: t.feature1Title,
      description: t.feature1Description
    },
    {
      icon: Calendar,
      title: t.feature2Title,
      description: t.feature2Description
    },
    {
      icon: MessageSquare,
      title: t.feature3Title,
      description: t.feature3Description
    },
    {
      icon: BarChart3,
      title: t.feature4Title,
      description: t.feature4Description
    }
  ]

  const steps = [
    {
      number: '1',
      title: t.step1Title,
      description: t.step1Description
    },
    {
      number: '2',
      title: t.step2Title,
      description: t.step2Description
    },
    {
      number: '3',
      title: t.step3Title,
      description: t.step3Description
    }
  ]

  const testimonials = [
    {
      quote: t.testimonial1Quote,
      author: t.testimonial1Author,
      company: t.testimonial1Company,
      rating: 5
    },
    {
      quote: t.testimonial2Quote,
      author: t.testimonial2Author,
      company: t.testimonial2Company,
      rating: 5
    },
    {
      quote: t.testimonial3Quote,
      author: t.testimonial3Author,
      company: t.testimonial3Company,
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: t.starterPlan,
      price: t.starterPrice,
      description: t.starterDescription,
      features: [t.starterFeature1, t.starterFeature2, t.starterFeature3, t.starterFeature4],
      popular: false
    },
    {
      name: t.professionalPlan,
      price: t.professionalPrice,
      description: t.professionalDescription,
      features: [t.professionalFeature1, t.professionalFeature2, t.professionalFeature3, t.professionalFeature4],
      popular: true
    },
    {
      name: t.enterprisePlan,
      price: t.enterprisePrice,
      description: t.enterpriseDescription,
      features: [t.enterpriseFeature1, t.enterpriseFeature2, t.enterpriseFeature3, t.enterpriseFeature4],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Angkor Compliance Logo" 
                  className="h-8 w-8 mr-2"
                />
                <span className={`text-xl font-bold text-gray-900 ${headerClass}`}>
                  {t.angkorCompliance}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className={`text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.home}
              </a>
              <a href="#features" className={`text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.features}
              </a>
              <a href="#pricing" className={`text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.pricing}
              </a>
              <a href="#about" className={`text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.about}
              </a>
              <a href="#contact" className={`text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.contact}
              </a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher variant="compact" />
              <button
                onClick={onNavigateToLogin}
                className={`px-4 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}
              >
                {t.signInButton}
              </button>
              <button
                onClick={onNavigateToLogin}
                className={`px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors ${textClass}`}
              >
                {t.getStarted}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#home" className={`block px-3 py-2 text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.home}
              </a>
              <a href="#features" className={`block px-3 py-2 text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.features}
              </a>
              <a href="#pricing" className={`block px-3 py-2 text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.pricing}
              </a>
              <a href="#about" className={`block px-3 py-2 text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.about}
              </a>
              <a href="#contact" className={`block px-3 py-2 text-gray-700 hover:text-amber-600 transition-colors ${textClass}`}>
                {t.contact}
              </a>
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              <div className="px-3 py-2 space-y-2">
                <button
                  onClick={onNavigateToLogin}
                  className={`block w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${textClass}`}
                >
                  {t.signInButton}
                </button>
                <button
                  onClick={onNavigateToLogin}
                  className={`block w-full px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors ${textClass}`}
                >
                  {t.getStarted}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-r from-amber-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 ${headerClass}`}>
              {t.heroHeadline}
            </h1>
            <p className={`text-xl text-gray-600 mb-8 max-w-3xl mx-auto ${textClass}`}>
              {t.heroSubtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onNavigateToLogin}
                className={`inline-flex items-center px-8 py-3 text-lg font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors ${textClass}`}
              >
                {t.getStarted}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className={`inline-flex items-center px-8 py-3 text-lg font-medium text-amber-600 bg-white border-2 border-amber-600 hover:bg-amber-50 rounded-md transition-colors ${textClass}`}>
                {t.requestDemo}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${headerClass}`}>
              {t.featuresTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${headerClass}`}>
                  {feature.title}
                </h3>
                <p className={`text-gray-600 ${textClass}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${headerClass}`}>
              {t.howItWorksTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className={`text-2xl font-bold text-white ${headerClass}`}>
                    {step.number}
                  </span>
                </div>
                <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${headerClass}`}>
                  {step.title}
                </h3>
                <p className={`text-gray-600 ${textClass}`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${headerClass}`}>
              {t.testimonialsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className={`text-gray-600 mb-4 ${textClass}`}>
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className={`font-semibold text-gray-900 ${textClass}`}>
                    {testimonial.author}
                  </p>
                  <p className={`text-sm text-gray-500 ${textClass}`}>
                    {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${headerClass}`}>
              {t.pricingTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white p-8 rounded-lg shadow-sm border-2 ${plan.popular ? 'border-amber-600' : 'border-gray-200'} relative`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className={`bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-medium ${textClass}`}>
                      {t.mostPopular}
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${headerClass}`}>
                    {plan.name}
                  </h3>
                  <div className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
                    {plan.price}
                  </div>
                  <p className={`text-gray-600 ${textClass}`}>
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-amber-600 mr-3" />
                      <span className={`text-gray-600 ${textClass}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onNavigateToLogin}
                  className={`w-full px-6 py-3 text-sm font-medium rounded-md transition-colors ${textClass} ${
                    plan.popular 
                      ? 'text-white bg-amber-600 hover:bg-amber-700' 
                      : 'text-amber-600 bg-white border-2 border-amber-600 hover:bg-amber-50'
                  }`}
                >
                  {t.choosePlan}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/logo.png" 
                  alt="Angkor Compliance Logo" 
                  className="h-8 w-8 mr-2"
                />
                <span className={`text-xl font-bold ${headerClass}`}>
                  {t.angkorCompliance}
                </span>
              </div>
              <p className={`text-gray-400 ${textClass}`}>
                {t.heroSubtext}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${headerClass}`}>
                {t.quickLinks}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#home" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.home}
                  </a>
                </li>
                <li>
                  <a href="#features" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.features}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.pricing}
                  </a>
                </li>
                <li>
                  <a href="#about" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.about}
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${headerClass}`}>
                {t.support}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.helpCenter}
                  </a>
                </li>
                <li>
                  <a href="#" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.contact}
                  </a>
                </li>
                <li>
                  <a href="#" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.privacyPolicy}
                  </a>
                </li>
                <li>
                  <a href="#" className={`text-gray-400 hover:text-white transition-colors ${textClass}`}>
                    {t.termsOfService}
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${headerClass}`}>
                {t.followUs}
              </h3>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-6 w-6" />
                </a>
              </div>
              <div className="space-y-2">
                <a href="mailto:support@angkor-compliance.com" className={`flex items-center text-gray-400 hover:text-white transition-colors ${textClass}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  support@angkor-compliance.com
                </a>
                <a href="tel:+855123456789" className={`flex items-center text-gray-400 hover:text-white transition-colors ${textClass}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  +855 12 345 6789
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className={`text-center text-gray-400 ${textClass}`}>
              © 2025 Angkor Compliance Co., Ltd. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 