import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatLongDate } from "@/lib/utils/format";
import { createClient } from "@/lib/utils/supabase/component";
import { DeliveryItem } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addBusinessDays } from "date-fns";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Delivery {
  id: number;
  invoice_number: string;
  customers: {
    name: string;
  };
  order_date: string;
}

interface Props {
  user: {
    id: string;
  };
  onSuccess?: () => void;
}

const supabase = createClient();

// Form schema
const formSchema = z.object({
  deliveryId: z.string(),
  productSku: z.string().min(1, "Product is required"),
  extraProductSku: z.string().optional(),
  needsPackaging: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Fetch delivery items
const useDeliveryItems = (deliveryId: string) => {
  return useQuery({
    queryKey: ["delivery-items", deliveryId],
    queryFn: async () => {
      if (!deliveryId) return null;
      const { data, error } = await supabase
        .from("delivery_items")
        .select(
          `
                    *,
                    products (
                        name
                    )
                `
        )
        .eq("delivery_id", deliveryId);

      if (error) throw error;
      return data as DeliveryItem[];
    },
    enabled: !!deliveryId,
  });
};

// Fetch deliveries for select
const useDeliveries = () => {
  return useQuery<Delivery[]>({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(
          `
            id,
            invoice_number,
            customers (
                name
            ),
            order_date
          `
        )
        .order("order_date", { ascending: false })
        .eq("state", "pending")
        .eq("type", "home_delivery");

      if (error) throw error;
      return data as unknown as Delivery[];
    },
  });
};

export function CreateOrderForm({ user, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      needsPackaging: false,
    },
  });

  const { data: deliveries, isLoading: isLoadingDeliveries } = useDeliveries();
  const { data: deliveryItems, isLoading: isLoadingItems } = useDeliveryItems(
    form.watch("deliveryId")
  );

  const deliveryId = form.watch("deliveryId");

  // Add this effect to watch productSku changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "productSku") {
        form.setValue("extraProductSku", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const createOrder = useMutation({
    mutationFn: async (values: FormValues) => {
      const selectedDelivery = deliveries?.find(
        (d) => d.id.toString() === values.deliveryId
      );
      if (!selectedDelivery) throw new Error("Delivery not found");

      const response = await fetch("/api/manufacturing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_id: parseInt(values.deliveryId),
          product_name:
            deliveryItems?.find(
              (item) => item.product_sku === values.productSku
            )?.products?.name || "",
          extras: values.extraProductSku
            ? deliveryItems?.find(
                (item) => item.product_sku === values.extraProductSku
              )?.products?.name || ""
            : null,
          needs_packaging: values.needsPackaging,
          notes: values.notes,
          created_by: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create manufacturing order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
      form.reset();
      onSuccess?.();
    },
  });

  const onSubmit = (values: FormValues) => {
    createOrder.mutate(values);
  };

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDeliveries = React.useMemo(() => {
    if (!deliveries) return [];
    return deliveries.filter((delivery) => {
      const searchTerm = search.toLowerCase();
      return (
        delivery.customers?.name.toLowerCase().includes(searchTerm) ||
        delivery.invoice_number?.toLowerCase().includes(searchTerm)
      );
    });
  }, [deliveries, search]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-96">
        <div className="grid grid-cols-[2fr,1fr] gap-4">
          <FormField
            control={form.control}
            name="deliveryId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Venta</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                        disabled={isLoadingDeliveries}
                      >
                        {field.value
                          ? deliveries?.find(
                              (delivery) =>
                                delivery.id.toString() === field.value
                            )?.customers.name
                          : "Seleccionar una venta"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <div className="flex items-center border-b px-3">
                        <CommandInput
                          placeholder="Buscar venta..."
                          value={search}
                          onValueChange={setSearch}
                        />
                      </div>
                      <CommandList>
                        <CommandEmpty>No se encontraron ventas.</CommandEmpty>
                        {isLoadingDeliveries ? (
                          <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando ventas...
                          </div>
                        ) : (
                          <CommandGroup>
                            {filteredDeliveries.map((delivery) => (
                              <CommandItem
                                key={delivery.id}
                                value={`${delivery.customers?.name} ${delivery.invoice_number}`}
                                onSelect={() => {
                                  field.onChange(delivery.id.toString());
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === delivery.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {delivery.customers.name} -{" "}
                                {delivery.invoice_number}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {deliveryItems && (
            <div className="flex items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Entrega estimada
                <p className="font-semibold">
                  {formatLongDate(
                    addBusinessDays(new Date(), 15).toISOString()
                  )}
                </p>
              </p>
            </div>
          )}
        </div>

        {deliveryItems && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar un producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deliveryItems?.map((item) => (
                          <SelectItem
                            key={item.product_sku}
                            value={item.product_sku}
                          >
                            {item.quantity} - {item.products?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="extraProductSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto Extra</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.getValues("productSku")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar un extra (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deliveryItems?.map((item) => (
                          <SelectItem
                            key={item.product_sku}
                            value={item.product_sku}
                            disabled={
                              item.product_sku === form.getValues("productSku")
                            }
                          >
                            {item.quantity} - {item.products?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="needsPackaging"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Embalaje</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button
          type="submit"
          disabled={createOrder.isPending}
          className="w-full"
        >
          {createOrder.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Crear Pedido
        </Button>
      </form>
    </Form>
  );
}
