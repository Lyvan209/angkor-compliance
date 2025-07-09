# Supabase Database Cleanup and Setup Instructions

## ⚠️ WARNING
**This process will delete ALL data in your Supabase database!**  
Make sure you have backed up any important data before proceeding.

## Step 1: Run Cleanup Script

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `database/cleanup.sql`
4. Click **RUN** to execute the cleanup script

This will:
- Remove all custom tables, functions, and policies
- Clean up storage buckets
- Reset the database to a clean state

## Step 2: Run Fresh Setup Script

1. In the same SQL Editor
2. Copy and paste the contents of `database/fresh-setup.sql`
3. Click **RUN** to execute the setup script

This will:
- Create all necessary tables for Angkor Compliance
- Set up proper RLS policies
- Create storage buckets
- Add indexes and triggers
- Insert sample data

## Step 3: Verify Setup

After running both scripts, verify that:

1. **Tables Created**: Check that all tables exist in the `public` schema
2. **Storage Buckets**: Verify `documents`, `avatars`, and `factory-images` buckets exist
3. **RLS Policies**: Confirm policies are active on all tables
4. **Sample Data**: Check that sample factory data was inserted

## Step 4: Test Authentication

1. Try registering a new user through your app
2. Verify the user appears in both `auth.users` and `public.users`
3. Test login functionality

## Common Issues and Solutions

### Issue: Permission Denied
**Solution**: Make sure you're running the scripts as the database owner or with sufficient privileges.

### Issue: Extension Already Exists
**Solution**: This is normal - the extensions will be skipped if they already exist.

### Issue: Storage Bucket Already Exists
**Solution**: The cleanup script should have removed them, but you can manually delete them in the Storage section.

### Issue: RLS Policy Conflicts
**Solution**: Make sure the cleanup script ran successfully before running the setup script.

## Post-Setup Checklist

- [ ] All tables created successfully
- [ ] Storage buckets configured
- [ ] RLS policies active
- [ ] Sample data inserted
- [ ] User registration/login working
- [ ] Your app can connect to the database

## Need Help?

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify your environment variables are correct
3. Make sure your app's Supabase client is properly configured

## Files Created

- `database/cleanup.sql` - Removes all leftover data
- `database/fresh-setup.sql` - Sets up clean database
- `database/run-cleanup.md` - This instruction file 