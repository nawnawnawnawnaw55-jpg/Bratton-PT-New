/**
 * Batch SEO Meta Fixer
 * For each index.html (except homepage), adds:
 * 1. Canonical tag (<link rel="canonical">)
 * 2. Fixes og:url from relative to absolute
 * 3. Adds og:image if missing (logo fallback)
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://bratton-pt.vercel.app';
const LOGO_OG_IMAGE = '/files/logo/BRATTON-ai.svg';
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Directories to exclude from processing
const EXCLUDE_DIRS = [
  'node_modules', '.git', 'css', 'js', 'templates',
  'components', 'api', 'files', 'tools'
];

// Pages to skip (homepage already has canonical)
const SKIP_FILES = new Set([
  path.join(PROJECT_ROOT, 'index.html')
]);

function getAllIndexFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDE_DIRS.includes(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dir, entry.name);
    const indexPath = path.join(fullPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      results.push(indexPath);
    }
    
    // Recurse into subdirectories
    const subResults = getAllIndexFiles(fullPath);
    results.push(...subResults);
  }
  
  return results;
}

function getPagePath(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const dirPath = path.dirname(relativePath).replace(/\\/g, '/');
  return '/' + (dirPath === '.' ? '' : dirPath + '/');
}

function processFile(filePath) {
  const pagePath = getPagePath(filePath);
  const absoluteUrl = BASE_URL + pagePath;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];
  
  // ===== TASK 1: Add canonical tag if missing =====
  if (!/<link\s+rel="canonical"/i.test(content)) {
    // Insert canonical before </head>
    const canonicalTag = '\n<link rel="canonical" href="' + absoluteUrl + '">';
    const headCloseRegex = /<\/head>/i;
    
    if (content.match(/<link rel="canonical"/i)) {
      // Already has one, skip
    } else if (headCloseRegex.test(content)) {
      content = content.replace(headCloseRegex, canonicalTag + '\n</head>');
      modified = true;
      changes.push('added canonical: ' + absoluteUrl);
    } else {
      console.warn('  WARNING: No </head> tag found in ' + filePath);
    }
  }
  
  // ===== TASK 2: Fix og:url from relative to absolute =====
  const ogUrlRegex = /<meta\s+property="og:url"\s+content="([^"]*)"/g;
  let ogUrlMatch;
  while ((ogUrlMatch = ogUrlRegex.exec(content)) !== null) {
    const currentUrl = ogUrlMatch[1];
    if (currentUrl.startsWith('/')) {
      const fixedUrl = BASE_URL + currentUrl;
      content = content.replace(
        'content="' + currentUrl + '"',
        'content="' + fixedUrl + '"'
      );
      modified = true;
      changes.push('fixed og:url: ' + currentUrl + ' -> ' + fixedUrl);
    }
  }
  
  // ===== TASK 3: Add og:image if missing =====
  if (!/<meta\s+property="og:image"/i.test(content)) {
    // Check if this page has an <img> tag to use; otherwise use logo
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    let imageUrl;
    
    if (imgMatch) {
      // Use the first image on the page if it's a local file (not external)
      if (imgMatch[1].startsWith('/files/')) {
        imageUrl = imgMatch[1];
      } else {
        imageUrl = LOGO_OG_IMAGE;
      }
    } else {
      imageUrl = LOGO_OG_IMAGE;
    }
    
    // Insert og:image after og:type or og:site_name, or before twitter:card
    const ogImageTag = '\n<meta property="og:image" content="' + imageUrl + '">';
    
    // Find the right insertion point
    if (content.includes('og:type')) {
      content = content.replace(
        /(<meta\s+property="og:type"[^>]*>)/,
        '$1' + ogImageTag
      );
    } else if (content.includes('og:site_name')) {
      content = content.replace(
        /(<meta\s+property="og:site_name"[^>]*>)/,
        '$1' + ogImageTag
      );
    } else if (content.includes('twitter:card')) {
      content = content.replace(
        /(<meta\s+name="twitter:card"[^>]*>)/,
        ogImageTag + '\n$1'
      );
    } else {
      // Last resort: before </head>
      content = content.replace('</head>', ogImageTag + '\n</head>');
    }
    
    modified = true;
    changes.push('added og:image: ' + imageUrl);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ ' + filePath.replace(PROJECT_ROOT, '.'));
    changes.forEach(c => console.log('  ' + c));
  }
  
  return modified;
}

// Main
console.log('Scanning for index.html files...');
const allFiles = getAllIndexFiles(PROJECT_ROOT).filter(f => !SKIP_FILES.has(f));
console.log('Found ' + allFiles.length + ' pages to process.\n');

let modifiedCount = 0;
for (const filePath of allFiles) {
  if (processFile(filePath)) {
    modifiedCount++;
  }
}

console.log('\n---');
console.log('Done! Modified ' + modifiedCount + ' / ' + allFiles.length + ' files.');