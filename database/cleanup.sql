-- Angkor Compliance Database Cleanup Script
-- This script cleans up all leftover data and prepares for a fresh setup
-- ⚠️ WARNING: This will delete ALL data in your database!

-- ==============================================
-- 1. DROP ALL CUSTOM POLICIES
-- ==============================================
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    -- Drop all policies on public tables
    FOR pol_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, (
            SELECT tablename 
            FROM pg_policies 
            WHERE policyname = pol_name AND schemaname = 'public' 
            LIMIT 1
        ));
    END LOOP;
END $$;

-- ==============================================
-- 2. DROP ALL CUSTOM VIEWS
-- ==============================================
DROP VIEW IF EXISTS public.expiring_permits CASCADE;
DROP VIEW IF EXISTS public.overdue_caps CASCADE;

-- ==============================================
-- 3. DROP ALL CUSTOM TABLES (in correct order)
-- ==============================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.committees CASCADE;
DROP TABLE IF EXISTS public.grievances CASCADE;
DROP TABLE IF EXISTS public.corrective_action_plans CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.permits CASCADE;
DROP TABLE IF EXISTS public.factory_users CASCADE;
DROP TABLE IF EXISTS public.factories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE; -- Common leftover table

-- ==============================================
-- 4. DROP ALL CUSTOM SEQUENCES
-- ==============================================
DROP SEQUENCE IF EXISTS public.grievance_sequence CASCADE;

-- ==============================================
-- 5. DROP ALL CUSTOM FUNCTIONS
-- ==============================================
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_grievance_number() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE; -- Common leftover function

-- ==============================================
-- 6. DROP ALL CUSTOM TYPES
-- ==============================================
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.factory_type CASCADE;
DROP TYPE IF EXISTS public.permit_status CASCADE;
DROP TYPE IF EXISTS public.cap_status CASCADE;
DROP TYPE IF EXISTS public.cap_priority CASCADE;
DROP TYPE IF EXISTS public.grievance_status CASCADE;
DROP TYPE IF EXISTS public.grievance_type CASCADE;
DROP TYPE IF EXISTS public.document_type CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- ==============================================
-- 7. CLEAN UP STORAGE BUCKETS
-- ==============================================
DELETE FROM storage.objects WHERE bucket_id IN ('documents', 'avatars', 'factory-images');
DELETE FROM storage.buckets WHERE id IN ('documents', 'avatars', 'factory-images');

-- ==============================================
-- 8. CLEAN UP AUTH USERS (Optional - uncomment if needed)
-- ==============================================
-- ⚠️ WARNING: This will delete ALL users! Only uncomment if you want to start fresh
-- DELETE FROM auth.users;

-- ==============================================
-- 9. RESET EXTENSIONS (if needed)
-- ==============================================
-- Most extensions should remain, but we can reset if needed
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pg_stat_statements" CASCADE;

-- ==============================================
-- CLEANUP COMPLETE MESSAGE
-- ==============================================
COMMENT ON DATABASE postgres IS 'Angkor Compliance - Database cleaned and ready for fresh setup';

-- Show cleanup completion
SELECT 'Database cleanup completed successfully!' AS status; 