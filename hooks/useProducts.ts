import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/utils/supabase/component';
import { Product } from '@/types/types';
import { Concepto } from '@/types/api';

const supabase = createClient();

interface UseProductsProps {
  query: string;
  includeERP?: boolean;
}

async function searchLocalProducts(query: string): Promise<Product[]> {
  if (query.length < 3) return [];
  
  const { data, error } = await supabase
    .from('products')
    .select('sku, name')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .order('name')
    .limit(10);

  if (error) throw error;
  return data;
}

async function searchERPProducts(query: string): Promise<Concepto[]> {
  if (query.length < 4) return [];
  
  const response = await fetch(`/api/search-products?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to fetch ERP products');
  
  const data = await response.json();
  return data.Items;
}

async function saveProductToLocal(product: Concepto): Promise<void> {
  const { error } = await supabase
    .from('products')
    .upsert({
      sku: product.Codigo,
      name: product.Nombre
    });

  if (error) throw error;
}

export function useProducts({ query, includeERP = false }: UseProductsProps) {
  return useQuery({
    queryKey: ['products', query, includeERP],
    queryFn: async () => {
      const localProducts = await searchLocalProducts(query);
      
      if (!includeERP) {
        return { local: localProducts, erp: [] };
      }

      const erpProducts = await searchERPProducts(query);
      
      // Save ERP products to local DB
      await Promise.all(
        erpProducts.map(product => saveProductToLocal(product))
      );

      return {
        local: localProducts,
        erp: erpProducts
      };
    },
    enabled: query.length >= 3
  });
}
