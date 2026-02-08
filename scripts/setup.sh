#!/bin/bash
# Setup script for Coach Core application
# This script helps restore the .env file and verify the environment is properly configured
#
# Usage:
#   bash scripts/setup.sh          # Interactive mode
#   bash scripts/setup.sh --force  # Non-interactive, always restore from backup

set -e  # Exit on error

FORCE_MODE=false
if [ "$1" == "--force" ]; then
    FORCE_MODE=true
fi

echo "================================================"
echo "Coach Core Application Setup"
echo "================================================"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✓ .env file already exists"
    
    if [ "$FORCE_MODE" == "true" ]; then
        echo "Force mode enabled. Restoring from backup..."
        if [ -f ".env.bak" ]; then
            cp .env.bak .env
            echo "✓ Restored .env from .env.bak"
        else
            echo "⚠️  .env.bak not found, keeping existing .env"
        fi
    else
        echo ""
        read -p "Do you want to replace it with .env.bak? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f ".env.bak" ]; then
                cp .env.bak .env
                echo "✓ Restored .env from .env.bak"
            else
                echo "✗ .env.bak not found"
                exit 1
            fi
        fi
    fi
else
    echo "✗ .env file not found"
    echo ""
    
    # Check for backup
    if [ -f ".env.bak" ]; then
        echo "Found .env.bak backup. Restoring..."
        cp .env.bak .env
        echo "✓ Restored .env from .env.bak"
    elif [ -f ".env.example" ]; then
        echo "Found .env.example. Creating new .env..."
        cp .env.example .env
        echo "✓ Created .env from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: You must edit .env and add your credentials!"
        echo "   See README.md for required environment variables."
        exit 1
    else
        echo "✗ No .env.bak or .env.example found"
        echo "Cannot proceed with setup."
        exit 1
    fi
fi

echo ""
echo "================================================"
echo "Verifying Environment Configuration"
echo "================================================"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "Running environment checks..."
npm run check-env

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✓ Setup Complete!"
    echo "================================================"
    echo ""
    echo "Your application is ready to run."
    echo ""
    echo "To start development server:"
    echo "  npm run dev"
    echo ""
    echo "To build for production:"
    echo "  npm run build"
    echo ""
else
    echo ""
    echo "================================================"
    echo "✗ Setup Failed"
    echo "================================================"
    echo ""
    echo "Please fix the environment issues above."
    echo "See docs/TROUBLESHOOTING.md for help."
    echo ""
    exit 1
fi
