import { useState, useEffect } from 'react'
import { User, Mail, Phone, Building, Calendar, Shield, Edit3, Save, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import { getUserProfile, updateUserProfile } from '../lib/supabase-enhanced'

const UserProfile = ({ user, onProfileUpdate }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const userRoles = {
    'super_admin': { label: 'Super Admin', color: 'bg-red-500' },
    'admin': { label: 'Admin', color: 'bg-purple-500' },
    'manager': { label: 'Manager', color: 'bg-blue-500' },
    'supervisor': { label: 'Supervisor', color: 'bg-green-500' },
    'worker': { label: 'Worker', color: 'bg-gray-500' },
    'auditor': { label: 'Auditor', color: 'bg-orange-500' },
    'committee_member': { label: 'Committee Member', color: 'bg-indigo-500' }
  }

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await getUserProfile(user.id)
      
      if (error) {
        console.error('Error loading profile:', error)
        return
      }
      
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        full_name_khmer: data.full_name_khmer || '',
        phone: data.phone || '',
        position: data.position || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setErrors({})
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({
      full_name: profile.full_name || '',
      full_name_khmer: profile.full_name_khmer || '',
      phone: profile.phone || '',
      position: profile.position || ''
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    try {
      setSaving(true)
      
      const { error } = await updateUserProfile(user.id, {
        full_name: formData.full_name,
        full_name_khmer: formData.full_name_khmer,
        phone: formData.phone,
        position: formData.position
      })
      
      if (error) {
        setErrors({ submit: 'Failed to update profile. Please try again.' })
        return
      }
      
      await loadProfile()
      setEditing(false)
      
      if (onProfileUpdate) {
        onProfileUpdate()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors({ submit: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className={`text-gray-600 ${textClass}`}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 ${headerClass}`}>
            Profile not found
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            Unable to load user profile information.
          </p>
        </div>
      </div>
    )
  }

  const roleConfig = userRoles[profile.role] || userRoles['worker']

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold text-gray-900 ${headerClass}`}>
              User Profile
            </h1>
            <p className={`mt-2 text-gray-600 ${textClass}`}>
              Manage your personal information and settings
            </p>
          </div>
          
          {!editing && (
            <button
              onClick={handleEdit}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className={`text-2xl font-bold text-amber-800 ${textClass}`}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              
              <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                {profile.full_name}
              </h3>
              
              {profile.full_name_khmer && (
                <p className={`text-gray-600 ${textClass}`}>
                  {profile.full_name_khmer}
                </p>
              )}
              
              <div className="mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${roleConfig.color}`}>
                  <Shield className="h-4 w-4 mr-1" />
                  {roleConfig.label}
                </span>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className={`text-sm text-gray-600 ${textClass}`}>
                    {profile.email}
                  </span>
                </div>
                
                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className={`text-sm text-gray-600 ${textClass}`}>
                      {profile.phone}
                    </span>
                  </div>
                )}
                
                {profile.organizations && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <span className={`text-sm text-gray-600 ${textClass}`}>
                      {profile.organizations.name}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className={`text-sm text-gray-600 ${textClass}`}>
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                Personal Information
              </h3>
              
              {editing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 ${textClass}`}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-6">
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
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${textClass}`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
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
                </div>
                
                {errors.submit && (
                  <p className="text-red-500 text-sm">{errors.submit}</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Full Name
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.full_name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Full Name (Khmer)
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.full_name_khmer || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Email
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Employee ID
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.employee_id || 'Not assigned'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Department
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.department || 'Not assigned'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Position
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.position || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Phone Number
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.phone || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium text-gray-500 mb-1 ${textClass}`}>
                      Last Login
                    </label>
                    <p className={`text-gray-900 ${textClass}`}>
                      {profile.last_login 
                        ? new Date(profile.last_login).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile 