import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Edit, 
  Share2, 
  Trash2,
  Eye,
  EyeOff,
  Clock,
  User,
  Tag,
  Globe,
  Lock,
  Star,
  StarOff,
  MessageSquare,
  History,
  Copy,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getDocumentById,
  getDocumentVersions,
  updateDocumentMetadata,
  approveDocument,
  deleteDocument
} from '../../lib/supabase-enhanced'

const DocumentViewer = ({ documentId, user, onClose, onEdit, onDelete }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [document, setDocument] = useState(null)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [starred, setStarred] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (documentId) {
      loadDocumentData()
    }
  }, [documentId])

  const loadDocumentData = async () => {
    setLoading(true)
    try {
      const [docResult, versionsResult] = await Promise.all([
        getDocumentById(documentId),
        getDocumentVersions(documentId)
      ])

      if (docResult.success) {
        setDocument(docResult.data)
      } else {
        setError('Failed to load document details')
      }

      if (versionsResult.success) {
        setVersions(versionsResult.data)
      }
    } catch (err) {
      setError('Failed to load document data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!document) return

    try {
      const result = await approveDocument(documentId, user.id)
      
      if (result.success) {
        setDocument(prev => ({ ...prev, approved_by: user, approved_at: new Date() }))
        setSuccess('Document approved successfully')
      } else {
        setError('Failed to approve document')
      }
    } catch (err) {
      setError('Failed to approve document')
    }
  }

  const handleDownload = () => {
    if (document?.file_url) {
      const link = document.createElement('a')
      link.href = document.file_url
      link.download = document.title
      link.click()
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/documents/${documentId}`
    navigator.clipboard.writeText(link)
    setSuccess('Link copied to clipboard')
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileTypeIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('image')) return '🖼️'
    if (fileType?.includes('video')) return '🎥'
    if (fileType?.includes('audio')) return '🎵'
    if (fileType?.includes('text')) return '📝'
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '📊'
    if (fileType?.includes('presentation') || fileType?.includes('powerpoint')) return '📈'
    return '📄'
  }

  const canEdit = () => {
    if (!document || !user) return false
    return document.uploaded_by.id === user.id || user.role === 'admin' || user.role === 'super_admin'
  }

  const canApprove = () => {
    if (!document || !user) return false
    return !document.approved_by && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'manager')
  }

  const canDelete = () => {
    if (!document || !user) return false
    return document.uploaded_by.id === user.id || user.role === 'admin' || user.role === 'super_admin'
  }

  const renderPreview = () => {
    if (!document) return null

    const fileType = document.file_type?.toLowerCase()

    if (fileType?.includes('image')) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <img 
            src={document.file_url} 
            alt={document.title}
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
          />
        </div>
      )
    }

    if (fileType?.includes('pdf')) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className={`text-gray-600 mb-4 ${textClass}`}>
              PDF documents can be viewed by downloading
            </p>
            <button
              onClick={handleDownload}
              className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
            >
              <Download className="h-4 w-4" />
              <span>Download & View</span>
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">
          {getFileTypeIcon(document.file_type)}
        </div>
        <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
          Preview not available
        </h3>
        <p className={`text-gray-600 mb-4 ${textClass}`}>
          This file type cannot be previewed in the browser
        </p>
        <button
          onClick={handleDownload}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
        >
          <Download className="h-4 w-4" />
          <span>Download File</span>
        </button>
      </div>
    )
  }

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* File Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
          <Eye className="h-5 w-5 mr-2" />
          File Preview
        </h3>
        {renderPreview()}
      </div>

      {/* Document Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
          <FileText className="h-5 w-5 mr-2" />
          Document Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Title
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {document.title}
            </p>
          </div>

          {document.title_khmer && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Title (Khmer)
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {document.title_khmer}
              </p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Document Type
            </label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {document.document_type.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Version
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {document.version || '1.0'}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              File Size
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {formatFileSize(document.file_size)}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              File Type
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {document.file_type}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Access Level
            </label>
            <div className="flex items-center space-x-2">
              {document.is_public ? (
                <>
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className={`text-green-600 ${textClass}`}>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-gray-600" />
                  <span className={`text-gray-600 ${textClass}`}>Private</span>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Description
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {document.description || 'No description provided'}
            </p>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
          <User className="h-5 w-5 mr-2" />
          Upload Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Uploaded By
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {document.uploaded_by.first_name} {document.uploaded_by.last_name}
            </p>
            <p className={`text-gray-500 text-sm ${textClass}`}>
              {document.uploaded_by.email}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Upload Date
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {formatDate(document.created_at)}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
              Last Modified
            </label>
            <p className={`text-gray-900 ${textClass}`}>
              {formatDate(document.updated_at)}
            </p>
          </div>

          {document.approved_by && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Approved By
              </label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className={`text-gray-900 ${textClass}`}>
                    {document.approved_by.first_name} {document.approved_by.last_name}
                  </p>
                  <p className={`text-gray-500 text-sm ${textClass}`}>
                    {formatDate(document.approved_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderVersionsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
        <History className="h-5 w-5 mr-2" />
        Version History
      </h3>
      
      {versions.length === 0 ? (
        <p className={`text-gray-500 text-center py-8 ${textClass}`}>
          No version history available
        </p>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div key={version.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">
                  v{version.version}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    Version {version.version}
                    {index === 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current
                      </span>
                    )}
                  </h4>
                  <span className={`text-sm text-gray-500 ${textClass}`}>
                    {formatDate(version.created_at)}
                  </span>
                </div>
                {version.change_notes && (
                  <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                    {version.change_notes}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`text-sm text-gray-500 ${textClass}`}>
                    by {version.uploaded_by?.first_name} {version.uploaded_by?.last_name}
                  </span>
                  <button
                    onClick={() => window.open(version.file_url, '_blank')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
          Document Not Found
        </h3>
        <p className={`text-gray-500 ${textClass}`}>
          The requested document could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">
              {getFileTypeIcon(document.file_type)}
            </div>
            <div>
              <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
                {document.title}
              </h2>
              <p className={`text-gray-600 mt-1 ${textClass}`}>
                {document.document_type.replace('_', ' ')} • {formatFileSize(document.file_size)}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  {document.is_public ? (
                    <>
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className={`text-green-600 text-sm ${textClass}`}>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-gray-600" />
                      <span className={`text-gray-600 text-sm ${textClass}`}>Private</span>
                    </>
                  )}
                </div>
                {document.approved_by && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className={`text-green-600 text-sm ${textClass}`}>Approved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={handleDownload}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          
          {canEdit() && (
            <button
              onClick={() => onEdit(document)}
              className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
          
          <button
            onClick={() => setShowShareModal(true)}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Copy className="h-4 w-4" />
            <span>Copy Link</span>
          </button>

          {canApprove() && (
            <button
              onClick={handleApprove}
              className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Approve</span>
            </button>
          )}

          {canDelete() && (
            <button
              onClick={() => onDelete(document)}
              className={`flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 ${textClass}`}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className={`text-green-800 ${textClass}`}>{success}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'versions', label: 'Versions', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
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

      {/* Tab Content */}
      {activeTab === 'details' && renderDetailsTab()}
      {activeTab === 'versions' && renderVersionsTab()}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className={`text-lg font-bold mb-4 ${headerClass}`}>
              Share Document
            </h3>
            <p className={`text-gray-600 mb-4 ${textClass}`}>
              Share this document with others by copying the link below:
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={`${window.location.origin}/documents/${documentId}`}
                readOnly
                className={`flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 ${textClass}`}
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowShareModal(false)}
                className={`px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentViewer 