/**
 * Nightly reviews cache refresh script.
 * Run via Windows Task Scheduler daily at 12:03 AM:
 *   node api/fetch-reviews-cache.js
 *
 * Reads GOOGLE_API_KEY from a .env file in the project root (or environment variable).
 *
 * Google's Place Details API hard-caps at 5 reviews per call, no matter what —
 * that's a permanent limit on Google's end. But which 5 you get depends on
 * reviews_sort, and each review carries an exact Unix timestamp (r.time), so
 * this script:
 *
 *   1. Calls Google TWICE per run — once reviews_sort=newest, once
 *      reviews_sort=most_relevant — since the two sorts often return a
 *      slightly different set of 5, netting more than 5 unique reviews.
 *   2. Merges any new-to-us reviews into a PERSISTENT archive
 *      (api/reviews-archive.json) that never gets wiped — it only grows,
 *      as genuinely new reviews get posted and captured by "newest" over
 *      time, or a previously-uncaptured one surfaces via "most_relevant".
 *   3. Builds the display cache from the archive (sorted by the real
 *      timestamp, not a fuzzy "3 months ago" string), filling any
 *      remaining slots up to 20 with the curated fallback list.
 *
 * As the archive naturally grows past 20 real reviews, the fallback filler
 * disappears entirely on its own — no code change needed later.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { FALLBACK, nameKey } from './fallback-reviews.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACE_ID = 'ChIJicdBse3mnYgRyU49RjVmRs0';
const OUTPUT_FILE = path.join(__dirname, 'reviews-cache.json');
const ARCHIVE_FILE = path.join(__dirname, 'reviews-archive.json');
const DISPLAY_TARGET = 20;

// Load GOOGLE_API_KEY from .env file if present
let API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GOOGLE_API_KEY=([^\r\n]+)/);
      if (match) API_KEY = match[1].trim();
    }
  } catch (e) {
    // .env file not found or unreadable — will try environment variable
  }
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function fetchGoogleReviews(sort) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${API_KEY}&language=en&reviews_sort=${sort}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse Google API response (sort=${sort}): ` + e.message));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`HTTP request failed (sort=${sort}): ` + e.message));
    });
  });
}

function sanitizeText(t) {
  return (t || '').replace(/[^\x20-\x7E\xA0-\xFF\u2010-\u2122]/g, '').replace(/\s+/g, ' ').trim();
}

// Catches near-duplicate names within the same fetch run — e.g. "Denice Foll"
// and "Denise Foll" are obviously the same person but Google returned two
// slightly different author_name strings. We keep the one with more text.
function dedupeByNameInRun(reviews) {
  const seen = [];
  for (const r of reviews) {
    const rKey = nameKey(r.name);
    const duplicate = seen.find(s => {
      // Exact fuzzy-key match (same firstname|lastinitial) — already a dupe
      if (nameKey(s.name) === rKey) return true;
      // Near-match: same last-initial, first names within edit-distance of 2
      const sParts = (s.name || '').trim().split(/\s+/).filter(Boolean);
      const rParts = (r.name || '').trim().split(/\s+/).filter(Boolean);
      if (sParts.length < 2 || rParts.length < 2) return false;
      const sLast = sParts[sParts.length - 1].toLowerCase();
      const rLast = rParts[rParts.length - 1].toLowerCase();
      if (sLast !== rLast) return false;
      const sFirst = sParts[0].toLowerCase();
      const rFirst = rParts[0].toLowerCase();
      if (Math.abs(sFirst.length - rFirst.length) > 2) return false;
      let diffs = 0;
      const maxLen = Math.max(sFirst.length, rFirst.length);
      for (let i = 0; i < maxLen; i++) {
        if (sFirst[i] !== rFirst[i]) diffs++;
        if (diffs > 2) return false;
      }
      return diffs <= 2;
    });
    if (!duplicate) {
      seen.push(r);
    } else if (r.text.length > duplicate.text.length) {
      // Replace with the richer version
      seen[seen.indexOf(duplicate)] = r;
    }
  }
  return seen;
}

// Exact dedup key for real Google reviews: author + exact submission
// timestamp. Far more reliable than name-matching since it can't collide
// unless it's genuinely the same review.
function reviewKey(r) {
  return (r.name || '').trim().toLowerCase() + '|' + r.time;
}

function readArchive() {
  try {
    if (!fs.existsSync(ARCHIVE_FILE)) return [];
    const raw = fs.readFileSync(ARCHIVE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Strip empty-text entries that snuck in from older runs and
    // deduplicate near-name variants (e.g. "Denice" / "Denise").
    const withText = parsed.filter(r => r.text && r.text.trim().length > 0);
    return dedupeByNameInRun(withText);
  } catch (e) {
    log('WARNING: could not read existing archive, starting fresh: ' + e.message);
    return [];
  }
}

async function main() {
  log('Starting reviews cache refresh...');

  if (!API_KEY) {
    log('ERROR: No GOOGLE_API_KEY found. Set it in a .env file in the project root or as an environment variable.');
    process.exit(1);
  }

  try {
    log('Fetching reviews from Google Places API (newest + most_relevant)...');
    const [newestData, relevantData] = await Promise.all([
      fetchGoogleReviews('newest'),
      fetchGoogleReviews('most_relevant')
    ]);

    const primary = newestData.result ? newestData : relevantData;
    if (primary.error_message) {
      log('Google API error: ' + primary.error_message);
      process.exit(1);
    }
    if (!primary.result) {
      log('No result in API response.');
      process.exit(1);
    }

    const rawFromBoth = [
      ...((newestData.result && newestData.result.reviews) || []),
      ...((relevantData.result && relevantData.result.reviews) || [])
    ];

    const freshLive = dedupeByNameInRun(
      rawFromBoth
        .map(r => ({
          name: r.author_name,
          text: sanitizeText(r.text),
          time: r.time,                              // exact Unix timestamp
          relative_time: r.relative_time_description, // human-readable, for display
          rating: r.rating,
          photo: r.profile_photo_url || null
        }))
        .filter(r => r.text.length > 0) // Google sometimes returns reviews with no body — skip those
    );

    // Merge into the persistent archive — this is what lets the real-review
    // count grow across nights instead of resetting every run.
    const archive = readArchive();
    const archiveKeys = new Set(archive.map(reviewKey));
    let newlyAdded = 0;
    for (const r of freshLive) {
      const k = reviewKey(r);
      if (!archiveKeys.has(k)) {
        archive.push(r);
        archiveKeys.add(k);
        newlyAdded++;
      }
    }
    // Genuine chronological sort — exact epoch, no string-guessing.
    archive.sort((a, b) => (b.time || 0) - (a.time || 0));
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2), 'utf8');

    // Fill remaining display slots (up to 20) with curated fallback reviews
    // that don't already match someone in the archive.
    const archivedNameKeys = new Set(archive.map(r => nameKey(r.name)));
    const fillerReviews = FALLBACK
      .filter(r => !archivedNameKeys.has(nameKey(r.name)))
      .map(r => ({ ...r, time: null, relative_time: r.time })); // FALLBACK's own "time" field is the relative string

    const displayReviews = [...archive, ...fillerReviews].slice(0, DISPLAY_TARGET);

    const cacheData = {
      reviews: displayReviews,
      overall_rating: primary.result.rating || 5.0,
      total_reviews: primary.result.user_ratings_total || displayReviews.length,
      archive_size: archive.length,
      cached_at: new Date().toISOString()
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
    log(`Archive: ${archive.length} real reviews total (${newlyAdded} new this run).`);
    log(`SUCCESS: Wrote ${displayReviews.length} reviews to cache (${Math.min(archive.length, DISPLAY_TARGET)} real, ${displayReviews.length - Math.min(archive.length, DISPLAY_TARGET)} curated filler).`);
    log(`Overall rating: ${cacheData.overall_rating} | Total reviews on Google: ${cacheData.total_reviews}`);

    // Auto-commit and push to trigger Vercel redeploy
    const projectRoot = path.join(__dirname, '..');
    const dateStr = new Date().toISOString().split('T')[0];
    try {
      log('Committing updated cache + archive to git...');
      execSync('git add api/reviews-cache.json api/reviews-archive.json', { cwd: projectRoot, stdio: 'pipe' });
      execSync(`git commit -m "Nightly reviews cache refresh - ${dateStr}"`, { cwd: projectRoot, stdio: 'pipe' });
      execSync('git push', { cwd: projectRoot, stdio: 'pipe' });
      log('Pushed to git — Vercel will redeploy with fresh cache.');
    } catch (gitErr) {
      log('WARNING: git push failed: ' + (gitErr.stderr ? gitErr.stderr.toString().trim() : gitErr.message));
      log('Cache file was written locally but not pushed. Vercel will keep serving previous cache.');
    }
    process.exit(0);
  } catch (e) {
    log('ERROR: ' + e.message);
    process.exit(1);
  }
}

main();