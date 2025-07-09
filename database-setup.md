# 🗄️ Database Setup Guide - Angkor Compliance

This guide will help you set up the complete database schema for the Angkor Compliance platform.

## 📋 Prerequisites

- [Supabase Account](https://supabase.com) (free tier works for development)
- PostgreSQL 14+ (if using local development)
- Basic knowledge of SQL and database management

## 🚀 Quick Setup (Supabase)

### Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and fill in project details:
   - **Name**: `angkor-compliance-dev`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to Cambodia (Singapore recommended)
4. Wait for project creation (usually 2-3 minutes)

### Step 2: Execute Database Schema

1. Go to your project dashboard
2. Click on "SQL Editor" in the sidebar
3. Copy and paste the contents of `database-schema.sql`
4. Click "Run" to execute the schema
5. Wait for completion (may take 1-2 minutes)

### Step 3: Apply Row Level Security Policies

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `supabase-rls-policies.sql`
3. Click "Run" to apply RLS policies
4. Verify no errors occurred

### Step 4: Load Seed Data (Optional)

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `seed-data.sql`
3. Click "Run" to load test data
4. This will create sample organizations, users, permits, etc.

### Step 5: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For development
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Get these values from your Supabase project:
- Go to "Settings" → "API"
- Copy the Project URL and anon public key

## 🛠️ Manual Setup (Local PostgreSQL)

### Step 1: Create Database

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE angkor_compliance;
CREATE USER angkor_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE angkor_compliance TO angkor_user;
\c angkor_compliance;
```

### Step 2: Execute Files in Order

```bash
# 1. Create schema
psql -U angkor_user -d angkor_compliance -f database-schema.sql

# 2. Load seed data (optional)
psql -U angkor_user -d angkor_compliance -f seed-data.sql
```

**Note**: Skip RLS policies for local development unless you implement custom auth.

## 📊 Database Structure Overview

The database includes these major components:

### **Core Tables**
- `organizations` - Factory/company information
- `users` - System users with roles
- `user_permissions` - Granular permissions

### **Compliance Management**
- `permits` - Government permits and certificates
- `audits` - Audit records and findings
- `caps` - Corrective Action Plans
- `cap_actions` - Individual SMART actions

### **Communication**
- `grievances` - Worker grievances and complaints
- `grievance_workflow` - Grievance status tracking
- `notifications` - System notifications

### **Training & Meetings**
- `training_modules` - Training content
- `training_sessions` - Scheduled training
- `committees` - Factory committees
- `meetings` - Committee meetings

### **Document Management**
- `documents` - Document storage
- `document_versions` - Version control

### **System**
- `audit_log` - System audit trail
- `system_settings` - Configuration settings

## 🔐 Security Features

### **Row Level Security (RLS)**
- Organization-level data isolation
- Role-based access control
- Secure multi-tenancy

### **User Roles**
- `super_admin` - Full system access
- `admin` - Organization management
- `manager` - Department management
- `supervisor` - Team management
- `worker` - Basic access
- `auditor` - Audit-specific access
- `committee_member` - Committee access

### **Permissions System**
- Granular permissions beyond roles
- Audit trail for all changes
- Secure function-based access control

## 🧪 Test Data

The seed data includes:

- **2 Organizations**: Golden Needle Garments & Angkor Electronics
- **7 Users**: Various roles and departments
- **5 Permits**: Different types and statuses
- **2 Audits**: With findings and CAPs
- **3 CAPs**: Different statuses
- **2 Grievances**: Web and QR code submissions
- **3 Committees**: PICC, OSH, Grievance Handling
- **3 Training Modules**: Fire Safety, OSH, Environmental

## 🔧 Troubleshooting

### Common Issues:

**Schema Creation Errors**
- Check PostgreSQL version (14+ required)
- Ensure extensions are available
- Verify user permissions

**RLS Policy Errors**
- Only apply to Supabase projects
- Check function definitions exist
- Verify user roles are properly set

**Seed Data Issues**
- Run schema first before seed data
- Check for UUID conflicts
- Verify foreign key constraints

**Connection Issues**
- Check environment variables
- Verify network connectivity
- Confirm database credentials

## 📈 Next Steps

After database setup:

1. **Update Application Config**
   - Update `src/lib/supabase.js` with your project details
   - Test authentication flow

2. **Verify Data Access**
   - Log in with test users
   - Check data filtering works correctly
   - Test different user roles

3. **Development Workflow**
   - Create feature branches
   - Use migrations for schema changes
   - Backup data regularly

## 🚨 Production Considerations

### **Security**
- Use environment variables for sensitive data
- Enable SSL connections
- Regular security audits
- Implement backup strategies

### **Performance**
- Monitor query performance
- Add indexes as needed
- Consider connection pooling
- Optimize for expected load

### **Maintenance**
- Regular backups
- Update dependencies
- Monitor disk usage
- Plan for scaling

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Check project logs in Supabase dashboard
4. Verify RLS policies are correctly applied

---

**Next**: Update your `src/lib/supabase.js` file with the correct project configuration and test the connection. 