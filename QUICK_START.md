# 🚀 Quick Start - Authentication Setup

## Current Status ✅❌
- ✅ Environment file exists (`.env.local`)
- ❌ Supabase URL needs real value
- ❌ Supabase Anon Key needs real value
- ✅ Node.js version OK
- ✅ Dependencies installed
- ✅ API modules exist

## 🎯 What You Need To Do

### 1️⃣ Get Your Supabase Credentials (5 minutes)

1. **Open Supabase**: https://app.supabase.com
2. **Sign Up/Login** (free account is fine)
3. **Create New Project**:
   ```
   Name: angkor-compliance
   Password: [choose strong password]
   Region: [nearest to you]
   ```
4. **Wait 2 minutes** for project setup

### 2️⃣ Copy Your Credentials

Once project is ready:

1. **Click Settings** (⚙️ gear icon)
2. **Click "API"** in the menu
3. **You'll see two values:**

```
Project URL:
https://xyzabc123456.supabase.co  ← Copy this

anon public:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← Copy this
```

### 3️⃣ Update Your .env.local File

Open `.env.local` and replace the placeholders:

**BEFORE:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**AFTER (example with your real values):**
```env
VITE_SUPABASE_URL=https://xyzabc123456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMzQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjI2MjA4NTQxLCJleHAiOjE5NDE3ODQ1NDF9.abc123def456
```

### 4️⃣ Verify Your Setup

Run this command to check:
```bash
node verify-setup.mjs
```

You should see all green checkmarks ✅

### 5️⃣ Test Authentication

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open browser:** http://localhost:5173

3. **Try to register:**
   - Click "Sign Up"
   - Enter email & password
   - Submit

## 🔍 Troubleshooting

### If registration fails:

1. **Check browser console** (F12) for errors
2. **Common fixes:**
   - Make sure you copied the ENTIRE anon key
   - No extra spaces in .env.local
   - Restart dev server after changing .env.local
   - Try a different email domain

### Still having issues?

Run the test to see detailed errors:
```bash
node test-real-auth.mjs
```

## 📹 Video Guide

Can't get it working? Here's what to check:

1. **Supabase Dashboard**:
   - Settings → API → Copy both values
   - Authentication → Providers → Email is ON
   - Authentication → URL Configuration → Add `http://localhost:5173/*`

2. **Your Code**:
   - `.env.local` has real values (not placeholders)
   - No typos in variable names
   - Saved the file after editing

3. **Quick Test**:
   ```bash
   # This should show your URL:
   node -e "require('dotenv').config({path:'.env.local'});console.log(process.env.VITE_SUPABASE_URL)"
   ```

## ✅ Success Checklist

When everything is working, you'll be able to:
- [ ] See the login page at http://localhost:5173
- [ ] Register a new account
- [ ] Login with your credentials
- [ ] See the dashboard after login
- [ ] Logout successfully

---

**Need more help?** See the full guide: `AUTHENTICATION_SETUP_GUIDE.md`