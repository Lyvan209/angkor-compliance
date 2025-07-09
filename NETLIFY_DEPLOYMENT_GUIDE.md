# Netlify Deployment Guide for Angkor Compliance

## 🚀 Quick Deploy Steps

### Prerequisites
- GitHub account
- Netlify account (free at netlify.com)
- Your Supabase credentials ready

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Angkor Compliance"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub
   - Select your repository

3. **Configure Build Settings** (Already set in netlify.toml)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These are pre-configured in your netlify.toml

4. **Set Environment Variables** ⚠️ IMPORTANT
   - In Netlify dashboard, go to Site Settings → Environment Variables
   - Add these variables:
     ```
     VITE_SUPABASE_URL=https://zubdmedwbqjxvzsucsah.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YmRtZWR3YnFqeHZ6c3Vjc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY4MTIsImV4cCI6MjA2NzU4MjgxMn0.nqH0OreeVQDZ_TLwCGPcwJEasWOnt2YVyiKOZUu0y2s
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (usually 1-2 minutes)

### Option 2: Direct Deploy (Drag & Drop)

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the `dist` folder to the browser
   - Your site will be live immediately

3. **Set Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add the same variables as above
   - Redeploy for changes to take effect

## 🔧 Post-Deployment Setup

### 1. Custom Domain (Optional)
- Site Settings → Domain Management
- Add custom domain
- Follow DNS configuration instructions

### 2. Enable Form Notifications (If using Netlify Forms)
- Site Settings → Forms → Form notifications
- Add email notifications

### 3. Set up Build Hooks (For CI/CD)
- Site Settings → Build & deploy → Build hooks
- Create hooks for automated deployments

## 🎯 Deployment Checklist

- [ ] Code committed to GitHub
- [ ] Environment variables set in Netlify
- [ ] Build successful
- [ ] Site accessible at Netlify URL
- [ ] Authentication working (test login/register)
- [ ] All API endpoints functioning
- [ ] SSL certificate active (automatic)

## 🌐 Your Site URLs

After deployment:
- Netlify URL: `https://YOUR-SITE-NAME.netlify.app`
- Custom domain: `https://angkorcompliance.com` (if configured)

## 🚨 Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify Node version matches (18.x)

### Authentication Not Working
- Verify environment variables are set correctly
- Check Supabase dashboard for API usage
- Ensure Supabase URL allows your Netlify domain

### 404 Errors on Routes
- netlify.toml redirect rules handle this
- If issues persist, check _redirects file

## 🔐 Security Notes

- Never commit .env files to GitHub
- Use Netlify environment variables for sensitive data
- Enable 2FA on both GitHub and Netlify accounts
- Regularly update dependencies

## 📞 Support

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- Community Forum: https://answers.netlify.com

---

Ready to deploy? Your app is configured and ready for Netlify! 🎉