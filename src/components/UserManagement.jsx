import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Shield, 
  Building, 
  Mail, 
  Phone, 
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import { 
  getOrganizationUsers, 
  createUserRecord, 
  updateUserProfile, 
  getUserProfile,
  getOrganization 
} from '../lib/supabase-enhanced'

const UserManagement = ({ currentUser, onUserUpdate }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  // State management
  const [users, setUsers] = useState([])
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    full_name_khmer: '',
    email: '',
    role: 'worker',
    department: '',
    position: '',
    phone: '',
    employee_id: '',
    is_active: true
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // User roles configuration
  const userRoles = [
    { value: 'super_admin', label: 'Super Admin', color: 'bg-red-500', icon: Shield },
    { value: 'admin', label: 'Admin', color: 'bg-purple-500', icon: Shield },
    { value: 'manager', label: 'Manager', color: 'bg-blue-500', icon: Users },
    { value: 'supervisor', label: 'Supervisor', color: 'bg-green-500', icon: Users },
    { value: 'worker', label: 'Worker', color: 'bg-gray-500', icon: Users },
    { value: 'auditor', label: 'Auditor', color: 'bg-orange-500', icon: CheckCircle },
    { value: 'committee_member', label: 'Committee Member', color: 'bg-indigo-500', icon: Users }
  ]

  const departments = [
    'Management',
    'Human Resources',
    'Production',
    'Quality Control',
    'Safety',
    'Administration',
    'Finance',
    'Maintenance',
    'Logistics',
    'Other'
  ]

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load organization data
      if (currentUser?.organization_id) {
        const { data: orgData } = await getOrganization(currentUser.organization_id)
        setOrganization(orgData)
        
        // Load users for the organization
        const { data: usersData } = await getOrganizationUsers(currentUser.organization_id)
        setUsers(usersData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const getRoleConfig = (role) => {
    return userRoles.find(r => r.value === role) || userRoles.find(r => r.value === 'worker')
  }

  const canManageUsers = () => {
    return ['admin', 'super_admin'].includes(currentUser?.role)
  }

  const canEditUser = (user) => {
    if (!canManageUsers()) return false
    if (user.role === 'super_admin' && currentUser.role !== 'super_admin') return false
    return true
  }

  const handleUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setFormData({
        full_name: user.full_name || '',
        full_name_khmer: user.full_name_khmer || '',
        email: user.email || '',
        role: user.role || 'worker',
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        employee_id: user.employee_id || '',
        is_active: user.is_active !== false
      })
    } else {
      setSelectedUser(null)
      setFormData({
        full_name: '',
        full_name_khmer: '',
        email: '',
        role: 'worker',
        department: '',
        position: '',
        phone: '',
        employee_id: '',
        is_active: true
      })
    }
    setFormErrors({})
    setShowUserModal(true)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!formData.role) {
      errors.role = 'Role is required'
    }
    
    // Check for duplicate email/employee_id (excluding current user)
    const existingUser = users.find(u => 
      u.id !== selectedUser?.id && 
      (u.email === formData.email || (formData.employee_id && u.employee_id === formData.employee_id))
    )
    
    if (existingUser) {
      if (existingUser.email === formData.email) {
        errors.email = 'Email already exists'
      }
      if (existingUser.employee_id === formData.employee_id) {
        errors.employee_id = 'Employee ID already exists'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setSubmitting(true)
      
      const userData = {
        ...formData,
        organization_id: currentUser.organization_id,
        updated_at: new Date().toISOString()
      }
      
      if (selectedUser) {
        // Update existing user
        await updateUserProfile(selectedUser.id, userData)
      } else {
        // Create new user
        await createUserRecord(
          null, // Will be set by auth system
          formData.email,
          formData.full_name,
          currentUser.organization_id,
          formData.role
        )
      }
      
      await loadData()
      setShowUserModal(false)
      
      if (onUserUpdate) {
        onUserUpdate()
      }
    } catch (error) {
      console.error('Error saving user:', error)
      setFormErrors({ submit: 'Failed to save user. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      await updateUserProfile(user.id, { 
        is_active: !user.is_active,
        updated_at: new Date().toISOString()
      })
      await loadData()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className={`text-gray-600 ${textClass}`}>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold text-gray-900 ${headerClass}`}>
              User Management
            </h1>
            <p className={`mt-2 text-gray-600 ${textClass}`}>
              Manage users and roles for {organization?.name}
            </p>
          </div>
          
          {canManageUsers() && (
            <button
              onClick={() => handleUserModal()}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Organization Overview */}
      {organization && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                {organization.name}
              </h3>
              <p className={`text-sm text-gray-500 ${textClass}`}>
                {organization.name_khmer}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <span className={textClass}>
                  {users.length} Users
                </span>
                <span className={textClass}>
                  {organization.employee_count} Total Employees
                </span>
                <span className={textClass}>
                  Industry: {organization.industry}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
            />
          </div>
          
          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
            >
              <option value="all">All Roles</option>
              {userRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  User
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  Role
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  Department
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  Contact
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleConfig = getRoleConfig(user.role)
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className={`text-sm font-medium text-amber-800 ${textClass}`}>
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium text-gray-900 ${textClass}`}>
                            {user.full_name}
                          </div>
                          {user.full_name_khmer && (
                            <div className={`text-sm text-gray-500 ${textClass}`}>
                              {user.full_name_khmer}
                            </div>
                          )}
                          <div className={`text-xs text-gray-400 ${textClass}`}>
                            ID: {user.employee_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${roleConfig.color}`}>
                        <roleConfig.icon className="h-3 w-3 mr-1" />
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm text-gray-900 ${textClass}`}>
                        {user.department || 'Not assigned'}
                      </div>
                      <div className={`text-sm text-gray-500 ${textClass}`}>
                        {user.position || 'No position'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        <span className={textClass}>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                          <Phone className="h-4 w-4" />
                          <span className={textClass}>{user.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {canEditUser(user) && (
                          <>
                            <button
                              onClick={() => handleUserModal(user)}
                              className="text-amber-600 hover:text-amber-900"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user)}
                              className={`${
                                user.is_active 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
              No users found
            </h3>
            <p className={`text-gray-500 ${textClass}`}>
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first user.'}
            </p>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className={`text-lg font-medium text-gray-900 mb-4 ${headerClass}`}>
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                      required
                    />
                    {formErrors.full_name && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Full Name (Khmer)
                    </label>
                    <input
                      type="text"
                      value={formData.full_name_khmer}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name_khmer: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                    />
                    {formErrors.employee_id && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.employee_id}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                      required
                    >
                      {userRoles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.role && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className={`ml-2 block text-sm text-gray-900 ${textClass}`}>
                    Active User
                  </label>
                </div>
                
                {formErrors.submit && (
                  <p className="text-red-500 text-sm">{formErrors.submit}</p>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 ${textClass}`}
                  >
                    {submitting ? 'Saving...' : (selectedUser ? 'Update User' : 'Create User')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

UserManagement.propTypes = {
  currentUser: PropTypes.object.isRequired,
  onUserUpdate: PropTypes.func.isRequired
}

export default UserManagement 