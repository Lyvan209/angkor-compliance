# Enhanced Authentication System Documentation

## Overview

The Angkor Compliance platform implements a comprehensive authentication system with multi-factor authentication (MFA), advanced session management, and robust security features. This document provides detailed information about the authentication architecture, components, and usage.

## Features

### 🔐 Core Authentication
- **Enhanced Sign-in**: Secure login with account lockout protection
- **Session Management**: Automatic session timeout and refresh
- **Password Security**: Strength validation and secure password changes
- **Account Lockout**: Temporary account locking after failed attempts

### 🛡️ Multi-Factor Authentication (MFA)
- **TOTP Support**: Time-based One-Time Password using authenticator apps
- **QR Code Setup**: Easy setup with QR code scanning
- **Manual Setup**: Alternative manual key entry
- **Factor Management**: Enable/disable MFA factors

### 📊 Security Monitoring
- **Audit Logging**: Comprehensive security event tracking
- **Activity Monitoring**: Real-time security activity viewing
- **Session Tracking**: Active session management
- **Security Events**: Login attempts, MFA actions, password changes

## Architecture

### File Structure
```
src/
├── lib/
│   └── auth-enhanced.js          # Core authentication logic
├── components/
│   └── auth/
│       ├── MFASetup.jsx          # Multi-factor authentication setup
│       ├── SecuritySettings.jsx  # Security management interface
│       └── EnhancedLoginForm.jsx # Enhanced login form with MFA
```

### Database Schema

#### User Security Table
```sql
CREATE TABLE user_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_successful_login TIMESTAMP WITH TIME ZONE,
  last_failed_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  backup_codes TEXT[],
  security_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Audit Log Table
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Components

### 1. Enhanced Authentication Library (`auth-enhanced.js`)

#### Core Classes and Functions

**SessionManager**
- Manages user sessions with automatic timeout
- Tracks user activity and extends sessions
- Handles session warnings and timeouts

**AccountSecurity**
- Manages account lockout policies
- Tracks login attempts and failures
- Implements security timeouts

**MFAManager**
- Handles multi-factor authentication setup
- Manages TOTP factors and verification
- Provides QR code generation

**PasswordSecurity**
- Validates password strength
- Manages password changes
- Implements common password checks

**SecurityMonitor**
- Tracks security events and activities
- Provides audit logging functionality
- Monitors active sessions

#### Security Settings
```javascript
const SECURITY_SETTINGS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  PASSWORD_MIN_LENGTH: 8,
  MFA_ISSUER: 'Angkor Compliance',
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000 // 30 days
}
```

### 2. MFA Setup Component (`MFASetup.jsx`)

#### Features
- **4-Step Setup Process**: Intro → Setup → Verify → Complete
- **QR Code Generation**: Automatic QR code for authenticator apps
- **Manual Setup**: Alternative setup key entry
- **Progress Tracking**: Visual progress indicator
- **Factor Management**: Enable/disable existing factors

#### Usage
```jsx
import MFASetup from './components/auth/MFASetup'

<MFASetup
  user={user}
  onComplete={() => setShowMFA(false)}
  onCancel={() => setShowMFA(false)}
/>
```

### 3. Security Settings Component (`SecuritySettings.jsx`)

#### Features
- **Security Overview**: Current security status display
- **Password Management**: Secure password change interface
- **MFA Management**: Enable/disable MFA with setup wizard
- **Activity Monitoring**: View security events and active sessions
- **Tabbed Interface**: Organized security settings

#### Usage
```jsx
import SecuritySettings from './components/auth/SecuritySettings'

<SecuritySettings user={user} />
```

### 4. Enhanced Login Form (`EnhancedLoginForm.jsx`)

#### Features
- **Account Lockout Protection**: Automatic lockout after failed attempts
- **MFA Integration**: Seamless MFA verification flow
- **Security Warnings**: Real-time security status indicators
- **Session Management**: Automatic session initialization
- **Responsive Design**: Mobile-friendly interface

#### Usage
```jsx
import EnhancedLoginForm from './components/auth/EnhancedLoginForm'

<EnhancedLoginForm
  onSuccess={(user) => handleLogin(user)}
  onError={(error) => handleError(error)}
/>
```

## Security Events

### Event Types
- `auth.login.success` - Successful login
- `auth.login.failed` - Failed login attempt
- `auth.logout` - User logout
- `auth.mfa.enabled` - MFA enabled
- `auth.mfa.disabled` - MFA disabled
- `auth.mfa.verified` - MFA verification success
- `auth.mfa.failed` - MFA verification failed
- `auth.password.changed` - Password changed
- `auth.password.reset` - Password reset
- `auth.session.expired` - Session expired
- `auth.account.locked` - Account locked
- `auth.account.unlocked` - Account unlocked

### Audit Logging
```javascript
import { logAuthEvent, AUTH_EVENTS } from './lib/auth-enhanced'

// Log a security event
await logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, userId, {
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...'
})
```

## Implementation Guide

### 1. Basic Setup

```javascript
// Initialize enhanced authentication
import { initializeSessionManager } from './lib/auth-enhanced'

// Initialize session manager after login
const sessionManager = initializeSessionManager()

// Clean up on logout
import { destroySessionManager } from './lib/auth-enhanced'
destroySessionManager()
```

### 2. Enhanced Sign-in

```javascript
import { enhancedSignIn } from './lib/auth-enhanced'

