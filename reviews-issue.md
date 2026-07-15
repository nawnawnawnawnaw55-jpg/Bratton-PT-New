# Reviews Page — Issue & Proposed Fix

## What the User Wants

- Show **16–20 reviews** on `reviews/index.html`
- Fetch all 20 reviews **once per night** (via the nightly cache script)
- Zero live API calls during the day — everything served from the static cache
- The nightly script should call Google's API, get real reviews, merge with any needed fallbacks, and write a full 20-review cache file

---

## Current Architecture

| File | Role |
|---|---|
| `api/fetch-reviews-cache.js` | Nightly script (run by Windows Task Scheduler at 12:03 AM). Fetches reviews from Google Places Details API, writes to `api/reviews-cache.json`, commits & pushes to trigger Vercel deploy. |
| `api/reviews-cache.json` | Static cache deployed alongside the site. Currently contains **5 reviews**. |
| `api/reviews.js` | Vercel serverless function at `/api/reviews`. Serves reviews from the static cache (or Google API live if cache is stale/missing, or 16 hardcoded fallbacks as last resort). |
| `reviews/index.html` | The patient reviews page. Calls `/api/reviews?newest=20`, then pads results with hardcoded fallbacks **client-side** if fewer than 16 are returned. |

## The Problem

### 1. Google Places Details API Caps Reviews at 5

The endpoint we use:

```
https://maps.googleapis.com/maps/api/place/details/json
  ?place_id=ChIJicdBse3mnYgRyU49RjVmRs0
  &fields=reviews,rating,user_ratings_total
  &key=API_KEY
  &language=en
```

- **Google returns a maximum of 5 reviews** in the response.
- The `next_page_token` field does **not exist** for the `reviews` sub-field in Place Details. This pagination mechanism is only available in **Place Search** and **Nearby Search** (listing multiple places), not for paginating reviews of a single place.
- According to Google's documentation: "Place Details returns up to 5 reviews only."

### 2. What Was Tried

#### Attempt 1: Paginated fetching in `fetch-reviews-cache.js`

We added pagination logic looking for `data.result.next_page_token`, with a 2-second delay between pages (as Google requires). Result:

```
Page 1: fetched 5 reviews (running total: 5)
No more page tokens available.
```

Google never returned a `next_page_token` for the reviews field, so only 5 reviews were ever fetched regardless of how many pages we attempted.

#### Attempt 2: Client-side padding in `reviews/index.html`

Changed the page to request `?newest=20` from the API, then pad with hardcoded fallback reviews client-side until 16 are shown. This works but:

- The padding code lives in the HTML (messy, duplicated data)
- It doesn't fulfill the goal of "cache all 20 at night" — the padding happens at page load time

### 3. The Core Issue

Google's free Places API simply **will not give more than 5 reviews per place**. No amount of pagination, delays, or clever request crafting changes this. From Google's official docs:

> `reviews[]` — a JSON array of up to five reviews.

---

## Proposed Solution: Bake 20 Reviews at Cache Time

Move the merge logic **into the nightly cache script** so the static `reviews-cache.json` file always contains exactly 20 reviews.

### How it works

1. The nightly script fetches 5 reviews from Google (all it can get)
2. It merges those 5 with the 16 hardcoded fallback reviews, deduplicating by author name
3. It always writes exactly 20 reviews to `api/reviews-cache.json`
4. The HTML page simply calls `/api/reviews?newest=20` — the cache always has 20

### Changes Required

#### `api/fetch-reviews-cache.js`
- Add the 16 hardcoded fallback reviews (same data currently in `reviews/index.html` and `api/reviews.js`)
- After fetching the 5 Google reviews, merge with fallbacks:
  - Add fallbacks to fill up to 20, skipping any that match Google review author names
  - This way if Google returns a new review, it replaces the matching fallback; otherwise all 16 fallbacks fill in
- Write exactly 20 reviews to cache

#### `reviews/index.html`
- Remove the `fallbackReviewsPage` array (16 reviews) — no longer needed
- Remove the client-side padding logic (lines 175-188)
- Simplify: just `fetch('/api/reviews?newest=20')` → render
- Keep the `.catch()` fallback as a last resort (if the API endpoint itself is down)

#### `api/reviews.js`
- No changes needed — it already reads from cache and falls back to 16 hardcoded reviews if cache is missing

### Benefits
- Google API called exactly once per day (nightly)
- Cache file always contains 20 reviews
- Page load: zero API calls, zero client-side padding, 20 reviews instantly
- If Google posts new reviews, they replace matching fallbacks at next nightly run
- If Google API is down, previous day's 20-review cache is still served (5-day freshness window)