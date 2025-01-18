// components/deliveries/CreateStoreMov.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PICKUP_STORES } from "@/utils/constants";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ProductItem, ProductList } from "../ProductList";

interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
}

const FormField = ({ label, children, error }: FormFieldProps) => (
  <div className="mb-2">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

type StoreId = (typeof PICKUP_STORES)[number]["value"];

interface FormData {
  origin_store: StoreId;
  dest_store: StoreId;
  products: ProductItem[];
  scheduled_date: string;
}

export default function CreateStoreMov({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    origin_store: "cd",
    dest_store: "" as StoreId,
    products: [],
    scheduled_date: ""
  });

  const handleStoreChange =
    (type: "origin_store" | "dest_store") => (value: StoreId) => {
      setFormData((prev) => ({
        ...prev,
        [type]: value
      }));
    };

  const validateForm = (data: FormData): string | null => {
    if (!data.dest_store) return "Seleccioná un local de destino";
    if (data.origin_store === data.dest_store)
      return "Local de destino y origen no pueden ser iguales";
    if (data.products.length === 0) return "Agregá al menos un producto.";
    return null;
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
        products: formData.products.map((p) => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity
        }))
      };

      const response = await fetch("/api/deliveries/create/store-mov", {
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

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="">Movimiento entre Locales</CardTitle>
          <FormField>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduled_date: e.target.value
                }))
              }
              required
              className="w-36 -mt-2"
            />
          </FormField>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Origen">
              <Select
                value={formData.origin_store}
                onValueChange={handleStoreChange("origin_store")}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_STORES.map((store) => (
                    <SelectItem
                      key={store.value}
                      value={store.value}
                      disabled={store.value === formData.dest_store}
                    >
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Destino">
              <Select
                value={formData.dest_store}
                onValueChange={handleStoreChange("dest_store")}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_STORES.map((store) => (
                    <SelectItem
                      key={store.value}
                      value={store.value}
                      disabled={store.value === formData.origin_store}
                    >
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <ProductList
            products={formData.products}
            onChange={(products) =>
              setFormData((prev) => ({ ...prev, products }))
            }
          />
        </CardContent>
        <CardFooter className="flex justify-between mt-4">
          <Button type="button" variant="link" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
        {error && <p className="text-sm text-red-500 px-6 pb-4">{error}</p>}
      </form>
    </Card>
  );
}
