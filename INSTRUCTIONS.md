# Polymarket Whale Tracker - Instructions

## Critical Fix Applied

### Issues Fixed:
1. **CORS Error** - The Polymarket API was being blocked because you were opening the file directly (file://)
2. **Alignment Issue** - The tracker grid was not properly aligned with the All Assets tab
3. **Start All Button** - Event listeners are now properly attached

## How to Use:

### Option 1: Quick Start (Recommended)
```bash
cd /Users/pmw/y-n10-fresh
./start-server.sh
```

Then open your browser to: **http://localhost:8000/portfolio.html**

### Option 2: Manual Start
```bash
cd /Users/pmw/y-n10-fresh
python3 -m http.server 8000
```

Then open your browser to: **http://localhost:8000/portfolio.html**

## What Changed:

### 1. CORS Fix
- You MUST use http://localhost:8000/portfolio.html instead of file:///...
- The Polymarket API blocks direct file:// access for security reasons
- Running through a local server fixes this

### 2. Alignment Fix
- The main layout is now constrained to 1200px (matching All Assets tab)
- Tracker section uses flexible width (flex: 1)
- Sidebar stays fixed at 400px
- Total: ~774px (trackers) + 1.5rem gap + 400px (sidebar) = 1200px

### 3. Button Fix
- Event listener now properly attaches after page load
- Console logging added to help debug any future issues

## Testing:

1. Open http://localhost:8000/portfolio.html
2. Click the "Polymarket" tab
3. Click "START ALL" button - should see console logs and trackers starting
4. Check alignment - should match the All Assets tab position

## Stopping the Server:

Press `Ctrl+C` in the terminal where the server is running.

## Notes:

- Keep the terminal window open while using the tracker
- The server runs on port 8000 by default
- If port 8000 is busy, you can use a different port: `python3 -m http.server 8080`
