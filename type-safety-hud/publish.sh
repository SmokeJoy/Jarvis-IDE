#!/bin/bash

# Color constants
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Type Safety HUD ====${NC}"
echo -e "${YELLOW}Preparing for NPM publishing...${NC}"

# Ensure we're on the main branch
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

if [ "$current_branch" != "main" ]; then
  echo -e "${YELLOW}WARNING: Not on main branch. Current branch: $current_branch${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Publishing aborted.${NC}"
    exit 1
  fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}WARNING: You have uncommitted changes${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Publishing aborted.${NC}"
    exit 1
  fi
fi

# Clean and build
echo -e "${GREEN}Cleaning and building the project...${NC}"
npm run clean || { echo -e "${RED}Clean failed${NC}"; exit 1; }
npm run build || { echo -e "${RED}Build failed${NC}"; exit 1; }

# Run tests
echo -e "${GREEN}Running tests...${NC}"
npm test || { 
  echo -e "${YELLOW}Tests failed. Continue anyway? (y/n)${NC}"
  read -p "" -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Publishing aborted.${NC}"
    exit 1
  fi
}

# Package version check
package_version=$(node -p "require('./package.json').version")
echo -e "${GREEN}Current package version: ${BLUE}$package_version${NC}"
read -p "Is this the correct version? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Please update the version in package.json and try again.${NC}"
  exit 1
fi

# Publish confirmation
echo -e "${YELLOW}Ready to publish to npm.${NC}"
read -p "Continue with publishing? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Publishing aborted.${NC}"
  exit 1
fi

# Login check
npm whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}You are not logged in to npm. Running 'npm login'...${NC}"
  npm login || { echo -e "${RED}Login failed${NC}"; exit 1; }
fi

# Publish
echo -e "${GREEN}Publishing to npm...${NC}"
npm run release || { echo -e "${RED}Publishing failed${NC}"; exit 1; }

# Success
echo -e "${GREEN}Successfully published type-safety-hud@$package_version to npm!${NC}"
echo -e "${BLUE}Package URL: https://www.npmjs.com/package/type-safety-hud${NC}"

# Git tag
read -p "Create git tag for v$package_version? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git tag -a "v$package_version" -m "Release v$package_version"
  git push origin "v$package_version"
  echo -e "${GREEN}Git tag v$package_version created and pushed.${NC}"
fi

echo -e "${GREEN}Done!${NC}" 