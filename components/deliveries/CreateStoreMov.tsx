// components/deliveries/CreateStoreMov.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STORES } from "@/lib/utils/constants";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ProductItem, ProductList } from "../ProductList";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Database } from "@/supabase/types/supabase";

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

type Store = Database["public"]["Enums"]["store"];

interface StoreMovFormValues {
  origin_store: Store;
  dest_store: Store;
  products: ProductItem[];
  scheduled_date: string;
}

const storeMovFormSchema = z
  .object({
    origin_store: z.enum(["60835", "24471", "31312", "70749"] as const, {
      required_error: "Seleccioná un local de origen",
    }),
    dest_store: z.enum(["60835", "24471", "31312", "70749"] as const, {
      required_error: "Seleccioná un local de destino",
    }),
    products: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          sku: z.string().min(1),
          quantity: z.number().min(1),
        })
      )
      .min(1, "Agregá al menos un producto"),
    scheduled_date: z.string({
      required_error: "La fecha es requerida",
    }),
  })
  .refine((data) => data.origin_store !== data.dest_store, {
    message: "Local de destino y origen no pueden ser iguales",
    path: ["dest_store"],
  });

export default function CreateStoreMov({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<ProductItem | null>(
    null
  );

  const form = useForm<StoreMovFormValues>({
    resolver: zodResolver(storeMovFormSchema),
    defaultValues: {
      origin_store: "60835",
      dest_store: "60835" as Store,
      products: [],
      scheduled_date: "",
    },
  });

  const handleSubmit = async (values: StoreMovFormValues) => {
    if (currentProduct?.id) {
      setError(
        "Tenés un producto seleccionado sin agregar a la lista. Hacé click en 'Agregar' o limpiá la selección."
      );
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...values,
        type: "store_movement" as const,
        created_by: user.id,
        products: values.products.map((p) => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
        })),
      };

      const response = await fetch("/api/deliveries/create/store-mov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    <Card className="mx-auto w-full">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="">Movimiento entre Locales</CardTitle>
          <FormField>
            <Input
              type="date"
              {...form.register("scheduled_date")}
              required
              className="w-36 -mt-2"
            />
            {form.formState.errors.scheduled_date && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.scheduled_date.message}
              </p>
            )}
          </FormField>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Origen">
              <Select
                value={form.watch("origin_store")}
                onValueChange={(value: Store) =>
                  form.setValue("origin_store", value)
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id as Store}
                      disabled={store.id === form.watch("dest_store")}
                    >
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.origin_store && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.origin_store.message}
                </p>
              )}
            </FormField>
            <FormField label="Destino">
              <Select
                value={form.watch("dest_store")}
                onValueChange={(value: Store) =>
                  form.setValue("dest_store", value)
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id as Store}
                      disabled={store.id === form.watch("origin_store")}
                    >
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.dest_store && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.dest_store.message}
                </p>
              )}
            </FormField>
          </div>

          <ProductList
            products={form.watch("products")}
            onChange={(products) => form.setValue("products", products)}
            onCurrentProductChange={setCurrentProduct}
          />
          {form.formState.errors.products && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.products.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between mt-4">
          <Button type="button" variant="link" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading || form.formState.isSubmitting}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
        {error && <p className="text-sm text-red-500 px-6 pb-4">{error}</p>}
      </form>
    </Card>
  );
}
