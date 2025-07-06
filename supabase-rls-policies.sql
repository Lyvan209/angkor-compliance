-- ==========================================
-- SUPABASE ROW LEVEL SECURITY POLICIES
-- ==========================================
-- Version: 1.0
-- Created: January 2024
-- Purpose: Secure data access for Angkor Compliance platform

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================

-- Core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Permits & Certificates
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;

-- Audit Management
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

-- CAPs
ALTER TABLE caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_actions ENABLE ROW LEVEL SECURITY;

-- Grievances
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_workflow ENABLE ROW LEVEL SECURITY;

-- Training
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendees ENABLE ROW LEVEL SECURITY;

-- Meetings & Committees
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- System
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(role_name user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = role_name
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 
            FROM user_permissions up
            JOIN users u ON up.user_id = u.id
            WHERE u.id = auth.uid() 
            AND up.permission = permission_name
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is committee member
CREATE OR REPLACE FUNCTION is_committee_member(committee_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 
            FROM committee_members cm
            WHERE cm.committee_id = committee_id 
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ORGANIZATIONS POLICIES
-- ==========================================

-- Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization()
    );

-- Only admins can update organization details
CREATE POLICY "Only admins can update organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization() AND 
        (has_role('admin') OR has_role('super_admin'))
    );

-- ==========================================
-- USERS POLICIES
-- ==========================================

-- Users can view users in their organization
CREATE POLICY "Users can view organization members" ON users
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

-- Admins can manage users in their organization
CREATE POLICY "Admins can manage organization users" ON users
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('super_admin'))
    );

-- ==========================================
-- USER PERMISSIONS POLICIES
-- ==========================================

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Admins can manage permissions for their organization
CREATE POLICY "Admins can manage permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_permissions.user_id 
            AND u.organization_id = get_user_organization()
            AND (has_role('admin') OR has_role('super_admin'))
        )
    );

-- ==========================================
-- PERMITS POLICIES
-- ==========================================

-- Users can view permits for their organization
CREATE POLICY "Users can view organization permits" ON permits
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Managers and admins can manage permits
CREATE POLICY "Managers can manage permits" ON permits
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('manager') OR has_role('super_admin'))
    );

-- ==========================================
-- AUDITS POLICIES
-- ==========================================

-- Users can view audits for their organization
CREATE POLICY "Users can view organization audits" ON audits
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Managers and admins can create/update audits
CREATE POLICY "Managers can manage audits" ON audits
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('manager') OR has_role('auditor') OR has_role('super_admin'))
    );

-- ==========================================
-- AUDIT FINDINGS POLICIES
-- ==========================================

-- Users can view audit findings for their organization
CREATE POLICY "Users can view audit findings" ON audit_findings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audits a 
            WHERE a.id = audit_findings.audit_id 
            AND a.organization_id = get_user_organization()
        )
    );

-- Auditors and managers can manage findings
CREATE POLICY "Auditors can manage findings" ON audit_findings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM audits a 
            WHERE a.id = audit_findings.audit_id 
            AND a.organization_id = get_user_organization()
            AND (has_role('admin') OR has_role('manager') OR has_role('auditor') OR has_role('super_admin'))
        )
    );

-- ==========================================
-- CAPS POLICIES
-- ==========================================

-- Users can view CAPs for their organization
CREATE POLICY "Users can view organization CAPs" ON caps
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Assigned users can update their CAPs
CREATE POLICY "Assigned users can update CAPs" ON caps
    FOR UPDATE USING (
        organization_id = get_user_organization() AND 
        (assigned_to = auth.uid() OR has_role('admin') OR has_role('manager') OR has_role('super_admin'))
    );

-- Managers can create/delete CAPs
CREATE POLICY "Managers can manage CAPs" ON caps
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('manager') OR has_role('super_admin'))
    );

-- ==========================================
-- CAP ACTIONS POLICIES
-- ==========================================

-- Users can view CAP actions for their organization
CREATE POLICY "Users can view CAP actions" ON cap_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM caps c 
            WHERE c.id = cap_actions.cap_id 
            AND c.organization_id = get_user_organization()
        )
    );

-- Assigned users can update their actions
CREATE POLICY "Assigned users can update actions" ON cap_actions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM caps c 
            WHERE c.id = cap_actions.cap_id 
            AND c.organization_id = get_user_organization()
            AND (cap_actions.assigned_to = auth.uid() OR has_role('admin') OR has_role('manager') OR has_role('super_admin'))
        )
    );

-- ==========================================
-- GRIEVANCES POLICIES
-- ==========================================

