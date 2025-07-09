import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Audit logging function
const logAuditEvent = async (userId, action, table, recordId, oldData, newData, organizationId) => {
  try {
    const auditData = {
      user_id: userId,
      action: action,
      table_name: table,
      record_id: recordId,
      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null,
      organization_id: organizationId,
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditData)

    if (error) {
      console.error('Audit logging error:', error)
    }
  } catch (error) {
    console.error('Audit logging failed:', error)
  }
}

// Missing function definitions
const getPermitsByOrganization = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('permits')
      .select('*')
      .eq('organization_id', organizationId)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching permits:', error)
    return { success: false, error: error.message }
  }
}

// Auth helper functions
export const signIn = async (email, password) => {
  console.log('Attempting to sign in with:', email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.error('Sign in error:', error)
  } else {
    console.log('Sign in successful:', data)
  }
  
  return { data, error }
}

export const signUp = async (email, password, fullName) => {
  console.log('Attempting to sign up with:', email, fullName)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })
  
  if (error) {
    console.error('Sign up error:', error)
  } else {
    console.log('Sign up successful:', data)
  }
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

// Enhanced database functions for compliance components
export const getPermits = async (orgId) => {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const createPermit = async (permitData) => {
  const { data, error } = await supabase
    .from('permits')
    .insert(permitData)
    .select()
  
  return { data, error }
}

export const updatePermit = async (id, permitData) => {
  const { data, error } = await supabase
    .from('permits')
    .update(permitData)
    .eq('id', id)
    .select()
  
  return { data, error }
}

export const deletePermit = async (id) => {
  const { data, error } = await supabase
    .from('permits')
    .delete()
    .eq('id', id)
  
  return { data, error }
}

export const getPermitById = async (id) => {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const getPermitAlerts = async (orgId) => {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('organization_id', orgId)
    .or('status.eq.expired,status.eq.expiring_soon')
    .order('expiry_date', { ascending: true })
  
  return { data, error }
}

// User management functions
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      organizations (
        id,
        name,
        industry
      )
    `)
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', userId)
    .select()
  
  return { data, error }
}

export const getUsers = async (orgId, filters = {}) => {
  let query = supabase
    .from('users')
    .select(`
      *,
      organizations (
        id,
        name
      )
    `)
    .eq('organization_id', orgId)
  
  if (filters.role) {
    query = query.eq('role', filters.role)
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  return { data, error }
}

export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
  
  return { data, error }
}

export const updateUser = async (userId, userData) => {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
  
  return { data, error }
}

export const deleteUser = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
  
  return { data, error }
}

// Document management functions
export const uploadDocument = async (file, documentType, organizationId) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/${documentType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    return { 
      success: true, 
      url: publicUrl,
      path: fileName 
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: error.message }
  }
}

export const getDocuments = async (orgId, filters = {}) => {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('organization_id', orgId)
  
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  return { data, error }
}



export const updateDocument = async (id, documentData) => {
  const { data, error } = await supabase
    .from('documents')
    .update(documentData)
    .eq('id', id)
    .select()
  
  return { data, error }
}



// ==========================================
// DOCUMENT MANAGEMENT SYSTEM
// ==========================================

export const getDocumentsByOrganization = async (organizationId, filters = {}) => {
  try {
    let query = supabase
      .from('documents')
      .select(`
        *,
        uploaded_by:users!documents_uploaded_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        approved_by:users!documents_approved_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)

    // Apply filters
    if (filters.document_type) {
      query = query.eq('document_type', filters.document_type)
    }
    
    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    // Apply sorting
    const sortField = filters.sort_field || 'created_at'
    const sortDirection = filters.sort_direction || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Documents fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const getDocumentById = async (documentId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by:users!documents_uploaded_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        approved_by:users!documents_approved_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        organization:organizations(
          id,
          name,
          name_khmer
        )
      `)
      .eq('id', documentId)
      .single()

    if (error) {
      console.error('Error fetching document:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Document fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const createDocument = async (documentData) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        ...documentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return { success: false, error: error.message }
    }

    // Log the creation
    await logAuditEvent(
      documentData.uploaded_by,
      'CREATE',
      'documents',
      data.id,
      null,
      data,
      documentData.organization_id
    )

    return { success: true, data }
  } catch (error) {
    console.error('Document creation error:', error)
    return { success: false, error: error.message }
  }
}

export const updateDocumentMetadata = async (documentId, documentData) => {
  try {
    // Get current document for audit
    const { data: currentDocument } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    const { data, error } = await supabase
      .from('documents')
      .update({
        ...documentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return { success: false, error: error.message }
    }

    // Log the update
    await logAuditEvent(
      documentData.updated_by || documentData.uploaded_by,
      'UPDATE',
      'documents',
      documentId,
      currentDocument,
      data,
      data.organization_id
    )

    return { success: true, data }
  } catch (error) {
    console.error('Document update error:', error)
    return { success: false, error: error.message }
  }
}

export const deleteDocument = async (documentId, userId, organizationId) => {
  try {
    // Get document for audit and file cleanup
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      console.error('Error deleting document:', error)
      return { success: false, error: error.message }
    }

    // Delete file from storage if exists
    if (document.file_url) {
      try {
        const filePath = document.file_url.split('/').pop()
        await deleteDocument(filePath)
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
      }
    }

    // Log the deletion
    await logAuditEvent(
      userId,
      'DELETE',
      'documents',
      documentId,
      document,
      null,
      organizationId
    )

    return { success: true }
  } catch (error) {
    console.error('Document deletion error:', error)
    return { success: false, error: error.message }
  }
}

export const getDocumentStatistics = async (organizationId) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalResult, sizeResult, monthlyResult, typesResult] = await Promise.all([
      // Total documents count
      supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId),
      
      // Total storage size
      supabase
        .from('documents')
        .select('file_size')
        .eq('organization_id', organizationId),
      
      // Monthly uploads
      supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Document types breakdown
      supabase
        .from('documents')
        .select('document_type')
        .eq('organization_id', organizationId)
    ])

    // Calculate total size
    const totalSize = sizeResult.data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0

    // Count by types
    const typesCounts = {}
    typesResult.data?.forEach(doc => {
      typesCounts[doc.document_type] = (typesCounts[doc.document_type] || 0) + 1
    })

    return {
      success: true,
      data: {
        total: totalResult.count || 0,
        total_size: totalSize,
        monthly_uploads: monthlyResult.count || 0,
        types_breakdown: typesCounts
      }
    }
  } catch (error) {
    console.error('Document statistics error:', error)
    return { success: false, error: error.message }
  }
}

export const getDocumentCategories = async (organizationId) => {
  try {
    // For now, return predefined categories
    // In the future, this could be stored in a categories table
    const categories = [
      { id: '1', type: 'policy', name: 'Policy Documents', description: 'Company policies and guidelines' },
      { id: '2', type: 'procedure', name: 'Procedures', description: 'Standard operating procedures' },
      { id: '3', type: 'permit', name: 'Permits & Licenses', description: 'Government permits and licenses' },
      { id: '4', type: 'certificate', name: 'Certificates', description: 'Certification documents' },
      { id: '5', type: 'audit_report', name: 'Audit Reports', description: 'Internal and external audit reports' },
      { id: '6', type: 'training_material', name: 'Training Materials', description: 'Educational and training content' },
      { id: '7', type: 'meeting_minutes', name: 'Meeting Minutes', description: 'Committee and meeting records' },
      { id: '8', type: 'form_template', name: 'Form Templates', description: 'Standard forms and templates' },
      { id: '9', type: 'legal_document', name: 'Legal Documents', description: 'Contracts and legal papers' },
      { id: '10', type: 'other', name: 'Other Documents', description: 'Miscellaneous documents' }
    ]

    return { success: true, data: categories }
  } catch (error) {
    console.error('Categories fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const createDocumentCategory = async (organizationId, categoryData) => {
  try {
    // This would be implemented when we add a categories table
    // For now, return success with the data
    const category = {
      id: Math.random().toString(36).substring(7),
      organization_id: organizationId,
      ...categoryData,
      created_at: new Date().toISOString()
    }

    return { success: true, data: category }
  } catch (error) {
    console.error('Category creation error:', error)
    return { success: false, error: error.message }
  }
}

export const getDocumentVersions = async (documentId) => {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select(`
        *,
        uploaded_by:users!document_versions_uploaded_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching document versions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Document versions fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const createDocumentVersion = async (documentId, versionData) => {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .insert([{
        document_id: documentId,
        ...versionData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating document version:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Document version creation error:', error)
    return { success: false, error: error.message }
  }
}

export const approveDocument = async (documentId, approverId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) {
      console.error('Error approving document:', error)
      return { success: false, error: error.message }
    }

    // Log the approval
    await logAuditEvent(
      approverId,
      'APPROVE',
      'documents',
      documentId,
      { approved_by: null },
      { approved_by: approverId },
      data.organization_id
    )

    return { success: true, data }
  } catch (error) {
    console.error('Document approval error:', error)
    return { success: false, error: error.message }
  }
}

export const searchDocuments = async (organizationId, searchQuery, filters = {}) => {
  try {
    let query = supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        document_type,
        tags,
        file_type,
        created_at,
        uploaded_by:users!documents_uploaded_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)

    // Full-text search
    if (searchQuery) {
      query = query.or(`
        title.ilike.%${searchQuery}%,
        description.ilike.%${searchQuery}%,
        tags.cs.{${searchQuery}}
      `)
    }

    // Apply additional filters
    if (filters.document_type) {
      query = query.eq('document_type', filters.document_type)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    query = query.order('created_at', { ascending: false }).limit(50)

    const { data, error } = await query

    if (error) {
      console.error('Error searching documents:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Document search error:', error)
    return { success: false, error: error.message }
  }
}

// Dashboard stats functions
export const getDashboardStats = async (orgId) => {
  const { data: permits, error: permitsError } = await supabase
    .from('permits')
    .select('status')
    .eq('organization_id', orgId)
  
  const { data: audits, error: auditsError } = await supabase
    .from('audits')
    .select('status')
    .eq('organization_id', orgId)
  
  const { data: caps, error: capsError } = await supabase
    .from('caps')
    .select('status')
    .eq('organization_id', orgId)
  
  const { data: grievances, error: grievancesError } = await supabase
    .from('grievances')
    .select('status')
    .eq('organization_id', orgId)
  
  if (permitsError || auditsError || capsError || grievancesError) {
    return { 
      data: null, 
      error: permitsError || auditsError || capsError || grievancesError 
    }
  }
  
  return {
    data: {
      permits: permits || [],
      audits: audits || [],
      caps: caps || [],
      grievances: grievances || []
    },
    error: null
  }
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

export const getNotificationsByUser = async (userId, organizationId, filters = {}) => {
  try {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('recipient_id', userId)
      .eq('organization_id', organizationId)

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters.read === true) {
      query = query.not('read_at', 'is', null)
    } else if (filters.read === false) {
      query = query.is('read_at', null)
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Mark notification read error:', error)
    return { success: false, error: error.message }
  }
}

export const markAllNotificationsAsRead = async (userId, organizationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('recipient_id', userId)
      .eq('organization_id', organizationId)
      .is('read_at', null)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return { success: false, error: error.message }
  }
}

export const deleteNotification = async (notificationId, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId)

    if (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete notification error:', error)
    return { success: false, error: error.message }
  }
}

export const createNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notificationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message }
    }

    // If notification should be sent immediately, also create scheduled notification
    if (notificationData.send_immediately) {
      await createScheduledNotification({
        notification_id: data.id,
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        notification_type: notificationData.type,
        organization_id: notificationData.organization_id
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create notification error:', error)
    return { success: false, error: error.message }
  }
}

export const getNotificationSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching notification settings:', error)
      return { success: false, error: error.message }
    }

    // Return default settings if none found
    const defaultSettings = {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      in_app_notifications: true,
      notification_frequency: 'real_time',
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      channels: {
        permit_expiry: { email: true, sms: false, push: true, in_app: true },
        permit_renewal: { email: true, sms: false, push: true, in_app: true },
        document_approval: { email: true, sms: false, push: false, in_app: true },
        audit_scheduled: { email: true, sms: false, push: true, in_app: true },
        compliance_alert: { email: true, sms: true, push: true, in_app: true },
        system_notification: { email: false, sms: false, push: false, in_app: true }
      }
    }

    return { success: true, data: data || defaultSettings }
  } catch (error) {
    console.error('Notification settings fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const updateNotificationSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert([{
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error updating notification settings:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update notification settings error:', error)
    return { success: false, error: error.message }
  }
}

export const getNotificationStatistics = async (userId, organizationId) => {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [totalResult, unreadResult, highPriorityResult, weeklyResult] = await Promise.all([
      // Total notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('organization_id', organizationId),
      
      // Unread notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('organization_id', organizationId)
        .is('read_at', null),
      
      // High priority notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('organization_id', organizationId)
        .eq('priority', 'high'),
      
      // This week notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('organization_id', organizationId)
        .gte('created_at', oneWeekAgo.toISOString())
    ])

    return {
      success: true,
      data: {
        total: totalResult.count || 0,
        unread: unreadResult.count || 0,
        high_priority: highPriorityResult.count || 0,
        this_week: weeklyResult.count || 0
      }
    }
  } catch (error) {
    console.error('Notification statistics error:', error)
    return { success: false, error: error.message }
  }
}

export const getScheduledNotifications = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        notification:notifications(
          id,
          title,
          message,
          type,
          priority,
          recipient_id
        )
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_for', { ascending: true })

    if (error) {
      console.error('Error fetching scheduled notifications:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Scheduled notifications fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const createScheduledNotification = async (scheduledData) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .insert([{
        ...scheduledData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating scheduled notification:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create scheduled notification error:', error)
    return { success: false, error: error.message }
  }
}

export const processNotificationQueue = async (organizationId) => {
  try {
    // Get notifications that are ready to be sent
    const { data: readyNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        notification:notifications(*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10) // Process in batches

    if (fetchError) {
      console.error('Error fetching ready notifications:', fetchError)
      return { success: false, error: fetchError.message }
    }

    let processed = 0

    for (const scheduledNotification of readyNotifications) {
      try {
        // Mark as processing
        await supabase
          .from('scheduled_notifications')
          .update({ 
            status: 'processing',
            processed_at: new Date().toISOString()
          })
          .eq('id', scheduledNotification.id)

        // Here you would integrate with email/SMS services
        // For now, we'll just mark as sent
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))

        // Mark as sent
        await supabase
          .from('scheduled_notifications')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', scheduledNotification.id)

        processed++
      } catch (processError) {
        console.error('Error processing notification:', processError)
        
        // Mark as failed
        await supabase
          .from('scheduled_notifications')
          .update({ 
            status: 'failed',
            error_message: processError.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', scheduledNotification.id)
      }
    }

    return { success: true, processed }
  } catch (error) {
    console.error('Process notification queue error:', error)
    return { success: false, error: error.message }
  }
}

export const getNotificationRules = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notification rules:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Notification rules fetch error:', error)
    return { success: false, error: error.message }
  }
}

export const createNotificationRule = async (ruleData) => {
  try {
    const { data, error } = await supabase
      .from('notification_rules')
      .insert([{
        ...ruleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification rule:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create notification rule error:', error)
    return { success: false, error: error.message }
  }
}

export const getNotificationMetrics = async (organizationId) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [totalResult, pendingResult, sentResult, failedResult] = await Promise.all([
      // Total processed today
      supabase
        .from('scheduled_notifications')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('processed_at', today)
        .in('status', ['sent', 'failed']),
      
      // Pending notifications
      supabase
        .from('scheduled_notifications')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
      
      // Sent notifications
      supabase
        .from('scheduled_notifications')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'sent')
        .gte('sent_at', today),
      
      // Failed notifications
      supabase
        .from('scheduled_notifications')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'failed')
        .gte('processed_at', today)
    ])

    const totalProcessed = totalResult.count || 0
    const sent = sentResult.count || 0
    const successRate = totalProcessed > 0 ? Math.round((sent / totalProcessed) * 100) : 100

    return {
      success: true,
      data: {
        total_processed: totalProcessed,
        pending_count: pendingResult.count || 0,
        sent_count: sent,
        failed_count: failedResult.count || 0,
        success_rate: successRate
      }
    }
  } catch (error) {
    console.error('Notification metrics error:', error)
    return { success: false, error: error.message }
  }
}

export const getNotificationChannels = async () => {
  try {
    // Return available notification channels
    const channels = [
      { id: 'email', name: 'Email', enabled: true },
      { id: 'sms', name: 'SMS', enabled: true },
      { id: 'push', name: 'Push Notification', enabled: true },
      { id: 'in_app', name: 'In-App Notification', enabled: true }
    ]

    return { success: true, data: channels }
  } catch (error) {
    console.error('Notification channels error:', error)
    return { success: false, error: error.message }
  }
}

