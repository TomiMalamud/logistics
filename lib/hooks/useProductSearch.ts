// hooks/useProductSearch.ts
import { useState, useEffect } from 'react';
import { Product } from '@/types/api';

export const useProductSearch = (debouncedSearch: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchProducts() {
      if (!debouncedSearch || debouncedSearch.length < 4) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/search-products?query=${encodeURIComponent(debouncedSearch)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error buscando productos');
        }

        const data = await response.json();
        setProducts(data.Items || []);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching products:', err);
        setError(err.message || 'Error al buscar productos. Por favor intente nuevamente.');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, [debouncedSearch]);

  return { products, isLoading, error };
};