// Single source of truth for the 16 curated fallback reviews.
// Used by:
//   - api/reviews.js           (last-resort serving if cache AND live API both fail)
//   - api/fetch-reviews-cache.js (fills remaining slots up to 20 alongside live Google reviews)
//
// Previously this exact list was duplicated in api/reviews.js AND reviews/index.html,
// which let the two copies drift out of sync. Now there's just this one file.

export const FALLBACK = [
  { name: "Gary L.", text: "Just want to thank Jena and staff for a great job in rehabbing my right rotator cuff. I had two complete tears out of the four muscles of the cuff. Jena and staff rehabbed my shoulder without a need for surgery...", time: "8 months ago", rating: 5 },
  { name: "John C.", text: "The experience has been outstanding! When I first came to Bratton Physical Therapy I had sore ankles, couldn't walk more than 50 feet, getting up from sitting was painful. Now I can easily walk 100's of yards (likely more), I have no pain...", time: "1 year ago", rating: 5 },
  { name: "Barbara K.", text: "My journey at Bratton PT began after I spent 3 days, about 6 hours a day working on a ladder moving shelving over my head remodeling my master closet. I developed pain in my neck and upper back. I chose Bratton PT because I used them in the past...", time: "1 year ago", rating: 5 },
  { name: "Nina S.", text: "Before coming I struggled picking up my son, sitting comfortably, and sleeping due to severe shoulder pain and limited neck mobility. Jena knew what the issue was immediately. She created a plan that quickly diminished my pain...", time: "2 years ago", rating: 5 },
  { name: "Stephen D.", text: "After major rotator cuff surgery, I was unable to move my arm away from my side. I was also experiencing considerable pain related to the surgery. For my physical therapy treatment, my Surgeon recommended Jena Bratton, PT...", time: "3 years ago", rating: 5 },
  { name: "James S.", text: "My journey has been one of great pain and great rewards. Many years ago my knees began failing and I was not successful with gym workouts helping the problem. It took quite a while in obtaining surgical approval to have my knees replaced...", time: "3 years ago", rating: 5 },
  { name: "Paul R.", text: "Undergoing PT for total hip replacement. The treatment is awesome. I get a custom PT plan focused on my needs and progress. I am so happy I came to Bratton.", time: "9 months ago", rating: 5 },
  { name: "Jeannie R.", text: "You cannot go wrong having your pains disappear at Bratton PT! Individual attention, explanation of each procedure before it is executed! They make it fun!", time: "10 months ago", rating: 5 },
  { name: "Nathan W.", text: "I came to seek relief from my Achilles tendon pain and very quickly they worked with me to make a targeted plan to reduce pain long term. Excellent experience.", time: "7 months ago", rating: 5 },
  { name: "Susan B.", text: "I had trouble with my right knee. It felt stiff, sore and achy. I tried Bratton Therapy Centre and it was the best decision ever. They came up with a special exercise program just for me.", time: "6 months ago", rating: 5 },
  { name: "Don N.", text: "When I came to Bratton for a very weak right shoulder, I was becoming one arm person. After 6 weeks of physical therapy I now have full extension and much less pain. My sleep at night has improved as well.", time: "6 months ago", rating: 5 },
  { name: "Alfred J.", text: "The staff is very professional. All guide your routine with caution and care. I began recovery after my first visit. I know my recovery is in good hands. Give them a call!", time: "5 months ago", rating: 5 },
  { name: "Duran H.", text: "Extremely friendly staff. They know what they are doing here. I would recommend this place to anyone. Already feeling results after a couple of weeks.", time: "4 months ago", rating: 5 },
  { name: "Nicholas B.", text: "My back pain was making day-to-day life absolutely miserable, but coming to see Ms. Jena and her amazing staff has been a total game-changer. I have significantly less pain and more flexibility.", time: "3 months ago", rating: 5 },
  { name: "Paul Rieder", text: "Undergoing PT for total hip replacement. The treatment is awesome. I get a custom PT plan focused on my needs and progress. I am so happy that I came to Bratton.", time: "2 months ago", rating: 5 },
  { name: "Jeannie Rivers", text: "You cannot go wrong by having your pains disappear when going to Bratton Physical Therapy! Individual attention, explanation of each procedure before it is executed! They make it fun!", time: "1 month ago", rating: 5 }
];

// Normalizes a name to "firstname|lastinitial" so we can detect when a live
// Google review and a curated fallback both belong to the same person, even
// though they're formatted differently (e.g. "Susan Behrens" vs "Susan B.").
export function nameKey(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0].toLowerCase().replace(/[^a-z]/g, '');
  const lastToken = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
  const lastInitial = lastToken.charAt(0);
  return first + '|' + lastInitial;
}