const handleLogin = async (email, password, rememberMe) => {
  const result = await enhancedSignIn(email, password, rememberMe)
  
  if (result.success) {
    // Handle successful login
    console.log('Login successful:', result.user)
  } else {
    // Handle login failure
    console.error('Login failed:', result.error)
    
    if (result.isLocked) {
      // Account is locked
      console.log('Account locked until:', result.lockoutTime)
    }
  }
}
```

### 3. MFA Implementation

```javascript
import { MFAManager } from './lib/auth-enhanced'

// Enable MFA for user
const enableMFA = async (userId) => {
  const result = await MFAManager.enableMFA(userId)
  
  if (result.success) {
    // Show QR code to user
    console.log('QR Code:', result.qrCode)
    console.log('Secret:', result.secret)
  }
}

// Verify MFA code
const verifyMFA = async (factorId, code, userId) => {
  const result = await MFAManager.verifyMFA(factorId, code, userId)
  
  if (result.success) {
    console.log('MFA verified successfully')
  } else {
    console.error('MFA verification failed:', result.error)
  }
}
```

### 4. Password Security

```javascript
import { PasswordSecurity } from './lib/auth-enhanced'

// Validate password strength
const validatePassword = (password) => {
  const validation = PasswordSecurity.validatePasswordStrength(password)
  
  console.log('Password strength:', validation.strength)
  console.log('Is valid:', validation.isValid)
  console.log('Checks:', validation.checks)
}

// Change password
const changePassword = async (currentPassword, newPassword, userId) => {
  const result = await PasswordSecurity.changePassword(
    currentPassword,
    newPassword,
    userId
  )
  
  if (result.success) {
    console.log('Password changed successfully')
  } else {
    console.error('Password change failed:', result.error)
  }
}
```

### 5. Security Monitoring

```javascript
import { SecurityMonitor } from './lib/auth-enhanced'

// Get security events
const getSecurityEvents = async (userId) => {
  const result = await SecurityMonitor.getSecurityEvents(userId, 50)
  
  if (result.success) {
    console.log('Security events:', result.events)
  }
}

// Get active sessions
const getActiveSessions = async (userId) => {
  const result = await SecurityMonitor.getActiveSessions(userId)
  
  if (result.success) {
    console.log('Active sessions:', result.sessions)
  }
}
```

## Best Practices

### Security Guidelines
1. **Always use HTTPS** in production
2. **Implement rate limiting** at the server level
3. **Use strong session tokens** with proper expiration
4. **Log all security events** for audit purposes
5. **Regularly review security logs** for suspicious activity

### User Experience
1. **Provide clear error messages** without revealing sensitive information
2. **Show security status** to users (MFA enabled, last login, etc.)
3. **Offer backup options** for MFA (backup codes, alternative methods)
4. **Implement progressive security** (require MFA for sensitive operations)

### Implementation Tips
1. **Test thoroughly** with different browsers and devices
2. **Handle edge cases** (network failures, timeout scenarios)
3. **Implement proper error handling** for all authentication flows
4. **Use secure storage** for sensitive data (encrypted storage)
5. **Regular security audits** of authentication flows

## Testing

### Unit Tests
```javascript
// Test password strength validation
test('Password strength validation', () => {
  const weak = PasswordSecurity.validatePasswordStrength('123')
  expect(weak.strength).toBe('weak')
  
  const strong = PasswordSecurity.validatePasswordStrength('StrongPass123!')
  expect(strong.strength).toBe('strong')
})

// Test account lockout
test('Account lockout after failed attempts', async () => {
  // Simulate multiple failed attempts
  for (let i = 0; i < 5; i++) {
    await AccountSecurity.recordLoginAttempt('test@example.com', false)
  }
  
  const lockCheck = await AccountSecurity.checkAccountLock('test@example.com')
  expect(lockCheck.isLocked).toBe(true)
})
```

### Integration Tests
```javascript
// Test full authentication flow
test('Complete authentication flow', async () => {
  // Test login
  const loginResult = await enhancedSignIn('test@example.com', 'password')
  expect(loginResult.success).toBe(true)
  
  // Test MFA setup
  const mfaResult = await MFAManager.enableMFA(loginResult.user.id)
  expect(mfaResult.success).toBe(true)
  
  // Test MFA verification
  const verifyResult = await MFAManager.verifyMFA(
    mfaResult.factorId,
    '123456',
    loginResult.user.id
  )
  expect(verifyResult.success).toBe(true)
})
```

## Troubleshooting

### Common Issues

1. **Session timeout not working**
   - Check if `initializeSessionManager()` is called after login
   - Verify session timeout settings in `SECURITY_SETTINGS`

2. **MFA setup failing**
   - Ensure Supabase MFA is enabled in project settings
   - Check user permissions for MFA enrollment

3. **Account lockout not resetting**
   - Verify `locked_until` timestamp in database
   - Check if cleanup job is running for expired lockouts

4. **Audit logs not being created**
   - Ensure `audit_log` table exists with proper permissions
   - Check if RLS policies allow audit log insertions

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('auth_debug', 'true')

// Check debug logs in console
console.log('Auth debug enabled')
```

## Conclusion

The enhanced authentication system provides enterprise-grade security features while maintaining a user-friendly experience. With proper implementation and testing, it ensures robust protection for the Angkor Compliance platform.

For additional support or questions, refer to the project documentation or contact the development team. 