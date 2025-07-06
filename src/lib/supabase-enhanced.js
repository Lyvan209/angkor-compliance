import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

export const signUp = async (email, password, fullName, organizationId = null) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_id: organizationId
        }
      }
    })
    
    if (error) throw error
    
    // If signup is successful and user is confirmed, create user record
    if (data.user && data.user.email_confirmed_at) {
      await createUserRecord(data.user.id, email, fullName, organizationId)
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

export const createUserRecord = async (userId, email, fullName, organizationId, role = 'worker') => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: userId,
      email,
      full_name: fullName,
      organization_id: organizationId,
      role
    }])
    .select()
    .single()
  
  return { data, error }
}

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      organizations (*)
    `)
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

export const getOrganizationUsers = async (organizationId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
  
  return { data, error }
}

// ==========================================
// ORGANIZATION FUNCTIONS
// ==========================================

export const getOrganization = async (organizationId) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()
  
  return { data, error }
}

export const updateOrganization = async (organizationId, updates) => {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organizationId)
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// PERMIT MANAGEMENT FUNCTIONS
// ==========================================

export const getPermits = async (organizationId) => {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('organization_id', organizationId)
    .order('expiry_date', { ascending: true })
  
  return { data, error }
}

export const createPermit = async (permitData) => {
  const { data, error } = await supabase
    .from('permits')
    .insert([permitData])
    .select()
    .single()
  
  return { data, error }
}

export const updatePermit = async (permitId, updates) => {
  const { data, error } = await supabase
    .from('permits')
    .update(updates)
    .eq('id', permitId)
    .select()
    .single()
  
  return { data, error }
}

export const getExpiringPermits = async (organizationId, daysAhead = 30) => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('organization_id', organizationId)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .eq('status', 'active')
  
  return { data, error }
}

// ==========================================
// AUDIT MANAGEMENT FUNCTIONS
// ==========================================

export const getAudits = async (organizationId) => {
  const { data, error } = await supabase
    .from('audits')
    .select(`
      *,
      audit_findings (*)
    `)
    .eq('organization_id', organizationId)
    .order('audit_date', { ascending: false })
  
  return { data, error }
}

export const createAudit = async (auditData) => {
  const { data, error } = await supabase
    .from('audits')
    .insert([auditData])
    .select()
    .single()
  
  return { data, error }
}

export const getAuditFindings = async (auditId) => {
  const { data, error } = await supabase
    .from('audit_findings')
    .select('*')
    .eq('audit_id', auditId)
    .order('severity', { ascending: false })
  
  return { data, error }
}

export const createAuditFinding = async (findingData) => {
  const { data, error } = await supabase
    .from('audit_findings')
    .insert([findingData])
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// CAP MANAGEMENT FUNCTIONS
// ==========================================

export const getCAPs = async (organizationId) => {
  const { data, error } = await supabase
    .from('caps')
    .select(`
      *,
      cap_actions (*),
      assigned_to:users!caps_assigned_to_fkey (*),
      reviewer:users!caps_reviewer_id_fkey (*),
      audit_findings (*)
    `)
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: true })
  
  return { data, error }
}

export const createCAP = async (capData) => {
  const { data, error } = await supabase
    .from('caps')
    .insert([capData])
    .select()
    .single()
  
  return { data, error }
}

export const updateCAP = async (capId, updates) => {
  const { data, error } = await supabase
    .from('caps')
    .update(updates)
    .eq('id', capId)
    .select()
    .single()
  
  return { data, error }
}

export const getCAPActions = async (capId) => {
  const { data, error } = await supabase
    .from('cap_actions')
    .select(`
      *,
      assigned_to:users (*)
    `)
    .eq('cap_id', capId)
    .order('due_date', { ascending: true })
  
  return { data, error }
}

export const createCAPAction = async (actionData) => {
  const { data, error } = await supabase
    .from('cap_actions')
    .insert([actionData])
    .select()
    .single()
  
  return { data, error }
}

export const updateCAPAction = async (actionId, updates) => {
  const { data, error } = await supabase
    .from('cap_actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// GRIEVANCE MANAGEMENT FUNCTIONS
// ==========================================

export const getGrievances = async (organizationId) => {
  const { data, error } = await supabase
    .from('grievances')
    .select(`
      *,
      submitted_by:users (*),
      assigned_to:users!grievances_assigned_to_fkey (*),
      grievance_workflow (*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const createGrievance = async (grievanceData) => {
  // Generate grievance number
  const grievanceNumber = await generateGrievanceNumber(grievanceData.organization_id)
  
  const { data, error } = await supabase
    .from('grievances')
    .insert([{
      ...grievanceData,
      grievance_number: grievanceNumber
    }])
    .select()
    .single()
  
  return { data, error }
}

export const updateGrievance = async (grievanceId, updates) => {
  const { data, error } = await supabase
    .from('grievances')
    .update(updates)
    .eq('id', grievanceId)
    .select()
    .single()
  
  return { data, error }
}

export const addGrievanceWorkflow = async (workflowData) => {
  const { data, error } = await supabase
    .from('grievance_workflow')
    .insert([workflowData])
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// TRAINING MANAGEMENT FUNCTIONS
// ==========================================

export const getTrainingModules = async (organizationId) => {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('title', { ascending: true })
  
  return { data, error }
}

export const getTrainingSessions = async (organizationId) => {
  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      *,
      training_modules (*),
      training_attendees (*)
    `)
    .eq('training_modules.organization_id', organizationId)
    .order('session_date', { ascending: true })
  
  return { data, error }
}

export const createTrainingSession = async (sessionData) => {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert([sessionData])
    .select()
    .single()
  
  return { data, error }
}

export const recordTrainingAttendance = async (attendanceData) => {
  const { data, error } = await supabase
    .from('training_attendees')
    .upsert([attendanceData])
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// COMMITTEE MANAGEMENT FUNCTIONS
// ==========================================

export const getCommittees = async (organizationId) => {
  const { data, error } = await supabase
    .from('committees')
    .select(`
      *,
      committee_members (
        *,
        users (*)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
  
  return { data, error }
}

export const getMeetings = async (committeeId) => {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      meeting_attendees (
        *,
        users (*)
      )
    `)
    .eq('committee_id', committeeId)
    .order('meeting_date', { ascending: false })
  
  return { data, error }
}

export const createMeeting = async (meetingData) => {
  const { data, error } = await supabase
    .from('meetings')
    .insert([meetingData])
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ==========================================

export const getDocuments = async (organizationId) => {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploaded_by:users (*),
      approved_by:users!documents_approved_by_fkey (*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const uploadDocument = async (documentData) => {
  const { data, error } = await supabase
    .from('documents')
    .insert([documentData])
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// NOTIFICATION FUNCTIONS
// ==========================================

export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return { data, error }
}

export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single()
  
  return { data, error }
}

export const createNotification = async (notificationData) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select()
    .single()
  
  return { data, error }
}

// ==========================================
// ANALYTICS & REPORTING FUNCTIONS
// ==========================================

export const getComplianceOverview = async (organizationId) => {
  // Get permits by status
  const { data: permits } = await supabase
    .from('permits')
    .select('status')
    .eq('organization_id', organizationId)
  
  // Get CAPs by status
  const { data: caps } = await supabase
    .from('caps')
    .select('status')
    .eq('organization_id', organizationId)
  
  // Get grievances by status
  const { data: grievances } = await supabase
    .from('grievances')
    .select('status')
    .eq('organization_id', organizationId)
  
  // Get recent audits
  const { data: audits } = await supabase
    .from('audits')
    .select('overall_score, audit_date')
    .eq('organization_id', organizationId)
    .order('audit_date', { ascending: false })
    .limit(5)
  
  return {
    permits: permits || [],
    caps: caps || [],
    grievances: grievances || [],
    audits: audits || []
  }
}

export const getAuditTrends = async (organizationId, months = 12) => {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  
  const { data, error } = await supabase
    .from('audits')
    .select('overall_score, audit_date')
    .eq('organization_id', organizationId)
    .gte('audit_date', startDate.toISOString().split('T')[0])
    .order('audit_date', { ascending: true })
  
  return { data, error }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const generateGrievanceNumber = async (organizationId) => {
  const currentYear = new Date().getFullYear()
  const prefix = `GRV-${currentYear}-`
  
  const { data, error } = await supabase
    .from('grievances')
    .select('grievance_number')
    .eq('organization_id', organizationId)
    .like('grievance_number', `${prefix}%`)
    .order('grievance_number', { ascending: false })
    .limit(1)
  
  if (error || !data || data.length === 0) {
    return `${prefix}001`
  }
  
  const lastNumber = data[0].grievance_number.split('-')[2]
  const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(3, '0')
  
  return `${prefix}${nextNumber}`
}

export const getSystemSettings = async (organizationId) => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
  
  return { data, error }
}

// ==========================================
// REAL-TIME SUBSCRIPTIONS
// ==========================================

export const subscribeToNotifications = (userId, callback) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToGrievances = (organizationId, callback) => {
  return supabase
    .channel(`grievances:${organizationId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'grievances',
        filter: `organization_id=eq.${organizationId}`
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToCAPs = (organizationId, callback) => {
  return supabase
    .channel(`caps:${organizationId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'caps',
        filter: `organization_id=eq.${organizationId}`
      }, 
      callback
    )
    .subscribe()
}

// ==========================================
// ERROR HANDLING
// ==========================================

export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  
  // Common error handling
  if (error.code === 'PGRST116') {
    return 'No data found'
  }
  
  if (error.code === '23505') {
    return 'This record already exists'
  }
  
  if (error.code === '23503') {
    return 'Invalid reference - related record not found'
  }
  
  return error.message || 'An unexpected error occurred'
}

export default supabase 