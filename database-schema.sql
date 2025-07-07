-- ==========================================
-- ANGKOR COMPLIANCE DATABASE SCHEMA
-- ==========================================
-- Version: 1.0
-- Created: January 2024
-- Purpose: Comprehensive compliance management platform for Cambodian factories

-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUMS
-- ==========================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin', 
    'manager',
    'supervisor',
    'worker',
    'auditor',
    'committee_member'
);

-- Permit/Certificate types
CREATE TYPE permit_type AS ENUM (
    'environmental',
    'health_safety',
    'fire_safety',
    'labor',
    'business_license',
    'export_permit',
    'import_permit',
    'other'
);

-- Permit status
CREATE TYPE permit_status AS ENUM (
    'active',
    'expired',
    'pending_renewal',
    'suspended',
    'cancelled'
);

-- Audit finding severity
CREATE TYPE severity_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- CAP status
CREATE TYPE cap_status AS ENUM (
    'open',
    'in_progress',
    'completed',
    'overdue',
    'cancelled'
);

-- Grievance types
CREATE TYPE grievance_type AS ENUM (
    'workplace_safety',
    'harassment',
    'discrimination',
    'wage_dispute',
    'working_conditions',
    'environmental',
    'other'
);

-- Grievance status
CREATE TYPE grievance_status AS ENUM (
    'submitted',
    'under_review',
    'investigating',
    'resolved',
    'closed',
    'escalated'
);

-- Committee types
CREATE TYPE committee_type AS ENUM (
    'picc',
    'osh',
    'fire_safety',
    'hiv_aids',
    'shop_steward',
    'grievance_handling',
    'environmental'
);

-- Training types
CREATE TYPE training_type AS ENUM (
    'ehs',
    'fire_safety',
    'osh',
    'hiv_aids',
    'shop_steward',
    'environmental',
    'compliance',
    'other'
);

-- Document types
CREATE TYPE document_type AS ENUM (
    'policy',
    'procedure',
    'form',
    'certificate',
    'permit',
    'audit_report',
    'training_material',
    'meeting_minutes',
    'other'
);

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Organizations (Factories)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_khmer VARCHAR(255),
    registration_number VARCHAR(100) UNIQUE,
    address TEXT,
    address_khmer TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(100),
    employee_count INTEGER,
    established_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    full_name_khmer VARCHAR(255),
    role user_role NOT NULL DEFAULT 'worker',
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(20),
    employee_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User security
CREATE TABLE user_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PERMITS & CERTIFICATES
-- ==========================================

-- Permits and certificates
CREATE TABLE permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    permit_type permit_type NOT NULL,
    permit_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    issuing_authority VARCHAR(255),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status permit_status DEFAULT 'active',
    renewal_reminder_days INTEGER DEFAULT 30,
    document_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- AUDIT MANAGEMENT
-- ==========================================

-- Audits
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_type VARCHAR(100) NOT NULL,
    auditor_name VARCHAR(255),
    auditor_organization VARCHAR(255),
    audit_date DATE NOT NULL,
    audit_scope TEXT,
    overall_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'completed',
    report_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit findings
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    finding_text TEXT NOT NULL,
    finding_text_khmer TEXT,
    severity severity_level NOT NULL,
    compliance_standard VARCHAR(100),
    requirement_reference VARCHAR(100),
    evidence_photos TEXT[],
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CORRECTIVE ACTION PLANS (CAPs)
-- ==========================================

-- CAPs
CREATE TABLE caps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_finding_id UUID REFERENCES audit_findings(id),
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    description TEXT NOT NULL,
    description_khmer TEXT,
    root_cause TEXT,
    root_cause_khmer TEXT,
    ai_suggested_actions TEXT[],
    status cap_status DEFAULT 'open',
    priority severity_level NOT NULL,
    assigned_to UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    due_date DATE NOT NULL,
    completion_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAP actions (SMART actions)
CREATE TABLE cap_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cap_id UUID REFERENCES caps(id) ON DELETE CASCADE,
    action_text TEXT NOT NULL,
    action_text_khmer TEXT,
    is_specific BOOLEAN DEFAULT false,
    is_measurable BOOLEAN DEFAULT false,
    is_achievable BOOLEAN DEFAULT false,
    is_relevant BOOLEAN DEFAULT false,
    is_timebound BOOLEAN DEFAULT false,
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    evidence_photos TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- GRIEVANCE MANAGEMENT
-- ==========================================

-- Grievances
CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    grievance_number VARCHAR(50) UNIQUE NOT NULL,
    grievance_type grievance_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    description TEXT NOT NULL,
    description_khmer TEXT,
    status grievance_status DEFAULT 'submitted',
    priority severity_level DEFAULT 'medium',
    is_anonymous BOOLEAN DEFAULT false,
    submitted_by UUID REFERENCES users(id),
    submitted_via VARCHAR(50), -- 'web', 'qr_code', 'paper', 'phone'
    assigned_committee committee_type,
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    resolution_date DATE,
    resolution_notes TEXT,
    resolution_notes_khmer TEXT,
    attachments TEXT[],
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grievance workflow
CREATE TABLE grievance_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID REFERENCES grievances(id) ON DELETE CASCADE,
    from_status grievance_status,
    to_status grievance_status NOT NULL,
    action_taken TEXT,
    action_taken_khmer TEXT,
    handled_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TRAINING MANAGEMENT
-- ==========================================

