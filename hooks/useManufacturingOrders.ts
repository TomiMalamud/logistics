import { createClient } from "@/lib/utils/supabase/component";
import { BaseManufacturingOrder, ManufacturingOrder } from "@/types/types";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

interface ManufacturingOrderRow extends BaseManufacturingOrder {
  created_at: string;
  created_by: string;
  finished_at: string;
  deliveries: {
    id: number;
    customer_id: number;
    order_date: string;
    customers: {
      name: string;
    };
  };
}

async function fetchManufacturingOrders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: orders, error } = await supabase
    .from("manufacturing_orders")
    .select(
      `
      id,
      created_at,
      created_by,
      product_name,
      extras,
      status,
      needs_packaging,
      finished_at,
      notes,
      delivery_id,
      deliveries (
        id,
        customer_id,
        order_date,
        customers (
          name
        )
      )
    `
    )
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (orders as unknown as ManufacturingOrderRow[]).map((order) => ({
    id: order.id,
    orderDate: order.deliveries?.order_date
      ? new Date(order.deliveries.order_date)
      : new Date(order.created_at),
    customerName: order.deliveries?.customers?.name,
    productName: order.product_name,
    deliveryId: order.delivery_id,
    needsPackaging: order.needs_packaging,
    extras: order.extras,
    status: order.status,
    notes: order.notes,
    createdAt: new Date(order.created_at),
    createdBy: order.created_by,
    finishedAt: order.finished_at ? new Date(order.finished_at) : null,
  })) as ManufacturingOrder[];
}

export function useManufacturingOrders() {
  return useQuery({
    queryKey: ["manufacturing-orders"],
    queryFn: fetchManufacturingOrders,
  });
}
