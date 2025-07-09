import { useState, useCallback } from 'react'
import { 
  Upload, 
  X, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Trash2,
  Image,
  Video,
  Music
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  uploadDocument, 
  createDocument,
  getDocumentCategories 
} from '../../lib/supabase-enhanced'

const DocumentUpload = ({ organizationId, user, onSuccess, onCancel }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [categories, setCategories] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load categories on mount
  useState(async () => {
    const result = await getDocumentCategories(organizationId)
    if (result.success) setCategories(result.data)
  }, [])

  const documentTypes = [
    { value: 'policy', label: 'Policy Document' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'permit', label: 'Permit/License' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'audit_report', label: 'Audit Report' },
    { value: 'training_material', label: 'Training Material' },
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'form_template', label: 'Form Template' },
    { value: 'legal_document', label: 'Legal Document' },
    { value: 'other', label: 'Other' }
  ]

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles) => {
    const processedFiles = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: '',
      document_type: 'other',
      tags: [],
      is_public: false,
      version: '1.0',
      error: null,
      uploaded: false
    }))
    
    setFiles(prev => [...prev, ...processedFiles])
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileMetadata = (fileId, field, value) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [field]: value } : f
    ))
  }

  const addTag = (fileId, tag) => {
    if (!tag.trim()) return
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        tags: [...(f.tags || []), tag.trim()] 
      } : f
    ))
  }

  const removeTag = (fileId, tagIndex) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        tags: f.tags.filter((_, i) => i !== tagIndex) 
      } : f
    ))
  }

  const validateFile = (fileData) => {
    const errors = []
    
    if (!fileData.title.trim()) {
      errors.push('Title is required')
    }
    
    if (!fileData.document_type) {
      errors.push('Document type is required')
    }
    
    // File size validation (max 50MB)
    if (fileData.file.size > 50 * 1024 * 1024) {
      errors.push('File size must be less than 50MB')
    }
    
    // File type validation
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]
    
    if (!allowedTypes.includes(fileData.file.type)) {
      errors.push('File type not supported')
    }
    
    return errors
  }

  const uploadSingleFile = async (fileData) => {
    const validationErrors = validateFile(fileData)
    if (validationErrors.length > 0) {
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, error: validationErrors.join(', ') } : f
      ))
      return false
    }

    try {
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }))
      
      // Upload file to storage
      const uploadResult = await uploadDocument(
        fileData.file, 
        fileData.document_type, 
        organizationId
      )
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }
      
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 50 }))
      
      // Create document record
      const documentData = {
        organization_id: organizationId,
        title: fileData.title,
        title_khmer: fileData.title_khmer,
        document_type: fileData.document_type,
        file_url: uploadResult.url,
        file_size: fileData.file.size,
        file_type: fileData.file.type,
        version: fileData.version,
        description: fileData.description,
        description_khmer: fileData.description_khmer,
        tags: fileData.tags,
        is_public: fileData.is_public,
        uploaded_by: user.id
      }
      
      const docResult = await createDocument(documentData)
      
      if (!docResult.success) {
        throw new Error(docResult.error)
      }
      
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }))
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, uploaded: true, error: null } : f
      ))
      
      return true
    } catch (err) {
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, error: err.message } : f
      ))
      return false
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    
    setUploading(true)
    setError('')
    setSuccess('')
    
    try {
      let successCount = 0
      
      for (const fileData of files) {
        if (!fileData.uploaded) {
          const success = await uploadSingleFile(fileData)
          if (success) successCount++
        }
      }
      
      if (successCount > 0) {
        setSuccess(`${successCount} document(s) uploaded successfully`)
        setTimeout(() => onSuccess(), 2000)
      }
    } catch (err) {
      setError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return <Image className="h-8 w-8 text-blue-500" />
    if (fileType.includes('video')) return <Video className="h-8 w-8 text-purple-500" />
    if (fileType.includes('audio')) return <Music className="h-8 w-8 text-green-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
            Upload Documents
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className={`text-gray-600 mt-1 ${textClass}`}>
          Upload and organize compliance documents with metadata
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {files.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            Drop files here or click to upload
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            Support for PDF, Word, Excel, images, and text files (max 50MB each)
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Select Files</span>
          </label>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
              Files to Upload ({files.length})
            </h3>
            <div className="flex space-x-2">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="add-more-files"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
              />
              <label
                htmlFor="add-more-files"
                className={`inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer ${textClass}`}
              >
                <Plus className="h-4 w-4" />
                <span>Add More</span>
              </label>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {files.map((fileData) => (
              <div key={fileData.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(fileData.file.type)}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium text-gray-900 ${textClass}`}>
                          {fileData.file.name}
                        </h4>
                        <p className={`text-sm text-gray-500 ${textClass}`}>
                          {formatFileSize(fileData.file.size)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {fileData.uploaded && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <button
                          onClick={() => removeFile(fileData.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress[fileData.id] !== undefined && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[fileData.id]}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileData.error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          <span className={`text-red-800 text-sm ${textClass}`}>
                            {fileData.error}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Metadata Form */}
                    {!fileData.uploaded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                            Title *
                          </label>
                          <input
                            type="text"
                            value={fileData.title}
                            onChange={(e) => updateFileMetadata(fileData.id, 'title', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                            required
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                            Document Type *
                          </label>
                          <select
                            value={fileData.document_type}
                            onChange={(e) => updateFileMetadata(fileData.id, 'document_type', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                            required
                          >
                            {documentTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                            Description
                          </label>
                          <textarea
                            value={fileData.description}
                            onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                            rows={2}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                            Version
                          </label>
                          <input
                            type="text"
                            value={fileData.version}
                            onChange={(e) => updateFileMetadata(fileData.id, 'version', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                          />
                        </div>

                        <div>
                          <label className={`flex items-center ${textClass}`}>
                            <input
                              type="checkbox"
                              checked={fileData.is_public}
                              onChange={(e) => updateFileMetadata(fileData.id, 'is_public', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm">Public access</span>
                          </label>
                        </div>

                        {/* Tags */}
                        <div className="md:col-span-2">
                          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {fileData.tags?.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {tag}
                                <button
                                  onClick={() => removeTag(fileData.id, index)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Add tag and press Enter"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTag(fileData.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className={`text-green-800 ${textClass}`}>{success}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className={`px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${textClass}`}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.every(f => f.uploaded)}
            className={`flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{uploading ? 'Uploading...' : 'Upload Documents'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload 