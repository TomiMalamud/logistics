// pages/price-checker/index.tsx
import Layout from "@/components/Layout";
import { ProductCard } from "@/components/price-checker/ProductCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/lib/hooks/useProducts";
import { Calculator } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

export default function PriceChecker() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 1000);
  const {
    data: productsData,
    isLoading,
    isError,
    error
  } = useProducts(debouncedSearch);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <Layout title="Precios">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-x-2 mb-6">
          <Input
            ref={inputRef}
            type="search"
            placeholder="Buscá por SKU o nombre. Mínimo 4 caracteres"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sw-full bg-white"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <Button variant="outline" asChild>
            <Link href="/price-checker/calculator">
              <Calculator />
            </Link>
          </Button>
        </div>

        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Error fetching products"}
            </AlertDescription>
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

        {!isLoading &&
          productsData?.Items.length === 0 &&
          debouncedSearch.length >= 4 && (
            <Alert className="mb-4">
              <AlertDescription>
                No se encontraron productos para: {debouncedSearch}
              </AlertDescription>
            </Alert>
          )}

        {!isLoading &&
          productsData?.Items.map((product) => (
            <ProductCard key={product.Id} product={product} />
          ))}
      </div>
    </Layout>
  );
}
