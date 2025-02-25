// useCarriers.ts
import { useState } from "react";

interface Carrier {
  id: number;
  name: string;
}

export function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchCarriers = async () => {
    // Allow refetching even if initialized when explicitly called
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/carriers");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCarriers(data);
      setIsInitialized(true);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      setError("Error al cargar transportes");
      setCarriers([]);
      // Reset initialized state to allow retrying
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { carriers, isLoading, error, fetchCarriers };
}
