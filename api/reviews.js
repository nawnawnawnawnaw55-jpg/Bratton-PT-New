// Fallback reviews served when Google API is unreachable
const FALLBACK = [
  { name: "Gary L.", text: "Just want to thank Jena and staff for a great job in rehabbing my right rotator cuff. I had two complete tears out of the four muscles of the cuff. Jena and staff rehabbed my shoulder without a need for surgery...", time: "8 months ago", rating: 5 },
  { name: "John C.", text: "The experience has been outstanding! When I first came to Bratton Physical Therapy I had sore ankles, couldn't walk more than 50 feet, getting up from sitting was painful. Now I can easily walk 100's of yards (likely more), I have no pain...", time: "1 year ago", rating: 5 },
  { name: "Barbara K.", text: "My journey at Bratton PT began after I spent 3 days, about 6 hours a day working on a ladder moving shelving over my head remodeling my master closet. I developed pain in my neck and upper back. I chose Bratton PT because I used them in the past...", time: "1 year ago", rating: 5 },
  { name: "Nina S.", text: "Before coming I struggled picking up my son, sitting comfortably, and sleeping due to severe shoulder pain and limited neck mobility. Jena knew what the issue was immediately. She created a plan that quickly diminished my pain...", time: "2 years ago", rating: 5 },
  { name: "Stephen D.", text: "After major rotator cuff surgery, I was unable to move my arm away from my side. I was also experiencing considerable pain related to the surgery. For my physical therapy treatment, my Surgeon recommended Jena Bratton, PT...", time: "3 years ago", rating: 5 },
  { name: "James S.", text: "My journey has been one of great pain and great rewards. Many years ago my knees began failing and I was not successful with gym workouts helping the problem. It took quite a while in obtaining surgical approval to have my knees replaced...", time: "3 years ago", rating: 5 },
  { name: "Paul R.", text: "Undergoing PT for total hip replacement. The treatment is awesome. I get a custom PT plan focused on my needs and progress. I am so happy I came to Bratton.", time: "9 months ago", rating: 5 },
  { name: "Jeannie R.", text: "You cannot go wrong having your pains disappear at Bratton PT! Individual attention, explanation of each procedure before it is executed! They make it fun!", time: "10 months ago", rating: 5 }
];

function serveFallback(showAll, newest, res) {
  const sorted = [...FALLBACK].sort((a, b) => (b.time||'').localeCompare(a.time||''));
  let reviews;
  if (newest && newest > 0) {
    reviews = sorted.slice(0, newest);
  } else if (showAll) {
    reviews = sorted;
  } else {
    reviews = sorted.slice(0, 5);
  }
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.json({ reviews, overall_rating: 5.0, total_reviews: 8, _fallback: true });
}

export default async function handler(req, res) {
  const PLACE_ID = 'ChIJicdBse3mnYgRyU49RjVmRs0';
  const API_KEY = process.env.GOOGLE_API_KEY;
  
  const showAll = req.query && req.query.all === '1';
  const newest = req.query && req.query.newest ? parseInt(req.query.newest, 10) : 0;
  
  if (!API_KEY) {
    return serveFallback(showAll, newest, res);
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${API_KEY}&language=en`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error_message) {
      return serveFallback(showAll, newest, res);
    }
    
    if (!data.result || !data.result.reviews) {
      return serveFallback(showAll, newest, res);
    }
    
    const allReviews = data.result.reviews.map(r => ({
      name: r.author_name,
      text: (r.text || '').replace(/[â-â¿¿]/g, '').replace(/\s+/g, ' ').trim(),
      time: r.relative_time_description,
      rating: r.rating,
      photo: r.profile_photo_url || null
    }));
    
    const overallRating = data.result.rating || 5.0;
    const totalReviews = data.result.user_ratings_total || allReviews.length;
    
    let reviews;
    if (newest && newest > 0) {
      reviews = allReviews.sort((a, b) => (b.time||'').localeCompare(a.time||'')).slice(0, newest);
    } else if (showAll) {
      reviews = allReviews.sort((a, b) => (b.time||'').localeCompare(a.time||''));
    } else {
      reviews = allReviews.filter(r => r.rating === 5).sort((a, b) => (b.time||'').localeCompare(a.time||'')).slice(0, 5);
    }
    
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.json({ reviews, overall_rating: overallRating, total_reviews: totalReviews });
  } catch (e) {
    serveFallback(showAll, newest, res);
  }
}
