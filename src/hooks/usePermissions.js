import { useState, useEffect } from 'react'

// Permission definitions based on user roles
const ROLE_PERMISSIONS = {
  super_admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'organizations:create',
    'organizations:read',
    'organizations:update',
    'organizations:delete',
    'permits:create',
    'permits:read',
    'permits:update',
    'permits:delete',
    'audits:create',
    'audits:read',
    'audits:update',
    'audits:delete',
    'caps:create',
    'caps:read',
    'caps:update',
    'caps:delete',
    'grievances:create',
    'grievances:read',
    'grievances:update',
    'grievances:delete',
    'training:create',
    'training:read',
    'training:update',
    'training:delete',
    'committees:create',
    'committees:read',
    'committees:update',
    'committees:delete',
    'meetings:create',
    'meetings:read',
    'meetings:update',
    'meetings:delete',
    'documents:create',
    'documents:read',
    'documents:update',
    'documents:delete',
    'reports:create',
    'reports:read',
    'settings:read',
    'settings:update'
  ],
  
  admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'organizations:read',
    'organizations:update',
    'permits:create',
    'permits:read',
    'permits:update',
    'permits:delete',
    'audits:create',
    'audits:read',
    'audits:update',
    'audits:delete',
    'caps:create',
    'caps:read',
    'caps:update',
    'caps:delete',
    'grievances:create',
    'grievances:read',
    'grievances:update',
    'grievances:delete',
    'training:create',
    'training:read',
    'training:update',
    'training:delete',
    'committees:create',
    'committees:read',
    'committees:update',
    'committees:delete',
    'meetings:create',
    'meetings:read',
    'meetings:update',
    'meetings:delete',
    'documents:create',
    'documents:read',
    'documents:update',
    'documents:delete',
    'reports:create',
    'reports:read',
    'settings:read',
    'settings:update'
  ],
  
  manager: [
    'users:read',
    'users:update',
    'organizations:read',
    'permits:create',
    'permits:read',
    'permits:update',
    'audits:create',
    'audits:read',
    'audits:update',
    'caps:create',
    'caps:read',
    'caps:update',
    'caps:delete',
    'grievances:create',
    'grievances:read',
    'grievances:update',
    'training:create',
    'training:read',
    'training:update',
    'committees:read',
    'committees:update',
    'meetings:create',
    'meetings:read',
    'meetings:update',
    'documents:create',
    'documents:read',
    'documents:update',
    'reports:read'
  ],
  
  supervisor: [
    'users:read',
    'organizations:read',
    'permits:read',
    'audits:read',
    'caps:read',
    'caps:update',
    'grievances:create',
    'grievances:read',
    'grievances:update',
    'training:read',
    'training:update',
    'committees:read',
    'meetings:read',
    'meetings:update',
    'documents:read',
    'documents:update'
  ],
  
  worker: [
    'organizations:read',
    'permits:read',
    'audits:read',
    'caps:read',
    'grievances:create',
    'grievances:read',
    'training:read',
    'committees:read',
    'meetings:read',
    'documents:read'
  ],
  
  auditor: [
    'users:read',
    'organizations:read',
    'permits:read',
    'audits:create',
    'audits:read',
    'audits:update',
    'caps:create',
    'caps:read',
    'caps:update',
    'grievances:read',
    'training:read',
    'committees:read',
    'meetings:read',
    'documents:read',
    'documents:create',
    'reports:create',
    'reports:read'
  ],
  
  committee_member: [
    'users:read',
    'organizations:read',
    'permits:read',
    'audits:read',
    'caps:read',
    'grievances:create',
    'grievances:read',
    'grievances:update',
    'training:read',
    'committees:read',
    'committees:update',
    'meetings:create',
    'meetings:read',
    'meetings:update',
    'documents:read'
  ]
}

// Module access based on roles
const MODULE_ACCESS = {
  dashboard: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  users: ['super_admin', 'admin'],
  organizations: ['super_admin', 'admin', 'manager'],
  permits: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  audits: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  caps: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  grievances: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  training: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  committees: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  meetings: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  documents: ['super_admin', 'admin', 'manager', 'supervisor', 'worker', 'auditor', 'committee_member'],
  reports: ['super_admin', 'admin', 'manager', 'auditor'],
  settings: ['super_admin', 'admin']
}

