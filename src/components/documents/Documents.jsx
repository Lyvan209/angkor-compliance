import { useState, useEffect } from 'react'
import { FileText, Upload, Filter, BarChart3 } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import DocumentManager from './DocumentManager'
import { getDocumentStatistics } from '../../lib/supabase-enhanced'

const Documents = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [activeView, setActiveView] = useState('manager')
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [organizationId])

  const loadStatistics = async () => {
    try {
      const result = await getDocumentStatistics(organizationId)
      if (result.success) {
        setStatistics(result.data)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
            Document Management
          </h1>
          <p className={`text-gray-600 mt-1 ${textClass}`}>
            Centralized document storage and compliance management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className={`text-blue-900 font-medium ${textClass}`}>
              {statistics.total || 0} Documents
            </span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
            <Upload className="h-5 w-5 text-green-600" />
            <span className={`text-green-900 font-medium ${textClass}`}>
              {formatFileSize(statistics.total_size || 0)} Storage
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 px-6">
      <nav className="flex space-x-8">
        {[
          { id: 'manager', label: 'Document Manager', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'categories', label: 'Categories', icon: Filter }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } ${textClass}`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'manager':
        return <DocumentManager user={user} organizationId={organizationId} />
      
      case 'analytics':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
                Document Analytics
              </h3>
              <p className={`text-gray-500 ${textClass}`}>
                Analytics and reporting features coming soon
              </p>
            </div>
          </div>
        )
      
      case 'categories':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
                Category Management
              </h3>
              <p className={`text-gray-500 ${textClass}`}>
                Advanced category management features coming soon
              </p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {renderNavigation()}
      {renderContent()}
    </div>
  )
}

export default Documents 