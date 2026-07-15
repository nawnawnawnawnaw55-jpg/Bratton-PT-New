// Bratton PT Reviews API — static-cache-first with Google API + hardcoded fallback
// Deployed as a Vercel serverless function at /api/reviews
//
// Query params:
//   ?newest=N  → N most recent reviews, any rating (for the /reviews page)
//   ?all=1     → all reviews, any rating (for popup / full listing)
//   (none)     → top 5 five-star reviews (for homepage carousel)
//
// Architecture:
//   1. Read api/reviews-cache.json (deployed alongside — refreshed nightly)
//   2. If cache has reviews → serve subset according to query params
//   3. If cache empty/missing → call Google Places API live
//   4. If Google API fails → serve hardcoded FALLBACK reviews

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Lives in ./fallback-reviews.js so fetch-reviews-cache.js can reuse the exact same list.
import { FALLBACK } from './fallback-reviews.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_PATH = path.join(__dirname, 'reviews-cache.json');

const PLACE_ID = 'ChIJicdBse3mnYgRyU49RjVmRs0';

// ── Helpers ──────────────────────────────────────────────────────────

function sanitizeText(t) {
  return (t || '').replace(/[^\x20-\x7E\xA0-\xFF\u2010-\u2122]/g, '').replace(/\s+/g, ' ').trim();
}

function parseTimeDays(t) {
  // Convert relative time strings to approximate days for sorting.
  // Only used as a fallback for reviews that don't carry an exact timestamp
  // (i.e. the curated FALLBACK list, or cache entries written before this
  // field existed).
  if (!t) return 0;
  const match = t.match(/(\d+)\s+(year|month|week|day)s?/i);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === 'day') return num;
  if (unit === 'week') return num * 7;
  if (unit === 'month') return num * 30;
  if (unit === 'year') return num * 365;
  return 0;
}

function sortReviewsNewest(reviews) {
  return [...reviews].sort((a, b) => {
    const aNum = typeof a.time === 'number';
    const bNum = typeof b.time === 'number';
    // Exact Unix timestamps (real Google reviews) sort correctly by definition.
    if (aNum && bNum) return b.time - a.time;
    if (aNum && !bNum) return -1; // a real timestamp beats a guessed one
    if (!aNum && bNum) return 1;
    // Neither has an exact timestamp — fall back to the old relative-string guess.
    // Covers both cache filler entries (relative_time set, time: null) and the
    // raw FALLBACK array served directly when cache+live API both fail (time
    // itself holds the relative string, e.g. "8 months ago").
    const aStr = a.relative_time || (typeof a.time === 'string' ? a.time : '');
    const bStr = b.relative_time || (typeof b.time === 'string' ? b.time : '');
    return parseTimeDays(aStr) - parseTimeDays(bStr);
  });
}

// ── Read cache from filesystem ───────────────────────────────────────

function readCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    const data = JSON.parse(raw);
    // Validate structure
    if (!data || typeof data !== 'object') return null;
    if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) return null;
    // Validate each review has required fields
    const valid = data.reviews.every(r => r && typeof r === 'object' && typeof r.text === 'string' && r.text.length > 0);
    if (!valid) {
      console.warn('Cache contains malformed reviews — skipping');
      return null;
    }
    // Check cache freshness (5 days max)
    if (data.cached_at) {
      const age = Date.now() - new Date(data.cached_at).getTime();
      const maxAge = 5 * 24 * 60 * 60 * 1000; // 5 days
      if (age > maxAge) {
        console.warn('Cache is over 5 days old — will try live API');
        return null; // Force refresh from live API
      }
    }
    return {
      reviews: data.reviews,
      overall_rating: data.overall_rating || 5.0,
      total_reviews: data.total_reviews || data.reviews.length,
      cached_at: data.cached_at || null
    };
  } catch (e) {
    console.warn('Cache read error — will try live API:', e.message);
    return null;
  }
}

// ── Select subset from full review list ──────────────────────────────

function selectReviews(allReviews, { newest, showAll }) {
  const sorted = sortReviewsNewest(allReviews);
  if (newest && newest > 0) {
    return sorted.slice(0, newest);
  }
  if (showAll) {
    return sorted;
  }
  // Default: top 5 five-star reviews
  return sorted.filter(r => r.rating === 5).slice(0, 5);
}

// ── Safe JSON responder (avoids reliance on Vercel res.json helper) ──

function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// ── Serve from hardcoded fallback ────────────────────────────────────

function serveFallback({ newest, showAll }, res) {
  const reviews = selectReviews(FALLBACK, { newest, showAll });
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  sendJSON(res, 200, {
    reviews,
    overall_rating: 5.0,
    total_reviews: FALLBACK.length,
    _fallback: true
  });
}

// ── Call Google Places API live ──────────────────────────────────────

async function fetchGoogleReviews(apiKey, { newest, showAll }, res) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=en`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error_message || !data.result || !data.result.reviews) {
      throw new Error(data.error_message || 'No reviews in API response');
    }

    const allReviews = data.result.reviews.map(r => ({
      name: r.author_name,
      text: sanitizeText(r.text),
      time: r.time,                              // exact Unix timestamp
      relative_time: r.relative_time_description, // human-readable, for display
      rating: r.rating,
      photo: r.profile_photo_url || null
    }));

    const reviews = selectReviews(allReviews, { newest, showAll });
    const overallRating = data.result.rating || 5.0;
    const totalReviews = data.result.user_ratings_total || allReviews.length;

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    sendJSON(res, 200, { reviews, overall_rating: overallRating, total_reviews: totalReviews, _live: true });
  } catch (e) {
    serveFallback({ newest, showAll }, res);
  }
}

// ── Main handler ─────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Always set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const API_KEY = process.env.GOOGLE_API_KEY;
  const showAll = req.query && req.query.all === '1';
  const newest = req.query && req.query.newest ? parseInt(req.query.newest, 10) : 0;

  try {
    // 1. Try static cache first
    const cache = readCache();
    if (cache) {
      const reviews = selectReviews(cache.reviews, { newest, showAll });
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      sendJSON(res, 200, {
        reviews,
        overall_rating: cache.overall_rating,
        total_reviews: cache.total_reviews,
        _from_cache: true
      });
      return;
    }

    // 2. Cache empty — try Google API live
    if (API_KEY) {
      return fetchGoogleReviews(API_KEY, { newest, showAll }, res);
    }

    // 3. No API key — use fallback
    serveFallback({ newest, showAll }, res);
  } catch (e) {
    console.error('reviews API error:', e);
    serveFallback({ newest, showAll }, res);
  }
}