import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
  MessageSquare, 
  AlertTriangle, 
  Upload, 
  X, 
  Eye, 
  EyeOff,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Flag,
  Shield,
  Users,
  TrendingUp,
  FileText,
  Camera,
  Save,
  Send,
  Info,
  CheckCircle,
  UserX
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  submitGrievance,
  uploadGrievanceDocument,
  getGrievanceCategories,
  validateGrievanceSubmission
} from '../../lib/supabase-enhanced'

const GrievanceForm = ({ user, organizationId, onSubmit, onClose, editingGrievance = null }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    department: '',
    location: '',
    date_of_incident: '',
    witnesses: '',
    desired_outcome: '',
    is_anonymous: false,
    contact_method: 'email',
    submitter_name: '',
    submitter_email: '',
    submitter_phone: '',
    submitter_department: '',
    additional_notes: ''
  })
  
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const maxSteps = 4
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    loadCategories()
    if (editingGrievance) {
      setFormData({ ...editingGrievance })
    } else if (user && !formData.is_anonymous) {
      setFormData(prev => ({
        ...prev,
        submitter_name: user.full_name || '',
        submitter_email: user.email || '',
        submitter_phone: user.phone || '',
        submitter_department: user.department || ''
      }))
    }
  }, [editingGrievance, user])

  const loadCategories = async () => {
    try {
      const result = await getGrievanceCategories(organizationId)
      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const validateStep = (step) => {
    const newErrors = {}
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (!formData.category) newErrors.category = 'Category is required'
      if (!formData.priority) newErrors.priority = 'Priority is required'
    }
    
    if (step === 2) {
      if (!formData.department.trim()) newErrors.department = 'Department is required'
      if (!formData.location.trim()) newErrors.location = 'Location is required'
      if (!formData.date_of_incident) newErrors.date_of_incident = 'Date of incident is required'
    }
    
    if (step === 3 && !formData.is_anonymous) {
      if (!formData.submitter_name.trim()) newErrors.submitter_name = 'Name is required'
      if (!formData.submitter_email.trim()) newErrors.submitter_email = 'Email is required'
      if (formData.submitter_email && !/\S+@\S+\.\S+/.test(formData.submitter_email)) {
        newErrors.submitter_email = 'Email is invalid'
      }
      if (formData.contact_method === 'phone' && !formData.submitter_phone.trim()) {
        newErrors.submitter_phone = 'Phone number is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, maxSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }

    // Auto-clear contact info when anonymous
    if (field === 'is_anonymous' && value) {
      setFormData(prev => ({
        ...prev,
        submitter_name: '',
        submitter_email: '',
        submitter_phone: '',
        submitter_department: ''
      }))
    }
  }

  const handleFileUpload = (uploadedFiles) => {
    const newFiles = Array.from(uploadedFiles).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Date.now() + Math.random()
    }))
    
    setFiles(prev => [...prev, ...newFiles])
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
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setSubmitting(true)
    try {
      // Validate complete form
      const validationResult = await validateGrievanceSubmission(formData, organizationId)
      if (!validationResult.success) {
        setErrors(validationResult.errors)
        return
      }

      // Upload files first
      let uploadedFiles = []
      if (files.length > 0) {
        setUploading(true)
        for (const fileData of files) {
          const uploadResult = await uploadGrievanceDocument(fileData.file, organizationId)
          if (uploadResult.success) {
            uploadedFiles.push(uploadResult.data)
          }
        }
      }

      // Submit grievance
      const grievanceData = {
        ...formData,
        organization_id: organizationId,
        submitted_by: user?.id || null,
        status: 'submitted',
        attached_files: uploadedFiles,
        submission_ip: await getClientIP(),
        submission_timestamp: new Date().toISOString()
      }

      const result = await submitGrievance(grievanceData)
      
      if (result.success) {
        onSubmit?.(result.data)
        onClose?.()
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ submit: 'Failed to submit grievance. Please try again.' })
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'Unknown'
    }
  }

  const getCategoryIcon = (categoryValue) => {
    switch (categoryValue) {
      case 'workplace_safety': return <Shield className="h-4 w-4" />
      case 'harassment': return <AlertTriangle className="h-4 w-4" />
      case 'working_conditions': return <Users className="h-4 w-4" />
      case 'wages_benefits': return <TrendingUp className="h-4 w-4" />
      case 'discrimination': return <Flag className="h-4 w-4" />
      case 'environmental': return <MapPin className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium text-gray-600 ${textClass}`}>
          Step {currentStep} of {maxSteps}
        </span>
        <span className={`text-sm text-gray-500 ${textClass}`}>
          {Math.round((currentStep / maxSteps) * 100)}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / maxSteps) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Basic Info</span>
        <span>Details</span>
        <span>Contact</span>
        <span>Review</span>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="h-5 w-5 text-blue-600" />
          <h3 className={`font-semibold text-blue-900 ${headerClass}`}>
            Basic Grievance Information
          </h3>
        </div>
        <p className={`text-blue-800 text-sm ${textClass}`}>
          Provide a clear title and description of your grievance or concern.
        </p>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Grievance Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          placeholder="Brief summary of your grievance"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
        >
          <option value="">Select a category</option>
          <option value="workplace_safety">Workplace Safety</option>
          <option value="harassment">Harassment</option>
          <option value="working_conditions">Working Conditions</option>
          <option value="wages_benefits">Wages & Benefits</option>
          <option value="discrimination">Discrimination</option>
          <option value="environmental">Environmental</option>
          <option value="other">Other</option>
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Priority Level *
        </label>
        <select
          value={formData.priority}
          onChange={(e) => handleInputChange('priority', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.priority ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
        >
          <option value="low">Low - Minor issue, no immediate action needed</option>
          <option value="medium">Medium - Moderate issue, needs attention</option>
          <option value="high">High - Serious issue, requires prompt action</option>
          <option value="critical">Critical - Urgent issue, immediate action required</option>
        </select>
        {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Detailed Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={6}
          className={`w-full px-3 py-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          placeholder="Provide a detailed description of your grievance, including what happened, when, and how it affected you"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/2000 characters
        </p>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-5 w-5 text-orange-600" />
          <h3 className={`font-semibold text-orange-900 ${headerClass}`}>
            Incident Details
          </h3>
        </div>
        <p className={`text-orange-800 text-sm ${textClass}`}>
          Provide specific details about where and when the incident occurred.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Department *
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className={`w-full px-3 py-2 border ${errors.department ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            placeholder="e.g., Production, Quality Control, Administration"
          />
          {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Specific Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={`w-full px-3 py-2 border ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            placeholder="e.g., Building A, Floor 2, Machine Line 5"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Date of Incident *
        </label>
        <input
          type="date"
          value={formData.date_of_incident}
          onChange={(e) => handleInputChange('date_of_incident', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-3 py-2 border ${errors.date_of_incident ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
        />
        {errors.date_of_incident && <p className="mt-1 text-sm text-red-600">{errors.date_of_incident}</p>}
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Witnesses (if any)
        </label>
        <textarea
          value={formData.witnesses}
          onChange={(e) => handleInputChange('witnesses', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          placeholder="Names of people who witnessed the incident (optional)"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Desired Outcome
        </label>
        <textarea
          value={formData.desired_outcome}
          onChange={(e) => handleInputChange('desired_outcome', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          placeholder="What would you like to see happen as a result of this grievance?"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Supporting Documents
        </label>
        <div 
          className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg p-6`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-sm text-gray-600 ${textClass}`}>
              Drag and drop files here, or{' '}
              <label className="text-blue-600 cursor-pointer hover:text-blue-500">
                browse
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, TXT, JPG, PNG up to 10MB each
            </p>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <User className="h-5 w-5 text-green-600" />
          <h3 className={`font-semibold text-green-900 ${headerClass}`}>
            Contact Information
          </h3>
        </div>
        <p className={`text-green-800 text-sm ${textClass}`}>
          Your contact information helps us follow up on your grievance.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.is_anonymous}
            onChange={(e) => handleInputChange('is_anonymous', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="flex items-center space-x-2 cursor-pointer">
            <UserX className="h-5 w-5 text-yellow-600" />
            <span className={`text-sm font-medium text-yellow-900 ${textClass}`}>
              Submit this grievance anonymously
            </span>
          </label>
        </div>
        <p className={`text-yellow-800 text-sm mt-2 ml-7 ${textClass}`}>
          Anonymous submissions protect your identity but may limit our ability to follow up directly.
        </p>
      </div>

      {!formData.is_anonymous && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                Full Name *
              </label>
              <input
                type="text"
                value={formData.submitter_name}
                onChange={(e) => handleInputChange('submitter_name', e.target.value)}
                className={`w-full px-3 py-2 border ${errors.submitter_name ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                placeholder="Your full name"
              />
              {errors.submitter_name && <p className="mt-1 text-sm text-red-600">{errors.submitter_name}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                Department
              </label>
              <input
                type="text"
                value={formData.submitter_department}
                onChange={(e) => handleInputChange('submitter_department', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                placeholder="Your department"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Email Address *
            </label>
            <input
              type="email"
              value={formData.submitter_email}
              onChange={(e) => handleInputChange('submitter_email', e.target.value)}
              className={`w-full px-3 py-2 border ${errors.submitter_email ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              placeholder="your.email@company.com"
            />
            {errors.submitter_email && <p className="mt-1 text-sm text-red-600">{errors.submitter_email}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.submitter_phone}
              onChange={(e) => handleInputChange('submitter_phone', e.target.value)}
              className={`w-full px-3 py-2 border ${errors.submitter_phone ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              placeholder="+855 12 345 678"
            />
            {errors.submitter_phone && <p className="mt-1 text-sm text-red-600">{errors.submitter_phone}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Preferred Contact Method
            </label>
            <select
              value={formData.contact_method}
              onChange={(e) => handleInputChange('contact_method', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="both">Both Email and Phone</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Additional Notes
        </label>
        <textarea
          value={formData.additional_notes}
          onChange={(e) => handleInputChange('additional_notes', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          placeholder="Any additional information you'd like to include"
        />
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Eye className="h-5 w-5 text-purple-600" />
          <h3 className={`font-semibold text-purple-900 ${headerClass}`}>
            Review Your Grievance
          </h3>
        </div>
        <p className={`text-purple-800 text-sm ${textClass}`}>
          Please review all information before submitting your grievance.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Basic Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Title:</span>
                <span className="text-gray-600">{formData.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Category:</span>
                <span className="flex items-center space-x-1">
                  {getCategoryIcon(formData.category)}
                  <span className="text-gray-600">{formData.category?.replace('_', ' ')}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Priority:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  formData.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  formData.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  formData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {formData.priority?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Incident Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Department:</span>
                <span className="text-gray-600">{formData.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Location:</span>
                <span className="text-gray-600">{formData.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Date:</span>
                <span className="text-gray-600">{formData.date_of_incident}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
            Description
          </h4>
          <p className={`text-sm text-gray-600 ${textClass}`}>
            {formData.description}
          </p>
        </div>

        {formData.desired_outcome && (
          <div className="mt-4">
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Desired Outcome
            </h4>
            <p className={`text-sm text-gray-600 ${textClass}`}>
              {formData.desired_outcome}
            </p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4">
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Attached Files
            </h4>
            <div className="space-y-1">
              {files.map(file => (
                <div key={file.id} className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{file.name}</span>
                  <span className="text-gray-500">({formatFileSize(file.size)})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
            Contact Information
          </h4>
          {formData.is_anonymous ? (
            <p className={`text-sm text-gray-600 ${textClass}`}>
              This grievance will be submitted anonymously.
            </p>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Name:</span>
                <span className="text-gray-600">{formData.submitter_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{formData.submitter_email}</span>
              </div>
              {formData.submitter_phone && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Phone:</span>
                  <span className="text-gray-600">{formData.submitter_phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className={`text-red-800 text-sm ${textClass}`}>
              {errors.submit}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {editingGrievance ? 'Edit Grievance' : 'Submit New Grievance'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {renderProgressBar()}
          {renderStepContent()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md ${
                currentStep === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
              } ${textClass}`}
            >
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              {currentStep === maxSteps ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || uploading}
                  className={`flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Grievance</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className={`flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

GrievanceForm.propTypes = {
  user: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  editingGrievance: PropTypes.object
}

export default GrievanceForm 