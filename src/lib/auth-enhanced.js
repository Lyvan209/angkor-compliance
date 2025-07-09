import { supabase } from './supabase-enhanced'

// ==========================================
// ENHANCED AUTHENTICATION SYSTEM
// ==========================================

// Auth events for audit logging
const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  MFA_ENABLED: 'auth.mfa.enabled',
  MFA_DISABLED: 'auth.mfa.disabled',
  MFA_VERIFIED: 'auth.mfa.verified',
  MFA_FAILED: 'auth.mfa.failed',
  PASSWORD_CHANGED: 'auth.password.changed',
  PASSWORD_RESET: 'auth.password.reset',
  SESSION_EXPIRED: 'auth.session.expired',
  ACCOUNT_LOCKED: 'auth.account.locked',
  ACCOUNT_UNLOCKED: 'auth.account.unlocked'
}

// Security settings
const SECURITY_SETTINGS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  PASSWORD_MIN_LENGTH: 8,
  MFA_ISSUER: 'Angkor Compliance',
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000 // 30 days
}

// ==========================================
// AUDIT LOGGING
// ==========================================

export const logAuthEvent = async (event, userId = null, details = {}) => {
  try {
    const logEntry = {
      user_id: userId,
      action: event,
      table_name: 'auth',
      record_id: userId,
      new_values: {
        event,
        timestamp: new Date().toISOString(),
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        ...details
      },
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    }

    await supabase.from('audit_log').insert([logEntry])
  } catch (error) {
    console.error('Failed to log auth event:', error)
  }
}

const getClientIP = async () => {
  try {
    // In production, get IP from your backend or IP service
    return 'client_ip'
  } catch {
    return 'unknown'
  }
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export class SessionManager {
  constructor() {
    this.sessionTimer = null
    this.warningTimer = null
    this.lastActivity = Date.now()
    this.isActive = true
    
    this.setupActivityTracking()
    this.setupSessionTimer()
  }

  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity()
      }, { passive: true })
    })
  }

  updateLastActivity() {
    this.lastActivity = Date.now()
    
    if (!this.isActive) {
      this.isActive = true
      this.setupSessionTimer()
    }
  }

  setupSessionTimer() {
    this.clearTimers()
    
    // Warning 5 minutes before timeout
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning()
    }, SECURITY_SETTINGS.SESSION_TIMEOUT - 5 * 60 * 1000)
    
    // Auto logout on timeout
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout()
    }, SECURITY_SETTINGS.SESSION_TIMEOUT)
  }

  showSessionWarning() {
    const confirmed = window.confirm(
      'Your session will expire in 5 minutes due to inactivity. Click OK to extend your session.'
    )
    
    if (confirmed) {
      this.extendSession()
    }
  }

  async extendSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Failed to refresh session:', error)
        this.handleSessionTimeout()
        return
      }
      
      this.setupSessionTimer()
      await logAuthEvent(AUTH_EVENTS.SESSION_EXTENDED, data.user?.id)
    } catch (error) {
      console.error('Session extension failed:', error)
      this.handleSessionTimeout()
    }
  }

  async handleSessionTimeout() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, user?.id)
      
      await supabase.auth.signOut()
      
      // Redirect to login with timeout message
      window.location.href = '/login?reason=session_expired'
    } catch (error) {
      console.error('Session timeout handling failed:', error)
    }
  }

  clearTimers() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
      this.sessionTimer = null
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this.warningTimer = null
    }
  }

  destroy() {
    this.clearTimers()
    this.isActive = false
  }
}

// ==========================================
// ACCOUNT SECURITY
// ==========================================

export class AccountSecurity {
  static async checkAccountLock(email) {
    try {
      const { data, error } = await supabase
        .from('user_security')
        .select('login_attempts, locked_until')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking account lock:', error)
        return { isLocked: false }
      }

      if (!data) {
        return { isLocked: false }
      }

      const now = new Date()
      const lockedUntil = data.locked_until ? new Date(data.locked_until) : null
      
      if (lockedUntil && now < lockedUntil) {
        return { 
          isLocked: true, 
          lockedUntil,
          remainingTime: lockedUntil - now
        }
      }

      return { isLocked: false, loginAttempts: data.login_attempts || 0 }
    } catch (error) {
      console.error('Account lock check failed:', error)
      return { isLocked: false }
    }
  }

  static async recordLoginAttempt(email, success = false, userId = null) {
    try {
      if (success) {
        // Reset login attempts on successful login
        await supabase
          .from('user_security')
          .upsert([{
            email,
            user_id: userId,
            login_attempts: 0,
            locked_until: null,
            last_successful_login: new Date().toISOString()
          }])
        
        await logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, userId, { email })
        return { success: true }
      } else {
        // Increment failed attempts
        const { data: existing } = await supabase
          .from('user_security')
          .select('login_attempts')
          .eq('email', email)
          .single()

        const attempts = (existing?.login_attempts || 0) + 1
        const shouldLock = attempts >= SECURITY_SETTINGS.MAX_LOGIN_ATTEMPTS
        
        const updateData = {
          email,
          login_attempts: attempts,
          last_failed_login: new Date().toISOString()
        }

        if (shouldLock) {
          updateData.locked_until = new Date(Date.now() + SECURITY_SETTINGS.LOCKOUT_DURATION).toISOString()
          await logAuthEvent(AUTH_EVENTS.ACCOUNT_LOCKED, null, { email, attempts })
        } else {
          await logAuthEvent(AUTH_EVENTS.LOGIN_FAILED, null, { email, attempts })
        }

        await supabase
          .from('user_security')
          .upsert([updateData])

        return { 
          success: false, 
          attempts, 
          isLocked: shouldLock,
          remainingAttempts: SECURITY_SETTINGS.MAX_LOGIN_ATTEMPTS - attempts
        }
      }
    } catch (error) {
      console.error('Failed to record login attempt:', error)
      return { success: false }
    }
  }
}

