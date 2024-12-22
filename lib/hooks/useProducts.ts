import { useQuery } from '@tanstack/react-query';
import { SearchProductsResponse, APIError } from '@/lib/api';

const PRODUCTS_CACHE_KEY = 'products';

async function fetchProducts(query: string): Promise<SearchProductsResponse> {
  if (!query || query.length < 4) {
    return { Items: [], TotalItems: 0, TotalPage: 0 };
  }

  const response = await fetch(`/api/search-products?query=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new APIError(error.message || 'Failed to fetch products', response.status);
  }

  return response.json();
}

export function useProducts(query: string) {
  return useQuery({
    queryKey: [PRODUCTS_CACHE_KEY, query],
    queryFn: () => fetchProducts(query),
    enabled: query.length >= 4,
    select: (data) => ({
      ...data,
      Items: data.Items.filter(product => 
        product.Estado === 'Activo' && product.PrecioFinal >0 && product.Nombre !== '-'
      )
    }),
  });
}
