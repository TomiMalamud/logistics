import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import CostCarrierForm, { isDeliveryCostValid } from "@/components/CostCarrierForm";
import { ProductList, type ProductItem } from "@/components/ProductList";

interface Props {
  user: User;
}

interface FormData {
  products: ProductItem[];
  supplier_id: number | null;
  scheduled_date?: string;
  delivery_cost?: number;
  carrier_id?: number;
}

function FormField({
  label,
  children,
  error
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
  const [formData, setFormData] = useState<FormData>({
    products: [],
    supplier_id: null,
    scheduled_date: new Date().toISOString().split("T")[0]
  });
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costError, setCostError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoadingSuppliers(true);
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
        setIsLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      setError("Please select a supplier.");
      return;
    }

    if (formData.products.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    setLoading(true);
    try {
      const productsFormatted = formData.products.map(product => ({
        name: `${product.name} (${product.sku})`,
        quantity: product.quantity
      }));

      const body = {
        ...formData,
        products: productsFormatted,
        type: "supplier_pickup",
        created_by: user.id
      };

      const response = await fetch("/api/create-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create delivery");
      }

      await router.push("/");
    } catch (error) {
      console.error("Submit error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleProductsChange = (products: ProductItem[]) => {
    setFormData(prev => ({ ...prev, products }));
  };

  const handleCostChange = (cost: string) => {
    if (cost && !isDeliveryCostValid(cost)) {
      setCostError("El costo debe ser un número válido mayor o igual a 0");
      return;
    }
    setCostError(null);
    setFormData(prev => ({
      ...prev,
      delivery_cost: cost ? parseInt(cost) : undefined
    }));
  };

  const handleCarrierChange = (carrierId: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      carrier_id: carrierId
    }));
  };

  return (
    <Card className="w-full md:w-[540px]">
      <CardHeader>
        <CardTitle>Nuevo Retiro de Proveedor</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
                    {formData.supplier_id
                      ? suppliers.find(supplier => supplier.id === formData.supplier_id)?.name
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
                        <CommandItem disabled>Cargando proveedores...</CommandItem>
                      ) : error ? (
                        <CommandItem disabled>Error: {error}</CommandItem>
                      ) : (
                        <>
                          <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                          <CommandGroup>
                            {suppliers.map(supplier => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.name}
                                onSelect={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    supplier_id: supplier.id
                                  }));
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.supplier_id === supplier.id
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
            </FormField>

            <FormField>
              <ProductList 
                products={formData.products}
                onChange={handleProductsChange}
              />
            </FormField>

            <FormField label="Fecha de retiro">
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    scheduled_date: e.target.value
                  }))
                }
              />
            </FormField>
            
            <FormField error={costError}>
              <CostCarrierForm
                initialDeliveryCost={formData.delivery_cost}
                initialCarrierId={formData.carrier_id}
                onCarrierChange={handleCarrierChange}
                onCostChange={handleCostChange}
                className="pt-2"
              />
            </FormField>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="link" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !!costError || formData.products.length === 0}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
        {error && <p className="text-sm text-red-500 px-6 pb-4">{error}</p>}
      </form>
    </Card>
  );
}