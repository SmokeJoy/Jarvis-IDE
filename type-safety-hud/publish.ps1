# Type Safety HUD - Publish Script for PowerShell
# This script automates the publishing process to npm

# Set color constants
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'  # Cyan is more visible than Blue in PowerShell
$Red = 'Red'

function Write-Color($message, $color) {
    Write-Host $message -ForegroundColor $color
}

Write-Color "=== Type Safety HUD ====" $Blue
Write-Color "Preparing for NPM publishing..." $Yellow

# Ensure we're on the main branch
try {
    $current_branch = git symbolic-ref --short HEAD 2>$null
} catch {
    $current_branch = "unknown"
}

if ($current_branch -ne "main") {
    Write-Color "WARNING: Not on main branch. Current branch: $current_branch" $Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Color "Publishing aborted." $Red
        exit 1
    }
}

# Check for uncommitted changes
$git_status = git status --porcelain
if ($git_status) {
    Write-Color "WARNING: You have uncommitted changes" $Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Color "Publishing aborted." $Red
        exit 1
    }
}

# Clean and build
Write-Color "Cleaning and building the project..." $Green
try {
    npm run clean
    npm run build
} catch {
    Write-Color "Build failed: $_" $Red
    exit 1
}

# Run tests
Write-Color "Running tests..." $Green
try {
    npm test
} catch {
    Write-Color "Tests failed. Continue anyway? (y/n)" $Yellow
    $continue = Read-Host
    if ($continue -ne 'y') {
        Write-Color "Publishing aborted." $Red
        exit 1
    }
}

# Package version check
$package_json = Get-Content './package.json' | ConvertFrom-Json
$package_version = $package_json.version
Write-Color "Current package version: $package_version" $Green
$version_ok = Read-Host "Is this the correct version? (y/n)"
if ($version_ok -ne 'y') {
    Write-Color "Please update the version in package.json and try again." $Yellow
    exit 1
}

# Publish confirmation
Write-Color "Ready to publish to npm." $Yellow
$publish_ok = Read-Host "Continue with publishing? (y/n)"
if ($publish_ok -ne 'y') {
    Write-Color "Publishing aborted." $Red
    exit 1
}

# Login check
try {
    $npm_whoami = npm whoami 2>$null
} catch {
    $npm_whoami = $null
}

if (-not $npm_whoami) {
    Write-Color "You are not logged in to npm. Running 'npm login'..." $Yellow
    try {
        npm login
    } catch {
        Write-Color "Login failed: $_" $Red
        exit 1
    }
}

# Publish
Write-Color "Publishing to npm..." $Green
try {
    npm run release
} catch {
    Write-Color "Publishing failed: $_" $Red
    exit 1
}

# Success
Write-Color "Successfully published type-safety-hud@$package_version to npm!" $Green
Write-Color "Package URL: https://www.npmjs.com/package/type-safety-hud" $Blue

# Git tag
$create_tag = Read-Host "Create git tag for v$package_version? (y/n)"
if ($create_tag -eq 'y') {
    git tag -a "v$package_version" -m "Release v$package_version"
    git push origin "v$package_version"
    Write-Color "Git tag v$package_version created and pushed." $Green
}

Write-Color "Done!" $Green 