export const usePermissions = (user) => {
  const [userPermissions, setUserPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role) {
      const permissions = ROLE_PERMISSIONS[user.role] || []
      setUserPermissions(permissions)
      setLoading(false)
    } else {
      setUserPermissions([])
      setLoading(false)
    }
  }, [user])

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user || !user.role) return false
    return userPermissions.includes(permission)
  }

  // Check if user can access module
  const canAccessModule = (module) => {
    if (!user || !user.role) return false
    return MODULE_ACCESS[module]?.includes(user.role) || false
  }

  // Check if user can perform action on resource
  const canPerformAction = (action, resource) => {
    const permission = `${resource}:${action}`
    return hasPermission(permission)
  }

  // Get all permissions for current user
  const getAllPermissions = () => {
    return userPermissions
  }

  // Get accessible modules for current user
  const getAccessibleModules = () => {
    if (!user || !user.role) return []
    
    return Object.keys(MODULE_ACCESS).filter(module => 
      MODULE_ACCESS[module].includes(user.role)
    )
  }

  // Check if user is admin level (admin or super_admin)
  const isAdmin = () => {
    return ['admin', 'super_admin'].includes(user?.role)
  }

  // Check if user is super admin
  const isSuperAdmin = () => {
    return user?.role === 'super_admin'
  }

  // Check if user can manage other users
  const canManageUsers = () => {
    return hasPermission('users:create') || hasPermission('users:update') || hasPermission('users:delete')
  }

  // Check if user can manage organization
  const canManageOrganization = () => {
    return hasPermission('organizations:update')
  }

  // Check if user can create CAPs
  const canCreateCAPs = () => {
    return hasPermission('caps:create')
  }

  // Check if user can handle grievances
  const canHandleGrievances = () => {
    return hasPermission('grievances:update') || hasPermission('grievances:delete')
  }

  // Check if user can manage training
  const canManageTraining = () => {
    return hasPermission('training:create') || hasPermission('training:update')
  }

  // Check if user can manage committees
  const canManageCommittees = () => {
    return hasPermission('committees:create') || hasPermission('committees:update')
  }

  // Check if user can view reports
  const canViewReports = () => {
    return hasPermission('reports:read')
  }

  // Check if user can create reports
  const canCreateReports = () => {
    return hasPermission('reports:create')
  }

  // Check if user can manage settings
  const canManageSettings = () => {
    return hasPermission('settings:update')
  }

  // Get user role information
  const getRoleInfo = () => {
    const roleMap = {
      super_admin: { label: 'Super Admin', level: 7, color: 'text-red-600' },
      admin: { label: 'Admin', level: 6, color: 'text-purple-600' },
      manager: { label: 'Manager', level: 5, color: 'text-blue-600' },
      supervisor: { label: 'Supervisor', level: 4, color: 'text-green-600' },
      auditor: { label: 'Auditor', level: 4, color: 'text-orange-600' },
      committee_member: { label: 'Committee Member', level: 3, color: 'text-indigo-600' },
      worker: { label: 'Worker', level: 2, color: 'text-gray-600' }
    }
    
    return roleMap[user?.role] || roleMap.worker
  }

  // Check if user can edit another user (based on role hierarchy)
  const canEditUser = (targetUser) => {
    if (!user || !targetUser) return false
    
    const roleMap = {
      super_admin: { label: 'Super Admin', level: 7, color: 'text-red-600' },
      admin: { label: 'Admin', level: 6, color: 'text-purple-600' },
      manager: { label: 'Manager', level: 5, color: 'text-blue-600' },
      supervisor: { label: 'Supervisor', level: 4, color: 'text-green-600' },
      auditor: { label: 'Auditor', level: 4, color: 'text-orange-600' },
      committee_member: { label: 'Committee Member', level: 3, color: 'text-indigo-600' },
      worker: { label: 'Worker', level: 2, color: 'text-gray-600' }
    }
    
    const currentUserLevel = getRoleInfo().level
    const targetUserLevel = roleMap[targetUser.role]?.level || 1
    
    // Super admins can edit anyone except other super admins
    if (user.role === 'super_admin') {
      return targetUser.role !== 'super_admin' || user.id === targetUser.id
    }
    
    // Admins can edit users below their level
    if (user.role === 'admin') {
      return targetUserLevel < currentUserLevel
    }
    
    // Users can only edit themselves
    return user.id === targetUser.id
  }

  return {
    permissions: userPermissions,
    loading,
    hasPermission,
    canAccessModule,
    canPerformAction,
    getAllPermissions,
    getAccessibleModules,
    isAdmin,
    isSuperAdmin,
    canManageUsers,
    canManageOrganization,
    canCreateCAPs,
    canHandleGrievances,
    canManageTraining,
    canManageCommittees,
    canViewReports,
    canCreateReports,
    canManageSettings,
    getRoleInfo,
    canEditUser
  }
}

// Helper function to check permissions without hook (for use outside components)
export const checkPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}

// Helper function to check module access without hook
export const checkModuleAccess = (userRole, module) => {
  return MODULE_ACCESS[module]?.includes(userRole) || false
}

export default usePermissions 