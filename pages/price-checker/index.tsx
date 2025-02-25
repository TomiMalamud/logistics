import Layout from "@/components/Layout";
import HelpDialog from "@/components/price-checker/HelpDialog";
import { ProductCard } from "@/components/price-checker/ProductCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import { Calculator, Info, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function PriceChecker() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [queryTerm, setQueryTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useProducts({
    query: queryTerm,
    includeERP: true,
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initialize search from URL query parameter
  useEffect(() => {
    const { q } = router.query;
    if (typeof q === "string") {
      setSearch(q);
      setQueryTerm(q);
    }
  }, [router.query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (search.length >= 2) {
      setQueryTerm(search);
      // Update URL with search term
      router.push(
        {
          pathname: router.pathname,
          query: { q: search },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  return (
    <Layout title="Precios">
      <div className="max-w-2xl mx-auto">
        <HelpDialog />
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-x-2 mb-6 mt-2"
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="search"
              placeholder="Buscá por SKU o nombre. Mínimo 2 caracteres"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white pr-10"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="search"
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              disabled={search.length < 2}
              title="Buscar"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" asChild>
            <Link href="/price-checker/calculator">
              <Calculator />
            </Link>
          </Button>
        </form>

        {search.length < 2 && queryTerm === "" && (
          <Alert>
            <AlertDescription>
              Ingresá al menos 2 caracteres y presioná Enter para buscar
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Error al buscar productos"}
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

        {!isLoading && data?.erp.length === 0 && queryTerm.length >= 2 && (
          <Alert className="mb-4">
            <AlertDescription>
              No se encontraron productos para: {queryTerm}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading &&
          data?.erp.map((product) => (
            <ProductCard key={product.Codigo} product={product} />
          ))}
        {data && (
          <Alert className="bg-blue-50">
            <AlertTitle className="flex items-center gap-x-2 mb-2">
              <Info size={16} color="#222" /> ¿No encontraste el producto?
            </AlertTitle>
            <AlertDescription className="text-stone-800">
              Probá con otra referencia o siendo más específico. Ejemplo: Si
              buscás el President de 190x140x28, buscá &quot;190x140x28&quot;
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  );
}