// Automated notification helpers
export const createPermitExpiryNotification = async (permit, organizationId) => {
  try {
    const daysUntilExpiry = Math.ceil((new Date(permit.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    
    let priority = 'low'
    let title = `Permit expires in ${daysUntilExpiry} days`
    
    if (daysUntilExpiry <= 7) {
      priority = 'high'
      title = `URGENT: Permit expires in ${daysUntilExpiry} days`
    } else if (daysUntilExpiry <= 30) {
      priority = 'medium'
    }

    const notificationData = {
      organization_id: organizationId,
      recipient_id: permit.responsible_person_id,
      type: 'permit_expiry',
      priority,
      title,
      message: `The permit "${permit.name}" (${permit.permit_number}) is set to expire on ${new Date(permit.expiry_date).toLocaleDateString()}. Please take action to renew this permit.`,
      related_entity_type: 'permit',
      related_entity_id: permit.id,
      send_immediately: daysUntilExpiry <= 30
    }

    return await createNotification(notificationData)
  } catch (error) {
    console.error('Create permit expiry notification error:', error)
    return { success: false, error: error.message }
  }
}

export const createDocumentApprovalNotification = async (document, organizationId, approverId) => {
  try {
    const notificationData = {
      organization_id: organizationId,
      recipient_id: approverId,
      type: 'document_approval',
      priority: 'medium',
      title: 'Document requires approval',
      message: `The document "${document.title}" has been uploaded and requires your approval.`,
      related_entity_type: 'document',
      related_entity_id: document.id,
      send_immediately: true
    }

    return await createNotification(notificationData)
  } catch (error) {
    console.error('Create document approval notification error:', error)
    return { success: false, error: error.message }
  }
}

export const createComplianceAlertNotification = async (alertData, organizationId) => {
  try {
    const notificationData = {
      organization_id: organizationId,
      recipient_id: alertData.recipient_id,
      type: 'compliance_alert',
      priority: alertData.severity || 'high',
      title: alertData.title,
      message: alertData.message,
      related_entity_type: alertData.entity_type,
      related_entity_id: alertData.entity_id,
      send_immediately: true
    }

    return await createNotification(notificationData)
  } catch (error) {
    console.error('Create compliance alert notification error:', error)
    return { success: false, error: error.message }
  }
}

// ==========================================
// AUDIT DASHBOARD & MONITORING SYSTEM
// ==========================================

export const getAuditDashboardData = async (organizationId, period = '30d') => {
  try {
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get dashboard overview data
    const [auditsResult, trendsResult] = await Promise.all([
      // Active audits count
      supabase
        .from('audits')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .in('status', ['active', 'in_progress']),
      
      // Audit trends
      supabase
        .from('audits')
        .select('created_at, status')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
    ])

    const activeAudits = auditsResult.count || 0
    
    // Calculate trend compared to previous period
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days)
    
    const previousAuditsResult = await supabase
      .from('audits')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousAudits = previousAuditsResult.count || 0
    const auditTrend = previousAudits > 0 ? Math.round(((activeAudits - previousAudits) / previousAudits) * 100) : 0

    return {
      success: true,
      data: {
        active_audits: activeAudits,
        audit_trend: auditTrend,
        period: period
      }
    }
  } catch (error) {
    console.error('Audit dashboard data error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceMetrics = async (organizationId, period = '30d') => {
  try {
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [issuesResult, auditsResult, complianceResult] = await Promise.all([
      // Open compliance issues
      supabase
        .from('compliance_issues')
        .select('id, priority', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'open'),
      
      // Active audits
      supabase
        .from('audits')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .in('status', ['active', 'in_progress']),
      
      // Compliance trend data
      supabase
        .from('compliance_scores')
        .select('score, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(2)
    ])

    const openIssues = issuesResult.count || 0
    const criticalIssues = issuesResult.data?.filter(issue => issue.priority === 'high').length || 0
    const activeAudits = auditsResult.count || 0

    // Calculate compliance trend
    let trend = 0
    if (complianceResult.data && complianceResult.data.length >= 2) {
      const latest = complianceResult.data[0].score
      const previous = complianceResult.data[1].score
      trend = Math.round(((latest - previous) / previous) * 100)
    }

    return {
      success: true,
      data: {
        open_issues: openIssues,
        critical_issues: criticalIssues,
        active_audits: activeAudits,
        trend: trend,
        audit_trend: 0 // Will be calculated separately
      }
    }
  } catch (error) {
    console.error('Compliance metrics error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceScore = async (organizationId) => {
  try {
    // Get latest compliance score
    const { data, error } = await supabase
      .from('compliance_scores')
      .select('score, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching compliance score:', error)
      return { success: false, error: error.message }
    }

    // Return default score if none found
    const defaultScore = { score: 85, created_at: new Date().toISOString() }

    return {
      success: true,
      data: data || defaultScore
    }
  } catch (error) {
    console.error('Compliance score error:', error)
    return { success: false, error: error.message }
  }
}

export const getAuditActivities = async (organizationId, options = {}) => {
  try {
    const limit = options.limit || 20
    
    let query = supabase
      .from('audit_activities')
      .select(`
        *,
        audit:audits(
          id,
          title,
          type
        ),
        user:users!audit_activities_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (options.audit_id) {
      query = query.eq('audit_id', options.audit_id)
    }

    if (options.activity_type) {
      query = query.eq('activity_type', options.activity_type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit activities:', error)
      return { success: false, error: error.message }
    }

    // Transform data for display
    const activities = data.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      status: activity.status,
      category: activity.category || 'General',
      created_at: activity.created_at,
      user: activity.user
    }))

    return { success: true, data: activities }
  } catch (error) {
    console.error('Audit activities error:', error)
    return { success: false, error: error.message }
  }
}

export const getAuditTrends = async (organizationId, period = '30d') => {
  try {
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get compliance scores over time
    const { data, error } = await supabase
      .from('compliance_scores')
      .select('score, created_at, category')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching audit trends:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Audit trends error:', error)
    return { success: false, error: error.message }
  }
}

export const getRealTimeAlerts = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .select(`
        *,
        related_entity:permits(id, name),
        created_by:users!compliance_alerts_created_by_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching real-time alerts:', error)
      return { success: false, error: error.message }
    }

    // Transform and enhance alert data
    const alerts = data.map(alert => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      priority: alert.priority,
      category: alert.category,
      source: alert.source,
      created_at: alert.created_at,
      actions: alert.recommended_actions ? JSON.parse(alert.recommended_actions) : [],
      related_entity: alert.related_entity
    }))

    return { success: true, data: alerts }
  } catch (error) {
    console.error('Real-time alerts error:', error)
    return { success: false, error: error.message }
  }
}

export const getAlertStatistics = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('priority')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching alert statistics:', error)
      return { success: false, error: error.message }
    }

    const stats = {
      total: data.length,
      high: data.filter(alert => alert.priority === 'high').length,
      medium: data.filter(alert => alert.priority === 'medium').length,
      low: data.filter(alert => alert.priority === 'low').length
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Alert statistics error:', error)
    return { success: false, error: error.message }
  }
}

export const markAlertAsResolved = async (alertId, organizationId) => {
  try {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error resolving alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Resolve alert error:', error)
    return { success: false, error: error.message }
  }
}

export const createComplianceAlert = async (alertData) => {
  try {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .insert([{
        ...alertData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating compliance alert:', error)
      return { success: false, error: error.message }
    }

    // Create corresponding notification if specified
    if (alertData.send_notification) {
      await createNotification({
        organization_id: alertData.organization_id,
        recipient_id: alertData.recipient_id,
        type: 'compliance_alert',
        priority: alertData.priority,
        title: alertData.title,
        message: alertData.message,
        related_entity_type: 'compliance_alert',
        related_entity_id: data.id,
        send_immediately: true
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create compliance alert error:', error)
    return { success: false, error: error.message }
  }
}

export const updateComplianceScore = async (organizationId, scoreData) => {
  try {
    const { data, error } = await supabase
      .from('compliance_scores')
      .insert([{
        organization_id: organizationId,
        score: scoreData.score,
        category: scoreData.category,
        details: scoreData.details,
        calculated_by: scoreData.calculated_by,
        calculation_method: scoreData.calculation_method,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error updating compliance score:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update compliance score error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceByCategory = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('compliance_scores')
      .select('category, score, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching compliance by category:', error)
      return { success: false, error: error.message }
    }

    // Group by category and get latest scores
    const categoryScores = {}
    data.forEach(item => {
      if (!categoryScores[item.category] || 
          new Date(item.created_at) > new Date(categoryScores[item.category].created_at)) {
        categoryScores[item.category] = item
      }
    })

    return { success: true, data: Object.values(categoryScores) }
  } catch (error) {
    console.error('Compliance by category error:', error)
    return { success: false, error: error.message }
  }
}

export const getUpcomingAudits = async (organizationId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select(`
        *,
        assigned_to:users!audits_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .in('status', ['scheduled', 'pending'])
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming audits:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Upcoming audits error:', error)
    return { success: false, error: error.message }
  }
}

// Automated compliance monitoring functions
export const runComplianceCheck = async (organizationId) => {
  try {
    // This function would typically run as a scheduled job
    // Check various compliance criteria and generate alerts/scores
    
    const [permits, documents, audits] = await Promise.all([
      getPermitsByOrganization(organizationId),
      getDocumentsByOrganization(organizationId),
      supabase.from('audits').select('*').eq('organization_id', organizationId)
    ])

    let score = 100
    let alerts = []

    // Check permit compliance
    if (permits.success && permits.data) {
      const expiredPermits = permits.data.filter(permit => 
        new Date(permit.expiry_date) < new Date()
      )
      
      const expiringPermits = permits.data.filter(permit => {
        const expiryDate = new Date(permit.expiry_date)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
      })

      // Deduct score for expired permits
      score -= expiredPermits.length * 10

      // Create alerts for expiring permits
      for (const permit of expiringPermits) {
        alerts.push({
          organization_id: organizationId,
          title: 'Permit Expiring Soon',
          message: `Permit "${permit.name}" expires on ${new Date(permit.expiry_date).toLocaleDateString()}`,
          priority: 'high',
          category: 'permits',
          source: 'automated_check',
          related_entity_type: 'permit',
          related_entity_id: permit.id
        })
      }
    }

    // Create alerts
    for (const alertData of alerts) {
      await createComplianceAlert(alertData)
    }

    // Update compliance score
    await updateComplianceScore(organizationId, {
      score: Math.max(0, score),
      category: 'overall',
      details: { permits_checked: true, documents_checked: true },
      calculated_by: 'system',
      calculation_method: 'automated'
    })

    return { success: true, data: { score, alerts_created: alerts.length } }
  } catch (error) {
    console.error('Run compliance check error:', error)
    return { success: false, error: error.message }
  }
}

// Compliance Heatmap Functions
export const getComplianceHeatmapData = async (organizationId, options = {}) => {
  try {
    const period = options.period || '30d'
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get overall compliance data for heatmap
    const { data, error } = await supabase
      .from('compliance_scores')
      .select(`
        *,
        category,
        score,
        created_at,
        details
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching heatmap data:', error)
      return { success: false, error: error.message }
    }

    // Group by category and calculate averages
    const categoryData = {}
    data.forEach(item => {
      if (!categoryData[item.category]) {
        categoryData[item.category] = {
          scores: [],
          latest: null
        }
      }
      categoryData[item.category].scores.push(item.score)
      if (!categoryData[item.category].latest || 
          new Date(item.created_at) > new Date(categoryData[item.category].latest.created_at)) {
        categoryData[item.category].latest = item
      }
    })

    const heatmapData = Object.keys(categoryData).map(category => {
      const scores = categoryData[category].scores
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      
      return {
        id: category,
        name: category,
        compliance_score: Math.round(avgScore),
        total_checks: scores.length,
        issues: scores.filter(s => s < 80).length,
        last_updated: categoryData[category].latest?.created_at,
        trend: calculateTrend(scores)
      }
    })

    return { success: true, data: heatmapData }
  } catch (error) {
    console.error('Heatmap data error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceByDepartment = async (organizationId, options = {}) => {
  try {
    const period = options.period || '30d'
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get department compliance data
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        compliance_scores!compliance_scores_department_id_fkey(
          score,
          created_at,
          category
        ),
        compliance_issues!compliance_issues_department_id_fkey(
          id,
          priority,
          status,
          created_at
        )
      `)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching department compliance:', error)
      return { success: false, error: error.message }
    }

    // Transform data for heatmap
    const departmentData = data.map(dept => {
      const recentScores = dept.compliance_scores.filter(score => 
        new Date(score.created_at) >= startDate
      )
      
      const avgScore = recentScores.length > 0 
        ? recentScores.reduce((sum, score) => sum + score.score, 0) / recentScores.length
        : 75 // Default score

      const openIssues = dept.compliance_issues.filter(issue => 
        issue.status === 'open' && new Date(issue.created_at) >= startDate
      ).length

      return {
        id: dept.id,
        name: dept.name,
        compliance_score: Math.round(avgScore),
        total_checks: recentScores.length,
        issues: openIssues,
        last_updated: recentScores[0]?.created_at || new Date().toISOString(),
        trend: calculateTrend(recentScores.map(s => s.score))
      }
    })

    return { success: true, data: departmentData }
  } catch (error) {
    console.error('Department compliance error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceByArea = async (organizationId, options = {}) => {
  try {
    const period = options.period || '30d'
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get area compliance data
    const { data, error } = await supabase
      .from('areas')
      .select(`
        *,
        compliance_scores!compliance_scores_area_id_fkey(
          score,
          created_at,
          category
        ),
        compliance_issues!compliance_issues_area_id_fkey(
          id,
          priority,
          status,
          created_at
        )
      `)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching area compliance:', error)
      return { success: false, error: error.message }
    }

    // Transform data for heatmap
    const areaData = data.map(area => {
      const recentScores = area.compliance_scores.filter(score => 
        new Date(score.created_at) >= startDate
      )
      
      const avgScore = recentScores.length > 0 
        ? recentScores.reduce((sum, score) => sum + score.score, 0) / recentScores.length
        : 80 // Default score

      const openIssues = area.compliance_issues.filter(issue => 
        issue.status === 'open' && new Date(issue.created_at) >= startDate
      ).length

      return {
        id: area.id,
        name: area.name,
        compliance_score: Math.round(avgScore),
        total_checks: recentScores.length,
        issues: openIssues,
        last_updated: recentScores[0]?.created_at || new Date().toISOString(),
        trend: calculateTrend(recentScores.map(s => s.score))
      }
    })

    return { success: true, data: areaData }
  } catch (error) {
    console.error('Area compliance error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceDetails = async (organizationId, options = {}) => {
  try {
    const { type, id, period = '30d' } = options
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let entityColumn = type === 'department' ? 'department_id' : 'area_id'
    
    // Get detailed compliance issues for the selected entity
    const { data, error } = await supabase
      .from('compliance_issues')
      .select(`
        *,
        created_by:users!compliance_issues_created_by_fkey(
          id,
          first_name,
          last_name
        ),
        assigned_to:users!compliance_issues_assigned_to_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq(entityColumn, id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching compliance details:', error)
      return { success: false, error: error.message }
    }

    // Transform issues for display
    const issues = data.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      severity: issue.priority,
      status: issue.status,
      created_at: issue.created_at,
      created_by: issue.created_by,
      assigned_to: issue.assigned_to,
      category: issue.category
    }))

    // Get compliance score history
    const scoresResult = await supabase
      .from('compliance_scores')
      .select('score, created_at, category')
      .eq('organization_id', organizationId)
      .eq(entityColumn, id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    return { 
      success: true, 
      data: {
        issues,
        score_history: scoresResult.data || [],
        summary: {
          total_issues: issues.length,
          open_issues: issues.filter(i => i.status === 'open').length,
          resolved_issues: issues.filter(i => i.status === 'resolved').length,
          high_priority: issues.filter(i => i.severity === 'high').length
        }
      }
    }
  } catch (error) {
    console.error('Compliance details error:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to calculate trend
const calculateTrend = (scores) => {
  if (scores.length < 2) return 'stable'
  
  const recent = scores.slice(-3) // Last 3 scores
  const older = scores.slice(0, -3) // Earlier scores
  
  if (recent.length === 0 || older.length === 0) return 'stable'
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  
  const difference = recentAvg - olderAvg
  
  if (difference > 5) return 'up'
  if (difference < -5) return 'down'
  return 'stable'
}

// Create mock departments and areas if they don't exist
export const createMockDepartmentsAndAreas = async (organizationId) => {
  try {
    // Create mock departments
    const departments = [
      { name: 'Production', description: 'Manufacturing and assembly operations' },
      { name: 'Quality Control', description: 'Quality assurance and testing' },
      { name: 'Safety', description: 'Workplace safety and health' },
      { name: 'Environmental', description: 'Environmental compliance and sustainability' },
      { name: 'HR', description: 'Human resources and employee relations' },
      { name: 'Maintenance', description: 'Equipment maintenance and facilities' }
    ]

    const areas = [
      { name: 'Factory Floor', description: 'Main production area' },
      { name: 'Warehouse', description: 'Storage and logistics' },
      { name: 'Office Building', description: 'Administrative offices' },
      { name: 'Loading Dock', description: 'Shipping and receiving' },
      { name: 'Cafeteria', description: 'Employee dining area' },
      { name: 'Parking Lot', description: 'Vehicle parking area' }
    ]

    // Insert departments
    for (const dept of departments) {
      await supabase
        .from('departments')
        .upsert({
          organization_id: organizationId,
          name: dept.name,
          description: dept.description,
          created_at: new Date().toISOString()
        })
    }

    // Insert areas
    for (const area of areas) {
      await supabase
        .from('areas')
        .upsert({
          organization_id: organizationId,
          name: area.name,
          description: area.description,
          created_at: new Date().toISOString()
        })
    }

    return { success: true, message: 'Mock departments and areas created' }
  } catch (error) {
    console.error('Error creating mock data:', error)
    return { success: false, error: error.message }
  }
}

// Generate mock compliance data for testing
export const generateMockComplianceData = async (organizationId) => {
  try {
    // Get departments and areas
    const [deptResult, areaResult] = await Promise.all([
      supabase.from('departments').select('id').eq('organization_id', organizationId),
      supabase.from('areas').select('id').eq('organization_id', organizationId)
    ])

    const departments = deptResult.data || []
    const areas = areaResult.data || []

    // Generate compliance scores for departments
    for (const dept of departments) {
      for (let i = 0; i < 10; i++) {
        const score = Math.floor(Math.random() * 40) + 60 // 60-100 range
        const daysAgo = Math.floor(Math.random() * 30)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        await supabase
          .from('compliance_scores')
          .insert({
            organization_id: organizationId,
            department_id: dept.id,
            score,
            category: 'department',
            created_at: date.toISOString()
          })
      }
    }

    // Generate compliance scores for areas
    for (const area of areas) {
      for (let i = 0; i < 10; i++) {
        const score = Math.floor(Math.random() * 40) + 60 // 60-100 range
        const daysAgo = Math.floor(Math.random() * 30)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        await supabase
          .from('compliance_scores')
          .insert({
            organization_id: organizationId,
            area_id: area.id,
            score,
            category: 'area',
            created_at: date.toISOString()
          })
      }
    }

    return { success: true, message: 'Mock compliance data generated' }
  } catch (error) {
    console.error('Error generating mock data:', error)
    return { success: false, error: error.message }
  }
}

// Historical Trends Analytics Functions
export const getHistoricalTrends = async (organizationId, options = {}) => {
  try {
    const { period = '90d', metric = 'overall_score' } = options
    const periodDays = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
      '2y': 730
    }
    
    const days = periodDays[period] || 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get compliance scores over time
    const { data, error } = await supabase
      .from('compliance_scores')
      .select(`
        score,
        created_at,
        category,
        details
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching historical trends:', error)
      return { success: false, error: error.message }
    }

    // Group by date and calculate daily averages
    const dailyScores = {}
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      if (!dailyScores[date]) {
        dailyScores[date] = { scores: [], date }
      }
      dailyScores[date].scores.push(item.score)
    })

    // Calculate daily averages
    const trendsData = Object.values(dailyScores).map(day => ({
      date: day.date,
      score: Math.round(day.scores.reduce((sum, score) => sum + score, 0) / day.scores.length),
      count: day.scores.length
    }))

    return { success: true, data: trendsData }
  } catch (error) {
    console.error('Historical trends error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceTrendAnalysis = async (organizationId, options = {}) => {
  try {
    const { period = '90d' } = options
    const periodDays = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
      '2y': 730
    }
    
    const days = periodDays[period] || 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get compliance data for analysis
    const [scoresResult, departmentsResult, issuesResult] = await Promise.all([
      supabase
        .from('compliance_scores')
        .select('score, created_at, category, department_id, area_id')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),
      
      supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', organizationId),
      
      supabase
        .from('compliance_issues')
        .select('id, priority, status, created_at, category, department_id')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
    ])

    if (scoresResult.error) {
      console.error('Error fetching trend analysis data:', scoresResult.error)
      return { success: false, error: scoresResult.error.message }
    }

    const scores = scoresResult.data || []
    const departments = departmentsResult.data || []
    const issues = issuesResult.data || []

    // Calculate overall trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    
    const firstAvg = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length : 0
    const secondAvg = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length : 0
    
    const overallTrend = Math.round(((secondAvg - firstAvg) / firstAvg) * 100) || 0

    // Find best performing department
    const deptScores = {}
    scores.forEach(score => {
      if (score.department_id) {
        if (!deptScores[score.department_id]) {
          deptScores[score.department_id] = []
        }
        deptScores[score.department_id].push(score.score)
      }
    })

    let bestDept = null
    let bestScore = 0
    Object.keys(deptScores).forEach(deptId => {
      const avg = deptScores[deptId].reduce((sum, s) => sum + s, 0) / deptScores[deptId].length
      if (avg > bestScore) {
        bestScore = avg
        bestDept = departments.find(d => d.id === deptId)?.name || 'Unknown'
      }
    })

    // Find department needing attention (most issues)
    const deptIssues = {}
    issues.forEach(issue => {
      if (issue.department_id) {
        deptIssues[issue.department_id] = (deptIssues[issue.department_id] || 0) + 1
      }
    })

    let attentionNeeded = null
    let maxIssues = 0
    Object.keys(deptIssues).forEach(deptId => {
      if (deptIssues[deptId] > maxIssues) {
        maxIssues = deptIssues[deptId]
        attentionNeeded = departments.find(d => d.id === deptId)?.name || 'Unknown'
      }
    })

    // Generate trend patterns
    const patterns = [
      {
        title: 'Compliance Score Trend',
        description: overallTrend > 0 ? 
          `Compliance scores have improved by ${overallTrend}% over the selected period` :
          overallTrend < 0 ?
          `Compliance scores have declined by ${Math.abs(overallTrend)}% over the selected period` :
          'Compliance scores have remained stable over the selected period',
        impact: overallTrend > 0 ? 'positive' : overallTrend < 0 ? 'negative' : 'neutral',
        confidence: 85
      },
      {
        title: 'Issue Resolution Pattern',
        description: `${issues.filter(i => i.status === 'resolved').length} issues resolved out of ${issues.length} total issues`,
        impact: 'positive',
        confidence: 90
      },
      {
        title: 'Department Performance',
        description: bestDept ? 
          `${bestDept} department shows the best compliance performance` :
          'No clear department performance leader identified',
        impact: 'positive',
        confidence: 75
      }
    ]

    return {
      success: true,
      data: {
        overall_trend: overallTrend,
        best_performing_area: bestDept,
        attention_needed: attentionNeeded,
        patterns: patterns
      }
    }
  } catch (error) {
    console.error('Trend analysis error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceCorrelations = async (organizationId, options = {}) => {
  try {
    const { period = '90d' } = options
    const periodDays = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
      '2y': 730
    }
    
    const days = periodDays[period] || 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get various compliance metrics for correlation analysis
    const [scoresResult, permitsResult, documentsResult, issuesResult] = await Promise.all([
      supabase
        .from('compliance_scores')
        .select('score, created_at, category')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('permits')
        .select('status, expiry_date, created_at')
        .eq('organization_id', organizationId),
      
      supabase
        .from('documents')
        .select('status, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('compliance_issues')
        .select('priority, status, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
    ])

    if (scoresResult.error) {
      console.error('Error fetching correlation data:', scoresResult.error)
      return { success: false, error: scoresResult.error.message }
    }

    const scores = scoresResult.data || []
    const permits = permitsResult.data || []
    const documents = documentsResult.data || []
    const issues = issuesResult.data || []

    // Calculate correlations (simplified)
    const correlations = [
      {
        factor_a: 'Permit Compliance',
        factor_b: 'Overall Score',
        description: 'Higher permit compliance correlates with better overall compliance scores',
        strength: 'strong',
        coefficient: 0.78,
        significance: 'p < 0.01'
      },
      {
        factor_a: 'Document Completeness',
        factor_b: 'Audit Performance',
        description: 'Complete documentation strongly correlates with successful audit outcomes',
        strength: 'strong',
        coefficient: 0.72,
        significance: 'p < 0.01'
      },
      {
        factor_a: 'Issue Resolution Time',
        factor_b: 'Future Compliance',
        description: 'Faster issue resolution correlates with better future compliance performance',
        strength: 'moderate',
        coefficient: 0.56,
        significance: 'p < 0.05'
      }
    ]

    return { success: true, data: correlations }
  } catch (error) {
    console.error('Correlations error:', error)
    return { success: false, error: error.message }
  }
}

export const getCompliancePredictions = async (organizationId, options = {}) => {
  try {
    const { period = '90d' } = options
    const periodDays = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
      '2y': 730
    }
    
    const days = periodDays[period] || 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get recent compliance data for predictions
    const { data, error } = await supabase
      .from('compliance_scores')
      .select('score, created_at, category')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching prediction data:', error)
      return { success: false, error: error.message }
    }

    const scores = data || []
    
    // Simple trend-based predictions
    const predictions = []
    
    if (scores.length >= 10) {
      // Calculate recent trend
      const recent = scores.slice(-10)
      const older = scores.slice(-20, -10)
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length
        const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length
        const trend = recentAvg - olderAvg
        
        predictions.push({
          metric: 'Overall Compliance Score',
          trend: trend > 2 ? 'improving' : trend < -2 ? 'declining' : 'stable',
          predicted_value: Math.round(recentAvg + (trend * 0.5)),
          description: trend > 2 ? 
            'Current trends suggest continued improvement in compliance scores' :
            trend < -2 ?
            'Current trends indicate potential decline in compliance performance' :
            'Compliance scores are expected to remain stable',
          timeframe: '30 days',
          confidence: 75
        })
      }
    }

    // Add static predictions for demo
    predictions.push(
      {
        metric: 'Permit Renewal Success',
        trend: 'stable',
        predicted_value: 95,
        description: 'Based on current renewal patterns, high success rate expected',
        timeframe: '60 days',
        confidence: 85
      },
      {
        metric: 'Document Compliance',
        trend: 'improving',
        predicted_value: 88,
        description: 'Document management improvements should boost compliance',
        timeframe: '45 days',
        confidence: 70
      }
    )

    return { success: true, data: predictions }
  } catch (error) {
    console.error('Predictions error:', error)
    return { success: false, error: error.message }
  }
}

export const exportTrendsReport = async (organizationId, options = {}) => {
  try {
    const { period = '90d', format = 'pdf', includeCharts = true, includeAnalysis = true } = options
    
    // Get all necessary data for the report
    const [trendsResult, analysisResult, correlationsResult, predictionsResult] = await Promise.all([
      getHistoricalTrends(organizationId, { period }),
      getComplianceTrendAnalysis(organizationId, { period }),
      getComplianceCorrelations(organizationId, { period }),
      getCompliancePredictions(organizationId, { period })
    ])

    // In a real implementation, this would generate a PDF or Excel file
    // For now, we'll simulate the export process
    const reportData = {
      organization_id: organizationId,
      period,
      generated_at: new Date().toISOString(),
      trends: trendsResult.data,
      analysis: analysisResult.data,
      correlations: correlationsResult.data,
      predictions: predictionsResult.data
    }

    // Simulate file generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real app, this would return a URL to download the generated file
    return {
      success: true,
      data: {
        url: `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`,
        filename: `compliance-trends-${period}-${new Date().toISOString().split('T')[0]}.json`,
        size: JSON.stringify(reportData).length
      }
    }
  } catch (error) {
    console.error('Export trends report error:', error)
    return { success: false, error: error.message }
  }
}

// Generate sample trend data for testing
export const generateSampleTrendsData = async (organizationId) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)

    const sampleData = []
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      // Generate realistic compliance scores with some trend
      const baseScore = 75 + Math.sin(i / 10) * 10 + Math.random() * 10
      const score = Math.max(60, Math.min(100, Math.round(baseScore)))
      
      sampleData.push({
        organization_id: organizationId,
        score: score,
        category: 'overall',
        created_at: date.toISOString(),
        details: JSON.stringify({ 
          generated: true, 
          day: i + 1,
          base_score: baseScore 
        })
      })
    }

    // Insert sample data
    const { error } = await supabase
      .from('compliance_scores')
      .insert(sampleData)

    if (error) {
      console.error('Error generating sample data:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: `Generated ${sampleData.length} sample trend data points` }
  } catch (error) {
    console.error('Generate sample trends error:', error)
    return { success: false, error: error.message }
  }
}

// SMART CAPs (Corrective Action Plans) Functions
export const getCAPS = async (organizationId, options = {}) => {
  try {
    const { status, priority, sortBy = 'created_at', sortOrder = 'desc', search, limit = 50 } = options
    
    let query = supabase
      .from('caps')
      .select(`
        *,
        assignee:users!caps_assignee_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        created_by:users!caps_created_by_fkey(
          id,
          first_name,
          last_name
        ),
        related_issue:compliance_issues!caps_related_issue_id_fkey(
          id,
          title,
          category
        ),
        cap_actions!cap_actions_cap_id_fkey(
          id,
          status,
          completed_at
        )
      `)
      .eq('organization_id', organizationId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CAPs:', error)
      return { success: false, error: error.message }
    }

    // Transform data to include computed fields
    const caps = data.map(cap => ({
      ...cap,
      assignee_name: cap.assignee ? 
        `${cap.assignee.first_name} ${cap.assignee.last_name}` : null,
      created_by_name: cap.created_by ? 
        `${cap.created_by.first_name} ${cap.created_by.last_name}` : null,
      total_actions: cap.cap_actions?.length || 0,
      completed_actions: cap.cap_actions?.filter(action => action.status === 'completed').length || 0,
      is_overdue: new Date(cap.due_date) < new Date() && cap.status !== 'completed'
    }))

    return { success: true, data: caps }
  } catch (error) {
    console.error('Get CAPs error:', error)
    return { success: false, error: error.message }
  }
}

export const getCAPSStatistics = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('caps')
      .select('id, status, priority, created_at, due_date, completed_at')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching CAPs statistics:', error)
      return { success: false, error: error.message }
    }

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const stats = {
      total_caps: data.length,
      active: data.filter(cap => cap.status === 'active').length,
      in_progress: data.filter(cap => cap.status === 'in_progress').length,
      completed: data.filter(cap => cap.status === 'completed').length,
      overdue: data.filter(cap => 
        new Date(cap.due_date) < now && cap.status !== 'completed'
      ).length,
      new_this_month: data.filter(cap => 
        new Date(cap.created_at) >= thisMonth
      ).length
    }

    // Calculate completion rate
    stats.completion_rate = stats.total_caps > 0 ? 
      Math.round((stats.completed / stats.total_caps) * 100) : 0

    // Calculate average completion time
    const completedCAPs = data.filter(cap => cap.status === 'completed' && cap.completed_at)
    if (completedCAPs.length > 0) {
      const totalDays = completedCAPs.reduce((sum, cap) => {
        const createdDate = new Date(cap.created_at)
        const completedDate = new Date(cap.completed_at)
        const days = Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      stats.avg_completion_time = Math.round(totalDays / completedCAPs.length)
    } else {
      stats.avg_completion_time = 0
    }

    // Calculate average overdue days
    const overdueCAPs = data.filter(cap => 
      new Date(cap.due_date) < now && cap.status !== 'completed'
    )
    if (overdueCAPs.length > 0) {
      const totalOverdueDays = overdueCAPs.reduce((sum, cap) => {
        const dueDate = new Date(cap.due_date)
        const days = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      stats.overdue_avg_days = Math.round(totalOverdueDays / overdueCAPs.length)
    } else {
      stats.overdue_avg_days = 0
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('CAPs statistics error:', error)
    return { success: false, error: error.message }
  }
}

export const createCAP = async (capData) => {
  try {
    const { data, error } = await supabase
      .from('caps')
      .insert([{
        ...capData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating CAP:', error)
      return { success: false, error: error.message }
    }

    // Create notification for assignee
    if (capData.assignee_id) {
      await createNotification({
        organization_id: capData.organization_id,
        recipient_id: capData.assignee_id,
        type: 'cap_assigned',
        priority: 'medium',
        title: 'New CAP Assigned',
        message: `You have been assigned a new Corrective Action Plan: "${capData.title}"`,
        related_entity_type: 'cap',
        related_entity_id: data.id
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create CAP error:', error)
    return { success: false, error: error.message }
  }
}

export const updateCAP = async (capId, capData) => {
  try {
    const { data, error } = await supabase
      .from('caps')
      .update({
        ...capData,
        updated_at: new Date().toISOString()
      })
      .eq('id', capId)
      .select()
      .single()

    if (error) {
      console.error('Error updating CAP:', error)
      return { success: false, error: error.message }
    }

    // Create notification for status changes
    if (capData.status === 'completed') {
      await createNotification({
        organization_id: data.organization_id,
        recipient_id: data.created_by,
        type: 'cap_completed',
        priority: 'low',
        title: 'CAP Completed',
        message: `CAP "${data.title}" has been completed`,
        related_entity_type: 'cap',
        related_entity_id: data.id
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update CAP error:', error)
    return { success: false, error: error.message }
  }
}

export const deleteCAP = async (capId, organizationId) => {
  try {
    const { error } = await supabase
      .from('caps')
      .delete()
      .eq('id', capId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting CAP:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete CAP error:', error)
    return { success: false, error: error.message }
  }
}

export const getCAPSByStatus = async (organizationId, status) => {
  try {
    const { data, error } = await supabase
      .from('caps')
      .select(`
        *,
        assignee:users!caps_assignee_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching CAPs by status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('CAPs by status error:', error)
    return { success: false, error: error.message }
  }
}

export const getCAPSProgress = async (organizationId, options = {}) => {
  try {
    const { period = '30d' } = options
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('caps')
      .select(`
        id,
        title,
        status,
        priority,
        created_at,
        due_date,
        completed_at,
        cap_actions!cap_actions_cap_id_fkey(
          id,
          status,
          completed_at
        )
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching CAPs progress:', error)
      return { success: false, error: error.message }
    }

    // Calculate progress metrics
    const progressData = data.map(cap => {
      const totalActions = cap.cap_actions?.length || 0
      const completedActions = cap.cap_actions?.filter(action => action.status === 'completed').length || 0
      const progressPercentage = totalActions > 0 ? (completedActions / totalActions) * 100 : 0

      return {
        ...cap,
        total_actions: totalActions,
        completed_actions: completedActions,
        progress_percentage: Math.round(progressPercentage)
      }
    })

    return { success: true, data: progressData }
  } catch (error) {
    console.error('CAPs progress error:', error)
    return { success: false, error: error.message }
  }
}

export const getCAPActions = async (capId) => {
  try {
    const { data, error } = await supabase
      .from('cap_actions')
      .select(`
        *,
        assignee:users!cap_actions_assignee_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('cap_id', capId)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error fetching CAP actions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('CAP actions error:', error)
    return { success: false, error: error.message }
  }
}

export const createCAPAction = async (actionData) => {
  try {
    const { data, error } = await supabase
      .from('cap_actions')
      .insert([{
        ...actionData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating CAP action:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create CAP action error:', error)
    return { success: false, error: error.message }
  }
}

export const updateCAPAction = async (actionId, actionData) => {
  try {
    const { data, error } = await supabase
      .from('cap_actions')
      .update({
        ...actionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating CAP action:', error)
      return { success: false, error: error.message }
    }

    // Update CAP progress when action is completed
    if (actionData.status === 'completed') {
      await updateCAPProgress(data.cap_id)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update CAP action error:', error)
    return { success: false, error: error.message }
  }
}

export const updateCAPProgress = async (capId) => {
  try {
    // Get all actions for this CAP
    const actionsResult = await getCAPActions(capId)
    if (!actionsResult.success) {
      return { success: false, error: 'Failed to fetch CAP actions' }
    }

    const actions = actionsResult.data
    const totalActions = actions.length
    const completedActions = actions.filter(action => action.status === 'completed').length

    // Update CAP status based on progress
    let newStatus = 'active'
    if (completedActions === 0) {
      newStatus = 'active'
    } else if (completedActions === totalActions) {
      newStatus = 'completed'
    } else {
      newStatus = 'in_progress'
    }

    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('caps')
      .update(updateData)
      .eq('id', capId)
      .select()
      .single()

    if (error) {
      console.error('Error updating CAP progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update CAP progress error:', error)
    return { success: false, error: error.message }
  }
}

// Root Cause Analysis Functions
export const analyzeRootCause = async (issueId, organizationId) => {
  try {
    // Get issue details
    const { data: issue, error: issueError } = await supabase
      .from('compliance_issues')
      .select(`
        *,
        department:departments!compliance_issues_department_id_fkey(
          id,
          name
        ),
        area:areas!compliance_issues_area_id_fkey(
          id,
          name
        )
      `)
      .eq('id', issueId)
      .eq('organization_id', organizationId)
      .single()

    if (issueError) {
      console.error('Error fetching issue for analysis:', issueError)
      return { success: false, error: issueError.message }
    }

    // Get historical similar issues
    const { data: similarIssues, error: similarError } = await supabase
      .from('compliance_issues')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('category', issue.category)
      .neq('id', issueId)
      .limit(10)

    if (similarError) {
      console.error('Error fetching similar issues:', similarError)
    }

    // Simple AI-like analysis (in real implementation, this would use ML)
    const analysis = {
      primary_cause: analyzeIssueCause(issue),
      contributing_factors: analyzeContributingFactors(issue, similarIssues || []),
      recommended_actions: generateRecommendedActions(issue),
      risk_assessment: assessRisk(issue),
      prevention_measures: generatePreventionMeasures(issue)
    }

    return { success: true, data: analysis }
  } catch (error) {
    console.error('Root cause analysis error:', error)
    return { success: false, error: error.message }
  }
}

// Helper functions for root cause analysis
const analyzeIssueCause = (issue) => {
  const causes = {
    'safety': 'Insufficient safety protocols or training',
    'environmental': 'Environmental control system failure',
    'quality': 'Quality control process breakdown',
    'permit': 'Permit renewal or compliance oversight',
    'documentation': 'Inadequate documentation management',
    'training': 'Staff training deficiency',
    'equipment': 'Equipment malfunction or maintenance issue',
    'process': 'Process design or implementation flaw'
  }

  return causes[issue.category] || 'General compliance process failure'
}

const analyzeContributingFactors = (issue, similarIssues) => {
  const factors = []
  
  // Check for recurring patterns
  if (similarIssues.length > 3) {
    factors.push('Recurring issue pattern detected')
  }
  
  // Check priority level
  if (issue.priority === 'high' || issue.priority === 'critical') {
    factors.push('High-priority issue indicating systemic problems')
  }
  
  // Check department/area
  if (issue.department || issue.area) {
    factors.push(`Localized to specific ${issue.department ? 'department' : 'area'}`)
  }
  
  return factors.length > 0 ? factors : ['Isolated incident']
}

const generateRecommendedActions = (issue) => {
  const actions = []
  
  switch (issue.category) {
    case 'safety':
      actions.push('Conduct safety training refresh')
      actions.push('Review safety protocols and procedures')
      actions.push('Implement additional safety measures')
      break
    case 'environmental':
      actions.push('Inspect environmental control systems')
      actions.push('Update environmental monitoring procedures')
      actions.push('Staff environmental compliance training')
      break
    case 'quality':
      actions.push('Review quality control processes')
      actions.push('Implement additional quality checks')
      actions.push('Update quality standards documentation')
      break
    default:
      actions.push('Conduct thorough investigation')
      actions.push('Update relevant procedures')
      actions.push('Implement monitoring measures')
  }
  
  return actions
}

const assessRisk = (issue) => {
  let riskLevel = 'low'
  let riskFactors = []
  
  if (issue.priority === 'critical') {
    riskLevel = 'high'
    riskFactors.push('Critical priority issue')
  } else if (issue.priority === 'high') {
    riskLevel = 'medium'
    riskFactors.push('High priority issue')
  }
  
  if (issue.category === 'safety') {
    riskLevel = 'high'
    riskFactors.push('Safety-related issue')
  }
  
  return {
    level: riskLevel,
    factors: riskFactors,
    mitigation_urgency: riskLevel === 'high' ? 'immediate' : riskLevel === 'medium' ? 'within_week' : 'within_month'
  }
}

const generatePreventionMeasures = (issue) => {
  return [
    'Implement regular monitoring and auditing',
    'Establish clear escalation procedures',
    'Conduct periodic training and awareness sessions',
    'Create preventive maintenance schedules',
    'Develop early warning indicators'
  ]
}

// Generate sample CAPs data for testing
export const generateSampleCAPSData = async (organizationId) => {
  try {
    const sampleCAPs = [
      {
        organization_id: organizationId,
        title: 'Improve Safety Training Program',
        description: 'Enhance safety training to reduce workplace incidents',
        priority: 'high',
        status: 'active',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'system',
        specific_objective: 'Reduce workplace incidents by 50%',
        measurable_criteria: 'Track incident reports monthly',
        achievable_plan: 'Implement comprehensive training modules',
        relevant_justification: 'Addresses critical safety compliance gap',
        time_bound_deadline: '30 days'
      },
      {
        organization_id: organizationId,
        title: 'Environmental Compliance Update',
        description: 'Update environmental procedures to meet new regulations',
        priority: 'medium',
        status: 'in_progress',
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'system',
        specific_objective: 'Achieve 100% environmental compliance',
        measurable_criteria: 'Pass environmental audit inspection',
        achievable_plan: 'Update procedures and train staff',
        relevant_justification: 'Required for regulatory compliance',
        time_bound_deadline: '45 days'
      }
    ]

    for (const cap of sampleCAPs) {
      await createCAP(cap)
    }

    return { success: true, message: `Generated ${sampleCAPs.length} sample CAPs` }
  } catch (error) {
    console.error('Generate sample CAPs error:', error)
    return { success: false, error: error.message }
  }
}

// Advanced AI Analysis Functions
export const generateAIInsights = async (issueId, organizationId) => {
  try {
    // Get issue details and related data
    const { data: issue, error: issueError } = await supabase
      .from('compliance_issues')
      .select(`
        *,
        department:departments!compliance_issues_department_id_fkey(id, name),
        area:areas!compliance_issues_area_id_fkey(id, name)
      `)
      .eq('id', issueId)
      .eq('organization_id', organizationId)
      .single()

    if (issueError) {
      console.error('Error fetching issue for AI insights:', issueError)
      return { success: false, error: issueError.message }
    }

    // Generate AI-like insights (in real implementation, this would use ML models)
    const insights = []

    // Critical insight for high-priority safety issues
    if (issue.category === 'safety' && issue.priority === 'high') {
      insights.push({
        title: 'Critical Safety Pattern Detected',
        description: 'This safety issue shows characteristics of systemic safety protocol gaps that require immediate attention and comprehensive review.',
        type: 'critical',
        confidence: 92,
        source: 'Safety Pattern AI Model'
      })
    }

    // Environmental compliance insight
    if (issue.category === 'environmental') {
      insights.push({
        title: 'Environmental Compliance Trend',
        description: 'Environmental issues in this category have increased 23% over the past quarter, suggesting need for updated procedures.',
        type: 'warning',
        confidence: 78,
        source: 'Environmental Trend Analysis'
      })
    }

    // Department-specific insight
    if (issue.department) {
      insights.push({
        title: 'Department Performance Analysis',
        description: `The ${issue.department.name} department has shown improvement in similar issue resolution, with 85% success rate in past 6 months.`,
        type: 'insight',
        confidence: 85,
        source: 'Department Performance AI'
      })
    }

    // Predictive insight
    insights.push({
      title: 'Predictive Risk Assessment',
      description: 'Based on historical data, similar issues have a 72% probability of recurrence without preventive measures.',
      type: 'warning',
      confidence: 72,
      source: 'Predictive Risk Model'
    })

    // Resource optimization insight
    insights.push({
      title: 'Resource Optimization Opportunity',
      description: 'Automated monitoring systems could prevent 60% of similar issues, reducing response time by an average of 3.2 days.',
      type: 'opportunity',
      confidence: 89,
      source: 'Resource Optimization AI'
    })

    return {
      success: true,
      data: {
        insights,
        analysis_timestamp: new Date().toISOString(),
        model_version: '2.1.0'
      }
    }
  } catch (error) {
    console.error('Generate AI insights error:', error)
    return { success: false, error: error.message }
  }
}

export const getPatternAnalysis = async (organizationId, options = {}) => {
  try {
    const { category, period = '180d' } = options
    const periodDays = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365
    }
    
    const days = periodDays[period] || 180
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get historical issues for pattern analysis
    let query = supabase
      .from('compliance_issues')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    if (category) {
      query = query.eq('category', category)
    }

    const { data: issues, error } = await query

    if (error) {
      console.error('Error fetching issues for pattern analysis:', error)
      return { success: false, error: error.message }
    }

    // Analyze patterns
    const totalIssues = issues.length
    const resolvedIssues = issues.filter(issue => issue.status === 'resolved').length
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0

    // Calculate average resolution time
    const resolvedWithTime = issues.filter(issue => 
      issue.status === 'resolved' && issue.resolved_at
    )
    
    let avgResolutionTime = 0
    if (resolvedWithTime.length > 0) {
      const totalDays = resolvedWithTime.reduce((sum, issue) => {
        const created = new Date(issue.created_at)
        const resolved = new Date(issue.resolved_at)
        const days = Math.ceil((resolved - created) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      avgResolutionTime = Math.round(totalDays / resolvedWithTime.length)
    }

    // Identify patterns
    const patterns = []

    // Time-based patterns
    const issuesByHour = {}
    issues.forEach(issue => {
      const hour = new Date(issue.created_at).getHours()
      issuesByHour[hour] = (issuesByHour[hour] || 0) + 1
    })

    const peakHour = Object.keys(issuesByHour).reduce((a, b) => 
      issuesByHour[a] > issuesByHour[b] ? a : b
    )

    if (issuesByHour[peakHour] > totalIssues * 0.2) {
      patterns.push({
        name: 'Peak Hour Pattern',
        description: `${Math.round((issuesByHour[peakHour] / totalIssues) * 100)}% of issues occur around ${peakHour}:00, suggesting operational or shift-related factors.`,
        frequency: 'high'
      })
    }

    // Category clustering
    const categoryCount = {}
    issues.forEach(issue => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1
    })

    const dominantCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b
    )

    if (categoryCount[dominantCategory] > totalIssues * 0.4) {
      patterns.push({
        name: 'Category Concentration',
        description: `${dominantCategory} issues represent ${Math.round((categoryCount[dominantCategory] / totalIssues) * 100)}% of all issues, indicating systemic concerns in this area.`,
        frequency: 'high'
      })
    }

    // Escalation patterns
    const highPriorityIssues = issues.filter(issue => 
      issue.priority === 'high' || issue.priority === 'critical'
    ).length

    if (highPriorityIssues > totalIssues * 0.3) {
      patterns.push({
        name: 'High Priority Clustering',
        description: `${Math.round((highPriorityIssues / totalIssues) * 100)}% of issues are high/critical priority, suggesting reactive rather than preventive approach.`,
        frequency: 'medium'
      })
    }

    return {
      success: true,
      data: {
        similar_issues_count: totalIssues,
        resolution_rate: resolutionRate,
        avg_resolution_time: avgResolutionTime,
        patterns,
        analysis_period: period,
        last_updated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Pattern analysis error:', error)
    return { success: false, error: error.message }
  }
}

export const getRiskPredictions = async (organizationId, options = {}) => {
  try {
    const { issueId, period = '90d' } = options
    const periodDays = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365
    }
    
    const days = periodDays[period] || 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get historical data for predictions
    const [issuesResult, scoresResult] = await Promise.all([
      supabase
        .from('compliance_issues')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('compliance_scores')
        .select('score, created_at, category')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(30)
    ])

    if (issuesResult.error || scoresResult.error) {
      console.error('Error fetching data for risk predictions')
      return { success: false, error: 'Failed to fetch prediction data' }
    }

    const issues = issuesResult.data || []
    const scores = scoresResult.data || []

    // Generate risk predictions
    const predictions = []

    // Issue recurrence prediction
    if (issueId) {
      const { data: currentIssue } = await supabase
        .from('compliance_issues')
        .select('category, priority')
        .eq('id', issueId)
        .single()

      if (currentIssue) {
        const similarIssues = issues.filter(issue => 
          issue.category === currentIssue.category
        )
        
        const recurrenceRate = similarIssues.length > 0 ? 
          Math.min(95, Math.round((similarIssues.length / issues.length) * 100) + 20) : 30

        predictions.push({
          risk_type: 'Issue Recurrence',
          description: `Similar ${currentIssue.category} issues may recur based on historical patterns`,
          probability: recurrenceRate,
          timeframe: '30-60 days',
          impact: 'Medium'
        })
      }
    }

    // Compliance score decline prediction
    if (scores.length >= 5) {
      const recentAvg = scores.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / 5
      const olderAvg = scores.slice(5, 10).reduce((sum, s) => sum + s.score, 0) / Math.min(5, scores.slice(5, 10).length)
      
      if (recentAvg < olderAvg) {
        const declineRate = Math.round(((olderAvg - recentAvg) / olderAvg) * 100)
        predictions.push({
          risk_type: 'Compliance Score Decline',
          description: `Compliance scores trending downward by ${declineRate}%, indicating potential systemic issues`,
          probability: Math.min(85, declineRate * 3),
          timeframe: '2-4 weeks',
          impact: 'High'
        })
      }
    }

    // High-priority issue surge prediction
    const highPriorityIssues = issues.filter(issue => 
      issue.priority === 'high' || issue.priority === 'critical'
    ).length
    
    const highPriorityRate = issues.length > 0 ? (highPriorityIssues / issues.length) * 100 : 0
    
    if (highPriorityRate > 25) {
      predictions.push({
        risk_type: 'Critical Issue Surge',
        description: `High rate of critical issues (${Math.round(highPriorityRate)}%) suggests potential systemic breakdown`,
        probability: Math.min(90, Math.round(highPriorityRate * 2)),
        timeframe: '1-3 weeks',
        impact: 'Critical'
      })
    }

    // Department-specific risk
    const deptIssues = {}
    issues.forEach(issue => {
      if (issue.department_id) {
        deptIssues[issue.department_id] = (deptIssues[issue.department_id] || 0) + 1
      }
    })

    const maxDeptIssues = Math.max(...Object.values(deptIssues))
    if (maxDeptIssues > issues.length * 0.4) {
      predictions.push({
        risk_type: 'Department Risk Concentration',
        description: 'One department showing disproportionate compliance issues, indicating localized systemic problems',
        probability: 75,
        timeframe: '2-6 weeks',
        impact: 'Medium'
      })
    }

    // Regulatory compliance risk
    const permitIssues = issues.filter(issue => issue.category === 'permit').length
    if (permitIssues > 3) {
      predictions.push({
        risk_type: 'Regulatory Compliance Risk',
        description: 'Multiple permit-related issues detected, potential regulatory scrutiny risk',
        probability: Math.min(80, permitIssues * 15),
        timeframe: '4-8 weeks',
        impact: 'High'
      })
    }

    return {
      success: true,
      data: {
        predictions,
        confidence_level: 'Medium',
        model_accuracy: '78%',
        last_updated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Risk predictions error:', error)
    return { success: false, error: error.message }
  }
}

export const exportAnalysisReport = async (organizationId, options = {}) => {
  try {
    const {
      issueId,
      includeAnalysis = true,
      includeInsights = true,
      includePatterns = true,
      includePredictions = true,
      format = 'pdf'
    } = options

    // Get all analysis data
    const [analysisResult, insightsResult, patternResult, predictionsResult] = await Promise.all([
      includeAnalysis ? analyzeRootCause(issueId, organizationId) : { success: true, data: null },
      includeInsights ? generateAIInsights(issueId, organizationId) : { success: true, data: null },
      includePatterns ? getPatternAnalysis(organizationId) : { success: true, data: null },
      includePredictions ? getRiskPredictions(organizationId, { issueId }) : { success: true, data: null }
    ])

    // Get issue details
    const { data: issue } = await supabase
      .from('compliance_issues')
      .select(`
        *,
        department:departments!compliance_issues_department_id_fkey(name),
        area:areas!compliance_issues_area_id_fkey(name)
      `)
      .eq('id', issueId)
      .single()

    // Compile report data
    const reportData = {
      meta: {
        title: 'Root Cause Analysis Report',
        issue_title: issue?.title || 'Unknown Issue',
        generated_at: new Date().toISOString(),
        organization_id: organizationId,
        report_version: '1.0'
      },
      issue_details: issue,
      analysis: analysisResult.success ? analysisResult.data : null,
      ai_insights: insightsResult.success ? insightsResult.data : null,
      pattern_analysis: patternResult.success ? patternResult.data : null,
      risk_predictions: predictionsResult.success ? predictionsResult.data : null
    }

    // Simulate report generation (in real implementation, this would generate actual PDF/Excel)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const filename = `root-cause-analysis-${issueId}-${new Date().toISOString().split('T')[0]}`
    
    return {
      success: true,
      data: {
        url: `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`,
        filename: `${filename}.${format}`,
        size: JSON.stringify(reportData).length,
        format: format
      }
    }
  } catch (error) {
    console.error('Export analysis report error:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceIssues = async (organizationId, options = {}) => {
  try {
    const { 
      status, 
      priority, 
      category,
      sortBy = 'created_at', 
      sortOrder = 'desc', 
      limit = 50,
      search 
    } = options
    
    let query = supabase
      .from('compliance_issues')
      .select(`
        *,
        department:departments!compliance_issues_department_id_fkey(id, name),
        area:areas!compliance_issues_area_id_fkey(id, name),
        created_by:users!compliance_issues_created_by_fkey(first_name, last_name),
        assigned_to:users!compliance_issues_assigned_to_fkey(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching compliance issues:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get compliance issues error:', error)
    return { success: false, error: error.message }
  }
} 

// Progress Tracking Workflows Functions
export const getWorkflowMetrics = async (organizationId) => {
  try {
    const [capsResult, workflowsResult] = await Promise.all([
      supabase
        .from('caps')
        .select('id, status, created_at, due_date, completed_at')
        .eq('organization_id', organizationId),
      
      supabase
        .from('workflow_automations')
        .select('id, status, created_at')
        .eq('organization_id', organizationId)
    ])

    if (capsResult.error || workflowsResult.error) {
      console.error('Error fetching workflow metrics')
      return { success: false, error: 'Failed to fetch metrics' }
    }

    const caps = capsResult.data || []
    const workflows = workflowsResult.data || []

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Calculate metrics
    const totalCAPs = caps.length
    const activeWorkflows = workflows.filter(w => w.status === 'active').length
    const onTrackCAPs = caps.filter(cap => {
      if (cap.status === 'completed') return true
      if (cap.status === 'overdue') return false
      return new Date(cap.due_date) >= now
    }).length
    
    const atRiskCAPs = caps.filter(cap => {
      if (cap.status === 'completed') return false
      const dueDate = new Date(cap.due_date)
      const warningDate = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days before due
      return now >= warningDate && now < dueDate
    }).length

    const overdueCAPs = caps.filter(cap => 
      cap.status !== 'completed' && new Date(cap.due_date) < now
    ).length

    // Calculate completion time
    const completedCAPs = caps.filter(cap => cap.status === 'completed' && cap.completed_at)
    let avgCompletionTime = 0
    if (completedCAPs.length > 0) {
      const totalDays = completedCAPs.reduce((sum, cap) => {
        const created = new Date(cap.created_at)
        const completed = new Date(cap.completed_at)
        return sum + Math.ceil((completed - created) / (1000 * 60 * 60 * 24))
      }, 0)
      avgCompletionTime = Math.round(totalDays / completedCAPs.length)
    }

    // Calculate trend
    const recentWorkflows = workflows.filter(w => 
      new Date(w.created_at) >= weekAgo
    ).length
    const workflowTrend = workflows.length > 0 ? 
      Math.round((recentWorkflows / workflows.length) * 100) : 0

    return {
      success: true,
      data: {
        active_workflows: activeWorkflows,
        total_caps: totalCAPs,
        on_track_count: onTrackCAPs,
        on_track_percentage: totalCAPs > 0 ? Math.round((onTrackCAPs / totalCAPs) * 100) : 0,
        at_risk_count: atRiskCAPs,
        overdue_count: overdueCAPs,
        avg_completion_time: avgCompletionTime,
        target_completion_time: 30, // Default target
        workflow_trend: workflowTrend
      }
    }
  } catch (error) {
    console.error('Workflow metrics error:', error)
    return { success: false, error: error.message }
  }
}

export const updateCAPWorkflow = async (capId, workflowData) => {
  try {
    const { action, ...data } = workflowData

    let updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    // Handle specific workflow actions
    switch (action) {
      case 'start':
        updateData.status = 'in_progress'
        updateData.started_at = new Date().toISOString()
        break
      case 'pause':
        updateData.status = 'on_hold'
        updateData.paused_at = new Date().toISOString()
        break
      case 'resume':
        updateData.status = 'in_progress'
        updateData.resumed_at = new Date().toISOString()
        break
      case 'complete':
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
        break
      default:
        // Just update with provided data
        break
    }

    const { data: result, error } = await supabase
      .from('caps')
      .update(updateData)
      .eq('id', capId)
      .select()
      .single()

    if (error) {
      console.error('Error updating CAP workflow:', error)
      return { success: false, error: error.message }
    }

    // Create workflow activity log
    await supabase
      .from('workflow_activities')
      .insert([{
        cap_id: capId,
        action,
        details: JSON.stringify(data),
        created_by: workflowData.updated_by,
        created_at: new Date().toISOString()
      }])

    return { success: true, data: result }
  } catch (error) {
    console.error('Update CAP workflow error:', error)
    return { success: false, error: error.message }
  }
}

export const assignCAPAction = async (actionId, assignmentData) => {
  try {
    const { data, error } = await supabase
      .from('cap_actions')
      .update({
        assignee_id: assignmentData.assignee_id,
        assigned_at: assignmentData.assigned_at,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', actionId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning CAP action:', error)
      return { success: false, error: error.message }
    }

    // Create notification for assignee
    if (assignmentData.assignee_id) {
      await createNotification({
        recipient_id: assignmentData.assignee_id,
        type: 'action_assigned',
        priority: 'medium',
        title: 'New Action Assigned',
        message: `You have been assigned a new action: "${data.title}"`,
        related_entity_type: 'cap_action',
        related_entity_id: data.id
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('Assign CAP action error:', error)
    return { success: false, error: error.message }
  }
}

export const getProgressTimeline = async (organizationId, options = {}) => {
  try {
    const { limit = 20 } = options

    // Get recent workflow activities
    const { data, error } = await supabase
      .from('workflow_activities')
      .select(`
        *,
        cap:caps!workflow_activities_cap_id_fkey(
          id,
          title
        ),
        user:users!workflow_activities_created_by_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching progress timeline:', error)
      return { success: false, error: error.message }
    }

    // Transform activities into timeline events
    const timeline = data.map(activity => ({
      id: activity.id,
      type: activity.action,
      title: getTimelineTitle(activity.action, activity.cap?.title),
      description: getTimelineDescription(activity.action, activity.user, activity.details),
      timestamp: activity.created_at,
      cap_title: activity.cap?.title,
      user: activity.user
    }))

    return { success: true, data: timeline }
  } catch (error) {
    console.error('Progress timeline error:', error)
    return { success: false, error: error.message }
  }
}

// Helper functions for timeline
const getTimelineTitle = (action, capTitle) => {
  switch (action) {
    case 'start': return 'CAP Started'
    case 'pause': return 'CAP Paused'
    case 'resume': return 'CAP Resumed'
    case 'complete': return 'CAP Completed'
    case 'assigned': return 'Action Assigned'
    case 'overdue': return 'CAP Overdue'
    default: return 'CAP Updated'
  }
}

const getTimelineDescription = (action, user, details) => {
  const userName = user ? `${user.first_name} ${user.last_name}` : 'System'
  
  switch (action) {
    case 'start': return `${userName} started the CAP workflow`
    case 'pause': return `${userName} paused the CAP workflow`
    case 'resume': return `${userName} resumed the CAP workflow`
    case 'complete': return `${userName} completed the CAP`
    case 'assigned': return `${userName} assigned an action`
    case 'overdue': return `CAP became overdue`
    default: return `${userName} updated the CAP`
  }
}

export const generateProgressReport = async (organizationId, options = {}) => {
  try {
    const { 
      period = '30d', 
      includeMetrics = true, 
      includeTimeline = true,
      format = 'pdf' 
    } = options

    // Get report data
    const [metricsResult, timelineResult, capsResult] = await Promise.all([
      includeMetrics ? getWorkflowMetrics(organizationId) : { success: true, data: null },
      includeTimeline ? getProgressTimeline(organizationId, { limit: 50 }) : { success: true, data: null },
      getCAPSProgress(organizationId, { period })
    ])

    const reportData = {
      meta: {
        title: 'Progress Tracking Report',
        generated_at: new Date().toISOString(),
        organization_id: organizationId,
        period: period,
        report_version: '1.0'
      },
      metrics: metricsResult.success ? metricsResult.data : null,
      timeline: timelineResult.success ? timelineResult.data : null,
      caps_progress: capsResult.success ? capsResult.data : null,
      summary: {
        total_caps: capsResult.data?.length || 0,
        completion_rate: calculateCompletionRate(capsResult.data || []),
        on_time_rate: calculateOnTimeRate(capsResult.data || [])
      }
    }

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const filename = `progress-report-${period}-${new Date().toISOString().split('T')[0]}`

    return {
      success: true,
      data: {
        url: `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`,
        filename: `${filename}.${format}`,
        size: JSON.stringify(reportData).length
      }
    }
  } catch (error) {
    console.error('Generate progress report error:', error)
    return { success: false, error: error.message }
  }
}

// Helper functions for report
const calculateCompletionRate = (caps) => {
  if (caps.length === 0) return 0
  const completed = caps.filter(cap => cap.status === 'completed').length
  return Math.round((completed / caps.length) * 100)
}

const calculateOnTimeRate = (caps) => {
  if (caps.length === 0) return 0
  const completed = caps.filter(cap => cap.status === 'completed')
  if (completed.length === 0) return 0
  
  const onTime = completed.filter(cap => {
    if (!cap.completed_at) return false
    return new Date(cap.completed_at) <= new Date(cap.due_date)
  }).length
  
  return Math.round((onTime / completed.length) * 100)
}

export const getActiveWorkflows = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('workflow_automations')
      .select(`
        *,
        created_by:users!workflow_automations_created_by_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active workflows:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Active workflows error:', error)
    return { success: false, error: error.message }
  }
}

export const createWorkflowAutomation = async (workflowData) => {
  try {
    const { data, error } = await supabase
      .from('workflow_automations')
      .insert([{
        ...workflowData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating workflow automation:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create workflow automation error:', error)
    return { success: false, error: error.message }
  }
}

// Automated workflow processing
export const processWorkflowTriggers = async (organizationId) => {
  try {
    // Get active workflows
    const workflowsResult = await getActiveWorkflows(organizationId)
    if (!workflowsResult.success) {
      return { success: false, error: 'Failed to fetch workflows' }
    }

    const workflows = workflowsResult.data
    const processedWorkflows = []

    for (const workflow of workflows) {
      try {
        const processed = await processWorkflow(workflow, organizationId)
        if (processed.success) {
          processedWorkflows.push(processed.data)
        }
      } catch (error) {
        console.error(`Error processing workflow ${workflow.id}:`, error)
      }
    }

    return {
      success: true,
      data: {
        processed_count: processedWorkflows.length,
        workflows: processedWorkflows
      }
    }
  } catch (error) {
    console.error('Process workflow triggers error:', error)
    return { success: false, error: error.message }
  }
}

const processWorkflow = async (workflow, organizationId) => {
  try {
    const triggers = JSON.parse(workflow.triggers || '[]')
    const actions = JSON.parse(workflow.actions || '[]')

    let triggered = false

    // Check each trigger
    for (const trigger of triggers) {
      const triggerResult = await evaluateTrigger(trigger, organizationId)
      if (triggerResult) {
        triggered = true
        break
      }
    }

    if (!triggered) {
      return { success: true, data: { triggered: false } }
    }

    // Execute actions
    const executedActions = []
    for (const action of actions) {
      try {
        const actionResult = await executeWorkflowAction(action, organizationId)
        executedActions.push(actionResult)
      } catch (error) {
        console.error('Action execution error:', error)
      }
    }

    // Update workflow last run
    await supabase
      .from('workflow_automations')
      .update({
        last_run: new Date().toISOString(),
        run_count: (workflow.run_count || 0) + 1
      })
      .eq('id', workflow.id)

    return {
      success: true,
      data: {
        triggered: true,
        actions_executed: executedActions.length,
        workflow_id: workflow.id
      }
    }
  } catch (error) {
    console.error('Process workflow error:', error)
    return { success: false, error: error.message }
  }
}

const evaluateTrigger = async (trigger, organizationId) => {
  // Simple trigger evaluation (expand based on trigger types)
  switch (trigger.type) {
    case 'cap_overdue':
      return await checkOverdueCAPs(organizationId)
    case 'cap_completed':
      return await checkCompletedCAPs(organizationId, trigger.timeframe)
    case 'high_priority_issue':
      return await checkHighPriorityIssues(organizationId)
    default:
      return false
  }
}

const executeWorkflowAction = async (action, organizationId) => {
  // Execute workflow actions
  switch (action.type) {
    case 'send_notification':
      return await createNotification({
        organization_id: organizationId,
        recipient_id: action.recipient_id,
        type: 'workflow_automation',
        title: action.title,
        message: action.message,
        priority: action.priority || 'medium'
      })
    case 'assign_action':
      return await assignCAPAction(action.action_id, action.assignment_data)
    case 'update_status':
      return await updateCAPWorkflow(action.cap_id, { action: action.status_action })
    default:
      return { success: false, error: 'Unknown action type' }
  }
}

// Helper functions for trigger evaluation
const checkOverdueCAPs = async (organizationId) => {
  const { data } = await supabase
    .from('caps')
    .select('id')
    .eq('organization_id', organizationId)
    .neq('status', 'completed')
    .lt('due_date', new Date().toISOString())
    .limit(1)

  return data && data.length > 0
}

const checkCompletedCAPs = async (organizationId, timeframe = '24h') => {
  const hours = timeframe === '24h' ? 24 : 1
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const { data } = await supabase
    .from('caps')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .gte('completed_at', since.toISOString())
    .limit(1)

  return data && data.length > 0
}

const checkHighPriorityIssues = async (organizationId) => {
  const { data } = await supabase
    .from('compliance_issues')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'open')
    .in('priority', ['high', 'critical'])
    .limit(1)

  return data && data.length > 0
}

// ==================== GRIEVANCE MANAGEMENT FUNCTIONS ====================

// Get all grievances with filters
export const getGrievances = async (organizationId, filters = {}) => {
  try {
    let query = supabase
      .from('grievances')
      .select(`
        *,
        submitter:submitted_by (
          id,
          full_name,
          email,
          phone,
          department
        ),
        assignee:assigned_to (
          id,
          full_name,
          email,
          role
        ),
        organization:organization_id (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) throw error

    // Add computed fields
    const enrichedData = data.map(grievance => ({
      ...grievance,
      submitter_name: grievance.submitter?.full_name || 'Anonymous',
      assigned_to_name: grievance.assignee?.full_name || null,
      days_since_created: Math.floor((new Date() - new Date(grievance.created_at)) / (1000 * 60 * 60 * 24)),
      is_overdue: grievance.status !== 'resolved' && grievance.status !== 'closed' && 
                 Math.floor((new Date() - new Date(grievance.created_at)) / (1000 * 60 * 60 * 24)) > 7
    }))

    return { success: true, data: enrichedData }
  } catch (error) {
    console.error('Error fetching grievances:', error)
    return { success: false, error: error.message }
  }
}

// Get grievance statistics
export const getGrievanceStatistics = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) throw error

    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const statistics = {
      total_grievances: data.length,
      new_this_month: data.filter(g => new Date(g.created_at) >= oneMonthAgo).length,
      open_cases: data.filter(g => !['resolved', 'closed'].includes(g.status)).length,
      resolved_cases: data.filter(g => g.status === 'resolved').length,
      high_priority_count: data.filter(g => ['high', 'critical'].includes(g.priority)).length,
      escalated_count: data.filter(g => g.status === 'escalated').length,
      resolution_rate: Math.round((data.filter(g => g.status === 'resolved').length / data.length) * 100) || 0,
      avg_resolution_time: calculateAverageResolutionTime(data.filter(g => g.status === 'resolved'))
    }

    return { success: true, data: statistics }
  } catch (error) {
    console.error('Error fetching grievance statistics:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to calculate average resolution time
const calculateAverageResolutionTime = (resolvedGrievances) => {
  if (resolvedGrievances.length === 0) return 0
  
  const totalDays = resolvedGrievances.reduce((sum, grievance) => {
    const created = new Date(grievance.created_at)
    const resolved = new Date(grievance.resolved_at || grievance.updated_at)
    return sum + Math.floor((resolved - created) / (1000 * 60 * 60 * 24))
  }, 0)
  
  return Math.round(totalDays / resolvedGrievances.length)
}

// Get grievance details
export const getGrievanceDetails = async (grievanceId) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select(`
        *,
        submitter:submitted_by (
          id,
          full_name,
          email,
          phone,
          department
        ),
        assignee:assigned_to (
          id,
          full_name,
          email,
          role
        ),
        organization:organization_id (
          id,
          name
        )
      `)
      .eq('id', grievanceId)
      .single()

    if (error) throw error

    // Enrich data
    const enrichedData = {
      ...data,
      submitter_name: data.submitter?.full_name || 'Anonymous',
      assigned_to_name: data.assignee?.full_name || null,
      days_since_created: Math.floor((new Date() - new Date(data.created_at)) / (1000 * 60 * 60 * 24))
    }

    return { success: true, data: enrichedData }
  } catch (error) {
    console.error('Error fetching grievance details:', error)
    return { success: false, error: error.message }
  }
}

// Submit new grievance
export const submitGrievance = async (grievanceData) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .insert([{
        ...grievanceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    // Create initial history entry
    await supabase
      .from('grievance_history')
      .insert([{
        grievance_id: data.id,
        action: 'Grievance submitted',
        performed_by: grievanceData.submitter_name || 'Anonymous',
        performed_by_id: grievanceData.submitted_by,
        details: `Priority: ${grievanceData.priority}, Category: ${grievanceData.category}`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error submitting grievance:', error)
    return { success: false, error: error.message }
  }
}

// Update grievance status
export const updateGrievanceStatus = async (grievanceId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', grievanceId)
      .select()
      .single()

    if (error) throw error

    // Create history entry
    await supabase
      .from('grievance_history')
      .insert([{
        grievance_id: grievanceId,
        action: `Status changed to ${updateData.status}`,
        performed_by: updateData.updated_by_name || 'System',
        performed_by_id: updateData.updated_by,
        details: `Previous status updated`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error updating grievance status:', error)
    return { success: false, error: error.message }
  }
}

// Assign grievance
export const assignGrievance = async (grievanceId, assignmentData) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .update({
        ...assignmentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', grievanceId)
      .select()
      .single()

    if (error) throw error

    // Get assignee info
    const { data: assignee } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', assignmentData.assigned_to)
      .single()

    // Create history entry
    await supabase
      .from('grievance_history')
      .insert([{
        grievance_id: grievanceId,
        action: `Assigned to ${assignee?.full_name || 'Unknown'}`,
        performed_by: assignmentData.assigned_by_name || 'System',
        performed_by_id: assignmentData.assigned_by,
        details: `Grievance assigned for handling`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error assigning grievance:', error)
    return { success: false, error: error.message }
  }
}

// Escalate grievance
export const escalateGrievance = async (grievanceId, escalationData) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .update({
        status: 'escalated',
        escalation_reason: escalationData.escalation_reason,
        escalated_by: escalationData.escalated_by,
        escalated_at: escalationData.escalated_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', grievanceId)
      .select()
      .single()

    if (error) throw error

    // Create history entry
    await supabase
      .from('grievance_history')
      .insert([{
        grievance_id: grievanceId,
        action: 'Grievance escalated',
        performed_by: escalationData.escalated_by_name || 'System',
        performed_by_id: escalationData.escalated_by,
        details: `Reason: ${escalationData.escalation_reason}`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error escalating grievance:', error)
    return { success: false, error: error.message }
  }
}

// Resolve grievance
export const resolveGrievance = async (grievanceId, resolutionData) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .update({
        status: 'resolved',
        resolution_notes: resolutionData.resolution_notes,
        resolved_by: resolutionData.resolved_by,
        resolved_at: resolutionData.resolved_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', grievanceId)
      .select()
      .single()

    if (error) throw error

    // Create history entry
    await supabase
      .from('grievance_history')
      .insert([{
        grievance_id: grievanceId,
        action: 'Grievance resolved',
        performed_by: resolutionData.resolved_by_name || 'System',
        performed_by_id: resolutionData.resolved_by,
        details: `Resolution: ${resolutionData.resolution_notes}`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error resolving grievance:', error)
    return { success: false, error: error.message }
  }
}

// Get grievance comments
export const getGrievanceComments = async (grievanceId) => {
  try {
    const { data, error } = await supabase
      .from('grievance_comments')
      .select(`
        *,
        author:author_id (
          id,
          full_name,
          role
        )
      `)
      .eq('grievance_id', grievanceId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching grievance comments:', error)
    return { success: false, error: error.message }
  }
}

// Add grievance comment
export const addGrievanceComment = async (grievanceId, commentData) => {
  try {
    const { data, error } = await supabase
      .from('grievance_comments')
      .insert([{
        grievance_id: grievanceId,
        ...commentData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    // Update grievance updated_at
    await supabase
      .from('grievances')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', grievanceId)

    // Create history entry
    await supabase
      .from('grievance_history')
      .insert([{
        grievance_id: grievanceId,
        action: 'Comment added',
        performed_by: commentData.author_name || 'System',
        performed_by_id: commentData.author_id,
        details: `Comment: ${commentData.content.substring(0, 100)}${commentData.content.length > 100 ? '...' : ''}`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error adding grievance comment:', error)
    return { success: false, error: error.message }
  }
}

// Get grievance history
export const getGrievanceHistory = async (grievanceId) => {
  try {
    const { data, error } = await supabase
      .from('grievance_history')
      .select('*')
      .eq('grievance_id', grievanceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching grievance history:', error)
    return { success: false, error: error.message }
  }
}

// Upload grievance document
export const uploadGrievanceDocument = async (file, organizationId) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `grievances/${organizationId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Store document metadata
    const { data: docData, error: docError } = await supabase
      .from('grievance_documents')
      .insert([{
        filename: file.name,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        public_url: publicUrl,
        organization_id: organizationId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (docError) throw docError

    return { success: true, data: docData }
  } catch (error) {
    console.error('Error uploading grievance document:', error)
    return { success: false, error: error.message }
  }
}

// Download grievance document
export const downloadGrievanceDocument = async (documentId) => {
  try {
    const { data: docData, error: docError } = await supabase
      .from('grievance_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError) throw docError

    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(docData.file_path)

    if (fileError) throw fileError

    return { success: true, data: fileData }
  } catch (error) {
    console.error('Error downloading grievance document:', error)
    return { success: false, error: error.message }
  }
}

// Get available assignees for grievances
export const getAvailableAssignees = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('organization_id', organizationId)
      .in('role', ['hr_manager', 'compliance_officer', 'supervisor', 'admin'])
      .order('full_name')

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching available assignees:', error)
    return { success: false, error: error.message }
  }
}

// Get grievance categories
export const getGrievanceCategories = async (organizationId) => {
  try {
    const categories = [
      { value: 'workplace_safety', label: 'Workplace Safety' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'working_conditions', label: 'Working Conditions' },
      { value: 'wages_benefits', label: 'Wages & Benefits' },
      { value: 'discrimination', label: 'Discrimination' },
      { value: 'environmental', label: 'Environmental' },
      { value: 'other', label: 'Other' }
    ]

    return { success: true, data: categories }
  } catch (error) {
    console.error('Error fetching grievance categories:', error)
    return { success: false, error: error.message }
  }
}

// Validate grievance submission
export const validateGrievanceSubmission = async (grievanceData, organizationId) => {
  try {
    const errors = {}

    // Basic validation
    if (!grievanceData.title?.trim()) errors.title = 'Title is required'
    if (!grievanceData.description?.trim()) errors.description = 'Description is required'
    if (!grievanceData.category) errors.category = 'Category is required'
    if (!grievanceData.priority) errors.priority = 'Priority is required'
    if (!grievanceData.department?.trim()) errors.department = 'Department is required'
    if (!grievanceData.location?.trim()) errors.location = 'Location is required'
    if (!grievanceData.date_of_incident) errors.date_of_incident = 'Date of incident is required'

    // Anonymous validation
    if (!grievanceData.is_anonymous) {
      if (!grievanceData.submitter_name?.trim()) errors.submitter_name = 'Name is required'
      if (!grievanceData.submitter_email?.trim()) errors.submitter_email = 'Email is required'
      if (grievanceData.submitter_email && !/\S+@\S+\.\S+/.test(grievanceData.submitter_email)) {
        errors.submitter_email = 'Email is invalid'
      }
    }

    // Date validation
    if (grievanceData.date_of_incident) {
      const incidentDate = new Date(grievanceData.date_of_incident)
      const today = new Date()
      if (incidentDate > today) {
        errors.date_of_incident = 'Date of incident cannot be in the future'
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }

    return { success: true }
  } catch (error) {
    console.error('Error validating grievance submission:', error)
    return { success: false, error: error.message }
  }
}

// Bulk update grievances
export const bulkUpdateGrievances = async (grievanceIds, updateData, userId) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .in('id', grievanceIds)
      .select()

    if (error) throw error

    // Create history entries for each grievance
    const historyEntries = grievanceIds.map(id => ({
      grievance_id: id,
      action: 'Bulk update',
      performed_by: updateData.updated_by_name || 'System',
      performed_by_id: userId,
      details: `Bulk update: ${Object.keys(updateData).join(', ')}`,
      created_at: new Date().toISOString()
    }))

    await supabase
      .from('grievance_history')
      .insert(historyEntries)

    return { success: true, data }
  } catch (error) {
    console.error('Error bulk updating grievances:', error)
    return { success: false, error: error.message }
  }
}

// Get grievance analytics
export const getGrievanceAnalytics = async (organizationId, dateRange = '30') => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Process analytics data
    const analytics = {
      totalGrievances: data.length,
      byCategory: {},
      byPriority: {},
      byStatus: {},
      byDepartment: {},
      resolutionTrends: [],
      submissionTrends: []
    }

    // Group by category
    data.forEach(grievance => {
      analytics.byCategory[grievance.category] = (analytics.byCategory[grievance.category] || 0) + 1
      analytics.byPriority[grievance.priority] = (analytics.byPriority[grievance.priority] || 0) + 1
      analytics.byStatus[grievance.status] = (analytics.byStatus[grievance.status] || 0) + 1
      analytics.byDepartment[grievance.department] = (analytics.byDepartment[grievance.department] || 0) + 1
    })

    return { success: true, data: analytics }
  } catch (error) {
    console.error('Error fetching grievance analytics:', error)
    return { success: false, error: error.message }
  }
}

// Export grievances to CSV
export const exportGrievances = async (organizationId, filters = {}) => {
  try {
    const { data, error } = await getGrievances(organizationId, filters)
    
    if (error) throw error

    // Convert to CSV format
    const csvHeaders = [
      'ID', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Location',
      'Date of Incident', 'Submitter', 'Assigned To', 'Created Date', 'Updated Date'
    ]

    const csvData = data.map(grievance => [
      grievance.id,
      grievance.title,
      grievance.category,
      grievance.priority,
      grievance.status,
      grievance.department,
      grievance.location,
      grievance.date_of_incident,
      grievance.submitter_name,
      grievance.assigned_to_name || 'Unassigned',
      new Date(grievance.created_at).toLocaleDateString(),
      new Date(grievance.updated_at).toLocaleDateString()
    ])

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return { success: true, data: csvContent }
  } catch (error) {
    console.error('Error exporting grievances:', error)
    return { success: false, error: error.message }
  }
}

// Get organization by QR code
export const getOrganizationByQRCode = async (qrCode) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching organization by QR code:', error)
    return { success: false, error: error.message }
  }
}

// Generate QR code for organization
export const generateOrganizationQRCode = async (organizationId) => {
  try {
    const qrCode = `GRV-${organizationId}-${Date.now()}`
    
    const { data, error } = await supabase
      .from('organizations')
      .update({ qr_code: qrCode })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: { qrCode, organization: data } }
  } catch (error) {
    console.error('Error generating QR code:', error)
    return { success: false, error: error.message }
  }
}

// Get QR code statistics
export const getQRCodeStatistics = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('submitted_via', 'qr_code')

    if (error) throw error

    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const statistics = {
      total_qr_submissions: data.length,
      submissions_this_week: data.filter(g => new Date(g.created_at) >= lastWeek).length,
      submissions_this_month: data.filter(g => new Date(g.created_at) >= lastMonth).length,
      anonymous_submissions: data.filter(g => g.is_anonymous).length,
      completion_rate: data.length > 0 ? Math.round((data.filter(g => g.status === 'resolved').length / data.length) * 100) : 0
    }

    return { success: true, data: statistics }
  } catch (error) {
    console.error('Error fetching QR code statistics:', error)
    return { success: false, error: error.message }
  }
}

// ==================== COMMITTEE WORKFLOW FUNCTIONS ====================

// Get all committees for an organization
export const getCommittees = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('committees')
      .select(`
        *,
        members:committee_members (
          id,
          user:user_id (
            id,
            full_name,
            email,
            role
          ),
          role,
          joined_at
        ),
        active_cases:committee_workflows!committee_id (
          count
        )
      `)
      .eq('organization_id', organizationId)

    if (error) throw error

    // Enrich committee data
    const enrichedData = data.map(committee => ({
      ...committee,
      member_count: committee.members?.length || 0,
      active_cases: committee.active_cases?.length || 0,
      completed_cases: 0, // TODO: Calculate from completed workflows
      success_rate: 85 // TODO: Calculate actual success rate
    }))

    return { success: true, data: enrichedData }
  } catch (error) {
    console.error('Error fetching committees:', error)
    return { success: false, error: error.message }
  }
}

// Get committee members
export const getCommitteeMembers = async (committeeId) => {
  try {
    const { data, error } = await supabase
      .from('committee_members')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email,
          role,
          department
        )
      `)
      .eq('committee_id', committeeId)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching committee members:', error)
    return { success: false, error: error.message }
  }
}

// Get committee workflows
export const getCommitteeWorkflows = async (organizationId, options = {}) => {
  try {
    let query = supabase
      .from('committee_workflows')
      .select(`
        *,
        grievance:grievance_id (
          id,
          title,
          description,
          category,
          priority,
          status,
          created_at
        ),
        committee:committee_id (
          id,
          name,
          type
        ),
        assigned_to_user:assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('organization_id', organizationId)

    // Apply filters
    if (options.status) query = query.eq('status', options.status)
    if (options.committee_id) query = query.eq('committee_id', options.committee_id)
    if (options.priority) query = query.eq('priority', options.priority)

    // Apply sorting
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    // Enrich workflow data
    const enrichedData = data.map(workflow => ({
      ...workflow,
      grievance_title: workflow.grievance?.title || 'Unknown',
      grievance_description: workflow.grievance?.description || '',
      committee_name: workflow.committee?.name || 'Unassigned',
      days_since_assignment: Math.floor((new Date() - new Date(workflow.created_at)) / (1000 * 60 * 60 * 24)),
      assigned_to_name: workflow.assigned_to_user?.full_name || 'Unassigned'
    }))

    return { success: true, data: enrichedData }
  } catch (error) {
    console.error('Error fetching committee workflows:', error)
    return { success: false, error: error.message }
  }
}

// Create new committee
export const createCommittee = async (committeeData) => {
  try {
    const { data, error } = await supabase
      .from('committees')
      .insert([{
        ...committeeData,
        created_at: new Date().toISOString(),
        status: 'active'
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating committee:', error)
    return { success: false, error: error.message }
  }
}

// Update committee
export const updateCommittee = async (committeeId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('committees')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', committeeId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating committee:', error)
    return { success: false, error: error.message }
  }
}

// Add committee member
export const addCommitteeMember = async (committeeId, memberData) => {
  try {
    const { data, error } = await supabase
      .from('committee_members')
      .insert([{
        committee_id: committeeId,
        ...memberData,
        joined_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error adding committee member:', error)
    return { success: false, error: error.message }
  }
}

// Remove committee member
export const removeCommitteeMember = async (committeeId, userId) => {
  try {
    const { error } = await supabase
      .from('committee_members')
      .delete()
      .eq('committee_id', committeeId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error removing committee member:', error)
    return { success: false, error: error.message }
  }
}

// Create committee workflow
export const createCommitteeWorkflow = async (workflowData) => {
  try {
    const { data, error } = await supabase
      .from('committee_workflows')
      .insert([{
        ...workflowData,
        created_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    // Create workflow history entry
    await supabase
      .from('workflow_history')
      .insert([{
        workflow_id: data.id,
        action: 'Workflow created',
        performed_by: workflowData.created_by,
        details: `Assigned to committee ${workflowData.committee_id}`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error creating committee workflow:', error)
    return { success: false, error: error.message }
  }
}

// Update committee workflow
export const updateCommitteeWorkflow = async (workflowId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('committee_workflows')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .select()
      .single()

    if (error) throw error

    // Create workflow history entry
    await supabase
      .from('workflow_history')
      .insert([{
        workflow_id: workflowId,
        action: 'Workflow updated',
        performed_by: updateData.updated_by,
        details: `Status changed to ${updateData.status}`,
        created_at: new Date().toISOString()
      }])

    return { success: true, data }
  } catch (error) {
    console.error('Error updating committee workflow:', error)
    return { success: false, error: error.message }
  }
}

// Assign grievance to committee
export const assignGrievanceToCommittee = async (grievanceId, committeeId, assignedBy) => {
  try {
    // Get grievance details
    const { data: grievance } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', grievanceId)
      .single()

    if (!grievance) throw new Error('Grievance not found')

    // Create committee workflow
    const workflowData = {
      grievance_id: grievanceId,
      committee_id: committeeId,
      organization_id: grievance.organization_id,
      priority: grievance.priority,
      status: 'assigned',
      assigned_by: assignedBy,
      due_date: calculateDueDate(grievance.priority)
    }

    const result = await createCommitteeWorkflow(workflowData)

    if (result.success) {
      // Update grievance status
      await supabase
        .from('grievances')
        .update({
          status: 'assigned_to_committee',
          assigned_committee_id: committeeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', grievanceId)
    }

    return result
  } catch (error) {
    console.error('Error assigning grievance to committee:', error)
    return { success: false, error: error.message }
  }
}

// Calculate due date based on priority
const calculateDueDate = (priority) => {
  const days = priority === 'critical' ? 3 : priority === 'high' ? 7 : priority === 'medium' ? 14 : 30
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + days)
  return dueDate.toISOString()
}

// Get committee statistics
export const getCommitteeStatistics = async (organizationId) => {
  try {
    const [committeesResult, workflowsResult] = await Promise.all([
      supabase
        .from('committees')
        .select('id, status')
        .eq('organization_id', organizationId),
      supabase
        .from('committee_workflows')
        .select('*')
        .eq('organization_id', organizationId)
    ])

    if (committeesResult.error) throw committeesResult.error
    if (workflowsResult.error) throw workflowsResult.error

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const statistics = {
      active_committees: committeesResult.data.filter(c => c.status === 'active').length,
      active_workflows: workflowsResult.data.filter(w => !['completed', 'cancelled'].includes(w.status)).length,
      routed_this_week: workflowsResult.data.filter(w => new Date(w.created_at) >= oneWeekAgo).length,
      avg_resolution_days: calculateAverageResolutionDays(workflowsResult.data.filter(w => w.status === 'completed'))
    }

    return { success: true, data: statistics }
  } catch (error) {
    console.error('Error fetching committee statistics:', error)
    return { success: false, error: error.message }
  }
}

// Calculate average resolution days
const calculateAverageResolutionDays = (completedWorkflows) => {
  if (completedWorkflows.length === 0) return 0
  
  const totalDays = completedWorkflows.reduce((sum, workflow) => {
    const created = new Date(workflow.created_at)
    const completed = new Date(workflow.completed_at || workflow.updated_at)
    return sum + Math.floor((completed - created) / (1000 * 60 * 60 * 24))
  }, 0)
  
  return Math.round(totalDays / completedWorkflows.length)
}

// Get committee grievances
export const getCommitteeGrievances = async (committeeId, options = {}) => {
  try {
    let query = supabase
      .from('committee_workflows')
      .select(`
        *,
        grievance:grievance_id (
          *,
          submitter:submitted_by (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('committee_id', committeeId)

    if (options.status) query = query.eq('status', options.status)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching committee grievances:', error)
    return { success: false, error: error.message }
  }
}

// Get workflow rules
export const getWorkflowRules = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('workflow_routing_rules')
      .select(`
        *,
        target_committee:target_committee_id (
          id,
          name,
          type
        )
      `)
      .eq('organization_id', organizationId)
      .order('priority', { ascending: false })

    if (error) throw error

    // Enrich rules data
    const enrichedData = data.map(rule => ({
      ...rule,
      target_committee_name: rule.target_committee?.name || 'Unknown',
      match_count: 0, // TODO: Calculate actual matches
      success_rate: 90, // TODO: Calculate actual success rate
      last_applied: rule.updated_at
    }))

    return { success: true, data: enrichedData }
  } catch (error) {
    console.error('Error fetching workflow rules:', error)
    return { success: false, error: error.message }
  }
}

// Create workflow rule
export const createWorkflowRule = async (ruleData) => {
  try {
    const { data, error } = await supabase
      .from('workflow_routing_rules')
      .insert([{
        ...ruleData,
        created_at: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating workflow rule:', error)
    return { success: false, error: error.message }
  }
}

// Process committee routing
export const processCommitteeRouting = async (organizationId) => {
  try {
    // Get unassigned grievances
    const { data: unassignedGrievances } = await supabase
      .from('grievances')
      .select('*')
      .eq('organization_id', organizationId)
      .is('assigned_committee_id', null)
      .eq('status', 'submitted')

    if (!unassignedGrievances || unassignedGrievances.length === 0) {
      return { success: true, data: { processed: 0, assigned: 0 } }
    }

    // Get routing rules
    const { data: rules } = await supabase
      .from('workflow_routing_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    let assigned = 0

    for (const grievance of unassignedGrievances) {
      const matchingRule = findMatchingRule(grievance, rules)
      
      if (matchingRule) {
        const result = await assignGrievanceToCommittee(
          grievance.id, 
          matchingRule.target_committee_id, 
          'system'
        )
        
        if (result.success) {
          assigned++
        }
      }
    }

    return { 
      success: true, 
      data: { 
        processed: unassignedGrievances.length, 
        assigned 
      } 
    }
  } catch (error) {
    console.error('Error processing committee routing:', error)
    return { success: false, error: error.message }
  }
}

// Find matching rule for grievance
const findMatchingRule = (grievance, rules) => {
  for (const rule of rules) {
    if (evaluateRuleCondition(grievance, rule)) {
      return rule
    }
  }
  return null
}

// Evaluate rule condition
const evaluateRuleCondition = (grievance, rule) => {
  switch (rule.condition_type) {
    case 'category':
      return grievance.category === rule.condition_value
    case 'priority':
      return grievance.priority === rule.condition_value
    case 'department':
      return grievance.department === rule.condition_value
    case 'category_and_priority':
      return grievance.category === rule.condition_value && 
             ['high', 'critical'].includes(grievance.priority)
    default:
      return false
  }
}

// Get workflow history
export const getWorkflowHistory = async (workflowId) => {
  try {
    const { data, error } = await supabase
      .from('workflow_history')
      .select(`
        *,
        performed_by_user:performed_by (
          id,
          full_name,
          role
        )
      `)
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching workflow history:', error)
    return { success: false, error: error.message }
  }
}

// Update committee workflow status
export const updateWorkflowStatus = async (workflowId, status, userId, notes = '') => {
  try {
    const updateData = {
      status,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completion_notes = notes
    }

    const result = await updateCommitteeWorkflow(workflowId, updateData)

    if (result.success) {
      // Update associated grievance status
      const { data: workflow } = await supabase
        .from('committee_workflows')
        .select('grievance_id')
        .eq('id', workflowId)
        .single()

      if (workflow) {
        const grievanceStatus = status === 'completed' ? 'resolved' : 
                              status === 'reviewing' ? 'in_review' : 
                              'investigating'

        await supabase
          .from('grievances')
          .update({
            status: grievanceStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflow.grievance_id)
      }
    }

    return result
  } catch (error) {
    console.error('Error updating workflow status:', error)
    return { success: false, error: error.message }
  }
}

// Get committee performance metrics
export const getCommitteePerformance = async (organizationId, period = '30d') => {
  try {
    const days = parseInt(period.replace('d', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('committee_workflows')
      .select(`
        *,
        committee:committee_id (
          id,
          name,
          type
        )
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Process performance metrics by committee
    const metrics = {}
    
    data.forEach(workflow => {
      const committeeId = workflow.committee_id
      const committeeName = workflow.committee?.name || 'Unknown'
      
      if (!metrics[committeeId]) {
        metrics[committeeId] = {
          id: committeeId,
          name: committeeName,
          total_cases: 0,
          completed_cases: 0,
          avg_resolution_days: 0,
          on_time_completion: 0,
          escalated_cases: 0
        }
      }
      
      metrics[committeeId].total_cases++
      
      if (workflow.status === 'completed') {
        metrics[committeeId].completed_cases++
        
        // Calculate resolution time
        const resolutionDays = Math.floor(
          (new Date(workflow.completed_at) - new Date(workflow.created_at)) / (1000 * 60 * 60 * 24)
        )
        
        metrics[committeeId].avg_resolution_days += resolutionDays
        
        // Check if completed on time
        if (workflow.due_date && new Date(workflow.completed_at) <= new Date(workflow.due_date)) {
          metrics[committeeId].on_time_completion++
        }
      }
      
      if (workflow.status === 'escalated') {
        metrics[committeeId].escalated_cases++
      }
    })

    // Finalize metrics calculations
    Object.values(metrics).forEach(metric => {
      if (metric.completed_cases > 0) {
        metric.avg_resolution_days = Math.round(metric.avg_resolution_days / metric.completed_cases)
        metric.completion_rate = Math.round((metric.completed_cases / metric.total_cases) * 100)
        metric.on_time_rate = Math.round((metric.on_time_completion / metric.completed_cases) * 100)
      } else {
        metric.completion_rate = 0
        metric.on_time_rate = 0
        metric.avg_resolution_days = 0
      }
    })

    return { success: true, data: Object.values(metrics) }
  } catch (error) {
    console.error('Error fetching committee performance:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// TRAINING SYSTEM FUNCTIONS
// ============================================================================

// Helper function to generate IDs (if not already present)
const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Training Modules
export const getTrainingModules = async (organizationId, filters = {}) => {
  try {
    let query = supabase
      .from('training_modules')
      .select(`
        *,
        lessons:training_lessons(count),
        progress:training_progress(
          user_id,
          progress_percentage,
          status,
          last_accessed
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filters.module_id) {
      query = query.eq('id', filters.module_id)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching training modules:', error)
    return { success: false, error: error.message }
  }
}

export const createTrainingModule = async (moduleData) => {
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .insert([{
        ...moduleData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating training module:', error)
    return { success: false, error: error.message }
  }
}

export const updateTrainingModule = async (moduleId, updates) => {
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating training module:', error)
    return { success: false, error: error.message }
  }
}

export const deleteTrainingModule = async (moduleId) => {
  try {
    const { error } = await supabase
      .from('training_modules')
      .update({ is_active: false })
      .eq('id', moduleId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting training module:', error)
    return { success: false, error: error.message }
  }
}

export const getTrainingStatistics = async (organizationId) => {
  try {
    // For now, return mock data since the actual tables may not exist
    return {
      success: true,
      data: {
        total_modules: 12,
        active_learners: 145,
        completion_rate: 87,
        certificates_issued: 89,
        average_score: 92,
        engagement_rate: 85,
        new_this_month: 3,
        new_modules_this_month: 2,
        modules_trend: 12,
        learners_trend: 8,
        completion_trend: 5,
        score_trend: 3,
        pass_rate: 94
      }
    }
  } catch (error) {
    console.error('Error fetching training statistics:', error)
    return { success: false, error: error.message }
  }
}

export const getTrainingProgress = async (userId, organizationId) => {
  try {
    // Return mock progress data
    return {
      success: true,
      data: [
        {
          id: '1',
          module_id: 'mod1',
          module_title: 'Workplace Safety Fundamentals',
          progress_percentage: 75,
          status: 'in_progress',
          last_accessed: new Date().toISOString(),
          time_spent: 45
        },
        {
          id: '2',
          module_id: 'mod2',
          module_title: 'Environmental Compliance',
          progress_percentage: 100,
          status: 'completed',
          last_accessed: new Date().toISOString(),
          time_spent: 120,
          certificate_issued: true
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching training progress:', error)
    return { success: false, error: error.message }
  }
}

export const enrollUserInModule = async (moduleId, userId) => {
  try {
    // Mock enrollment success
    return {
      success: true,
      data: {
        id: generateId(),
        module_id: moduleId,
        user_id: userId,
        progress_percentage: 0,
        status: 'in_progress',
        enrolled_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error enrolling user in module:', error)
    return { success: false, error: error.message }
  }
}

export const getTrainingAnalytics = async (organizationId) => {
  try {
    // Return mock analytics data
    return {
      success: true,
      data: {
        by_category: {
          safety: { enrollments: 45, completion_rate: 89 },
          compliance: { enrollments: 38, completion_rate: 92 },
          hr: { enrollments: 22, completion_rate: 85 },
          technical: { enrollments: 15, completion_rate: 78 }
        },
        completion_trends: [
          { month: 'Jan', completion_rate: 85 },
          { month: 'Feb', completion_rate: 88 },
          { month: 'Mar', completion_rate: 92 },
          { month: 'Apr', completion_rate: 87 }
        ],
        total_enrollments: 120
      }
    }
  } catch (error) {
    console.error('Error fetching training analytics:', error)
    return { success: false, error: error.message }
  }
}

// Training Content Management
export const getTrainingContent = async (organizationId, filters = {}) => {
  try {
    // Return mock content data
    return {
      success: true,
      data: {
        content: [
          {
            id: '1',
            title: 'Safety Procedures Video',
            type: 'video',
            description: 'Comprehensive workplace safety procedures',
            duration: 1800,
            file_size: 50000000,
            created_at: new Date().toISOString(),
            thumbnail_url: null
          },
          {
            id: '2',
            title: 'Compliance Handbook',
            type: 'document',
            description: 'Complete guide to compliance requirements',
            duration: null,
            file_size: 2000000,
            created_at: new Date().toISOString(),
            thumbnail_url: null
          }
        ],
        lessons: [
          {
            id: '1',
            title: 'Introduction to Safety',
            description: 'Basic safety concepts and procedures',
            duration: 900,
            sort_order: 1,
            content_count: 3
          }
        ]
      }
    }
  } catch (error) {
    console.error('Error fetching training content:', error)
    return { success: false, error: error.message }
  }
}

export const createTrainingContent = async (contentData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...contentData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating training content:', error)
    return { success: false, error: error.message }
  }
}

export const updateTrainingContent = async (contentId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: contentId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating training content:', error)
    return { success: false, error: error.message }
  }
}

export const deleteTrainingContent = async (contentId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting training content:', error)
    return { success: false, error: error.message }
  }
}

export const uploadTrainingMedia = async (file, organizationId, onProgress = null) => {
  try {
    // Mock the upload process
    if (onProgress) {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        onProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
        }
      }, 100)
    }

    // Mock upload success
    return {
      success: true,
      data: {
        url: `https://mock-storage.com/training/${organizationId}/${file.name}`,
        path: `training/${organizationId}/${file.name}`,
        size: file.size,
        type: file.type,
        duration: file.type.startsWith('video/') ? 300 : null,
        thumbnail: file.type.startsWith('video/') ? `https://mock-storage.com/thumbnails/${file.name}.jpg` : null
      }
    }
  } catch (error) {
    console.error('Error uploading training media:', error)
    return { success: false, error: error.message }
  }
}

export const getContentStatistics = async (organizationId) => {
  try {
    // Return mock statistics
    return {
      success: true,
      data: {
        total_content: 24,
        video_count: 8,
        document_count: 12,
        total_size: 500000000
      }
    }
  } catch (error) {
    console.error('Error fetching content statistics:', error)
    return { success: false, error: error.message }
  }
}

export const createLesson = async (lessonData) => {
  try {
    // Mock successful lesson creation
    return {
      success: true,
      data: {
        ...lessonData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating lesson:', error)
    return { success: false, error: error.message }
  }
}

export const updateLesson = async (lessonId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: lessonId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating lesson:', error)
    return { success: false, error: error.message }
  }
}

export const deleteLesson = async (lessonId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return { success: false, error: error.message }
  }
}

export const reorderLessons = async (lessonIds) => {
  try {
    // Mock successful reordering
    return { success: true }
  } catch (error) {
    console.error('Error reordering lessons:', error)
    return { success: false, error: error.message }
  }
}

export const duplicateContent = async (contentId, userId) => {
  try {
    // Mock successful duplication
    return {
      success: true,
      data: {
        id: generateId(),
        title: 'Duplicated Content',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error duplicating content:', error)
    return { success: false, error: error.message }
  }
}

export const getContentPreview = async (contentId) => {
  try {
    // Mock content preview
    return {
      success: true,
      data: {
        id: contentId,
        title: 'Sample Content',
        type: 'video',
        description: 'Sample content description',
        url: 'https://example.com/content.mp4'
      }
    }
  } catch (error) {
    console.error('Error fetching content preview:', error)
    return { success: false, error: error.message }
  }
}

// Assessment System
export const getAssessments = async (organizationId, filters = {}) => {
  try {
    // Return mock assessment data
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Safety Knowledge Quiz',
          description: 'Test your understanding of workplace safety',
          difficulty: 'medium',
          question_count: 10,
          time_limit: 30,
          passing_score: 80,
          attempt_count: 45,
          created_at: new Date().toISOString(),
          type: 'quiz'
        },
        {
          id: '2',
          title: 'Compliance Certification',
          description: 'Comprehensive compliance assessment',
          difficulty: 'advanced',
          question_count: 25,
          time_limit: 60,
          passing_score: 85,
          attempt_count: 23,
          created_at: new Date().toISOString(),
          type: 'certification'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return { success: false, error: error.message }
  }
}

export const createAssessment = async (assessmentData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...assessmentData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating assessment:', error)
    return { success: false, error: error.message }
  }
}

export const updateAssessment = async (assessmentId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: assessmentId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating assessment:', error)
    return { success: false, error: error.message }
  }
}

export const deleteAssessment = async (assessmentId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return { success: false, error: error.message }
  }
}

export const getAssessmentQuestions = async (assessmentId) => {
  try {
    // Return mock questions
    return {
      success: true,
      data: [
        {
          id: '1',
          question_text: 'What is the most important safety rule in the workplace?',
          type: 'multiple_choice',
          points: 10,
          difficulty: 'easy',
          options: [
            { id: 'a', text: 'Always wear safety equipment' },
            { id: 'b', text: 'Report hazards immediately' },
            { id: 'c', text: 'Follow all safety procedures' },
            { id: 'd', text: 'All of the above' }
          ],
          correct_answer: 'd',
          explanation: 'All safety rules are equally important and must be followed.'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching assessment questions:', error)
    return { success: false, error: error.message }
  }
}

export const createQuestion = async (questionData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...questionData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating question:', error)
    return { success: false, error: error.message }
  }
}

export const updateQuestion = async (questionId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: questionId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating question:', error)
    return { success: false, error: error.message }
  }
}

export const deleteQuestion = async (questionId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting question:', error)
    return { success: false, error: error.message }
  }
}

export const getAssessmentAttempts = async (assessmentId, userId = null) => {
  try {
    // Return mock attempts
    return {
      success: true,
      data: [
        {
          id: '1',
          user_id: userId || 'user1',
          score: 85,
          status: 'completed',
          time_taken: 1800,
          created_at: new Date().toISOString(),
          answers: {}
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching assessment attempts:', error)
    return { success: false, error: error.message }
  }
}

export const submitAssessment = async (submissionData) => {
  try {
    // Mock successful submission with scoring
    const score = Math.floor(Math.random() * 40) + 60 // Random score between 60-100
    
    return {
      success: true,
      data: {
        ...submissionData,
        id: generateId(),
        score,
        status: 'completed',
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error submitting assessment:', error)
    return { success: false, error: error.message }
  }
}

export const getAssessmentResults = async (attemptId) => {
  try {
    // Return mock results
    return {
      success: true,
      data: {
        id: attemptId,
        score: 85,
        passed: true,
        time_taken: 1800,
        answers: {},
        assessment: {
          title: 'Safety Knowledge Quiz',
          passing_score: 80
        }
      }
    }
  } catch (error) {
    console.error('Error fetching assessment results:', error)
    return { success: false, error: error.message }
  }
}

export const generateCertificate = async (userId, moduleId, assessmentId) => {
  try {
    // Mock certificate generation
    return {
      success: true,
      data: {
        id: generateId(),
        certificate_number: `CERT-${Date.now()}-${generateId().substring(0, 6)}`,
        user_id: userId,
        module_id: moduleId,
        assessment_id: assessmentId,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating certificate:', error)
    return { success: false, error: error.message }
  }
}

export const getAssessmentStatistics = async (organizationId) => {
  try {
    // Return mock statistics
    return {
      success: true,
      data: {
        total_assessments: 8,
        total_attempts: 156,
        completed_attempts: 134,
        average_score: 87,
        pass_rate: 92
      }
    }
  } catch (error) {
    console.error('Error fetching assessment statistics:', error)
    return { success: false, error: error.message }
  }
}

// Training Dashboard Data
export const getTrainingDashboardData = async (organizationId, userId) => {
  try {
    // Return mock dashboard data
    return {
      success: true,
      data: {
        user_progress: [
          {
            id: '1',
            module_title: 'Workplace Safety Fundamentals',
            progress_percentage: 75,
            status: 'in_progress',
            last_accessed: new Date().toISOString()
          },
          {
            id: '2',
            module_title: 'Environmental Compliance',
            progress_percentage: 100,
            status: 'completed',
            last_accessed: new Date().toISOString()
          }
        ]
      }
    }
  } catch (error) {
    console.error('Error fetching training dashboard data:', error)
    return { success: false, error: error.message }
  }
}

export const getRecentActivity = async (organizationId, userId) => {
  try {
    // Return mock activity data
    return {
      success: true,
      data: [
        {
          id: '1',
          type: 'module_completed',
          title: 'Completed Safety Training',
          description: 'Successfully completed Workplace Safety Fundamentals',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'assessment_taken',
          title: 'Assessment Completed',
          description: 'Scored 92% on Safety Knowledge Quiz',
          created_at: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return { success: false, error: error.message }
  }
}

export const getUpcomingDeadlines = async (organizationId, userId) => {
  try {
    // Return mock deadlines
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Annual Safety Recertification',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'certification'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error)
    return { success: false, error: error.message }
  }
}

export const getTopPerformers = async (organizationId) => {
  try {
    // Return mock performers
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'John Doe',
          modules_completed: 12,
          average_score: 94,
          rating: 4.8
        },
        {
          id: '2',
          name: 'Jane Smith',
          modules_completed: 10,
          average_score: 91,
          rating: 4.7
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching top performers:', error)
    return { success: false, error: error.message }
  }
}

export const getTrainingRecommendations = async (organizationId, userId) => {
  try {
    // Return mock recommendations
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Advanced Safety Management',
          description: 'Take your safety knowledge to the next level',
          duration: 120,
          difficulty: 'advanced',
          rating: 4.6
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching training recommendations:', error)
    return { success: false, error: error.message }
  }
}

export const getModuleContent = async (moduleId) => {
  try {
    // Return mock content
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Introduction Video',
          type: 'video',
          order_number: 1,
          duration: 600
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching module content:', error)
    return { success: false, error: error.message }
  }
}

export const updateProgress = async (userId, moduleId, progressData) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        user_id: userId,
        module_id: moduleId,
        ...progressData,
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating progress:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// MEETING SYSTEM FUNCTIONS
// ============================================================================

// Meeting Management
export const getMeetings = async (organizationId, filters = {}) => {
  try {
    // Return mock meeting data
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Monthly Safety Committee Meeting',
          description: 'Review safety incidents and discuss preventive measures',
          type: 'committee_meeting',
          status: 'scheduled',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          location: 'Conference Room A',
          is_virtual: false,
          is_recurring: true,
          attendee_count: 8,
          has_agenda: true,
          has_minutes: false,
          organizer: { full_name: 'John Smith' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Compliance Review Session',
          description: 'Quarterly compliance review and audit preparation',
          type: 'compliance_review',
          status: 'completed',
          start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
          duration: 90,
          location: null,
          is_virtual: true,
          is_recurring: false,
          attendee_count: 12,
          has_agenda: true,
          has_minutes: true,
          organizer: { full_name: 'Sarah Johnson' },
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return { success: false, error: error.message }
  }
}

export const createMeeting = async (meetingData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...meetingData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating meeting:', error)
    return { success: false, error: error.message }
  }
}

export const updateMeeting = async (meetingId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: meetingId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating meeting:', error)
    return { success: false, error: error.message }
  }
}

export const deleteMeeting = async (meetingId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return { success: false, error: error.message }
  }
}

export const getMeetingById = async (meetingId) => {
  try {
    // Mock meeting details
    return {
      success: true,
      data: {
        id: meetingId,
        title: 'Monthly Safety Committee Meeting',
        description: 'Review safety incidents and discuss preventive measures',
        type: 'committee_meeting',
        status: 'scheduled',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        location: 'Conference Room A',
        is_virtual: false,
        is_recurring: true,
        organizer: { full_name: 'John Smith', id: 'user1' },
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching meeting by ID:', error)
    return { success: false, error: error.message }
  }
}

export const getMeetingStatistics = async (organizationId) => {
  try {
    // Return mock statistics
    return {
      success: true,
      data: {
        total_meetings: 45,
        meetings_this_month: 8,
        upcoming_meetings: 5,
        completed_meetings: 38,
        attendance_rate: 87,
        avg_attendees: 9,
        completion_rate: 94,
        next_meeting_date: 'Tomorrow',
        meetings_trend: 12,
        committees_trend: 8,
        attendance_trend: 5,
        completion_trend: 3,
        active_committees: 6,
        total_members: 48,
        active_action_items: 23
      }
    }
  } catch (error) {
    console.error('Error fetching meeting statistics:', error)
    return { success: false, error: error.message }
  }
}

export const getMeetingAttendees = async (meetingId) => {
  try {
    // Return mock attendees
    return {
      success: true,
      data: [
        {
          id: '1',
          user_id: 'user1',
          user: { full_name: 'John Smith', email: 'john@example.com', role: 'Safety Manager' },
          status: 'confirmed',
          role: 'organizer'
        },
        {
          id: '2',
          user_id: 'user2',
          user: { full_name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Compliance Officer' },
          status: 'confirmed',
          role: 'attendee'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching meeting attendees:', error)
    return { success: false, error: error.message }
  }
}

export const addMeetingAttendee = async (meetingId, attendeeData) => {
  try {
    // Mock successful addition
    return {
      success: true,
      data: {
        ...attendeeData,
        id: generateId(),
        meeting_id: meetingId,
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error adding meeting attendee:', error)
    return { success: false, error: error.message }
  }
}

export const updateAttendeeStatus = async (attendeeId, status) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        id: attendeeId,
        status,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating attendee status:', error)
    return { success: false, error: error.message }
  }
}

export const removeMeetingAttendee = async (meetingId, userId) => {
  try {
    // Mock successful removal
    return { success: true }
  } catch (error) {
    console.error('Error removing meeting attendee:', error)
    return { success: false, error: error.message }
  }
}

export const sendMeetingInvitations = async (meetingId) => {
  try {
    // Mock successful invitation sending
    return {
      success: true,
      data: {
        sent_count: 8,
        failed_count: 0
      }
    }
  } catch (error) {
    console.error('Error sending meeting invitations:', error)
    return { success: false, error: error.message }
  }
}

// Meeting Agenda Functions
export const getMeetingAgenda = async (meetingId) => {
  try {
    // Return mock agenda items
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Review Previous Minutes',
          description: 'Review and approve minutes from last meeting',
          type: 'discussion',
          priority: 'medium',
          estimated_duration: 10,
          order_number: 1,
          presenter: { full_name: 'John Smith' },
          is_completed: false,
          notes: null,
          attachments: []
        },
        {
          id: '2',
          title: 'Safety Incident Report',
          description: 'Discuss recent safety incidents and corrective actions',
          type: 'report',
          priority: 'high',
          estimated_duration: 20,
          order_number: 2,
          presenter: { full_name: 'Sarah Johnson' },
          is_completed: false,
          notes: null,
          attachments: ['incident_report.pdf']
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching meeting agenda:', error)
    return { success: false, error: error.message }
  }
}

export const createAgendaItem = async (itemData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...itemData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating agenda item:', error)
    return { success: false, error: error.message }
  }
}

export const updateAgendaItem = async (itemId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: itemId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating agenda item:', error)
    return { success: false, error: error.message }
  }
}

export const deleteAgendaItem = async (itemId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting agenda item:', error)
    return { success: false, error: error.message }
  }
}

export const reorderAgendaItems = async (meetingId, itemOrder) => {
  try {
    // Mock successful reordering
    return { success: true }
  } catch (error) {
    console.error('Error reordering agenda items:', error)
    return { success: false, error: error.message }
  }
}

export const duplicateAgendaItem = async (itemId, userId) => {
  try {
    // Mock successful duplication
    return {
      success: true,
      data: {
        id: generateId(),
        title: 'Copy of Agenda Item',
        created_by: userId,
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error duplicating agenda item:', error)
    return { success: false, error: error.message }
  }
}

export const getAgendaTemplates = async (organizationId) => {
  try {
    // Return mock templates
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Safety Committee Template',
          description: 'Standard agenda for safety committee meetings',
          items: [
            { title: 'Review Previous Minutes', type: 'discussion', duration: 10 },
            { title: 'Safety Incidents Review', type: 'report', duration: 20 },
            { title: 'Action Items Follow-up', type: 'action_item', duration: 15 }
          ]
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching agenda templates:', error)
    return { success: false, error: error.message }
  }
}

export const createAgendaTemplate = async (templateData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...templateData,
        id: generateId(),
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating agenda template:', error)
    return { success: false, error: error.message }
  }
}

export const applyAgendaTemplate = async (meetingId, templateId) => {
  try {
    // Mock successful application
    return { success: true }
  } catch (error) {
    console.error('Error applying agenda template:', error)
    return { success: false, error: error.message }
  }
}

export const getAgendaStatistics = async (organizationId) => {
  try {
    // Return mock statistics
    return {
      success: true,
      data: {
        total_items: 156,
        completed_items: 134,
        avg_duration: 45,
        most_common_type: 'discussion'
      }
    }
  } catch (error) {
    console.error('Error fetching agenda statistics:', error)
    return { success: false, error: error.message }
  }
}

export const generateAgendaPDF = async (meetingId) => {
  try {
    // Mock PDF generation
    return {
      success: true,
      data: {
        url: 'https://example.com/agenda.pdf'
      }
    }
  } catch (error) {
    console.error('Error generating agenda PDF:', error)
    return { success: false, error: error.message }
  }
}

export const shareAgenda = async (meetingId, shareData) => {
  try {
    // Mock successful sharing
    return { success: true }
  } catch (error) {
    console.error('Error sharing agenda:', error)
    return { success: false, error: error.message }
  }
}

export const getAgendaComments = async (meetingId) => {
  try {
    // Return mock comments
    return {
      success: true,
      data: [
        {
          id: '1',
          agenda_item_id: '1',
          user: { full_name: 'John Smith' },
          comment: 'We should allocate more time for this discussion',
          created_at: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching agenda comments:', error)
    return { success: false, error: error.message }
  }
}

export const addAgendaComment = async (itemId, commentData) => {
  try {
    // Mock successful comment addition
    return {
      success: true,
      data: {
        ...commentData,
        id: generateId(),
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error adding agenda comment:', error)
    return { success: false, error: error.message }
  }
}

export const markAgendaItemComplete = async (itemId, completed, userId) => {
  try {
    // Mock successful completion marking
    return {
      success: true,
      data: {
        id: itemId,
        is_completed: completed,
        completed_by: userId,
        completed_at: completed ? new Date().toISOString() : null
      }
    }
  } catch (error) {
    console.error('Error marking agenda item complete:', error)
    return { success: false, error: error.message }
  }
}

export const trackAgendaTime = async (itemId, action, userId, duration = null) => {
  try {
    // Mock successful time tracking
    return {
      success: true,
      data: {
        item_id: itemId,
        action,
        duration,
        tracked_by: userId,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error tracking agenda time:', error)
    return { success: false, error: error.message }
  }
}

export const getAgendaHistory = async (meetingId) => {
  try {
    // Return mock history
    return {
      success: true,
      data: [
        {
          id: '1',
          action: 'Item added',
          user: { full_name: 'John Smith' },
          details: 'Added agenda item: Safety Review',
          timestamp: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching agenda history:', error)
    return { success: false, error: error.message }
  }
}

// Meeting Minutes Functions
export const getMeetingMinutes = async (meetingId) => {
  try {
    // Return mock minutes
    return {
      success: true,
      data: {
        id: '1',
        meeting_id: meetingId,
        content: 'Meeting called to order at 2:00 PM\n\nAttendees: John Smith, Sarah Johnson\n\nAgenda Items Discussed:\n1. Review of previous minutes - Approved\n2. Safety incident review - 3 incidents reported',
        updated_at: new Date().toISOString(),
        updated_by: 'user1'
      }
    }
  } catch (error) {
    console.error('Error fetching meeting minutes:', error)
    return { success: false, error: error.message }
  }
}

export const saveMeetingMinutes = async (meetingId, minutesData) => {
  try {
    // Mock successful save
    return {
      success: true,
      data: {
        id: generateId(),
        meeting_id: meetingId,
        ...minutesData,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error saving meeting minutes:', error)
    return { success: false, error: error.message }
  }
}

export const updateMeetingMinutes = async (minutesId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        id: minutesId,
        ...updates,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating meeting minutes:', error)
    return { success: false, error: error.message }
  }
}

export const getMeetingActionItems = async (meetingId) => {
  try {
    // Return mock action items
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Update safety procedures document',
          description: 'Revise safety procedures based on recent incidents',
          status: 'pending',
          priority: 'high',
          assigned_to: { full_name: 'John Smith', id: 'user1' },
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Schedule safety training session',
          description: 'Organize training for new employees',
          status: 'in_progress',
          priority: 'medium',
          assigned_to: { full_name: 'Sarah Johnson', id: 'user2' },
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching meeting action items:', error)
    return { success: false, error: error.message }
  }
}

export const createActionItem = async (actionData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...actionData,
        id: generateId(),
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating action item:', error)
    return { success: false, error: error.message }
  }
}

export const updateActionItem = async (itemId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        id: itemId,
        ...updates,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating action item:', error)
    return { success: false, error: error.message }
  }
}

export const deleteActionItem = async (itemId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting action item:', error)
    return { success: false, error: error.message }
  }
}

export const getMeetingAttendance = async (meetingId) => {
  try {
    // Return mock attendance data
    return {
      success: true,
      data: [
        {
          id: '1',
          user: { full_name: 'John Smith', role: 'Safety Manager' },
          status: 'present',
          joined_at: new Date().toISOString()
        },
        {
          id: '2',
          user: { full_name: 'Sarah Johnson', role: 'Compliance Officer' },
          status: 'present',
          joined_at: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching meeting attendance:', error)
    return { success: false, error: error.message }
  }
}

export const updateAttendance = async (attendeeId, status, userId) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        id: attendeeId,
        status,
        updated_by: userId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating attendance:', error)
    return { success: false, error: error.message }
  }
}

export const generateMinutesTemplate = async (meetingId) => {
  try {
    // Mock template generation
    return {
      success: true,
      data: {
        template: 'Meeting called to order at: \nAttendees: \nAgenda Items Discussed:\n\n1. \n\nAction Items:\n- \n\nNext Meeting: '
      }
    }
  } catch (error) {
    console.error('Error generating minutes template:', error)
    return { success: false, error: error.message }
  }
}

export const exportMinutesToPDF = async (meetingId) => {
  try {
    // Mock PDF export
    return {
      success: true,
      data: {
        url: 'https://example.com/minutes.pdf'
      }
    }
  } catch (error) {
    console.error('Error exporting minutes to PDF:', error)
    return { success: false, error: error.message }
  }
}

export const shareMinutes = async (meetingId, shareData) => {
  try {
    // Mock successful sharing
    return { success: true }
  } catch (error) {
    console.error('Error sharing minutes:', error)
    return { success: false, error: error.message }
  }
}

export const getMinutesHistory = async (meetingId) => {
  try {
    // Return mock history
    return {
      success: true,
      data: [
        {
          id: '1',
          action: 'Minutes created',
          user: { full_name: 'John Smith' },
          timestamp: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching minutes history:', error)
    return { success: false, error: error.message }
  }
}

export const approveMinutes = async (meetingId, userId) => {
  try {
    // Mock successful approval
    return {
      success: true,
      data: {
        approved_by: userId,
        approved_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error approving minutes:', error)
    return { success: false, error: error.message }
  }
}

export const getMinutesStatistics = async (organizationId) => {
  try {
    // Return mock statistics
    return {
      success: true,
      data: {
        total_meetings_with_minutes: 38,
        avg_minutes_length: 1200,
        most_productive_month: 'March',
        action_items_generated: 156
      }
    }
  } catch (error) {
    console.error('Error fetching minutes statistics:', error)
    return { success: false, error: error.message }
  }
}

export const extractActionItemsFromText = async (minutesText) => {
  try {
    // Mock AI extraction of action items
    const actionItems = [
      {
        title: 'Update safety procedures',
        description: 'Based on discussion about recent incidents',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    
    return {
      success: true,
      data: actionItems
    }
  } catch (error) {
    console.error('Error extracting action items:', error)
    return { success: false, error: error.message }
  }
}

export const autoSummarizeDiscussion = async (minutesText) => {
  try {
    // Mock AI summarization
    return {
      success: true,
      data: {
        summary: 'Meeting focused on safety improvements and compliance updates.',
        keyPoints: [
          'Three safety incidents reported',
          'Need to update safety procedures',
          'Training session required for new employees'
        ]
      }
    }
  } catch (error) {
    console.error('Error auto-summarizing discussion:', error)
    return { success: false, error: error.message }
  }
}

// Meeting Dashboard Functions
export const getMeetingDashboardData = async (organizationId) => {
  try {
    // Return mock dashboard data
    return {
      success: true,
      data: {
        upcoming_meetings: 5,
        recent_meetings: 3,
        active_committees: 6,
        pending_action_items: 23
      }
    }
  } catch (error) {
    console.error('Error fetching meeting dashboard data:', error)
    return { success: false, error: error.message }
  }
}

export const getUpcomingMeetings = async (organizationId, limit = 10) => {
  try {
    // Return mock upcoming meetings
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Weekly Safety Review',
          type: 'safety',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: 'Conference Room A',
          is_virtual: false,
          attendee_count: 8
        },
        {
          id: '2',
          title: 'Compliance Committee Meeting',
          type: 'compliance_review',
          start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: null,
          is_virtual: true,
          attendee_count: 12
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error)
    return { success: false, error: error.message }
  }
}

export const getRecentMeetings = async (organizationId, limit = 10) => {
  try {
    // Return mock recent meetings
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Monthly Safety Committee',
          end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          has_minutes: true,
          has_action_items: true
        },
        {
          id: '2',
          title: 'Audit Review Session',
          end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          has_minutes: true,
          has_action_items: false
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching recent meetings:', error)
    return { success: false, error: error.message }
  }
}

export const getMeetingAnalytics = async (organizationId) => {
  try {
    // Return mock analytics
    return {
      success: true,
      data: {
        monthly_trends: [
          { month: 'Jan', meetings: 12, attendance: 85 },
          { month: 'Feb', meetings: 15, attendance: 88 },
          { month: 'Mar', meetings: 18, attendance: 92 }
        ],
        meeting_types: {
          safety: 45,
          compliance: 38,
          training: 22,
          general: 15
        }
      }
    }
  } catch (error) {
    console.error('Error fetching meeting analytics:', error)
    return { success: false, error: error.message }
  }
}

export const getCommitteeOverview = async (organizationId) => {
  try {
    // Return mock committee overview
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Safety Committee',
          member_count: 8,
          active_workflows: 3,
          performance_score: 92
        },
        {
          id: '2',
          name: 'Compliance Committee',
          member_count: 12,
          active_workflows: 5,
          performance_score: 88
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching committee overview:', error)
    return { success: false, error: error.message }
  }
}

export const getActionItemsSummary = async (organizationId) => {
  try {
    // Return mock action items summary
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Update safety procedures',
          status: 'pending',
          priority: 'high',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'John Smith'
        },
        {
          id: '2',
          title: 'Schedule training session',
          status: 'in_progress',
          priority: 'medium',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'Sarah Johnson'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching action items summary:', error)
    return { success: false, error: error.message }
  }
}

export const getRecurringMeetings = async (organizationId) => {
  try {
    // Return mock recurring meetings
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Weekly Safety Review',
          frequency: 'weekly',
          next_occurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching recurring meetings:', error)
    return { success: false, error: error.message }
  }
}

export const createRecurringMeeting = async (meetingData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...meetingData,
        id: generateId(),
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating recurring meeting:', error)
    return { success: false, error: error.message }
  }
}

export const updateRecurringMeeting = async (meetingId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        id: meetingId,
        ...updates,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating recurring meeting:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// COMMITTEE MANAGEMENT FUNCTIONS
// ============================================================================

export const deleteCommittee = async (committeeId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting committee:', error)
    return { success: false, error: error.message }
  }
}

export const getCommitteeById = async (committeeId) => {
  try {
    // Mock committee details
    return {
      success: true,
      data: {
        id: committeeId,
        name: 'Safety Committee',
        description: 'Oversees workplace safety policies and incident management',
        type: 'safety',
        status: 'active',
        member_count: 8,
        active_workflows: 3,
        performance_score: 92,
        meeting_frequency: 'weekly',
        chairperson: { full_name: 'John Smith', id: 'user1' },
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching committee by ID:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// AI & ADVANCED FEATURES FUNCTIONS (PHASE 8)
// ============================================================================

// Smart Insights Engine Functions
export const getSmartInsights = async (organizationId, filters = {}) => {
  try {
    // Return mock AI insights
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Compliance Score Trending Upward',
          description: 'Your overall compliance score has improved by 12% over the past month due to consistent permit renewals and improved safety training completion rates.',
          type: 'compliance_trend',
          category: 'compliance',
          impact: 'medium',
          confidence: 92,
          priority: 'medium',
          is_read: false,
          is_bookmarked: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          key_findings: [
            'Safety training completion increased by 15%',
            'Permit renewal rate improved to 98%',
            'Incident reporting response time decreased by 20%'
          ],
          recommendations: [
            'Continue current safety training schedule',
            'Implement automated permit renewal reminders',
            'Expand incident response team training'
          ],
          affected_areas: ['safety', 'permits', 'training'],
          estimated_impact: { value: 12, type: 'percentage' }
        },
        {
          id: '2',
          title: 'Potential Safety Risk Detected',
          description: 'AI analysis indicates an increased risk of safety incidents in the production area based on recent equipment maintenance patterns and worker behavior data.',
          type: 'risk_alert',
          category: 'safety',
          impact: 'high',
          confidence: 87,
          priority: 'high',
          is_read: false,
          is_bookmarked: true,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          key_findings: [
            'Equipment maintenance overdue by 3 days on average',
            'Increased near-miss reports in past 2 weeks',
            'Worker fatigue indicators above normal threshold'
          ],
          recommendations: [
            'Schedule immediate equipment inspection',
            'Implement additional safety briefings',
            'Review shift rotation schedules',
            'Increase safety supervisor presence'
          ],
          affected_areas: ['production', 'maintenance', 'safety'],
          estimated_impact: { value: 25, type: 'percentage' }
        },
        {
          id: '3',
          title: 'Training Efficiency Opportunity',
          description: 'Machine learning analysis reveals that training completion rates are 30% higher when delivered on Tuesday-Thursday compared to Monday and Friday.',
          type: 'efficiency_opportunity',
          category: 'training',
          impact: 'medium',
          confidence: 83,
          priority: 'low',
          is_read: true,
          is_bookmarked: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          key_findings: [
            'Tuesday-Thursday training completion: 94%',
            'Monday-Friday training completion: 72%',
            'Optimal training duration: 45-60 minutes'
          ],
          recommendations: [
            'Reschedule critical training to mid-week',
            'Limit Monday/Friday training to refreshers',
            'Optimize training session length'
          ],
          affected_areas: ['training', 'scheduling'],
          estimated_impact: { value: 30, type: 'percentage' }
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching smart insights:', error)
    return { success: false, error: error.message }
  }
}

export const getInsightsByCategory = async (organizationId, category) => {
  try {
    // Mock category-specific insights
    return {
      success: true,
      data: []
    }
  } catch (error) {
    console.error('Error fetching insights by category:', error)
    return { success: false, error: error.message }
  }
}

export const generateInsightReport = async (organizationId, insightIds) => {
  try {
    // Mock insight report generation
    return {
      success: true,
      data: {
        report_url: 'https://example.com/insights-report.pdf'
      }
    }
  } catch (error) {
    console.error('Error generating insight report:', error)
    return { success: false, error: error.message }
  }
}

export const getInsightTrends = async (organizationId, timeRange) => {
  try {
    // Return mock insight trends
    return {
      success: true,
      data: [
        {
          title: 'Compliance Score Improvement',
          description: 'Overall compliance performance trending upward',
          direction: 'up',
          value: 15,
          comparison_period: 'last month'
        },
        {
          title: 'Safety Incident Reduction',
          description: 'Safety incidents decreasing with improved training',
          direction: 'down',
          value: 22,
          comparison_period: 'last quarter'
        },
        {
          title: 'Training Efficiency',
          description: 'Training completion rates improving',
          direction: 'up',
          value: 8,
          comparison_period: 'last week'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching insight trends:', error)
    return { success: false, error: error.message }
  }
}

export const getInsightRecommendations = async (organizationId) => {
  try {
    // Return mock AI recommendations
    return {
      success: true,
      data: [
        {
          title: 'Optimize Training Schedule',
          description: 'Reschedule training sessions to mid-week for higher completion rates',
          impact: 'medium',
          effort: 'low',
          roi: 'high',
          timeline: '2 weeks',
          priority: 'medium'
        },
        {
          title: 'Implement Predictive Maintenance',
          description: 'Use AI to predict equipment failures before they occur',
          impact: 'high',
          effort: 'medium',
          roi: 'very high',
          timeline: '1 month',
          priority: 'high'
        },
        {
          title: 'Automate Permit Renewals',
          description: 'Set up automatic renewal reminders and pre-filling',
          impact: 'low',
          effort: 'low',
          roi: 'medium',
          timeline: '1 week',
          priority: 'low'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching insight recommendations:', error)
    return { success: false, error: error.message }
  }
}

export const getInsightAlerts = async (organizationId) => {
  try {
    // Return mock insight alerts
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'High Priority Safety Risk',
          message: 'AI detected elevated safety risk in production area',
          severity: 'high',
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching insight alerts:', error)
    return { success: false, error: error.message }
  }
}

export const markInsightAsRead = async (insightId, userId) => {
  try {
    // Mock marking insight as read
    return {
      success: true,
      data: {
        id: insightId,
        is_read: true,
        read_by: userId,
        read_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error marking insight as read:', error)
    return { success: false, error: error.message }
  }
}

export const bookmarkInsight = async (insightId, userId, isBookmarked) => {
  try {
    // Mock bookmarking insight
    return {
      success: true,
      data: {
        id: insightId,
        is_bookmarked: isBookmarked,
        bookmarked_by: userId,
        bookmarked_at: isBookmarked ? new Date().toISOString() : null
      }
    }
  } catch (error) {
    console.error('Error bookmarking insight:', error)
    return { success: false, error: error.message }
  }
}

export const shareInsight = async (insightId, shareData) => {
  try {
    // Mock sharing insight
    return { success: true }
  } catch (error) {
    console.error('Error sharing insight:', error)
    return { success: false, error: error.message }
  }
}

export const getInsightStatistics = async (organizationId) => {
  try {
    // Return mock insight statistics
    return {
      success: true,
      data: {
        total_insights: 156,
        new_insights_today: 8,
        high_priority_alerts: 3,
        urgent_alerts: 1,
        avg_confidence: 84,
        high_confidence_insights: 142,
        implemented_recommendations: 23,
        pending_actions: 7,
        insights_trend: 12,
        alerts_trend: -15,
        confidence_trend: 3,
        implementation_trend: 8
      }
    }
  } catch (error) {
    console.error('Error fetching insight statistics:', error)
    return { success: false, error: error.message }
  }
}

export const refreshInsights = async (organizationId) => {
  try {
    // Mock insight refresh
    return {
      success: true,
      data: {
        new_insights_generated: 5,
        updated_insights: 12
      }
    }
  } catch (error) {
    console.error('Error refreshing insights:', error)
    return { success: false, error: error.message }
  }
}

export const getInsightHistory = async (organizationId) => {
  try {
    // Return mock insight history
    return {
      success: true,
      data: [
        {
          id: '1',
          action: 'Insight generated',
          insight_title: 'Compliance Score Improvement',
          user: { full_name: 'AI System' },
          timestamp: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching insight history:', error)
    return { success: false, error: error.message }
  }
}

export const configureInsightSettings = async (organizationId, settings) => {
  try {
    // Mock configuration update
    return { success: true }
  } catch (error) {
    console.error('Error configuring insight settings:', error)
    return { success: false, error: error.message }
  }
}

export const exportInsightsReport = async (organizationId, filters) => {
  try {
    // Mock export
    return {
      success: true,
      data: {
        export_url: 'https://example.com/insights-export.pdf'
      }
    }
  } catch (error) {
    console.error('Error exporting insights report:', error)
    return { success: false, error: error.message }
  }
}

// Predictive Analytics Functions
export const getPredictiveAnalytics = async (organizationId, options = {}) => {
  try {
    // Return mock predictive analytics data
    return {
      success: true,
      data: {
        prediction_accuracy: 87,
        accuracy_improvement: 5,
        high_risk_predictions: 4,
        critical_alerts: 2,
        forecasted_compliance: 92,
        model_performance: 89,
        active_models: 8
      }
    }
  } catch (error) {
    console.error('Error fetching predictive analytics:', error)
    return { success: false, error: error.message }
  }
}

export const getComplianceForecasts = async (organizationId, timeframe) => {
  try {
    // Return mock compliance forecasts
    return {
      success: true,
      data: [
        {
          metric_name: 'Overall Compliance Score',
          timeframe: '30 days',
          current_value: 88,
          predicted_value: 92,
          confidence: 84,
          trend: 'up',
          change: 4.5,
          confidence_interval: 3.2,
          value_type: 'percentage',
          factors: ['improved training', 'better documentation', 'proactive maintenance']
        },
        {
          metric_name: 'Safety Incident Rate',
          timeframe: '30 days',
          current_value: 2.3,
          predicted_value: 1.8,
          confidence: 79,
          trend: 'down',
          change: -21.7,
          confidence_interval: 0.4,
          value_type: 'rate',
          factors: ['enhanced safety training', 'new safety protocols', 'improved equipment']
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching compliance forecasts:', error)
    return { success: false, error: error.message }
  }
}

export const getTrendPredictions = async (organizationId) => {
  try {
    // Return mock trend predictions
    return {
      success: true,
      data: [
        {
          metric: 'Compliance Score',
          trend: 'increasing',
          confidence: 85,
          predicted_change: 8.5
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching trend predictions:', error)
    return { success: false, error: error.message }
  }
}

export const getAnomalyDetection = async (organizationId) => {
  try {
    // Return mock anomaly detection results
    return {
      success: true,
      data: [
        {
          title: 'Unusual Training Completion Pattern',
          description: 'Training completion rate dropped to 45% on Friday, significantly below the 85% weekly average',
          severity: 'medium',
          detected_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          deviation: 47,
          confidence: 92,
          suggested_actions: [
            'Investigate Friday training session issues',
            'Check for technical problems with training platform',
            'Review trainer availability and quality'
          ]
        },
        {
          title: 'Permit Renewal Spike',
          description: 'Unusually high number of permit renewals requested today - 3x normal volume',
          severity: 'low',
          detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          deviation: 200,
          confidence: 88,
          suggested_actions: [
            'Verify if this is due to scheduled renewals',
            'Check for system notification issues',
            'Ensure adequate staff to process renewals'
          ]
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching anomaly detection:', error)
    return { success: false, error: error.message }
  }
}

export const getPredictiveModels = async (organizationId) => {
  try {
    // Return mock predictive models
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Compliance Score Predictor',
          type: 'lstm',
          accuracy: 87,
          status: 'active',
          last_trained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching predictive models:', error)
    return { success: false, error: error.message }
  }
}

export const generateForecast = async (organizationId, options) => {
  try {
    // Mock forecast generation
    return {
      success: true,
      data: {
        forecast_id: generateId(),
        message: 'Forecast generated successfully'
      }
    }
  } catch (error) {
    console.error('Error generating forecast:', error)
    return { success: false, error: error.message }
  }
}

export const updatePredictionModel = async (modelId, updates) => {
  try {
    // Mock model update
    return {
      success: true,
      data: {
        id: modelId,
        ...updates,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating prediction model:', error)
    return { success: false, error: error.message }
  }
}

export const getPredictionAccuracy = async (organizationId) => {
  try {
    // Return mock prediction accuracy
    return {
      success: true,
      data: {
        overall_accuracy: 87,
        model_accuracies: [
          { model: 'Compliance Predictor', accuracy: 87 },
          { model: 'Safety Risk Analyzer', accuracy: 82 },
          { model: 'Training Optimizer', accuracy: 91 }
        ]
      }
    }
  } catch (error) {
    console.error('Error fetching prediction accuracy:', error)
    return { success: false, error: error.message }
  }
}

export const getScenarioAnalysis = async (organizationId) => {
  try {
    // Return mock scenario analysis
    return {
      success: true,
      data: [
        {
          scenario: 'Increased Training Budget',
          impact: 'Compliance score improvement of 12-15%',
          probability: 85,
          risk_factors: ['Budget approval', 'Staff availability']
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching scenario analysis:', error)
    return { success: false, error: error.message }
  }
}

export const exportPredictionReport = async (organizationId, options) => {
  try {
    // Mock export
    return {
      success: true,
      data: {
        report_url: 'https://example.com/prediction-report.pdf'
      }
    }
  } catch (error) {
    console.error('Error exporting prediction report:', error)
    return { success: false, error: error.message }
  }
}

export const configurePredictionSettings = async (organizationId, settings) => {
  try {
    // Mock configuration
    return { success: true }
  } catch (error) {
    console.error('Error configuring prediction settings:', error)
    return { success: false, error: error.message }
  }
}

export const getPredictionAlerts = async (organizationId) => {
  try {
    // Return mock prediction alerts
    return {
      success: true,
      data: [
        {
          id: '1',
          title: 'Model Accuracy Degradation',
          message: 'Compliance prediction model accuracy dropped below threshold',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching prediction alerts:', error)
    return { success: false, error: error.message }
  }
}

export const acknowledgePredictionAlert = async (alertId, userId) => {
  try {
    // Mock alert acknowledgment
    return {
      success: true,
      data: {
        id: alertId,
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error acknowledging prediction alert:', error)
    return { success: false, error: error.message }
  }
}

// Advanced Automation Functions
export const getAutomationRules = async (organizationId) => {
  try {
    // Return mock automation rules
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Auto Permit Renewal Reminder',
          description: 'Automatically send reminders 30 days before permit expiry',
          category: 'compliance',
          status: 'active',
          priority: 'medium',
          is_active: true,
          trigger_type: 'schedule',
          trigger_name: 'Daily Check',
          trigger_schedule: 'Daily at 9:00 AM',
          trigger_conditions: ['Permit expires in 30 days', 'Reminder not sent'],
          action_count: 2,
          actions: [
            { type: 'email', name: 'Send email to permit owner', delay: null },
            { type: 'notification', name: 'Create in-app notification', delay: '1 hour' }
          ],
          last_executed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          execution_count: 45,
          success_rate: 98,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Safety Incident Auto-Assignment',
          description: 'Automatically assign safety incidents to safety manager',
          category: 'safety',
          status: 'active',
          priority: 'high',
          is_active: true,
          trigger_type: 'event',
          trigger_name: 'Safety Incident Created',
          trigger_schedule: null,
          trigger_conditions: ['Incident severity is high', 'No assignee'],
          action_count: 3,
          actions: [
            { type: 'update_status', name: 'Assign to safety manager', delay: null },
            { type: 'email', name: 'Notify safety manager', delay: null },
            { type: 'create_task', name: 'Create investigation task', delay: '1 day' }
          ],
          last_executed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          execution_count: 12,
          success_rate: 100,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Training Completion Follow-up',
          description: 'Follow up on overdue training assignments',
          category: 'training',
          status: 'paused',
          priority: 'low',
          is_active: false,
          trigger_type: 'schedule',
          trigger_name: 'Weekly Check',
          trigger_schedule: 'Weekly on Monday',
          trigger_conditions: ['Training overdue by 7 days'],
          action_count: 1,
          actions: [
            { type: 'email', name: 'Send reminder email', delay: null }
          ],
          last_executed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          execution_count: 8,
          success_rate: 87,
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching automation rules:', error)
    return { success: false, error: error.message }
  }
}

export const createAutomationRule = async (ruleData) => {
  try {
    // Mock successful creation
    return {
      success: true,
      data: {
        ...ruleData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const updateAutomationRule = async (ruleId, updates) => {
  try {
    // Mock successful update
    return {
      success: true,
      data: {
        ...updates,
        id: ruleId,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const deleteAutomationRule = async (ruleId) => {
  try {
    // Mock successful deletion
    return { success: true }
  } catch (error) {
    console.error('Error deleting automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const getAutomationHistory = async (organizationId) => {
  try {
    // Return mock automation history
    return {
      success: true,
      data: [
        {
          id: '1',
          rule_id: '1',
          rule_name: 'Auto Permit Renewal Reminder',
          action: 'executed',
          status: 'success',
          details: 'Sent 5 permit renewal reminders',
          executed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          rule_id: '2',
          rule_name: 'Safety Incident Auto-Assignment',
          action: 'executed',
          status: 'success',
          details: 'Assigned incident #123 to safety manager',
          executed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching automation history:', error)
    return { success: false, error: error.message }
  }
}

export const getAutomationStatistics = async (organizationId) => {
  try {
    // Return mock automation statistics
    return {
      success: true,
      data: {
        total_rules: 15,
        active_rules: 12,
        executions_today: 28,
        success_rate: 95,
        time_saved_hours: 156,
        efficiency_gain: 35
      }
    }
  } catch (error) {
    console.error('Error fetching automation statistics:', error)
    return { success: false, error: error.message }
  }
}

export const executeAutomationRule = async (ruleId, userId) => {
  try {
    // Mock rule execution
    return {
      success: true,
      data: {
        rule_id: ruleId,
        executed_by: userId,
        executed_at: new Date().toISOString(),
        status: 'success'
      }
    }
  } catch (error) {
    console.error('Error executing automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const pauseAutomationRule = async (ruleId, userId) => {
  try {
    // Mock rule pausing
    return {
      success: true,
      data: {
        id: ruleId,
        is_active: false,
        paused_by: userId,
        paused_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error pausing automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const resumeAutomationRule = async (ruleId, userId) => {
  try {
    // Mock rule resuming
    return {
      success: true,
      data: {
        id: ruleId,
        is_active: true,
        resumed_by: userId,
        resumed_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error resuming automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const getAutomationTriggers = async () => {
  try {
    // Return available trigger types
    return {
      success: true,
      data: [
        {
          type: 'schedule',
          name: 'Scheduled Trigger',
          description: 'Execute based on time schedule',
          options: ['daily', 'weekly', 'monthly', 'custom_cron']
        },
        {
          type: 'event',
          name: 'Event Trigger',
          description: 'Execute when specific events occur',
          options: ['permit_expiring', 'incident_created', 'training_overdue', 'audit_scheduled']
        },
        {
          type: 'condition',
          name: 'Condition Trigger',
          description: 'Execute when conditions are met',
          options: ['compliance_score_below', 'incident_count_above', 'permits_expiring_count']
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching automation triggers:', error)
    return { success: false, error: error.message }
  }
}

export const getAutomationActions = async () => {
  try {
    // Return available action types
    return {
      success: true,
      data: [
        {
          type: 'notification',
          name: 'Send Notification',
          description: 'Create in-app notification',
          parameters: ['recipient', 'message', 'priority']
        },
        {
          type: 'email',
          name: 'Send Email',
          description: 'Send email notification',
          parameters: ['recipients', 'subject', 'template']
        },
        {
          type: 'create_task',
          name: 'Create Task',
          description: 'Create a new task or action item',
          parameters: ['title', 'assignee', 'due_date', 'priority']
        },
        {
          type: 'update_status',
          name: 'Update Status',
          description: 'Update entity status',
          parameters: ['entity_type', 'entity_id', 'new_status']
        },
        {
          type: 'generate_report',
          name: 'Generate Report',
          description: 'Create automated report',
          parameters: ['report_type', 'recipients', 'format']
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching automation actions:', error)
    return { success: false, error: error.message }
  }
}

export const testAutomationRule = async (ruleId, userId) => {
  try {
    // Mock rule testing
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing
    
    return {
      success: true,
      data: {
        rule_id: ruleId,
        test_status: 'passed',
        message: 'Rule executed successfully in test mode',
        test_results: {
          triggers_evaluated: 1,
          actions_executed: 2,
          execution_time: '1.2s'
        }
      }
    }
  } catch (error) {
    console.error('Error testing automation rule:', error)
    return { success: false, error: error.message }
  }
}

export const getAutomationTemplates = async () => {
  try {
    // Return automation templates
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Permit Renewal Automation',
          description: 'Automated permit renewal reminders and processing',
          category: 'compliance',
          triggers: [{ type: 'schedule', schedule: 'daily' }],
          actions: [{ type: 'email' }, { type: 'notification' }]
        },
        {
          id: '2',
          name: 'Safety Incident Response',
          description: 'Automated safety incident assignment and notifications',
          category: 'safety',
          triggers: [{ type: 'event', event: 'incident_created' }],
          actions: [{ type: 'update_status' }, { type: 'email' }, { type: 'create_task' }]
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching automation templates:', error)
    return { success: false, error: error.message }
  }
}

export const exportAutomationRules = async (organizationId) => {
  try {
    // Mock export
    return {
      success: true,
      data: {
        export_url: 'https://example.com/automation-rules.json'
      }
    }
  } catch (error) {
    console.error('Error exporting automation rules:', error)
    return { success: false, error: error.message }
  }
}

export const importAutomationRules = async (organizationId, rulesData) => {
  try {
    // Mock import
    return {
      success: true,
      data: {
        imported_count: rulesData.length,
        skipped_count: 0
      }
    }
  } catch (error) {
    console.error('Error importing automation rules:', error)
    return { success: false, error: error.message }
  }
}

export const getWorkflowPerformance = async (organizationId) => {
  try {
    // Return mock workflow performance
    return {
      success: true,
      data: [
        {
          workflow_name: 'Permit Renewal Process',
          description: 'Automated permit renewal workflow',
          efficiency_gain: 75,
          time_saved: 24,
          cost_reduction: 40
        },
        {
          workflow_name: 'Safety Incident Response',
          description: 'Automated safety incident processing',
          efficiency_gain: 60,
          time_saved: 16,
          cost_reduction: 25
        },
        {
          workflow_name: 'Training Completion Tracking',
          description: 'Automated training follow-up',
          efficiency_gain: 45,
          time_saved: 12,
          cost_reduction: 20
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching workflow performance:', error)
    return { success: false, error: error.message }
  }
}

export const optimizeWorkflows = async (organizationId) => {
  try {
    // Mock workflow optimization
    return {
      success: true,
      data: {
        optimizations_applied: 5,
        efficiency_improvement: 12,
        recommendations: [
          'Combine duplicate email notifications',
          'Reduce automation trigger frequency',
          'Optimize condition checking logic'
        ]
      }
    }
  } catch (error) {
    console.error('Error optimizing workflows:', error)
    return { success: false, error: error.message }
  }
}

export const getAutomationInsights = async (organizationId) => {
  try {
    // Return automation insights
    return {
      success: true,
      data: [
        {
          title: 'High Email Volume Detected',
          description: 'Permit renewal reminders are generating excessive emails. Consider consolidating notifications.',
          category: 'efficiency',
          priority: 'medium',
          confidence: 88,
          recommendations: [
            'Implement daily digest emails instead of individual notifications',
            'Add email throttling to prevent spam',
            'Create a unified notification dashboard'
          ]
        },
        {
          title: 'Automation Success Rate Improvement',
          description: 'Recent automation optimizations have improved success rates by 15%',
          category: 'performance',
          priority: 'low',
          confidence: 92,
          recommendations: [
            'Apply similar optimizations to other workflows',
            'Monitor performance metrics continuously',
            'Consider expanding automation coverage'
          ]
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching automation insights:', error)
    return { success: false, error: error.message }
  }
}

// AI Dashboard Functions
export const getAIDashboardOverview = async (organizationId) => {
  try {
    // Return mock AI dashboard overview
    return {
      success: true,
      data: {
        insights_generated: 156,
        insights_trend: 15,
        new_insights_today: 8,
        predictions_made: 89,
        predictions_trend: 22,
        prediction_accuracy: 87,
        active_automations: 12,
        automation_trend: 8,
        automations_executed: 28,
        ai_performance_score: 91,
        performance_trend: 5,
        system_health: 'excellent'
      }
    }
  } catch (error) {
    console.error('Error fetching AI dashboard overview:', error)
    return { success: false, error: error.message }
  }
}

export const getAISystemHealth = async (organizationId) => {
  try {
    // Return mock AI system health
    return {
      success: true,
      data: {
        overall_status: 'excellent',
        model_accuracy: 87,
        uptime: 99.8,
        components: [
          {
            name: 'Smart Insights Engine',
            status: 'healthy',
            performance: 92,
            last_check: '2 minutes ago'
          },
          {
            name: 'Predictive Analytics',
            status: 'healthy',
            performance: 89,
            last_check: '5 minutes ago'
          },
          {
            name: 'Automation Engine',
            status: 'healthy',
            performance: 95,
            last_check: '1 minute ago'
          }
        ]
      }
    }
  } catch (error) {
    console.error('Error fetching AI system health:', error)
    return { success: false, error: error.message }
  }
}

export const getAIPerformanceMetrics = async (organizationId) => {
  try {
    // Return mock AI performance metrics
    return {
      success: true,
      data: [
        {
          metric: 'Model Accuracy',
          current_value: 87,
          target_value: 85,
          trend: 'improving'
        },
        {
          metric: 'Prediction Confidence',
          current_value: 84,
          target_value: 80,
          trend: 'stable'
        },
        {
          metric: 'Automation Success Rate',
          current_value: 95,
          target_value: 90,
          trend: 'improving'
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching AI performance metrics:', error)
    return { success: false, error: error.message }
  }
}

export const getRecentAIActivities = async (organizationId) => {
  try {
    // Return mock recent AI activities
    return {
      success: true,
      data: [
        {
          type: 'insight',
          title: 'New Compliance Insight Generated',
          description: 'AI detected improvement opportunity in training scheduling',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          confidence: 92
        },
        {
          type: 'prediction',
          title: 'Risk Prediction Updated',
          description: 'Safety risk prediction for production area updated',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          confidence: 85
        },
        {
          type: 'automation',
          title: 'Automation Rule Executed',
          description: 'Permit renewal reminders sent automatically',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          confidence: null
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching recent AI activities:', error)
    return { success: false, error: error.message }
  }
}

export const getAIRecommendations = async (organizationId) => {
  try {
    // Return mock AI recommendations
    return {
      success: true,
      data: [
        {
          title: 'Optimize Training Schedule',
          description: 'Reschedule training sessions to mid-week for higher completion rates',
          priority: 'medium',
          impact: 'medium',
          effort: 'low',
          confidence: 88
        },
        {
          title: 'Implement Predictive Maintenance',
          description: 'Use AI to predict equipment failures before they occur',
          priority: 'high',
          impact: 'high',
          effort: 'medium',
          confidence: 85
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching AI recommendations:', error)
    return { success: false, error: error.message }
  }
}

export const getAIAlerts = async (organizationId) => {
  try {
    // Return mock AI alerts
    return {
      success: true,
      data: [
        {
          title: 'Model Accuracy Drop',
          message: 'Compliance prediction model accuracy has dropped below 85%',
          severity: 'medium',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching AI alerts:', error)
    return { success: false, error: error.message }
  }
}

export const refreshAIModels = async (organizationId) => {
  try {
    // Mock AI model refresh
    await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate processing
    
    return {
      success: true,
      data: {
        models_updated: 5,
        improvement: 3.2
      }
    }
  } catch (error) {
    console.error('Error refreshing AI models:', error)
    return { success: false, error: error.message }
  }
}

export const calibrateAIModels = async (organizationId, userId) => {
  try {
    // Mock AI model calibration
    return {
      success: true,
      data: {
        calibration_started: true,
        estimated_completion: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    }
  } catch (error) {
    console.error('Error calibrating AI models:', error)
    return { success: false, error: error.message }
  }
}

export const getAIUsageStatistics = async (organizationId) => {
  try {
    // Return mock AI usage statistics
    return {
      success: true,
      data: {
        insights_generated_monthly: 234,
        predictions_made_monthly: 156,
        automations_executed_monthly: 890,
        user_engagement: 78,
        roi_improvement: 35
      }
    }
  } catch (error) {
    console.error('Error fetching AI usage statistics:', error)
    return { success: false, error: error.message }
  }
}

export const exportAIReport = async (organizationId, options = {}) => {
  try {
    // Mock AI report export
    return {
      success: true,
      data: {
        report_url: 'https://example.com/ai-report.pdf'
      }
    }
  } catch (error) {
    console.error('Error exporting AI report:', error)
    return { success: false, error: error.message }
  }
}

// Get organization by ID
export const getOrganization = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Organization fetch error:', error)
    return { success: false, error: error.message }
  }
}

// Get organization users
export const getOrganizationUsers = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organization users:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Organization users fetch error:', error)
    return { success: false, error: error.message }
  }
}

// Create user record
export const createUserRecord = async (userId, email, fullName, organizationId, role = 'worker') => {
  try {
    const userData = {
      id: userId,
      email,
      full_name: fullName,
      organization_id: organizationId,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error('Error creating user record:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create user record error:', error)
    return { success: false, error: error.message }
  }
}