// ==========================================
// MULTI-FACTOR AUTHENTICATION
// ==========================================

export class MFAManager {
  static async enableMFA(userId) {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) {
        console.error('MFA enrollment failed:', error)
        return { success: false, error: error.message }
      }

      await logAuthEvent(AUTH_EVENTS.MFA_ENABLED, userId)
      
      return {
        success: true,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id
      }
    } catch (error) {
      console.error('MFA enable error:', error)
      return { success: false, error: error.message }
    }
  }

  static async verifyMFA(factorId, code, userId) {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: factorId,
        code
      })

      if (error) {
        await logAuthEvent(AUTH_EVENTS.MFA_FAILED, userId, { factorId })
        return { success: false, error: error.message }
      }

      await logAuthEvent(AUTH_EVENTS.MFA_VERIFIED, userId, { factorId })
      return { success: true }
    } catch (error) {
      console.error('MFA verification error:', error)
      return { success: false, error: error.message }
    }
  }

  static async disableMFA(factorId, userId) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })

      if (error) {
        console.error('MFA disable failed:', error)
        return { success: false, error: error.message }
      }

      await logAuthEvent(AUTH_EVENTS.MFA_DISABLED, userId, { factorId })
      return { success: true }
    } catch (error) {
      console.error('MFA disable error:', error)
      return { success: false, error: error.message }
    }
  }

  static async listMFAFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      
      if (error) {
        console.error('Failed to list MFA factors:', error)
        return { success: false, factors: [] }
      }

      return { success: true, factors: data.totp || [] }
    } catch (error) {
      console.error('MFA list error:', error)
      return { success: false, factors: [] }
    }
  }
}

// ==========================================
// PASSWORD SECURITY
// ==========================================

export class PasswordSecurity {
  static validatePasswordStrength(password) {
    const checks = {
      length: password.length >= SECURITY_SETTINGS.PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommon: !this.isCommonPassword(password)
    }

    const score = Object.values(checks).filter(Boolean).length
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'

    return {
      isValid: checks.length && checks.uppercase && checks.lowercase && checks.numbers,
      strength,
      score,
      checks
    }
  }

  static isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ]
    
    return commonPasswords.includes(password.toLowerCase())
  }

  static async changePassword(currentPassword, newPassword, userId) {
    try {
      const validation = this.validatePasswordStrength(newPassword)
      
      if (!validation.isValid) {
        return { 
          success: false, 
          error: 'Password does not meet security requirements',
          validation
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password change failed:', error)
        return { success: false, error: error.message }
      }

      await logAuthEvent(AUTH_EVENTS.PASSWORD_CHANGED, userId)
      return { success: true }
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, error: error.message }
    }
  }

  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('Password reset failed:', error)
        return { success: false, error: error.message }
      }

      await logAuthEvent(AUTH_EVENTS.PASSWORD_RESET, null, { email })
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: error.message }
    }
  }
}

// ==========================================
// ENHANCED SIGN IN/OUT
// ==========================================

export const enhancedSignIn = async (email, password, rememberMe = false) => {
  try {
    // Check if account is locked
    const lockCheck = await AccountSecurity.checkAccountLock(email)
    
    if (lockCheck.isLocked) {
      return {
        success: false,
        error: `Account is locked until ${lockCheck.lockedUntil.toLocaleString()}`,
        isLocked: true,
        remainingTime: lockCheck.remainingTime
      }
    }

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        persistSession: rememberMe
      }
    })

    if (error) {
      // Record failed attempt
      const attemptResult = await AccountSecurity.recordLoginAttempt(email, false)
      
      return {
        success: false,
        error: error.message,
        attempts: attemptResult.attempts,
        remainingAttempts: attemptResult.remainingAttempts,
        isLocked: attemptResult.isLocked
      }
    }

    // Record successful login
    await AccountSecurity.recordLoginAttempt(email, true, data.user.id)
    
    return {
      success: true,
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Enhanced sign in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

export const enhancedSignOut = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }

    await logAuthEvent(AUTH_EVENTS.LOGOUT, user?.id)
    
    return { success: true }
  } catch (error) {
    console.error('Enhanced sign out error:', error)
    return { success: false, error: error.message }
  }
}

// ==========================================
// SECURITY MONITORING
// ==========================================

export class SecurityMonitor {
  static async getSecurityEvents(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('user_id', userId)
        .like('action', 'auth.%')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch security events:', error)
        return { success: false, events: [] }
      }

      return { success: true, events: data }
    } catch (error) {
      console.error('Security events fetch error:', error)
      return { success: false, events: [] }
    }
  }

  static async getActiveSessions(userId) {
    try {
      // This would require additional session tracking in your database
      // For now, return current session info
      const { data: { session } } = await supabase.auth.getSession()
      
      return {
        success: true,
        sessions: session ? [{
          id: session.access_token.substring(0, 8),
          created_at: new Date(session.user.created_at),
          last_activity: new Date(),
          ip_address: 'current',
          user_agent: navigator.userAgent,
          is_current: true
        }] : []
      }
    } catch (error) {
      console.error('Active sessions fetch error:', error)
      return { success: false, sessions: [] }
    }
  }
}

// Initialize session manager
let sessionManager = null

export const initializeSessionManager = () => {
  if (!sessionManager) {
    sessionManager = new SessionManager()
  }
  return sessionManager
}

export const destroySessionManager = () => {
  if (sessionManager) {
    sessionManager.destroy()
    sessionManager = null
  }
}

// Export security settings for components
export { AUTH_EVENTS, SECURITY_SETTINGS } 