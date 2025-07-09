# 🔐 Angkor Compliance Authentication Setup Guide

This guide will help you set up authentication for the Angkor Compliance system step by step.

## 📋 Prerequisites

Before starting, make sure you have:
- Node.js installed (v14 or higher)
- A Supabase account (free tier is fine)
- The project cloned locally

## 🚀 Step-by-Step Setup

### Step 1: Create a Supabase Project

1. **Go to Supabase**: Visit [https://app.supabase.com](https://app.supabase.com)
2. **Sign up or Login**: Create a free account if you don't have one
3. **Create New Project**:
   - Click "New Project"
   - Choose your organization (or create one)
   - Enter project details:
     - **Name**: `angkor-compliance`
     - **Database Password**: Choose a strong password (save this!)
     - **Region**: Choose the nearest to you
   - Click "Create new project"
4. **Wait for setup**: This takes about 2 minutes

### Step 2: Get Your API Credentials

Once your project is created:

1. **Go to Settings**: Click the gear icon (⚙️) in the sidebar
2. **Click "API"**: In the settings menu
3. **Copy these values**:
   - **Project URL**: Something like `https://abcdefghijklmnop.supabase.co`
   - **Anon Key**: A long string starting with `eyJ...`

### Step 3: Configure Environment Variables

1. **Open `.env.local`** in your project root
2. **Replace the placeholder values**:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

Example (with fake values):
```env
VITE_SUPABASE_URL=https://xyzabc123456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMzQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjI2MjA4NTQxLCJleHAiOjE5NDE3ODQ1NDF9.abc123def456...
```

### Step 4: Set Up Database Tables

1. **Go to SQL Editor** in your Supabase dashboard
2. **Create the users table** (if not exists):

```sql
-- Create users table with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);
```

3. **Run the SQL**: Click "Run" to execute

### Step 5: Configure Authentication Settings

1. **Go to Authentication** in Supabase dashboard
2. **Click "Providers"**
3. **Enable Email Provider**:
   - Toggle "Enable Email" ON
   - Configure email settings:
     - **Enable email confirmations**: Toggle based on preference
     - **Secure email change**: Keep enabled
     - **Secure password change**: Keep enabled

4. **Configure Email Templates** (optional):
   - Go to "Email Templates"
   - Customize confirmation emails
   - Customize reset password emails

### Step 6: Set Up Redirect URLs

1. **Go to Authentication → URL Configuration**
2. **Add these redirect URLs**:
   - `http://localhost:5173/*`
   - `http://localhost:3000/*`
   - `https://your-production-domain.com/*` (for production)

### Step 7: Test Your Setup

1. **Restart your development server**:
```bash
# Stop the server (Ctrl+C) then:
npm run dev
```

2. **Run the authentication test**:
```bash
node test-real-auth.mjs
```

3. **Check the results**: You should see successful API connection

### Step 8: Create a Test User (Optional)

1. **Via Supabase Dashboard**:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Click "Create user"

2. **Via the Application**:
   - Visit http://localhost:5173
   - Click "Sign Up"
   - Register a new account

## 🧪 Testing Authentication

### Test Registration:
1. Open your app at http://localhost:5173
2. Click "Sign Up" or toggle to register mode
3. Enter:
   - **Email**: your-email@example.com
   - **Password**: YourSecurePassword123!
   - **Full Name**: Your Name
4. Click "Create Account"

### Test Login:
1. Open your app at http://localhost:5173
2. Enter your credentials:
   - **Email**: your-email@example.com
   - **Password**: YourSecurePassword123!
3. Click "Sign In"

## 🔍 Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables" error**:
   - Check `.env.local` exists
   - Verify no typos in variable names
   - Restart dev server after changes

2. **"Invalid API key" error**:
   - Double-check your anon key from Supabase
   - Make sure you copied the entire key
   - Ensure no extra spaces or line breaks

3. **"Network request failed" error**:
   - Check internet connection
   - Verify Supabase project is active
   - Check if project URL is correct

4. **"Email not allowed" error**:
   - Some email domains might be blocked
   - Try a different email provider
   - Check spam folder for confirmation

5. **"User already exists" error**:
   - Email is already registered
   - Try login instead of signup
   - Or use a different email

### Debug Commands:

```bash
# Check if environment variables are loaded
node -e "console.log(process.env.VITE_SUPABASE_URL)"

# Test API connection directly
node test-real-auth.mjs

# Check application logs
npm run dev
# Then check browser console for errors
```

## 📝 Next Steps

Once authentication is working:

1. **Customize the UI**: Modify `src/components/LoginForm.jsx`
2. **Add profile management**: Create user profile pages
3. **Implement role-based access**: Add user roles and permissions
4. **Set up email templates**: Customize confirmation/reset emails
5. **Add social login**: Enable Google, GitHub, etc.

## 🆘 Need Help?

If you're still having issues:
1. Check the browser console for detailed errors
2. Review the Supabase logs in your dashboard
3. Verify all steps were followed correctly
4. Check the project's GitHub issues

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [React + Supabase Tutorial](https://supabase.com/docs/guides/with-react)

---

*Remember to never commit your `.env.local` file to version control!*