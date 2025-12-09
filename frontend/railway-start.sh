#!/bin/sh
echo "🔍 Checking current directory: $(pwd)"
echo "📁 Listing files:"
ls -la

if [ -d "dist" ]; then
    echo "✅ dist directory found"
    echo "📂 Contents of dist:"
    ls -la dist
    echo "🚀 Starting HTTP server with serve..."
    npx serve dist -l 5000 --single
else
    echo "❌ dist directory not found!"
    echo "Current directory contents:"
    ls -la
    exit 1
fi
