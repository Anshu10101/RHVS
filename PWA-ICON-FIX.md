# PWA Splash Screen Icon Fix

## Issue
The PWA loading screen shows the logo with padding/transparent edges, not filling the entire screen.

## Root Cause
The splash screen uses icons from `/public/icons/icon-192x192.png` and `/public/icons/icon-512x512.png`. If these icons have:
- Transparent padding around the logo
- Logo not extending to canvas edges
- Safe zone padding (for maskable icons)

Then the splash screen will show gaps.

## Solution

### Option 1: Replace Icon Files (Recommended)
1. Create new icon files where the logo **fills the entire canvas**:
   - `icon-192x192.png` - Logo should touch all 4 edges (192x192px)
   - `icon-512x512.png` - Logo should touch all 4 edges (512x512px)

2. **No transparent padding** - Logo should extend edge-to-edge
3. Background should match your logo's orange color (`#ea580c`)

### Option 2: Use Different Icons for Splash
Create separate full-coverage icons:
- `icon-splash-192x192.png`
- `icon-splash-512x512.png`

Then update manifest to use these for splash screens.

## Current Configuration
- **Icons used**: `/public/icons/icon-192x192.png` and `/public/icons/icon-512x512.png`
- **Background color**: `#ea580c` (orange - matches your logo)
- **Theme color**: `#ea580c`

## How PWA Splash Screen Works
1. Browser uses the **largest icon** (512x512) for splash screen
2. Icon is centered on screen
3. Background color fills the rest
4. If icon has padding, you'll see the background color around it

## Quick Fix Steps
1. Open your logo in an image editor
2. Create 192x192 and 512x512 versions
3. **Remove all padding** - logo should touch edges
4. Save as PNG with no transparency (or transparent = background color)
5. Replace files in `/public/icons/`
6. Clear browser cache and reinstall PWA

## Testing
After updating icons:
1. Uninstall PWA from phone
2. Clear browser cache
3. Reinstall PWA
4. Open app - splash screen should now show logo filling edges

