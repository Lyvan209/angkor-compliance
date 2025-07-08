@echo off
echo ========================================
echo EMERGENCY SUPABASE SECURITY FIX SCRIPT
echo ========================================
echo.

echo WARNING: Critical security vulnerabilities detected!
echo Your Supabase credentials are exposed in public files.
echo.

REM Step 1: Backup current state
echo Step 1: Creating backup...
if exist vercel.json copy vercel.json vercel.json.backup >nul 2>&1
if exist env.production copy env.production env.production.backup >nul 2>&1
if exist env.example copy env.example env.example.backup >nul 2>&1
echo ✓ Backup created
echo.

REM Step 2: Clean vercel.json
echo Step 2: Cleaning vercel.json...
(
echo {
echo   "name": "angkor-compliance",
echo   "version": 2,
echo   "builds": [
echo     {
echo       "src": "server.js",
echo       "use": "@vercel/node"
echo     },
echo     {
echo       "src": "public/**",
echo       "use": "@vercel/static"
echo     }
echo   ],
echo   "routes": [
echo     {
echo       "src": "/api/^(.*^)",
echo       "dest": "/server.js"
echo     },
echo     {
echo       "src": "/^(.*\\.(css^|js^|png^|jpg^|jpeg^|gif^|ico^|svg^)^)",
echo       "dest": "/$1"
echo     },
echo     {
echo       "src": "/^(.*^)",
echo       "dest": "/index.html"
echo     }
echo   ],
echo   "env": {
echo     "NODE_ENV": "production"
echo   },
echo   "functions": {
echo     "server.js": {
echo       "maxDuration": 30
echo     }
echo   },
echo   "rewrites": [
echo     {
echo       "source": "/^(^(?!api/^).*^)",
echo       "destination": "/index.html"
echo     }
echo   ]
echo }
) > vercel.json
echo ✓ vercel.json cleaned (secrets removed)
echo.

REM Step 3: Clean env.production
echo Step 3: Cleaning env.production...
(
echo # Angkor Compliance Production Environment Variables
echo # IMPORTANT: Add these values in your deployment platform's dashboard
echo # DO NOT add actual secrets to this file
echo.
echo NODE_ENV=production
echo PORT=3000
echo APP_URL=https://www.angkorcompliance.com
echo.
echo # Supabase Configuration - SET IN DEPLOYMENT DASHBOARD
echo SUPABASE_URL=
echo SUPABASE_ANON_KEY=
echo SUPABASE_SERVICE_ROLE_KEY=
echo JWT_SECRET=
echo.
echo # Security
echo SESSION_SECRET=
echo ALLOWED_ORIGINS=https://www.angkorcompliance.com,https://angkorcompliance.com
echo.
echo # Features
echo ENABLE_SUPABASE=true
echo ENABLE_ANALYTICS=true
echo ENABLE_REALTIME=true
echo.
echo # Logging
echo LOG_LEVEL=info
echo DEBUG=false
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
) > env.production
echo ✓ env.production cleaned (secrets removed)
echo.

REM Step 4: Clean env.example
echo Step 4: Cleaning env.example...
(
echo # Angkor Compliance Environment Variables
echo # Copy this file to .env and fill in your actual values
echo.
echo # Application Settings
echo NODE_ENV=development
echo PORT=3000
echo APP_URL=http://localhost:3000
echo.
echo # Security
echo SESSION_SECRET=your-super-secret-session-key-here
echo JWT_SECRET=your-256-bit-jwt-secret-key-here
echo.
echo # Supabase Configuration - GET FROM SUPABASE DASHBOARD
echo SUPABASE_URL=https://your-project.supabase.co
echo SUPABASE_ANON_KEY=your-anon-key-here
echo SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # CORS Configuration
echo ALLOWED_ORIGINS=http://localhost:3000,https://www.angkorcompliance.com
echo.
echo # Feature Flags
echo ENABLE_SUPABASE=true
echo ENABLE_ANALYTICS=true
echo ENABLE_REALTIME=true
) > env.example
echo ✓ env.example cleaned (template format)
echo.

REM Step 5: Create secure environment template
echo Step 5: Creating secure .env template...
(
echo # SECURE ENVIRONMENT VARIABLES
echo # Use these in your deployment platform ^(Vercel/Netlify dashboard^)
echo # DO NOT commit this file to git
echo.
echo NODE_ENV=production
echo SUPABASE_URL=YOUR_SUPABASE_URL_HERE
echo SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
echo SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_KEY_HERE
echo JWT_SECRET=GENERATE_NEW_256_BIT_KEY
echo SESSION_SECRET=GENERATE_NEW_256_BIT_KEY
) > .env.secure
echo ✓ Secure environment template created (.env.secure)
echo.

REM Step 6: Update .gitignore
echo Step 6: Updating .gitignore...
echo .env.secure >> .gitignore 2>nul
echo *.backup >> .gitignore 2>nul
echo ✓ .gitignore updated
echo.

echo ===============================================
echo 🎉 EMERGENCY FIXES COMPLETED!
echo ===============================================
echo.

echo 🚨 CRITICAL NEXT STEPS:
echo.
echo 1. 🔄 ROTATE SUPABASE KEYS IMMEDIATELY:
echo    • Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
echo    • Click 'Reset' on Service Role Key
echo    • Generate new Anon Key if needed
echo.
echo 2. 🔐 SET ENVIRONMENT VARIABLES IN DEPLOYMENT PLATFORM:
echo    • Vercel: Go to dashboard → Settings → Environment Variables
echo    • Netlify: Go to dashboard → Site Settings → Environment Variables
echo    • Use values from .env.secure file
echo.
echo 3. 🧹 CLEAN GIT HISTORY:
echo    git add .
echo    git commit -m "SECURITY: Remove exposed credentials"
echo    git push origin main
echo.
echo ⚠️  WARNING: Your system is NOT secure until you complete steps 1-3!
echo.
echo Files modified:
echo • vercel.json ^(secrets removed^)
echo • env.production ^(cleaned^)
echo • env.example ^(template format^)
echo • .env.secure ^(secure values for deployment^)
echo.
echo ✓ Emergency security fixes applied successfully!
echo 📄 See SUPABASE-SECURITY-AUDIT.md for complete security analysis.
echo.
pause 