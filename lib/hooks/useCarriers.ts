import { useState, useEffect } from 'react';

interface Carrier {
  id: number;
  name: string;
}

export function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCarriers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/carriers');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCarriers(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching carriers:', error);
        setError('Error al cargar transportes');
        setCarriers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarriers();
  }, []);

  return { carriers, isLoading, error };
}