import { useState, useEffect } from 'react'
import { 
  FileText, 
  Video, 
  Image, 
  Upload, 
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Edit,
  Save,
  X,
  Plus,
  Eye,
  Trash2,
  Copy,
  Move,
  Folder,
  FolderOpen,
  Link,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  BookOpen,
  Target,
  Users,
  BarChart3,
  Layers,
  Type,
  Code,
  Mic
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getTrainingContent,
  createTrainingContent,
  updateTrainingContent,
  deleteTrainingContent,
  uploadTrainingMedia,
  getContentStatistics,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  duplicateContent,
  getContentPreview
} from '../../lib/supabase-enhanced'

const TrainingContent = ({ user, organizationId, moduleId = null }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [content, setContent] = useState([])
  const [lessons, setLessons] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [selectedContent, setSelectedContent] = useState(null)
  const [showCreateContent, setShowCreateContent] = useState(false)
  const [showEditContent, setShowEditContent] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadContentData()
  }, [organizationId, moduleId])

  const loadContentData = async () => {
    setLoading(true)
    setError('')

    try {
      const [contentResult, statisticsResult] = await Promise.all([
        getTrainingContent(organizationId, { module_id: moduleId }),
        getContentStatistics(organizationId)
      ])

      if (contentResult.success) {
        setContent(contentResult.data.content || [])
        setLessons(contentResult.data.lessons || [])
      }
      if (statisticsResult.success) setStatistics(statisticsResult.data)
    } catch (error) {
      console.error('Failed to load content data:', error)
      setError('Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContent = async (contentData) => {
    try {
      const result = await createTrainingContent({
        ...contentData,
        organization_id: organizationId,
        module_id: moduleId,
        created_by: user.id
      })

      if (result.success) {
        await loadContentData()
        setShowCreateContent(false)
      }
    } catch (error) {
      console.error('Failed to create content:', error)
    }
  }

  const handleFileUpload = async (files) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      for (const file of files) {
        const result = await uploadTrainingMedia(file, organizationId, (progress) => {
          setUploadProgress(progress)
        })

        if (result.success) {
          await handleCreateContent({
            title: file.name.split('.')[0],
            type: getFileType(file.type),
            content_url: result.data.url,
            file_size: file.size,
            duration: result.data.duration || null,
            thumbnail_url: result.data.thumbnail || null
          })
        }
      }
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'document'
    if (mimeType.includes('presentation')) return 'presentation'
    return 'document'
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files))
    }
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />
      case 'image': return <Image className="h-5 w-5" />
      case 'audio': return <Mic className="h-5 w-5" />
      case 'document': return <FileText className="h-5 w-5" />
      case 'presentation': return <Monitor className="h-5 w-5" />
      case 'interactive': return <Target className="h-5 w-5" />
      case 'quiz': return <CheckCircle className="h-5 w-5" />
      case 'text': return <Type className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Content
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {statistics.total_content}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Videos
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.video_count}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Documents
              </p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.document_count}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Size
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {formatFileSize(statistics.total_size)}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderUploadArea = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Upload Content
        </h3>
        <button
          onClick={() => setShowCreateContent(true)}
          className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
        >
          <Plus className="h-4 w-4" />
          <span>Create Content</span>
        </button>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
          Upload Training Materials
        </h4>
        <p className={`text-gray-600 mb-4 ${textClass}`}>
          Drag and drop files here, or click to browse
        </p>
        <div className="flex items-center justify-center space-x-4">
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Choose Files</span>
            <input
              type="file"
              multiple
              accept="video/*,image/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Supported formats: Video (MP4, WebM), Images (JPG, PNG, GIF), Audio (MP3, WAV), Documents (PDF, DOC, PPT)
        </p>
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium text-gray-700 ${textClass}`}>
              Uploading...
            </span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )

  const renderControls = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
            <option value="presentation">Presentations</option>
            <option value="interactive">Interactive</option>
            <option value="quiz">Quizzes</option>
            <option value="text">Text Content</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContentCard = (item) => (
    <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {item.thumbnail_url && (
        <div className="h-48 bg-gray-200 relative">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getContentTypeIcon(item.type)}
            <span className={`text-sm text-gray-600 ${textClass}`}>
              {item.type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setSelectedContent(item)
                setShowPreview(true)
              }}
              className="p-1 text-gray-400 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setSelectedContent(item)
                setShowEditContent(true)
              }}
              className="p-1 text-gray-400 hover:text-green-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-1 ${textClass}`}>
          {item.title}
        </h3>
        
        {item.description && (
          <p className={`text-gray-600 text-sm mb-3 line-clamp-2 ${textClass}`}>
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(item.duration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>{formatFileSize(item.file_size)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setSelectedContent(item)
                setShowPreview(true)
              }}
              className={`px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ${textClass}`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContentList = () => {
    const filteredContent = content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || item.type === filterType
      return matchesSearch && matchesType
    })

    if (filteredContent.length === 0) {
      return (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Content Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No content matches your current filters
          </p>
          <button
            onClick={() => setShowCreateContent(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create First Content</span>
          </button>
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 
        'space-y-4'
      }>
        {filteredContent.map(item => renderContentCard(item))}
      </div>
    )
  }

  const renderLessonsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Lesson Management
          </h3>
          <button
            onClick={() => setShowCreateContent(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Lesson</span>
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
              No Lessons Created
            </h4>
            <p className={`text-gray-500 mb-4 ${textClass}`}>
              Create structured lessons to organize your training content
            </p>
            <button
              onClick={() => setShowCreateContent(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Create First Lesson</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <h4 className={`font-semibold text-gray-900 ${textClass}`}>
                        {lesson.title}
                      </h4>
                    </div>
                    <p className={`text-gray-600 mb-3 ${textClass}`}>
                      {lesson.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Duration: {formatDuration(lesson.duration)}</span>
                      <span>Content: {lesson.content_count} items</span>
                      <span>Order: {lesson.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderTabs = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex space-x-8 px-6">
        {[
          { id: 'content', label: 'Content Library', icon: Layers },
          { id: 'lessons', label: 'Lessons', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'content': 
        return (
          <div>
            {renderUploadArea()}
            {renderControls()}
            {renderContentList()}
          </div>
        )
      case 'lessons': return renderLessonsTab()
      case 'analytics': return <div>Analytics coming soon...</div>
      default: 
        return (
          <div>
            {renderUploadArea()}
            {renderControls()}
            {renderContentList()}
          </div>
        )
    }
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Training Content Management
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Create, organize, and manage training materials and lessons
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            Phase 6
          </div>
          <div className={`text-sm text-gray-600 ${textClass}`}>
            Training
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderHeader()}
      {renderStatistics()}
      {renderTabs()}
      {renderTabContent()}
    </div>
  )
}

export default TrainingContent 