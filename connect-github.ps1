# PowerShell script to connect to GitHub repository
# Usage: .\connect-github.ps1 YOUR_USERNAME

param(
    [Parameter(Mandatory=$true)]
    [string]$Username
)

Write-Host "🚀 Connecting to GitHub repository..." -ForegroundColor Green

# Add remote repository
$repoUrl = "https://github.com/$Username/Angkor-Compliance.git"
Write-Host "Adding remote repository: $repoUrl" -ForegroundColor Yellow
git remote add origin $repoUrl

# Push to GitHub
Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
git push -u origin master

Write-Host "✅ Successfully connected to GitHub!" -ForegroundColor Green
Write-Host "🌐 Your repository is now at: $repoUrl" -ForegroundColor Cyan
Write-Host "📝 Next step: Set up auto deployment with Netlify following the instructions in setup-deployment.md" -ForegroundColor Magenta 