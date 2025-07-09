import { useState, useEffect } from 'react'
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus,
  FileText,
  Download,
  Bell,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getPermitsByOrganization, 
  getExpiringPermits, 
  getPermitStatistics,
  updatePermitStatus 
} from '../../lib/supabase-enhanced'

const PermitTracker = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [permits, setPermits] = useState([])
  const [filteredPermits, setFilteredPermits] = useState([])
  const [expiringPermits, setExpiringPermits] = useState([])
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortField, setSortField] = useState('expiry_date')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPermit, setSelectedPermit] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadPermitData()
  }, [organizationId])

  useEffect(() => {
    filterAndSortPermits()
  }, [permits, searchQuery, statusFilter, typeFilter, sortField, sortDirection])

  const loadPermitData = async () => {
    setLoading(true)
    try {
      const [permitsResult, expiringResult, statsResult] = await Promise.all([
        getPermitsByOrganization(organizationId),
        getExpiringPermits(organizationId, 60), // 60 days ahead
        getPermitStatistics(organizationId)
      ])

      if (permitsResult.success) setPermits(permitsResult.data)
      if (expiringResult.success) setExpiringPermits(expiringResult.data)
      if (statsResult.success) setStatistics(statsResult.data)
    } catch (error) {
      console.error('Failed to load permit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPermits = () => {
    let filtered = [...permits]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(permit => 
        permit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permit.permit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permit.issuing_authority.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(permit => permit.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(permit => permit.permit_type === typeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === 'expiry_date' || sortField === 'issue_date') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredPermits(filtered)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expiring': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'suspended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryStatus = (expiryDate) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
    
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring'
    return 'active'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const permitTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'business_license', label: 'Business License' },
    { value: 'environmental_permit', label: 'Environmental Permit' },
    { value: 'fire_safety_certificate', label: 'Fire Safety Certificate' },
    { value: 'building_permit', label: 'Building Permit' },
    { value: 'health_permit', label: 'Health Permit' },
    { value: 'labor_permit', label: 'Labor Permit' },
    { value: 'import_export_license', label: 'Import/Export License' },
    { value: 'other', label: 'Other' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
  ]

  const renderStatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Total Permits
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
              Active
            </p>
            <p className={`text-2xl font-bold text-green-600 ${headerClass}`}>
              {statistics.active || 0}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Expiring Soon
            </p>
            <p className={`text-2xl font-bold text-yellow-600 ${headerClass}`}>
              {statistics.expiring || 0}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Expired
            </p>
            <p className={`text-2xl font-bold text-red-600 ${headerClass}`}>
              {statistics.expired || 0}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
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
              placeholder="Search permits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            {permitTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Add Permit</span>
          </button>
          
          <button
            onClick={() => {/* Export functionality */}}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderPermitTable = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Permit Details
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Type
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Status
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Issue Date
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Expiry Date
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Days Until Expiry
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredPermits.length === 0 ? (
              <tr>
                <td colSpan="7" className={`px-6 py-4 text-center text-gray-500 ${textClass}`}>
                  No permits found matching your filters
                </td>
              </tr>
            ) : (
              filteredPermits.map((permit) => {
                const daysUntilExpiry = getDaysUntilExpiry(permit.expiry_date)
                const expiryStatus = getExpiryStatus(permit.expiry_date)
                
                return (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className={`text-sm font-medium text-gray-900 ${textClass}`}>
                            {permit.title}
                          </div>
                          <div className={`text-sm text-gray-500 ${textClass}`}>
                            {permit.permit_number}
                          </div>
                          <div className={`text-sm text-gray-500 ${textClass}`}>
                            {permit.issuing_authority}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 ${textClass}`}>
                        {permit.permit_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expiryStatus)}`}>
                        {getStatusIcon(expiryStatus)}
                        <span className="ml-1">{expiryStatus}</span>
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm text-gray-900 ${textClass}`}>
                      {formatDate(permit.issue_date)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-gray-900 ${textClass}`}>
                      {formatDate(permit.expiry_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        daysUntilExpiry < 0 ? 'text-red-600' :
                        daysUntilExpiry <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {daysUntilExpiry < 0 ? 
                          `${Math.abs(daysUntilExpiry)} days overdue` :
                          `${daysUntilExpiry} days`
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPermit(permit)
                            setShowDetails(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPermit(permit)
                            setShowAddForm(true)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* Delete functionality */}}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Permit & Certificate Tracker
        </h1>
        <p className={`text-gray-600 ${textClass}`}>
          Monitor and manage all permits and certificates with automated expiry tracking
        </p>
      </div>

      {renderStatisticsCards()}
      {renderFiltersAndActions()}
      {renderPermitTable()}

      {/* Add/Edit Permit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Add form component here */}
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-4 ${headerClass}`}>
                {selectedPermit ? 'Edit Permit' : 'Add New Permit'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setSelectedPermit(null)
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
              {/* Form content will be added next */}
            </div>
          </div>
        </div>
      )}

      {/* Permit Details Modal */}
      {showDetails && selectedPermit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Details component here */}
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-4 ${headerClass}`}>
                Permit Details
              </h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedPermit(null)
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
              {/* Details content will be added next */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermitTracker 