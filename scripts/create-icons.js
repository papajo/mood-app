#!/usr/bin/env node

/**
 * Icon Creation Script for MoodMingle
 * 
 * This script creates a simple SVG-based icon and provides instructions
 * for generating PNG icons at all required sizes.
 * 
 * For production, replace with your actual app icon design.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

// Create directories
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon template
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="512" cy="512" r="480" fill="url(#grad1)"/>
  
  <!-- Mood emoji representation -->
  <text x="512" y="680" font-size="400" text-anchor="middle" fill="white">😊</text>
  
  <!-- Connecting lines (representing mingling) -->
  <circle cx="300" cy="300" r="60" fill="rgba(255,255,255,0.3)"/>
  <circle cx="724" cy="300" r="60" fill="rgba(255,255,255,0.3)"/>
  <circle cx="300" cy="724" r="60" fill="rgba(255,255,255,0.3)"/>
  <circle cx="724" cy="724" r="60" fill="rgba(255,255,255,0.3)"/>
  
  <!-- Connecting lines -->
  <line x1="360" y1="300" x2="664" y2="300" stroke="rgba(255,255,255,0.4)" stroke-width="8"/>
  <line x1="300" y1="360" x2="300" y2="664" stroke="rgba(255,255,255,0.4)" stroke-width="8"/>
  <line x1="724" y1="360" x2="724" y2="664" stroke="rgba(255,255,255,0.4)" stroke-width="8"/>
  <line x1="360" y1="724" x2="664" y2="724" stroke="rgba(255,255,255,0.4)" stroke-width="8"/>
</svg>`;

// Save SVG template
const svgPath = path.join(iconsDir, 'icon-template.svg');
fs.writeFileSync(svgPath, iconSVG);
console.log('✅ Created icon template: icon-template.svg');

// Create a simple HTML file to preview the icon
const previewHTML = `<!DOCTYPE html>
<html>
<head>
    <title>MoodMingle Icon Preview</title>
    <style>
        body {
            background: #0f172a;
            color: white;
            font-family: system-ui;
            padding: 40px;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .icon-item {
            text-align: center;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
        }
        .icon-item img {
            width: 100%;
            height: auto;
            border-radius: 8px;
        }
        .size-label {
            margin-top: 10px;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <h1>MoodMingle Icon Preview</h1>
    <p>This is a template icon. For production, replace with your custom design.</p>
    
    <div class="icon-grid">
        <div class="icon-item">
            <img src="icon-template.svg" alt="Icon" />
            <div class="size-label">1024x1024 (Template)</div>
        </div>
    </div>
    
    <h2>Required Icon Sizes</h2>
    <ul>
        <li>72x72</li>
        <li>96x96</li>
        <li>128x128</li>
        <li>144x144</li>
        <li>152x152</li>
        <li>192x192</li>
        <li>384x384</li>
        <li>512x512</li>
    </ul>
    
    <h2>How to Generate Icons</h2>
    <p>Use one of these methods:</p>
    <ol>
        <li><strong>Online Tool:</strong> <a href="https://realfavicongenerator.net/" style="color: #8b5cf6;">RealFaviconGenerator</a></li>
        <li><strong>ImageMagick:</strong> <code>convert icon-template.svg -resize 192x192 icons/icon-192x192.png</code></li>
        <li><strong>Design Tool:</strong> Export from Figma/Sketch at each size</li>
    </ol>
</body>
</html>`;

const previewPath = path.join(iconsDir, 'preview.html');
fs.writeFileSync(previewPath, previewHTML);
console.log('✅ Created icon preview: preview.html');

// Create placeholder PNG files (will be replaced with actual icons)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
console.log('\n📝 Note: Placeholder structure created.');
console.log('   Replace icon-template.svg with your design, then generate PNGs at all sizes.');
console.log(`   Place generated PNGs in: ${iconsDir}\n`);

console.log('Required files:');
sizes.forEach(size => {
    const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
    if (!fs.existsSync(filePath)) {
        console.log(`  ⏳ Missing: icon-${size}x${size}.png`);
    } else {
        console.log(`  ✅ Found: icon-${size}x${size}.png`);
    }
});

console.log('\n✨ Icon creation script complete!');
