import { useState, useEffect } from 'react'
import { 
  QrCode, 
  MessageSquare, 
  AlertTriangle, 
  User, 
  Camera, 
  Upload, 
  Send, 
  CheckCircle, 
  Eye, 
  , 
  Phone, 
  , 
  MapPin, 
  , 
  FileText,
  X,
  ArrowLeft,
  ,
  Shield,
  Users,
  TrendingUp,
  Flag,
  UserX,
  Smartphone,
  Wifi,
  WifiOff,
  
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  submitGrievance,
  uploadGrievanceDocument,
  validateGrievanceSubmission,
  getOrganizationByQRCode
} from '../../lib/supabase-enhanced'

const QRSubmissionPortal = ({ qrCode, onSubmissionComplete, onClose }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [organization, setOrganization] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    department: '',
    location: '',
    date_of_incident: '',
    is_anonymous: false,
    submitter_name: '',
    submitter_email: '',
    submitter_phone: '',
    contact_method: 'email',
    additional_notes: ''
  })
  
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  
  const maxSteps = 4

  useEffect(() => {
    // Load organization data from QR code
    loadOrganizationData()
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [qrCode])

  const loadOrganizationData = async () => {
    setLoading(true)
    try {
      const result = await getOrganizationByQRCode(qrCode)
      if (result.success) {
        setOrganization(result.data)
      } else {
        setErrors({ organization: 'Invalid QR code or organization not found' })
      }
    } catch (error) {
      console.error('Failed to load organization:', error)
      setErrors({ organization: 'Failed to load organization data' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
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

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const validateStep = (step) => {
    const newErrors = {}
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (!formData.category) newErrors.category = 'Category is required'
    }
    
    if (step === 2) {
      if (!formData.department.trim()) newErrors.department = 'Department is required'
      if (!formData.location.trim()) newErrors.location = 'Location is required'
    }
    
    if (step === 3 && !formData.is_anonymous) {
      if (!formData.submitter_name.trim()) newErrors.submitter_name = 'Name is required'
      if (!formData.submitter_email.trim()) newErrors.submitter_email = 'Email is required'
      if (formData.submitter_email && !/\S+@\S+\.\S+/.test(formData.submitter_email)) {
        newErrors.submitter_email = 'Email is invalid'
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setSubmitting(true)
    try {
      // Validate complete form
      const validationResult = await validateGrievanceSubmission(formData, organization.id)
      if (!validationResult.success) {
        setErrors(validationResult.errors)
        return
      }

      // Upload files if any
      let uploadedFiles = []
      if (files.length > 0) {
        for (const fileData of files) {
          const uploadResult = await uploadGrievanceDocument(fileData.file, organization.id)
          if (uploadResult.success) {
            uploadedFiles.push(uploadResult.data)
          }
        }
      }

      // Submit grievance
      const grievanceData = {
        ...formData,
        organization_id: organization.id,
        status: 'submitted',
        attached_files: uploadedFiles,
        submitted_via: 'qr_code',
        submission_timestamp: new Date().toISOString()
      }

      const result = await submitGrievance(grievanceData)
      
      if (result.success) {
        setSubmitted(true)
        setShowSuccessScreen(true)
        onSubmissionComplete?.(result.data)
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ submit: 'Failed to submit grievance. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryIcon = (categoryValue) => {
    switch (categoryValue) {
      case 'workplace_safety': return <Shield className="h-5 w-5" />
      case 'harassment': return <AlertTriangle className="h-5 w-5" />
      case 'working_conditions': return <Users className="h-5 w-5" />
      case 'wages_benefits': return <TrendingUp className="h-5 w-5" />
      case 'discrimination': return <Flag className="h-5 w-5" />
      case 'environmental': return <MapPin className="h-5 w-5" />
      default: return <MessageSquare className="h-5 w-5" />
    }
  }

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium text-gray-600 ${textClass}`}>
          Step {currentStep} of {maxSteps}
        </span>
        <span className={`text-sm text-gray-500 ${textClass}`}>
          {Math.round((currentStep / maxSteps) * 100)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / maxSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  )

  const renderConnectionStatus = () => (
    <div className={`flex items-center justify-center mb-4 p-2 rounded-lg ${
      isOnline ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    }`}>
      {isOnline ? (
        <><Wifi className="h-4 w-4 mr-2" />Online</>
      ) : (
        <><WifiOff className="h-4 w-4 mr-2" />Offline - Your submission will be saved when connection is restored</>
      )}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className={`font-semibold text-blue-900 ${headerClass}`}>
            Submit Your Grievance
          </h3>
        </div>
        <p className={`text-blue-800 text-sm ${textClass}`}>
          Tell us about your concern or grievance. Your voice matters.
        </p>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          What is your concern about? *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`w-full px-3 py-3 border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
          placeholder="Brief summary of your concern"
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
          className={`w-full px-3 py-3 border ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
        >
          <option value="">Select category</option>
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
          How urgent is this? *
        </label>
        <select
          value={formData.priority}
          onChange={(e) => handleInputChange('priority', e.target.value)}
          className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
        >
          <option value="low">Low - Can wait</option>
          <option value="medium">Medium - Needs attention</option>
          <option value="high">High - Important</option>
          <option value="critical">Critical - Very urgent</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Tell us what happened *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-3 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
          placeholder="Please describe what happened in detail..."
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
            Where and When?
          </h3>
        </div>
        <p className={`text-orange-800 text-sm ${textClass}`}>
          Help us understand where and when this happened.
        </p>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Department *
        </label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
          className={`w-full px-3 py-3 border ${errors.department ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
          placeholder="e.g., Production, Quality Control"
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
          className={`w-full px-3 py-3 border ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
          placeholder="e.g., Building A, Floor 2, Line 5"
        />
        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          When did this happen?
        </label>
        <input
          type="date"
          value={formData.date_of_incident}
          onChange={(e) => handleInputChange('date_of_incident', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Add Photos or Documents
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className={`text-sm text-gray-600 mb-2 ${textClass}`}>
            Take a photo or upload files
          </p>
          <label className="text-blue-600 cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <span className="text-sm underline">Choose files</span>
          </label>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
            Your Contact Information
          </h3>
        </div>
        <p className={`text-green-800 text-sm ${textClass}`}>
          How can we reach you about this grievance?
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
              Submit anonymously
            </span>
          </label>
        </div>
        <p className={`text-yellow-800 text-sm mt-2 ml-7 ${textClass}`}>
          We won't be able to contact you directly, but your concern will still be investigated.
        </p>
      </div>

      {!formData.is_anonymous && (
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Your Name *
            </label>
            <input
              type="text"
              value={formData.submitter_name}
              onChange={(e) => handleInputChange('submitter_name', e.target.value)}
              className={`w-full px-3 py-3 border ${errors.submitter_name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
              placeholder="Your full name"
            />
            {errors.submitter_name && <p className="mt-1 text-sm text-red-600">{errors.submitter_name}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Email Address *
            </label>
            <input
              type="email"
              value={formData.submitter_email}
              onChange={(e) => handleInputChange('submitter_email', e.target.value)}
              className={`w-full px-3 py-3 border ${errors.submitter_email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
              placeholder="your.email@example.com"
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
              className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
              placeholder="+855 12 345 678"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              How should we contact you?
            </label>
            <select
              value={formData.contact_method}
              onChange={(e) => handleInputChange('contact_method', e.target.value)}
              className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base ${textClass}`}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="both">Both Email and Phone</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Eye className="h-5 w-5 text-purple-600" />
          <h3 className={`font-semibold text-purple-900 ${headerClass}`}>
            Review Your Submission
          </h3>
        </div>
        <p className={`text-purple-800 text-sm ${textClass}`}>
          Please review your information before submitting.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Your Concern
            </h4>
            <p className={`text-gray-900 font-medium ${textClass}`}>
              {formData.title}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              {getCategoryIcon(formData.category)}
              <span className="text-sm text-gray-600">{formData.category?.replace('_', ' ')}</span>
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

          <div>
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Details
            </h4>
            <p className={`text-gray-600 text-sm ${textClass}`}>
              {formData.description}
            </p>
          </div>

          <div>
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Location
            </h4>
            <p className={`text-gray-600 text-sm ${textClass}`}>
              {formData.department} - {formData.location}
            </p>
          </div>

          {files.length > 0 && (
            <div>
              <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
                Attached Files
              </h4>
              <div className="space-y-1">
                {files.map(file => (
                  <div key={file.id} className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className={`font-semibold text-gray-900 mb-2 ${headerClass}`}>
              Contact Information
            </h4>
            {formData.is_anonymous ? (
              <p className={`text-gray-600 text-sm ${textClass}`}>
                This grievance will be submitted anonymously.
              </p>
            ) : (
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">{formData.submitter_name}</p>
                <p className="text-gray-600">{formData.submitter_email}</p>
                {formData.submitter_phone && (
                  <p className="text-gray-600">{formData.submitter_phone}</p>
                )}
              </div>
            )}
          </div>
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

  const renderSuccessScreen = () => (
    <div className="text-center space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className={`text-2xl font-bold text-green-900 mb-2 ${headerClass}`}>
          Thank You!
        </h2>
        <p className={`text-green-800 ${textClass}`}>
          Your grievance has been submitted successfully.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`font-semibold text-gray-900 mb-4 ${headerClass}`}>
          What happens next?
        </h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-medium">1</span>
            </div>
            <p className={`text-gray-600 text-sm ${textClass}`}>
              Your grievance will be reviewed within 24 hours
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-medium">2</span>
            </div>
            <p className={`text-gray-600 text-sm ${textClass}`}>
              It will be assigned to the appropriate team for investigation
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-medium">3</span>
            </div>
            <p className={`text-gray-600 text-sm ${textClass}`}>
              {formData.is_anonymous ? 
                "Updates will be posted publicly without identifying information" :
                "You will receive updates via your preferred contact method"
              }
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${textClass}`}
      >
        Close
      </button>
    </div>
  )

  const renderStepContent = () => {
    if (showSuccessScreen) return renderSuccessScreen()
    
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-gray-600 ${textClass}`}>Loading grievance portal...</p>
        </div>
      </div>
    )
  }

  if (errors.organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className={`text-lg font-semibold text-gray-900 mb-2 ${headerClass}`}>
            Invalid QR Code
          </h2>
          <p className={`text-gray-600 mb-4 ${textClass}`}>
            {errors.organization}
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 ${textClass}`}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className={`text-lg font-semibold ${headerClass}`}>
                  Submit Grievance
                </h1>
                <p className={`text-blue-200 text-sm ${textClass}`}>
                  {organization?.name}
                </p>
              </div>
            </div>
            <Smartphone className="h-6 w-6 text-blue-200" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderConnectionStatus()}
          
          {!showSuccessScreen && renderProgressBar()}
          
          {renderStepContent()}
          
          {/* Navigation */}
          {!showSuccessScreen && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg ${
                  currentStep === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50'
                } ${textClass}`}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              {currentStep === maxSteps ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !isOnline}
                  className={`flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className={`flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${textClass}`}
                >
                  <span>Next</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRSubmissionPortal 