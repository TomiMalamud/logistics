// pages/api/deliveries/calendar.ts
import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import type { NextApiRequest, NextApiResponse } from "next";

type FeedResponse = {
  feed: CalendarItem[];
  totalItems: number;
  unscheduledCount: number;
  dailyCosts: Record<string, number>;
  totalCost: number;
};

type ErrorResponse = {
  error: string;
};

interface PendingDelivery {
  id: number;
  scheduled_date: string;
  invoice_id: number | null;
  customers: {
    name: string;
    address: string;
    phone: string | null;
  } | null;
  created_by: {
    name: string | null;
  } | null;
  delivery_items:
    | {
        quantity: number;
        pending_quantity: number;
        products: {
          name: string;
        };
      }[]
    | null;
  products: string | null;
}

interface DeliveryOperation {
  id: number;
  operation_date: string;
  cost: number | null;
  pickup_store: string | null;
  carriers: {
    name: string;
  } | null;
  delivery: {
    id: number;
    type: string;
    customers: {
      name: string;
      address: string;
      phone: string | null;
    } | null;
  };
  operation_items:
    | {
        quantity: number;
        products: {
          name: string;
        };
      }[]
    | null;
}

interface CalendarItem {
  id: number;
  type: "pending" | "delivered";
  display_date: string;
  delivery_type?: string;
  invoice_id?: number | null;
  customer?: {
    name: string;
    address: string;
    phone: string | null;
  };
  items: Array<{
    quantity: number;
    name: string;
  }>;
  created_by?: {
    name: string | null;
  } | null;
  carrier?: string | null;
  pickup_store?: string | null;
  operation_cost?: number | null;
}

const calculateDailyCosts = (operations: DeliveryOperation[]) => {
  return (
    operations?.reduce((acc, operation) => {
      const date = operation.operation_date.split("T")[0];
      acc[date] = (acc[date] || 0) + (operation.cost || 0);
      return acc;
    }, {} as Record<string, number>) || {}
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { startDate, endDate } = req.query;

  if (
    !startDate ||
    !endDate ||
    Array.isArray(startDate) ||
    Array.isArray(endDate)
  ) {
    return res
      .status(400)
      .json({ error: "Valid start and end dates are required" });
  }

  try {
    const supabase = createClient(req, res);
    const deliveryService = createDeliveryService(supabase);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get pending deliveries with scheduled dates
    const { data: scheduled, error: scheduledError } =
      await deliveryService.listDeliveries({
        state: "pending",
        page: 1,
        pageSize: 1000,
        scheduledDate: "hasDate",
        startDate,
        endDate,
      });

    if (scheduledError) {
      throw new Error(scheduledError);
    }

    // Get unscheduled count
    const { data: unscheduled, count: unscheduledCount } =
      await deliveryService.listDeliveries({
        state: "pending",
        page: 1,
        pageSize: 1,
        scheduledDate: "noDate",
      });

    // Get delivery operations
    const { data: operations } = (await deliveryService.listOperations({
      startDate,
      endDate,
      type: "delivery",
    })) as { data: DeliveryOperation[] };

    // Process pending deliveries
    const pendingItems: CalendarItem[] = (scheduled as PendingDelivery[]).map(
      (delivery) => ({
        id: delivery.id,
        type: "pending",
        display_date: delivery.scheduled_date,
        invoice_id: delivery.invoice_id,
        ...(delivery.customers && {
          customer: {
            name: delivery.customers.name,
            address: delivery.customers.address,
            phone: delivery.customers.phone,
          },
        }),
        created_by: delivery.created_by,
        items:
          delivery.delivery_items?.map((item) => ({
            quantity: item.quantity,
            name: item.products.name,
          })) || [],
      })
    );

    // Process delivered items
    const deliveredItems: CalendarItem[] = (operations || []).map(
      (operation) => ({
        id: operation.id,
        type: "delivered",
        display_date: operation.operation_date,
        delivery_type: operation.delivery.type,
        ...(operation.delivery.customers && {
          customer: {
            name: operation.delivery.customers.name,
            address: operation.delivery.customers.address,
            phone: operation.delivery.customers.phone,
          },
        }),
        items:
          operation.operation_items?.map((item) => ({
            quantity: item.quantity,
            name: item.products.name,
          })) || [],
        operation_cost: operation.cost,
        carrier: operation.carriers?.name || null,
        pickup_store: operation.pickup_store,
      })
    );

    const dailyCosts = calculateDailyCosts(operations || []);
    const totalCost = Object.values(dailyCosts).reduce(
      (sum, cost) => sum + cost,
      0
    );

    return res.status(200).json({
      feed: [...pendingItems, ...deliveredItems],
      totalItems: pendingItems.length + deliveredItems.length,
      unscheduledCount: unscheduledCount || 0,
      dailyCosts,
      totalCost,
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
