// pages/price-checker/index.tsx
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import type { Product } from "@/types/api";

export default function PriceChecker() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      if (!debouncedSearch || debouncedSearch.length < 4) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/search-products?query=${encodeURIComponent(debouncedSearch)}`,
          {
            signal: controller.signal
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Error buscando productos");
        }
        
        const data = await response.json();
        setProducts(data.Items || []);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        
        console.error("Error fetching products:", err);
        setError(err.message || "Error al buscar productos. Por favor intente nuevamente.");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Buscador de Precios</h1>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Input
            type="search"
            placeholder="Buscá por SKU o nombre. Mínimo 4 caracteres"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-6 bg-white"
          />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && products.length === 0 && debouncedSearch && debouncedSearch.length >= 4 && (
            <Alert className="mb-4">
              <AlertDescription>
                No se encontraron productos para {debouncedSearch}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && products.map((product) => (
            <Card key={product.id} className="p-4 mb-4 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{product.Nombre}</h3>
                  <span className="text-sm text-gray-500 ml-2">{product.Codigo}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-green-600">
                    $ {product.PrecioFinal.toLocaleString("es-AR")}
                  </span>
                  <span 
                    className={`font-medium px-2 py-1 rounded-full text-xs ${
                      product.Stock > 0 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.Stock > 0 ? "En Stock" : "Sin Stock"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}