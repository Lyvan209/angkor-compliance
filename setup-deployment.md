# 🚀 Auto Deployment Setup Guide

## Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `Angkor-Compliance` (recommended)
3. **Description**: "Angkor Compliance login system with Supabase authentication"
4. **Visibility**: Public (required for free Netlify deployment)
5. **Initialize**: Leave all checkboxes unchecked
6. **Click "Create repository"**

## Step 2: Connect Your Local Repository

After creating the repository on GitHub, you'll see a page with setup instructions. Run these commands in your terminal:

### Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/Angkor-Compliance.git

# Push your code to GitHub
git push -u origin master
```

**Example** (if your username is "john"):
```bash
git remote add origin https://github.com/john/Angkor-Compliance.git
git push -u origin master
```

## Step 3: Set Up Auto Deployment with Netlify

### Option A: Direct GitHub Integration (Recommended)

1. **Go to Netlify**: https://app.netlify.com
2. **Click "New site from Git"**
3. **Choose "GitHub"** and authorize Netlify
4. **Select your repository**: `Angkor-Compliance`
5. **Build settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Click "Deploy site"**

### Option B: Manual Setup (if needed)

If auto-detection doesn't work, use these settings:
- **Base directory**: (leave empty)
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18 (set in Environment variables)

## Step 4: Configure Environment Variables

If your app uses environment variables:

1. In your Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add your Supabase keys:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key

## Step 5: Set Up Custom Domain (Optional)

1. In Netlify dashboard, go to **Domain settings**
2. **Add custom domain**: Enter your domain
3. **Follow DNS instructions** to point your domain to Netlify

## 🎉 Auto Deployment is Live!

Now every time you push to GitHub:
1. **Netlify automatically detects** the push
2. **Builds your app** using `npm run build`
3. **Deploys to your live site**

## Quick Commands for Future Updates

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin master

# Your site will automatically rebuild and deploy!
```

## Testing Your Deployment

1. **Visit your Netlify URL** (provided after deployment)
2. **Test all features**:
   - Sign up functionality
   - Login/logout
   - Dashboard access
   - Responsive design

## Troubleshooting

### Build Fails
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally

### Environment Variables
- Double-check your Supabase configuration
- Make sure environment variables are set in Netlify
- Verify variable names match your code

## Your Current Setup

✅ **Local repository**: Ready and committed
✅ **Build configuration**: `netlify.toml` is configured
✅ **Dependencies**: All installed in `package.json`
✅ **Build command**: `npm run build` produces `dist` folder

**Next step**: Create the GitHub repository and run the connection commands above! 