-- Training modules
CREATE TABLE training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    description TEXT,
    description_khmer TEXT,
    training_type training_type NOT NULL,
    duration_hours DECIMAL(4,2),
    is_mandatory BOOLEAN DEFAULT false,
    refresh_frequency_months INTEGER,
    content_url TEXT,
    presentation_url TEXT,
    quiz_id UUID,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training sessions
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    instructor_name VARCHAR(255),
    max_participants INTEGER,
    actual_participants INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training attendees
CREATE TABLE training_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    quiz_score DECIMAL(5,2),
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(training_session_id, user_id)
);

-- ==========================================
-- MEETINGS & COMMITTEES
-- ==========================================

-- Committees
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    committee_type committee_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_khmer VARCHAR(255),
    description TEXT,
    description_khmer TEXT,
    meeting_frequency VARCHAR(50), -- 'weekly', 'monthly', 'quarterly'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Committee members
CREATE TABLE committee_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100), -- 'chair', 'secretary', 'member'
    joined_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(committee_id, user_id)
);

-- Meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location VARCHAR(255),
    agenda TEXT,
    agenda_khmer TEXT,
    minutes TEXT,
    minutes_khmer TEXT,
    action_items TEXT[],
    attendees UUID[],
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting attendees
CREATE TABLE meeting_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    role VARCHAR(50), -- 'chair', 'secretary', 'member', 'guest'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);

-- ==========================================
-- DOCUMENT MANAGEMENT
-- ==========================================

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    document_type document_type NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    version VARCHAR(20) DEFAULT '1.0',
    description TEXT,
    description_khmer TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    expiry_date DATE,
    uploaded_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document versions
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    file_url TEXT NOT NULL,
    change_notes TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_khmer VARCHAR(255),
    message TEXT NOT NULL,
    message_khmer TEXT,
    type VARCHAR(50) NOT NULL, -- 'permit_expiry', 'cap_overdue', 'grievance_new', etc.
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    sent_via VARCHAR(50)[], -- 'email', 'sms', 'app'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SYSTEM TABLES
-- ==========================================

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, setting_key)
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- User security
CREATE INDEX idx_user_security_user_id ON user_security(user_id);
CREATE INDEX idx_user_security_email ON user_security(email);
CREATE INDEX idx_user_security_locked_until ON user_security(locked_until);

-- Permits
CREATE INDEX idx_permits_organization_id ON permits(organization_id);
CREATE INDEX idx_permits_expiry_date ON permits(expiry_date);
CREATE INDEX idx_permits_status ON permits(status);

-- Audits
CREATE INDEX idx_audits_organization_id ON audits(organization_id);
CREATE INDEX idx_audits_audit_date ON audits(audit_date);

-- CAPs
CREATE INDEX idx_caps_organization_id ON caps(organization_id);
CREATE INDEX idx_caps_assigned_to ON caps(assigned_to);
CREATE INDEX idx_caps_due_date ON caps(due_date);
CREATE INDEX idx_caps_status ON caps(status);

-- Grievances
CREATE INDEX idx_grievances_organization_id ON grievances(organization_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_assigned_to ON grievances(assigned_to);
CREATE INDEX idx_grievances_created_at ON grievances(created_at);

-- Training
CREATE INDEX idx_training_sessions_session_date ON training_sessions(session_date);
CREATE INDEX idx_training_attendees_user_id ON training_attendees(user_id);

-- Meetings
CREATE INDEX idx_meetings_committee_id ON meetings(committee_id);
CREATE INDEX idx_meetings_meeting_date ON meetings(meeting_date);

-- Documents
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables that have updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_security_updated_at BEFORE UPDATE ON user_security FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON permits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_caps_updated_at BEFORE UPDATE ON caps FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cap_actions_updated_at BEFORE UPDATE ON cap_actions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_grievances_updated_at BEFORE UPDATE ON grievances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_training_modules_updated_at BEFORE UPDATE ON training_modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('permit_reminder_days', '30', 'Default days before permit expiry to send reminder'),
('cap_overdue_threshold', '7', 'Days after due date to mark CAP as overdue'),
('grievance_response_time', '5', 'Days to respond to grievance'),
('training_refresh_reminder', '30', 'Days before training refresh to send reminder'),
('app_version', '1.0.0', 'Current application version'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('default_language', 'en', 'Default system language'),
('supported_languages', 'en,km', 'Supported languages (comma separated)');

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON DATABASE angkor_compliance IS 'Angkor Compliance Management System - Database for managing factory compliance in Cambodia';

-- Table comments
COMMENT ON TABLE organizations IS 'Factory/organization master data';
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE permits IS 'Government permits and certificates tracking';
COMMENT ON TABLE audits IS 'Audit records and findings';
COMMENT ON TABLE caps IS 'Corrective Action Plans generated from audit findings';
COMMENT ON TABLE cap_actions IS 'Individual SMART actions within CAPs';
COMMENT ON TABLE grievances IS 'Worker grievances and complaints';
COMMENT ON TABLE training_modules IS 'Training content and modules';
COMMENT ON TABLE training_sessions IS 'Scheduled training sessions';
COMMENT ON TABLE committees IS 'Factory committees (PICC, OSH, etc.)';
COMMENT ON TABLE meetings IS 'Committee meetings and minutes';
COMMENT ON TABLE documents IS 'Document management system';
COMMENT ON TABLE notifications IS 'System notifications and alerts';
COMMENT ON TABLE audit_log IS 'System audit trail for all actions'; 