import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Props {
  user: {
    id: string;
  };
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

// Form schema
const formSchema = z
  .object({
    amount: z.number().min(1, "Ingresá un monto válido"),
    paymentDate: z.string(),
    paymentMethod: z.enum(["cash", "bank_transfer"], {
      required_error: "Elegí un método de pago",
    }),
    notes: z.string().optional(),
    isAdvancePayment: z.boolean().default(false),
    orderIds: z.array(z.number()).optional().default([]),
  })
  .refine(
    (data) => {
      if (
        !data.isAdvancePayment &&
        (!data.orderIds || data.orderIds.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Seleccioná al menos una orden",
      path: ["orderIds"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "bank_transfer", label: "Transferencia" },
];

interface CompletedOrder {
  id: number;
  product_name: string;
  extras: string | null;
  price: number;
  completed_at: string;
  deliveries: {
    customers: {
      name: string;
    };
  };
}

export function PaymentForm({ user, onSuccess, trigger }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      orderIds: [],
      isAdvancePayment: false,
      amount: 0,
    },
  });

  // Fetch completed orders
  const { data: completedOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["completed-orders"],
    queryFn: async () => {
      const response = await fetch("/api/manufacturing/completed-orders");
      if (!response.ok) {
        throw new Error("Failed to fetch completed orders");
      }
      return response.json() as Promise<CompletedOrder[]>;
    },
  });

  const createPayment = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/manufacturing/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: values.amount,
          payment_date: values.paymentDate,
          payment_method: values.paymentMethod,
          notes: values.notes,
          created_by: user.id,
          order_ids: values.orderIds,
          is_advance_payment: values.isAdvancePayment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturer-balance"] });
      queryClient.invalidateQueries({ queryKey: ["completed-orders"] });
      form.reset();
      setDialogOpen(false);
      onSuccess?.();
    },
  });

  const onSubmit = (values: FormValues) => {
    createPayment.mutate(values);
  };

  // Get selected order IDs from form
  const selectedOrderIds = form.watch("orderIds");
  const isAdvancePayment = form.watch("isAdvancePayment");

  // Calculate total amount of selected orders
  const selectedOrdersTotal = React.useMemo(() => {
    if (!completedOrders || isAdvancePayment) return 0;
    return completedOrders
      .filter((order) => selectedOrderIds.includes(order.id))
      .reduce((sum, order) => sum + (order.price || 0), 0);
  }, [completedOrders, selectedOrderIds, isAdvancePayment]);

  // Update amount when orders are selected (only if not advance payment)
  React.useEffect(() => {
    if (!isAdvancePayment) {
      form.setValue("amount", selectedOrdersTotal);
    }
  }, [selectedOrdersTotal, form, isAdvancePayment]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Nuevo Pago</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Pago</DialogTitle>
          <DialogDescription>
            Registrar un nuevo pago al fabricante.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="isAdvancePayment"
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
                      Pago por adelantado
                    </FormLabel>
                    <FormDescription>
                      Marcar si este es un pago por adelantado sin órdenes
                      asociadas
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!isAdvancePayment && (
              <FormField
                control={form.control}
                name="orderIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Órdenes a pagar</FormLabel>
                    <div className="max-h-[200px] overflow-y-auto border rounded-md p-4 space-y-2">
                      {isLoadingOrders ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        completedOrders?.map((order) => (
                          <FormField
                            key={order.id}
                            control={form.control}
                            name="orderIds"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(order.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      const newValue = checked
                                        ? [...currentValue, order.id]
                                        : currentValue.filter(
                                            (id) => id !== order.id
                                          );
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="cursor-pointer text-sm">
                                    {order.product_name}
                                    {order.extras
                                      ? ` + ${order.extras}`
                                      : ""} - {order.deliveries.customers.name}{" "}
                                    -{" "}
                                    {new Intl.NumberFormat("es-AR", {
                                      style: "currency",
                                      currency: "ARS",
                                    }).format(order.price || 0)}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  {isAdvancePayment ? (
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  ) : (
                    <div className="text-lg font-medium">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      }).format(field.value || 0)}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
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

            <DialogFooter>
              <Button
                type="submit"
                disabled={createPayment.isPending}
                className="w-full"
              >
                {createPayment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Pago
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