-- Users can view grievances for their organization
CREATE POLICY "Users can view organization grievances" ON grievances
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Anyone can submit grievances
CREATE POLICY "Anyone can submit grievances" ON grievances
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization()
    );

-- Assigned users and committee members can update grievances
CREATE POLICY "Committee members can manage grievances" ON grievances
    FOR UPDATE USING (
        organization_id = get_user_organization() AND 
        (assigned_to = auth.uid() OR 
         submitted_by = auth.uid() OR 
         has_role('admin') OR 
         has_role('manager') OR 
         has_role('super_admin') OR
         has_role('committee_member'))
    );

-- ==========================================
-- TRAINING POLICIES
-- ==========================================

-- Users can view training modules for their organization
CREATE POLICY "Users can view training modules" ON training_modules
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Managers can manage training modules
CREATE POLICY "Managers can manage training modules" ON training_modules
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('manager') OR has_role('super_admin'))
    );

-- Users can view training sessions for their organization
CREATE POLICY "Users can view training sessions" ON training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_modules tm 
            WHERE tm.id = training_sessions.training_module_id 
            AND tm.organization_id = get_user_organization()
        )
    );

-- Users can view their own training attendance
CREATE POLICY "Users can view own attendance" ON training_attendees
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN training_modules tm ON ts.training_module_id = tm.id
            WHERE ts.id = training_attendees.training_session_id
            AND tm.organization_id = get_user_organization()
            AND (has_role('admin') OR has_role('manager') OR has_role('super_admin'))
        )
    );

-- ==========================================
-- COMMITTEES POLICIES
-- ==========================================

-- Users can view committees for their organization
CREATE POLICY "Users can view organization committees" ON committees
    FOR SELECT USING (
        organization_id = get_user_organization()
    );

-- Managers can manage committees
CREATE POLICY "Managers can manage committees" ON committees
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('manager') OR has_role('super_admin'))
    );

-- Users can view committee members for their organization
CREATE POLICY "Users can view committee members" ON committee_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM committees c 
            WHERE c.id = committee_members.committee_id 
            AND c.organization_id = get_user_organization()
        )
    );

-- ==========================================
-- MEETINGS POLICIES
-- ==========================================

-- Committee members can view meetings
CREATE POLICY "Committee members can view meetings" ON meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM committees c 
            WHERE c.id = meetings.committee_id 
            AND c.organization_id = get_user_organization()
        )
    );

-- Committee members can manage meetings
CREATE POLICY "Committee members can manage meetings" ON meetings
    FOR ALL USING (
        (is_committee_member(committee_id) OR 
         has_role('admin') OR 
         has_role('manager') OR 
         has_role('super_admin'))
    );

-- ==========================================
-- DOCUMENTS POLICIES
-- ==========================================

-- Users can view documents for their organization
CREATE POLICY "Users can view organization documents" ON documents
    FOR SELECT USING (
        organization_id = get_user_organization() AND 
        (is_public = true OR 
         has_role('admin') OR 
         has_role('manager') OR 
         has_role('super_admin'))
    );

-- Managers can manage documents
CREATE POLICY "Managers can manage documents" ON documents
    FOR ALL USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('manager') OR has_role('super_admin'))
    );

-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- System can create notifications
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization()
    );

-- ==========================================
-- AUDIT LOG POLICIES
-- ==========================================

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_log
    FOR SELECT USING (
        organization_id = get_user_organization() AND 
        (has_role('admin') OR has_role('super_admin'))
    );

-- System can create audit logs
CREATE POLICY "System can create audit logs" ON audit_log
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization()
    );

-- ==========================================
-- SYSTEM SETTINGS POLICIES
-- ==========================================

-- Users can view system settings for their organization
CREATE POLICY "Users can view system settings" ON system_settings
    FOR SELECT USING (
        organization_id = get_user_organization() OR 
        organization_id IS NULL -- Global settings
    );

-- Only admins can manage system settings
CREATE POLICY "Only admins can manage system settings" ON system_settings
    FOR ALL USING (
        (organization_id = get_user_organization() OR organization_id IS NULL) AND 
        (has_role('admin') OR has_role('super_admin'))
    );

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select/insert/update/delete on all tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on all functions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON FUNCTION get_user_organization() IS 'Get current authenticated user organization ID';
COMMENT ON FUNCTION has_role(user_role) IS 'Check if current user has specific role';
COMMENT ON FUNCTION has_permission(TEXT) IS 'Check if current user has specific permission';
COMMENT ON FUNCTION is_committee_member(UUID) IS 'Check if current user is member of specific committee'; 