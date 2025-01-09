// pages/api/reviews.js
export default async function handler(req, res) {
    const placeId = process.env.NEXT_PUBLIC_PLACE_ID;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  
    if (!placeId || !apiKey) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }
  
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
  
      const data = await response.json();
  
      if (data.error_message) {
        throw new Error(data.error_message);
      }
  
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }