import React, { useState, useEffect } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MAX_REVIEWS = 5;

const GoogleReviewsWidget = () => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const fetchReviews = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem('googleReviews');
        if (cachedData) {
          const { reviews, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setReviews(reviews);
            setLoading(false);
            return;
          }
        }

        // Fetch from our API route
        const response = await fetch('/api/reviews');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch reviews');
        }

        const data = await response.json();
        const fetchedReviews = data.result.reviews || [];
        const limitedReviews = fetchedReviews.slice(0, MAX_REVIEWS);

        // Cache the results
        localStorage.setItem('googleReviews', JSON.stringify({
          reviews: limitedReviews,
          timestamp: Date.now()
        }));

        setReviews(limitedReviews);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err.message || 'Failed to load reviews');
        setLoading(false);

        // Fallback to cached data if available
        const cachedData = localStorage.getItem('googleReviews');
        if (cachedData) {
          const { reviews } = JSON.parse(cachedData);
          setReviews(reviews);
          setError('Using cached data - Failed to fetch latest reviews');
        }
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading reviews...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Google Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={review.profile_photo_url || "/api/placeholder/40/40"}
                  alt={review.author_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-semibold">{review.author_name}</div>
                  <div className="text-sm text-gray-500">
                    {review.relative_time_description}
                  </div>
                </div>
              </div>
              <div className="flex mb-2">{renderStars(review.rating)}</div>
              <p className="text-gray-700">{review.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleReviewsWidget;