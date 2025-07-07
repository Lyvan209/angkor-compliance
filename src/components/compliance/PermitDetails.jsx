import { useState, useEffect } from 'react'
import { 
  FileText, 
  Calendar, 
  Building, 
  User, 
  Clock, 
  Download, 
  Edit, 
  Bell,
  CheckCircle,
  AlertTriangle,
  Eye,
  X,
  History,
  Settings
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getPermitById,
  updatePermitStatus,
  getAuditLogByRecord
} from '../../lib/supabase-enhanced'

const PermitDetails = ({ permitId, onClose, onEdit }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [permit, setPermit] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (permitId) {
      loadPermitDetails()
    }
  }, [permitId])

  const loadPermitDetails = async () => {
    setLoading(true)
    try {
      const [permitResult, auditResult] = await Promise.all([
        getPermitById(permitId),
        getAuditLogByRecord('permits', permitId)
      ])

      if (permitResult.success) {
        setPermit(permitResult.data)
      } else {
        setError('Failed to load permit details')
      }

      if (auditResult.success) {
        setAuditLog(auditResult.data)
      }
    } catch (err) {
      setError('Failed to load permit details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      const result = await updatePermitStatus(permitId, newStatus, permit.created_by.id)
      
      if (result.success) {
        setPermit(prev => ({ ...prev, status: newStatus }))
        setSuccess(`Status updated to ${newStatus}`)
        await loadPermitDetails() // Reload to get audit log
      } else {
        setError(result.error || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update permit status')
    } finally {
      setUpdating(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!permit) return null
    const today = new Date()
    const expiry = new Date(permit.expiry_date)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'expiring': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'suspended': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'expiring': return <Clock className="h-4 w-4" />
      case 'expired': return <AlertTriangle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'suspended': return <AlertTriangle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getExpiryStatus = () => {
    const daysUntilExpiry = getDaysUntilExpiry()
    
    if (daysUntilExpiry === null) return 'unknown'
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring'
    return 'active'
  }

  const renderDetailsTab = () => {
    if (!permit) return null

    const daysUntilExpiry = getDaysUntilExpiry()
    const expiryStatus = getExpiryStatus()

    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`border rounded-lg p-4 ${getStatusColor(expiryStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(expiryStatus)}
              <div>
                <h3 className={`font-semibold ${textClass}`}>
                  {expiryStatus === 'expired' ? 'Permit Expired' :
                   expiryStatus === 'expiring' ? 'Permit Expiring Soon' :
                   'Permit Active'}
                </h3>
                <p className={`text-sm ${textClass}`}>
                  {daysUntilExpiry === null ? 'Status unknown' :
                   daysUntilExpiry < 0 ? `Expired ${Math.abs(daysUntilExpiry)} days ago` :
                   daysUntilExpiry === 0 ? 'Expires today' :
                   `${daysUntilExpiry} days until expiry`}
                </p>
              </div>
            </div>
            
            {expiryStatus === 'expiring' || expiryStatus === 'expired' ? (
              <button
                onClick={() => {/* Handle renewal */}}
                className={`px-4 py-2 bg-white border border-current rounded-md hover:bg-opacity-10 ${textClass}`}
              >
                Start Renewal
              </button>
            ) : null}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <FileText className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Permit Type
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {permit.permit_type.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Permit Number
              </label>
              <p className={`text-gray-900 font-mono ${textClass}`}>
                {permit.permit_number}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Title (English)
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {permit.title}
              </p>
            </div>

            {permit.title_khmer && (
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                  Title (Khmer)
                </label>
                <p className={`text-gray-900 ${textClass}`}>
                  {permit.title_khmer}
                </p>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Current Status
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                {getStatusIcon(permit.status)}
                <span className="ml-1">{permit.status.toUpperCase()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Authority & Dates */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <Building className="h-5 w-5 mr-2" />
            Authority & Dates
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Issuing Authority
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {permit.issuing_authority}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Renewal Reminder
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {permit.renewal_reminder_days} days before expiry
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Issue Date
              </label>
              <p className={`text-gray-900 flex items-center ${textClass}`}>
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {formatDate(permit.issue_date)}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Expiry Date
              </label>
              <p className={`text-gray-900 flex items-center ${textClass}`}>
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {formatDate(permit.expiry_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Document & Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <FileText className="h-5 w-5 mr-2" />
            Document & Notes
          </h3>
          
          <div className="space-y-4">
            {permit.document_url ? (
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                  Permit Document
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <FileText className="h-4 w-4" />
                    <span className={`text-sm ${textClass}`}>Permit Document</span>
                  </div>
                  <button
                    onClick={() => window.open(permit.document_url, '_blank')}
                    className={`flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm ${textClass}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = permit.document_url
                      link.download = `${permit.permit_number}-document`
                      link.click()
                    }}
                    className={`flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm ${textClass}`}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                  Permit Document
                </label>
                <p className={`text-gray-500 text-sm ${textClass}`}>
                  No document uploaded
                </p>
              </div>
            )}

            {permit.notes && (
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                  Notes
                </label>
                <p className={`text-gray-900 ${textClass}`}>
                  {permit.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Created By */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <User className="h-5 w-5 mr-2" />
            Record Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Created By
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {permit.created_by.first_name} {permit.created_by.last_name}
              </p>
              <p className={`text-gray-500 text-sm ${textClass}`}>
                {permit.created_by.email}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Created Date
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {formatDate(permit.created_at)}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Last Updated
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {formatDate(permit.updated_at)}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                Organization
              </label>
              <p className={`text-gray-900 ${textClass}`}>
                {permit.organization?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderActivityTab = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
          <History className="h-5 w-5 mr-2" />
          Activity Timeline
        </h3>
        
        {auditLog.length === 0 ? (
          <p className={`text-gray-500 text-center py-8 ${textClass}`}>
            No activity recorded for this permit
          </p>
        ) : (
          <div className="space-y-4">
            {auditLog.map((entry, index) => (
              <div key={entry.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium text-gray-900 ${textClass}`}>
                      {entry.action === 'CREATE' ? 'Permit Created' :
                       entry.action === 'UPDATE' ? 'Permit Updated' :
                       entry.action === 'DELETE' ? 'Permit Deleted' :
                       entry.action}
                    </p>
                    <span className={`text-sm text-gray-500 ${textClass}`}>
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {entry.new_values && (
                    <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                      Changes made to permit record
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!permit) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
          Permit Not Found
        </h3>
        <p className={`text-gray-500 ${textClass}`}>
          The requested permit could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {permit.title}
            </h2>
            <p className={`text-gray-600 mt-1 ${textClass}`}>
              {permit.permit_number} • {permit.permit_type.replace('_', ' ')}
            </p>
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
            onClick={() => onEdit(permit)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Edit className="h-4 w-4" />
            <span>Edit Permit</span>
          </button>
          
          {permit.status === 'active' && (
            <button
              onClick={() => handleStatusUpdate('suspended')}
              disabled={updating}
              className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              <Settings className="h-4 w-4" />
              <span>Suspend</span>
            </button>
          )}
          
          {permit.status === 'suspended' && (
            <button
              onClick={() => handleStatusUpdate('active')}
              disabled={updating}
              className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Reactivate</span>
            </button>
          )}
          
          <button
            onClick={() => {/* Handle alert setup */}}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Bell className="h-4 w-4" />
            <span>Set Alert</span>
          </button>
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
            { id: 'activity', label: 'Activity', icon: History }
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
      {activeTab === 'activity' && renderActivityTab()}
    </div>
  )
}

export default PermitDetails 