import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
  Folder, 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download,
  Eye,
  ,
  Trash2,
  Share2,
  Clock,
  ,
  ,
  ,
  Grid,
  List,
  Plus,
  MoreVertical,
  CheckSquare,
  Square,
  ,
  User,
  ,
  
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getDocumentsByOrganization,
  getDocumentCategories,
  createDocumentCategory,
  deleteDocument,
  updateDocumentMetadata,
  getDocumentStatistics
} from '../../lib/supabase-enhanced'
import DocumentUpload from './DocumentUpload'
import DocumentViewer from './DocumentViewer'

const DocumentManager = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showUpload, setShowUpload] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showViewer, setShowViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    loadDocumentData()
  }, [organizationId])

  useEffect(() => {
    filterAndSortDocuments()
  }, [documents, searchQuery, selectedCategory, sortField, sortDirection])

  const loadDocumentData = async () => {
    setLoading(true)
    try {
      const [docsResult, categoriesResult, statsResult] = await Promise.all([
        getDocumentsByOrganization(organizationId),
        getDocumentCategories(organizationId),
        getDocumentStatistics(organizationId)
      ])

      if (docsResult.success) setDocuments(docsResult.data)
      if (categoriesResult.success) setCategories(categoriesResult.data)
      if (statsResult.success) setStatistics(statsResult.data)
    } catch (error) {
      console.error('Failed to load document data:', error)
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortDocuments = () => {
    let filtered = [...documents]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredDocuments(filtered)
  }

  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return

    const confirmed = window.confirm(`Delete ${selectedDocuments.length} document(s)?`)
    if (!confirmed) return

    try {
      for (const docId of selectedDocuments) {
        await deleteDocument(docId, user.id, organizationId)
      }
      
      setSuccess(`${selectedDocuments.length} document(s) deleted successfully`)
      setSelectedDocuments([])
      await loadDocumentData()
    } catch (err) {
      setError('Failed to delete documents')
    }
  }

  const handleViewDocument = (document) => {
    setSelectedDocument(document)
    setShowViewer(true)
  }

  const handleUploadSuccess = () => {
    setShowUpload(false)
    setSuccess('Documents uploaded successfully')
    loadDocumentData()
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
      month: 'short',
      day: 'numeric'
    })
  }

  const getDocumentIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('image')) return '🖼️'
    if (fileType?.includes('video')) return '🎥'
    if (fileType?.includes('audio')) return '🎵'
    if (fileType?.includes('text')) return '📝'
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '📊'
    if (fileType?.includes('presentation') || fileType?.includes('powerpoint')) return '📈'
    return '📄'
  }

  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Total Documents
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {statistics.total || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Categories
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {categories.length}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <Folder className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Storage Used
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {formatFileSize(statistics.total_size || 0)}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Upload className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              This Month
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {statistics.monthly_uploads || 0}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderFiltersAndActions = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.type}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-')
              setSortField(field)
              setSortDirection(direction)
            }}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="title-asc">Name A-Z</option>
            <option value="title-desc">Name Z-A</option>
            <option value="file_size-desc">Largest First</option>
            <option value="file_size-asc">Smallest First</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm text-gray-600 ${textClass}`}>
                {selectedDocuments.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => setShowCategoryForm(true)}
            className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Folder className="h-4 w-4" />
            <span>Add Category</span>
          </button>

          <button
            onClick={() => setShowUpload(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredDocuments.map((document) => (
        <div 
          key={document.id} 
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <button
              onClick={() => handleDocumentSelect(document.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {selectedDocuments.includes(document.id) ? 
                <CheckSquare className="h-4 w-4" /> : 
                <Square className="h-4 w-4" />
              }
            </button>
            <div className="relative">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-center mb-3">
            <div className="text-4xl mb-2">
              {getDocumentIcon(document.file_type)}
            </div>
            <h3 className={`font-semibold text-gray-900 truncate ${textClass}`}>
              {document.title}
            </h3>
            <p className={`text-sm text-gray-500 truncate ${textClass}`}>
              {document.description}
            </p>
          </div>

          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Size:</span>
              <span>{formatFileSize(document.file_size)}</span>
            </div>
            <div className="flex justify-between">
              <span>Modified:</span>
              <span>{formatDate(document.updated_at)}</span>
            </div>
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {document.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
                {document.tags.length > 2 && (
                  <span className="text-gray-400">+{document.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => handleViewDocument(document)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Eye className="h-3 w-3" />
              <span>View</span>
            </button>
            <button
              onClick={() => window.open(document.file_url, '_blank')}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </button>
            <button
              onClick={() => {/* Share document */}}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm"
            >
              <Share2 className="h-3 w-3" />
              <span>Share</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {selectedDocuments.length === filteredDocuments.length ? 
                    <CheckSquare className="h-4 w-4" /> : 
                    <Square className="h-4 w-4" />
                  }
                </button>
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Name
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Type
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Size
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Modified
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDocumentSelect(document.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedDocuments.includes(document.id) ? 
                      <CheckSquare className="h-4 w-4" /> : 
                      <Square className="h-4 w-4" />
                    }
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {getDocumentIcon(document.file_type)}
                    </span>
                    <div>
                      <div className={`text-sm font-medium text-gray-900 ${textClass}`}>
                        {document.title}
                      </div>
                      <div className={`text-sm text-gray-500 ${textClass}`}>
                        {document.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 text-sm text-gray-900 ${textClass}`}>
                  {document.document_type}
                </td>
                <td className={`px-6 py-4 text-sm text-gray-900 ${textClass}`}>
                  {formatFileSize(document.file_size)}
                </td>
                <td className={`px-6 py-4 text-sm text-gray-900 ${textClass}`}>
                  {formatDate(document.updated_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDocument(document)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(document.file_url, '_blank')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (showUpload) {
    return (
      <DocumentUpload
        organizationId={organizationId}
        user={user}
        onSuccess={handleUploadSuccess}
        onCancel={() => setShowUpload(false)}
      />
    )
  }

  if (showViewer && selectedDocument) {
    return (
      <DocumentViewer
        documentId={selectedDocument.id}
        user={user}
        onClose={() => {
          setShowViewer(false)
          setSelectedDocument(null)
        }}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Document Management
        </h1>
        <p className={`text-gray-600 ${textClass}`}>
          Organize, store, and manage all compliance documents in one place
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <Trash2 className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <CheckSquare className="h-5 w-5 text-green-600 mr-2" />
            <span className={`text-green-800 ${textClass}`}>{success}</span>
          </div>
        </div>
      )}

      {renderStatistics()}
      {renderFiltersAndActions()}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No documents found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by uploading your first document'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
    </div>
  )
}

DocumentManager.propTypes = {
  user: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired
}

export default DocumentManager 