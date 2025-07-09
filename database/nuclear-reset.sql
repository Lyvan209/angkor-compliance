-- ============================================================================
-- ANGKOR COMPLIANCE NUCLEAR DATABASE RESET
-- ============================================================================
-- ⚠️⚠️⚠️ NUCLEAR OPTION - DROPS ABSOLUTELY EVERYTHING! ⚠️⚠️⚠️
-- This script will DELETE ALL DATA, USERS, TABLES, FUNCTIONS, EVERYTHING!
-- 
-- Use this only if you want to completely start from scratch
-- ============================================================================

-- ==============================================
-- PART 1: NUCLEAR CLEANUP - DROP EVERYTHING!
-- ==============================================

-- Drop all policies on ALL schemas
DO $$ 
DECLARE
    pol_record RECORD;
BEGIN
    FOR pol_record IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname IN ('public', 'auth', 'storage')
    ) 
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                pol_record.policyname, pol_record.schemaname, pol_record.tablename);
        EXCEPTION 
            WHEN OTHERS THEN 
                -- Ignore errors and continue
                NULL;
        END;
    END LOOP;
END $$;

-- Drop all views in public schema
DO $$ 
DECLARE
    view_name TEXT;
BEGIN
    FOR view_name IN (
        SELECT viewname FROM pg_views WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    END LOOP;
END $$;

-- Drop all tables in public schema
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
    END LOOP;
END $$;

-- Drop all sequences in public schema
DO $$ 
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN (
        SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', seq_name);
    END LOOP;
END $$;

-- Drop all functions in public schema
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN (
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) 
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                func_record.proname, func_record.argtypes);
        EXCEPTION 
            WHEN OTHERS THEN 
                -- Ignore errors and continue
                NULL;
        END;
    END LOOP;
END $$;

-- Drop all types in public schema
DO $$ 
DECLARE
    type_name TEXT;
BEGIN
    FOR type_name IN (
        SELECT typname FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public' AND t.typtype = 'e'
    ) 
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', type_name);
    END LOOP;
END $$;

-- Nuclear option: Clean up ALL storage buckets and objects
DELETE FROM storage.objects;
DELETE FROM storage.buckets;

-- Nuclear option: Delete ALL auth users (uncomment if you want this)
-- ⚠️ WARNING: This will delete ALL user accounts!
-- DELETE FROM auth.refresh_tokens;
-- DELETE FROM auth.sessions;
-- DELETE FROM auth.users;

-- Clean up auth-related tables (but keep users - uncomment above to delete users too)
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Drop any remaining triggers
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN (
        SELECT schemaname, tablename, triggername
        FROM pg_triggers 
        WHERE schemaname = 'public'
    ) 
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                trigger_record.triggername, trigger_record.schemaname, trigger_record.tablename);
        EXCEPTION 
            WHEN OTHERS THEN 
                NULL;
        END;
    END LOOP;
END $$;

-- Reset all extensions (optional - uncomment if needed)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pg_stat_statements" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- Clean up any remaining indexes in public schema
DO $$ 
DECLARE
    index_name TEXT;
BEGIN
    FOR index_name IN (
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I CASCADE', index_name);
    END LOOP;
END $$;

-- ==============================================
-- PART 2: FRESH SETUP (Create everything new)
-- ==============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'viewer');
CREATE TYPE factory_type AS ENUM ('garment', 'textile', 'footwear', 'accessories');
CREATE TYPE permit_status AS ENUM ('active', 'expired', 'pending_renewal', 'suspended');
CREATE TYPE cap_status AS ENUM ('open', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE cap_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE grievance_status AS ENUM ('submitted', 'investigating', 'resolved', 'closed', 'escalated');
CREATE TYPE grievance_type AS ENUM ('workplace_safety', 'harassment', 'wages', 'working_conditions', 'discrimination', 'other');
CREATE TYPE document_type AS ENUM ('permit', 'certificate', 'policy', 'report', 'image', 'other');
CREATE TYPE notification_type AS ENUM ('reminder', 'alert', 'info', 'warning', 'error');

-- Create main tables
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'staff',
    phone VARCHAR(20),
    avatar_url TEXT,
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Phnom_Penh',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.factories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_kh VARCHAR(255),
    type factory_type DEFAULT 'garment',
    registration_number VARCHAR(100) UNIQUE,
    tax_id VARCHAR(100),
    address TEXT NOT NULL,
    address_kh TEXT,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Cambodia',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    established_date DATE,
    employee_count INTEGER,
    owner_id UUID REFERENCES public.users(id),
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.factory_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(factory_id, user_id)
);

