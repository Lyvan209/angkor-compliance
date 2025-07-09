import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
  Save, 
  , 
  Upload, 
  , 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Building,
  User,
  
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  createPermit, 
  updatePermit, 
  uploadDocument 
} from '../../lib/supabase-enhanced'

const PermitForm = ({ permit, user, organizationId, onSave, onCancel }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [formData, setFormData] = useState({
    permit_type: 'business_license',
    permit_number: '',
    title: '',
    title_khmer: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    status: 'active',
    renewal_reminder_days: 30,
    document_url: '',
    notes: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [documentFile, setDocumentFile] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (permit) {
      setFormData({
        permit_type: permit.permit_type || 'business_license',
        permit_number: permit.permit_number || '',
        title: permit.title || '',
        title_khmer: permit.title_khmer || '',
        issuing_authority: permit.issuing_authority || '',
        issue_date: permit.issue_date || '',
        expiry_date: permit.expiry_date || '',
        status: permit.status || 'active',
        renewal_reminder_days: permit.renewal_reminder_days || 30,
        document_url: permit.document_url || '',
        notes: permit.notes || ''
      })
    }
  }, [permit])

  const permitTypes = [
    { value: 'business_license', label: 'Business License' },
    { value: 'environmental_permit', label: 'Environmental Permit' },
    { value: 'fire_safety_certificate', label: 'Fire Safety Certificate' },
    { value: 'building_permit', label: 'Building Permit' },
    { value: 'health_permit', label: 'Health Permit' },
    { value: 'labor_permit', label: 'Labor Permit' },
    { value: 'import_export_license', label: 'Import/Export License' },
    { value: 'tax_certificate', label: 'Tax Certificate' },
    { value: 'quality_certificate', label: 'Quality Certificate' },
    { value: 'other', label: 'Other' }
  ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'expired', label: 'Expired' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, JPEG, or PNG file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setDocumentFile(file)
    setUploadingDocument(true)
    setError('')

    try {
      const uploadResult = await uploadDocument(file, 'permits', organizationId)
      
      if (uploadResult.success) {
        setFormData(prev => ({ ...prev, document_url: uploadResult.url }))
        setSuccess('Document uploaded successfully')
      } else {
        setError(uploadResult.error || 'Failed to upload document')
      }
    } catch (err) {
      setError('Failed to upload document')
    } finally {
      setUploadingDocument(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.permit_type) errors.permit_type = 'Permit type is required'
    if (!formData.permit_number.trim()) errors.permit_number = 'Permit number is required'
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.issuing_authority.trim()) errors.issuing_authority = 'Issuing authority is required'
    if (!formData.issue_date) errors.issue_date = 'Issue date is required'
    if (!formData.expiry_date) errors.expiry_date = 'Expiry date is required'

    // Validate dates
    if (formData.issue_date && formData.expiry_date) {
      const issueDate = new Date(formData.issue_date)
      const expiryDate = new Date(formData.expiry_date)
      
      if (expiryDate <= issueDate) {
        errors.expiry_date = 'Expiry date must be after issue date'
      }
    }

    // Validate reminder days
    if (formData.renewal_reminder_days < 0 || formData.renewal_reminder_days > 365) {
      errors.renewal_reminder_days = 'Reminder days must be between 0 and 365'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError('Please fix the validation errors')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const permitData = {
        ...formData,
        organization_id: organizationId,
        created_by: user.id
      }

      let result
      if (permit) {
        result = await updatePermit(permit.id, permitData)
      } else {
        result = await createPermit(permitData)
      }

      if (result.success) {
        setSuccess(permit ? 'Permit updated successfully' : 'Permit created successfully')
        setTimeout(() => onSave(result.data), 1500)
      } else {
        setError(result.error || 'Failed to save permit')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysUntilExpiry = () => {
    if (!formData.expiry_date) return null
    
    const today = new Date()
    const expiry = new Date(formData.expiry_date)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const renderFormField = (name, label, type = 'text', options = null, required = false) => {
    const error = validationErrors[name]
    
    return (
      <div className="mb-4">
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {type === 'select' ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${textClass}`}
            required={required}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${textClass}`}
            required={required}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${textClass}`}
            required={required}
          />
        )}
        
        {error && (
          <p className={`text-red-600 text-sm mt-1 ${textClass}`}>
            {error}
          </p>
        )}
      </div>
    )
  }

  const daysUntilExpiry = calculateDaysUntilExpiry()

  return (
    <div className="max-w-4xl mx-auto bg-white">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
          {permit ? 'Edit Permit' : 'Add New Permit'}
        </h2>
        <p className={`text-gray-600 mt-1 ${textClass}`}>
          {permit ? 'Update permit information and settings' : 'Create a new permit or certificate record'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <FileText className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField('permit_type', 'Permit Type', 'select', permitTypes, true)}
            {renderFormField('permit_number', 'Permit Number', 'text', null, true)}
            {renderFormField('title', 'Title (English)', 'text', null, true)}
            {renderFormField('title_khmer', 'Title (Khmer)', 'text')}
          </div>
        </div>

        {/* Authority & Dates */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <Building className="h-5 w-5 mr-2" />
            Authority & Dates
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField('issuing_authority', 'Issuing Authority', 'text', null, true)}
            {renderFormField('status', 'Status', 'select', statusOptions, true)}
            {renderFormField('issue_date', 'Issue Date', 'date', null, true)}
            {renderFormField('expiry_date', 'Expiry Date', 'date', null, true)}
          </div>

          {/* Expiry Status Indicator */}
          {daysUntilExpiry !== null && (
            <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
              daysUntilExpiry < 0 ? 'bg-red-100 text-red-800' :
              daysUntilExpiry <= 30 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {daysUntilExpiry < 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : daysUntilExpiry <= 30 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <span className={`font-medium ${textClass}`}>
                {daysUntilExpiry < 0 ? 
                  `Expired ${Math.abs(daysUntilExpiry)} days ago` :
                  daysUntilExpiry <= 30 ?
                  `Expires in ${daysUntilExpiry} days` :
                  `${daysUntilExpiry} days until expiry`
                }
              </span>
            </div>
          )}
        </div>

        {/* Document Upload */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <Upload className="h-5 w-5 mr-2" />
            Document Upload
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                Upload Permit Document
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                disabled={uploadingDocument}
              />
              <p className={`text-sm text-gray-500 mt-1 ${textClass}`}>
                Supported formats: PDF, JPEG, PNG (max 10MB)
              </p>
            </div>

            {uploadingDocument && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className={`text-sm text-gray-600 ${textClass}`}>Uploading document...</span>
              </div>
            )}

            {formData.document_url && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className={`text-sm ${textClass}`}>Document uploaded successfully</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings & Notes */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <User className="h-5 w-5 mr-2" />
            Settings & Notes
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Renewal Reminder (days before expiry)
              </label>
              <input
                type="number"
                name="renewal_reminder_days"
                value={formData.renewal_reminder_days}
                onChange={handleInputChange}
                min="0"
                max="365"
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.renewal_reminder_days ? 'border-red-300' : 'border-gray-300'
                } ${textClass}`}
              />
              {validationErrors.renewal_reminder_days && (
                <p className={`text-red-600 text-sm mt-1 ${textClass}`}>
                  {validationErrors.renewal_reminder_days}
                </p>
              )}
            </div>

            {renderFormField('notes', 'Notes', 'textarea')}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className={`text-red-800 ${textClass}`}>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className={`text-green-800 ${textClass}`}>{success}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${textClass}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Permit'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

PermitForm.propTypes = {
  permit: PropTypes.object,
  user: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default PermitForm 