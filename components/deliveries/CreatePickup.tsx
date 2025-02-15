import { ProductList, type ProductItem } from "@/components/ProductList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Database } from "@/supabase/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import { Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type DeliveryType = Database["public"]["Enums"]["delivery_type"];

interface Props {
  user: User;
}

interface PickupFormValues {
  supplier_id: number;
  products: ProductItem[];
  scheduled_date?: string;
  type: DeliveryType;
}

const pickupFormSchema = z.object({
  supplier_id: z.number({
    required_error: "Seleccioná un proveedor",
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
  scheduled_date: z.string().optional(),
  type: z
    .enum(["supplier_pickup", "home_delivery", "store_movement"] as const)
    .default("supplier_pickup"),
});

function FormField({
  label,
  children,
  error,
}: {
  label?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default function CreatePickup({ user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [isLoadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<ProductItem | null>(
    null
  );

  const form = useForm<PickupFormValues>({
    resolver: zodResolver(pickupFormSchema),
    defaultValues: {
      supplier_id: undefined,
      products: [],
      scheduled_date: new Date().toISOString().split("T")[0],
      type: "supplier_pickup",
    },
  });

  React.useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        setError(null);
        const response = await fetch("/api/suppliers");

        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }

        const data = await response.json();
        setSuppliers(data || []);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setError("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSubmit = async (values: PickupFormValues) => {
    if (currentProduct?.id) {
      setError(
        "Tenés un producto seleccionado sin agregar a la lista. Hacé click en 'Agregar' o limpiá la selección."
      );
      return;
    }

    setLoading(true);
    try {
      const productsFormatted = values.products.map((product) => ({
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
      }));

      const body = {
        ...values,
        products: productsFormatted,
        type: "supplier_pickup",
        created_by: user.id,
      };

      const response = await fetch("/api/deliveries/create/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create delivery");
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
    <Card className="mx-auto w-full md:w-[540px]">
      <CardHeader>
        <CardTitle>Nuevo Retiro de Proveedor</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent>
          <div className="max-w-xl space-y-4">
            <FormField label="Proveedor *">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                    disabled={isLoadingSuppliers}
                    type="button"
                  >
                    {form.watch("supplier_id")
                      ? suppliers.find(
                          (supplier) =>
                            supplier.id === form.watch("supplier_id")
                        )?.name
                      : isLoadingSuppliers
                      ? "Cargando proveedores..."
                      : "Seleccioná un Proveedor"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar proveedor..." />
                    <CommandList>
                      {isLoadingSuppliers ? (
                        <CommandItem disabled>
                          Cargando proveedores...
                        </CommandItem>
                      ) : error ? (
                        <CommandItem disabled>Error: {error}</CommandItem>
                      ) : (
                        <>
                          <CommandEmpty>
                            No se encontraron proveedores.
                          </CommandEmpty>
                          <CommandGroup>
                            {suppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.name}
                                onSelect={() => {
                                  form.setValue("supplier_id", supplier.id);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("supplier_id") === supplier.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {supplier.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.supplier_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.supplier_id.message}
                </p>
              )}
            </FormField>

            <FormField>
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
            </FormField>

            <FormField label="Fecha de retiro">
              <Input type="date" {...form.register("scheduled_date")} />
              {form.formState.errors.scheduled_date && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.scheduled_date.message}
                </p>
              )}
            </FormField>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
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
