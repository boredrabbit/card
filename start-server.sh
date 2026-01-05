#!/bin/bash
# Simple local web server for Polymarket whale tracker
# This fixes CORS issues by serving the page through HTTP instead of file://

cd "$(dirname "$0")"
echo "🚀 Starting local web server..."
echo "📡 Server running at: http://localhost:8000"
echo "🌐 Open this URL in your browser: http://localhost:8000/portfolio.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
