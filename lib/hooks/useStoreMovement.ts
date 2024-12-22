// lib/hooks/useStoreMovement.ts
import { useState } from "react";
import { useRouter } from "next/router";
import { User } from "@supabase/supabase-js";
import { useDebouncedCallback } from "use-debounce";
import { useProducts } from "./useProducts";
import { titleCase } from "title-case";

export const stores = [
  { id: "cd", name: "CD" },
  { id: "9dejulio", name: "9 de Julio" },
  { id: "carcano", name: "Cárcano" }
] as const;

export type Store = (typeof stores)[number];
export type StoreId = Store["id"];

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

interface FormData {
  origin_store: StoreId;
  destination_store: StoreId;
  products: ProductItem[];
  scheduled_date?: string;
}

export const useStoreMovement = (user: User) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data: productsData, isLoading: isLoadingProducts } =
    useProducts(searchQuery);

  const debouncedSearch = useDebouncedCallback(
    (value: string) => setSearchQuery(value),
    500
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const [currentProduct, setCurrentProduct] = useState<ProductItem>({
    id: "",
    code: "",
    name: "",
    quantity: 1
  });

  const [formData, setFormData] = useState<FormData>({
    origin_store: "cd",
    destination_store: "" as StoreId,
    products: [],
    scheduled_date: new Date().toISOString().split("T")[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (data: FormData): string | null => {
    if (!data.destination_store) return "Seleccioná un local de destino";
    if (data.origin_store === data.destination_store)
      return "Local de destino y origen no pueden ser iguales";
    if (data.products.length === 0) return "Agregá al menos un producto.";
    return null;
  };
  
  const handleProductSelect = (product: any) => {
    setCurrentProduct((prev) => ({
      ...prev,
      id: product.Id,
      code: product.Codigo,
      name: titleCase(product.Nombre.toLowerCase())
    }))
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...formData,
        type: "store_movement",
        created_by: user.id,
        products: formData.products
          .map((p) => `${p.name} (${p.code}) x${p.quantity}`)
          .join(", ")
      };

      const response = await fetch("/api/create-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error.");
      }

      await router.push("/");
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    currentProduct,
    setCurrentProduct,
    loading,
    error,
    search,
    setSearch,
    handleSearch,
    handleProductSelect,
    open,
    setOpen,
    handleSubmit,
    productsData,
    isLoadingProducts
  };
};