CREATE TABLE public.permits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_kh VARCHAR(255),
    permit_type VARCHAR(100) NOT NULL,
    permit_number VARCHAR(100) UNIQUE NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    issuing_authority_kh VARCHAR(255),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_period_months INTEGER DEFAULT 12,
    status permit_status DEFAULT 'active',
    description TEXT,
    description_kh TEXT,
    document_url TEXT,
    reminder_days_before INTEGER DEFAULT 30,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_kh VARCHAR(255),
    certificate_type VARCHAR(100) NOT NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issuing_organization_kh VARCHAR(255),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status permit_status DEFAULT 'active',
    scope TEXT,
    scope_kh TEXT,
    document_url TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.corrective_action_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_kh VARCHAR(255),
    description TEXT NOT NULL,
    description_kh TEXT,
    root_cause TEXT,
    root_cause_kh TEXT,
    corrective_actions TEXT NOT NULL,
    corrective_actions_kh TEXT,
    preventive_actions TEXT,
    preventive_actions_kh TEXT,
    priority cap_priority DEFAULT 'medium',
    status cap_status DEFAULT 'open',
    due_date DATE NOT NULL,
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    progress_notes TEXT,
    completion_date DATE,
    verification_required BOOLEAN DEFAULT true,
    verified_by UUID REFERENCES public.users(id),
    verification_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grievances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    grievance_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_kh VARCHAR(255),
    description TEXT NOT NULL,
    description_kh TEXT,
    type grievance_type NOT NULL,
    status grievance_status DEFAULT 'submitted',
    priority cap_priority DEFAULT 'medium',
    submitted_by VARCHAR(255),
    submitted_by_employee_id VARCHAR(100),
    department VARCHAR(100),
    incident_date DATE,
    location VARCHAR(255),
    witnesses TEXT,
    evidence_description TEXT,
    assigned_investigator UUID REFERENCES public.users(id),
    investigation_notes TEXT,
    resolution TEXT,
    resolution_kh TEXT,
    resolved_date DATE,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.committees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_kh VARCHAR(255),
    type VARCHAR(100) NOT NULL,
    description TEXT,
    description_kh TEXT,
    chairperson VARCHAR(255),
    secretary VARCHAR(255),
    members JSONB,
    meeting_frequency VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_kh VARCHAR(255),
    agenda TEXT,
    agenda_kh TEXT,
    meeting_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    location VARCHAR(255),
    attendees JSONB,
    minutes TEXT,
    minutes_kh TEXT,
    action_items JSONB,
    next_meeting_date TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type document_type NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    related_id UUID,
    related_type VARCHAR(50),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_kh VARCHAR(255),
    description TEXT,
    description_kh TEXT,
    reminder_date TIMESTAMPTZ NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_kh VARCHAR(255),
    message TEXT NOT NULL,
    message_kh TEXT,
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    factory_id UUID REFERENCES public.factories(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_permits_factory_expiry ON public.permits(factory_id, expiry_date);
CREATE INDEX idx_permits_status ON public.permits(status);
CREATE INDEX idx_caps_factory_status ON public.corrective_action_plans(factory_id, status);
CREATE INDEX idx_caps_due_date ON public.corrective_action_plans(due_date);
CREATE INDEX idx_grievances_factory_status ON public.grievances(factory_id, status);
CREATE INDEX idx_documents_factory_type ON public.documents(factory_id, type);
CREATE INDEX idx_reminders_date ON public.reminders(reminder_date);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_user_date ON public.audit_logs(user_id, created_at);
CREATE INDEX idx_factory_users_factory_id ON public.factory_users(factory_id);
CREATE INDEX idx_factory_users_user_id ON public.factory_users(user_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_grievance_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.grievance_number = 'GRV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('grievance_sequence')::text, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence
CREATE SEQUENCE grievance_sequence START 1;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_factories_updated_at BEFORE UPDATE ON public.factories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON public.permits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_caps_updated_at BEFORE UPDATE ON public.corrective_action_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grievances_updated_at BEFORE UPDATE ON public.grievances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON public.committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER generate_grievance_number_trigger BEFORE INSERT ON public.grievances FOR EACH ROW EXECUTE FUNCTION generate_grievance_number();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Factory access via membership" ON public.factories FOR ALL USING (
    id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Factory users can read own associations" ON public.factory_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Factory managers can manage associations" ON public.factory_users FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
);

CREATE POLICY "Permits accessible by factory members" ON public.permits FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Certificates accessible by factory members" ON public.certificates FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "CAPs accessible by factory members" ON public.corrective_action_plans FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Grievances accessible by factory members" ON public.grievances FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Committees accessible by factory members" ON public.committees FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Meetings accessible by committee factory members" ON public.meetings FOR ALL USING (
    committee_id IN (SELECT c.id FROM public.committees c JOIN public.factory_users fu ON c.factory_id = fu.factory_id WHERE fu.user_id = auth.uid() AND fu.is_active = true)
);

CREATE POLICY "Documents accessible by factory members" ON public.documents FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Reminders accessible by factory members" ON public.reminders FOR ALL USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Notifications for user" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Notifications can be updated by user" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Audit logs for factory members" ON public.audit_logs FOR SELECT USING (
    factory_id IN (SELECT factory_id FROM public.factory_users WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
);

-- Create views with proper date calculations
CREATE VIEW public.expiring_permits AS
SELECT 
    p.*, 
    f.name as factory_name, 
    (p.expiry_date - CURRENT_DATE) as days_until_expiry
FROM public.permits p
JOIN public.factories f ON p.factory_id = f.id
WHERE p.expiry_date <= CURRENT_DATE + INTERVAL '60 days' AND p.status = 'active'
ORDER BY p.expiry_date;

CREATE VIEW public.overdue_caps AS
SELECT 
    c.*, 
    f.name as factory_name, 
    u.full_name as assigned_to_name
FROM public.corrective_action_plans c
JOIN public.factories f ON c.factory_id = f.id
LEFT JOIN public.users u ON c.assigned_to = u.id
WHERE c.due_date < CURRENT_DATE AND c.status NOT IN ('completed', 'cancelled')
ORDER BY c.due_date;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('documents', 'documents', false),
('avatars', 'avatars', true),
('factory-images', 'factory-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Factory members can upload documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.uid() IN (SELECT user_id FROM public.factory_users WHERE is_active = true)
);

CREATE POLICY "Factory members can read documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND auth.uid() IN (SELECT user_id FROM public.factory_users WHERE is_active = true)
);

CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Insert sample data
INSERT INTO public.factories (id, name, name_kh, type, address, city, province, country) VALUES
(uuid_generate_v4(), 'Sample Garment Factory', 'រោងចក្រកាត់ដេរគំរូ', 'garment', '123 Industrial Street', 'Phnom Penh', 'Phnom Penh', 'Cambodia')
ON CONFLICT DO NOTHING;

-- ==============================================
-- NUCLEAR RESET COMPLETE!
-- ==============================================
COMMENT ON DATABASE postgres IS 'Angkor Compliance - Nuclear Reset Complete - Everything Destroyed and Rebuilt';
SELECT 'NUCLEAR DATABASE RESET COMPLETED! 💥🎉' AS status, 'Everything has been completely destroyed and rebuilt from scratch!' AS details; 