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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatLongDate } from "@/lib/utils/format";
import { createClient } from "@/lib/utils/supabase/component";
import { DeliveryItem } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addBusinessDays } from "date-fns";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
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

interface CreateOrderRequest {
  delivery_id?: number;
  product_name: string;
  product_sku?: string;
  extra_product_sku?: string | null;
  extras: string | null;
  needs_packaging: boolean;
  notes: string | null;
  created_by: string;
  is_custom_order?: boolean;
  price?: number;
}

interface Props {
  user: {
    id: string;
  };
  onSuccess?: () => void;
  defaultDeliveryId?: string;
}

const supabase = createClient();

// Form schema
const formSchema = z
  .object({
    deliveryId: z.string().optional(),
    productSku: z.string().optional(),
    extraProductSku: z.string().optional(),
    needsPackaging: z.boolean(),
    notes: z.string().optional(),
    isCustomOrder: z.boolean().default(false),
    customProductName: z.string().optional(),
    customPrice: z.number().optional(),
  })
  .refine((data) => {
    // Require either deliveryId + productSku OR isCustomOrder + customProductName + customPrice
    if (data.isCustomOrder) {
      return (
        !!data.customProductName &&
        data.customPrice !== undefined &&
        data.customPrice > 0
      );
    }
    return !!data.deliveryId && !!data.productSku;
  }, "Completa los campos requeridos");

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

export function CreateOrderForm({ user, onSuccess, defaultDeliveryId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      needsPackaging: false,
      deliveryId: defaultDeliveryId,
    },
  });

  // Open dialog if defaultDeliveryId is provided
  React.useEffect(() => {
    if (defaultDeliveryId) {
      setDialogOpen(true);
    }
  }, [defaultDeliveryId]);

  const { data: deliveries, isLoading: isLoadingDeliveries } = useDeliveries();
  const { data: deliveryItems, isLoading: isLoadingItems } = useDeliveryItems(
    form.watch("deliveryId")
  );

  // Add this effect to watch productSku changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "productSku") {
        form.setValue("extraProductSku", "");
      }
      if (name === "isCustomOrder") {
        // Reset delivery-related fields when switching to custom order
        form.setValue("deliveryId", "");
        form.setValue("productSku", "");
        form.setValue("extraProductSku", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const createOrder = useMutation({
    mutationFn: async (values: CreateOrderRequest) => {
      const response = await fetch("/api/manufacturing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.issues) {
          // Set form errors for each validation issue
          data.issues.forEach((issue: { field: string; message: string }) => {
            form.setError(issue.field as any, {
              type: "server",
              message: issue.message,
            });
          });

          toast({
            title: "Error de validación",
            description: "Por favor revisa los campos marcados en rojo",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Hubo un error al crear el pedido",
            variant: "destructive",
          });
        }
        throw new Error(data.error || "Failed to create manufacturing order");
      }

      if (data.price) {
        toast({
          title: "Pedido creado",
          description: `Costo del pedido: ${new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
          }).format(data.price)}`,
        });
      } else {
        toast({
          title: "Pedido creado",
          description: "No se pudo obtener el costo del pedido",
          variant: "destructive",
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["manufacturer-balance"] });
      form.reset();
      setDialogOpen(false);
      onSuccess?.();
    },
    onError: () => {
      // Keep the dialog open when there are errors
      setDialogOpen(true);
    },
  });

  const onSubmit = (values: FormValues) => {
    createOrder.mutate({
      delivery_id: values.isCustomOrder
        ? undefined
        : parseInt(values.deliveryId || "0"),
      product_name: values.isCustomOrder
        ? values.customProductName || ""
        : (
            deliveryItems?.find(
              (item) => item.product_sku === values.productSku
            )?.products?.name || ""
          )
            .replace("CAMA CON CAJONES ", "")
            .trim(),
      product_sku: values.isCustomOrder ? undefined : values.productSku,
      extra_product_sku: values.isCustomOrder
        ? undefined
        : values.extraProductSku,
      extras: values.isCustomOrder
        ? null
        : (
            deliveryItems?.find(
              (item) => item.product_sku === values.extraProductSku
            )?.products?.name || ""
          )
            .replace("CAMA CON CAJONES ", "")
            .trim(),
      needs_packaging: values.needsPackaging,
      notes: values.notes || null,
      created_by: user.id,
      is_custom_order: values.isCustomOrder,
      price: values.isCustomOrder ? values.customPrice : undefined,
    });
  };

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

  const isCustomOrder = form.watch("isCustomOrder");

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-scroll my-4">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
          <DialogDescription>
            Nueva cama con cajones para Maxi. Si son 2 unidades, creá 2 pedidos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isCustomOrder"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Pedido personalizado
                    </FormLabel>
                    <FormDescription>
                      Marcar si este es un pedido sin venta asociada
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!isCustomOrder ? (
              <div className="grid grid-cols-[2fr,1fr] gap-4">
                <FormField
                  control={form.control}
                  name="deliveryId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Venta</FormLabel>
                      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={popoverOpen}
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
                              <CommandEmpty>
                                No se encontraron ventas.
                              </CommandEmpty>
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
                                        setPopoverOpen(false);
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
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="customProductName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Producto</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: CAMA CON CAJONES 2 PLAZAS"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 150000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {deliveryItems && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productSku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                                  item.product_sku ===
                                  form.getValues("productSku")
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
                        <FormLabel className="cursor-pointer">
                          Embalaje
                        </FormLabel>
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
                      <FormDescription className="max-w-96">
                        Si la cama es de 1 plaza, indicá para qué lado abren los
                        cajones como si estuvieras parado en los pies de la
                        cama.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
