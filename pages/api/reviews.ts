// pages/api/reviews.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const placeId = process.env.PLACE_ID;
    const apiKey = process.env.GOOGLE_API_KEY;
  
    if (!placeId || !apiKey) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        details: {
            missingPlaceId: !placeId,
            missingApiKey: !apiKey
        }
      });
    }
  
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
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
      console.error('Google Places API Error:', error);
      res.status(500).json({ error: error.message });
    }
}