// pages/api/deliveries/calendar.ts
import { supabase } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";
import { Product } from "@/types/types";

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

// Interface for pending deliveries from DB
interface PendingDelivery {
  id: number;
  scheduled_date: string;
  delivery_cost: number | null;
  invoice_id: number | null;  
  customers: {
    name: string;
    address: string;
    phone: string | null;
  };
  created_by: {
    name: string | null;
  } | null;
  delivery_items: {
    quantity: number;
    pending_quantity: number;
    products: {
      name: string;
    };
  }[] | null;
  products: string | null; // JSON string of legacy products
}

// Interface for delivery operations from DB
interface DeliveryOperation {
  id: number;
  operation_date: string;
  cost: number | null;
  pickup_store: string | null;
  carriers: {
    name: string;
  } | null;
  delivery: {
    customers: {
      name: string;
      address: string;
      phone: string | null;
    };
  };
  operation_items: {
    quantity: number;
    products: {
      name: string;
    };
  }[] | null;
}

// Common interface for calendar items
interface CalendarItem {
  id: number;
  type: "pending" | "delivered";
  display_date: string;
  invoice_id?: number | null;  
  customer: {
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

const getPendingDeliveriesQuery = () => `
  id,
  state,
  scheduled_date,
  delivery_cost,
  invoice_id,
  customers!inner (
    name,
    address,
    phone
  ),
  created_by:profiles (
    name
  ),
  delivery_items (
    quantity,
    pending_quantity,
    products (
      name
    )
  ),
  products
`;

const getDeliveryOperationsQuery = () => `
  id,
  delivery:deliveries!inner (
    id,
    customers!inner (
      name,
      address,
      phone
    )
  ),
  operation_date,
  cost,
  pickup_store,
  carriers (
    name
  ),
  operation_items (
    quantity,
    products (
      name
    )
  )
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    // Get pending deliveries with scheduled dates
    const { data: scheduledPending, error: scheduledError } = await supabase
      .from("deliveries")
      .select(getPendingDeliveriesQuery())
      .eq("state", "pending")
      .not("scheduled_date", "is", null)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate) as { data: PendingDelivery[] | null, error: any };

    // Get pending deliveries without scheduled dates (for count only)
    const { count: unscheduledCount, error: unscheduledError } = await supabase
      .from("deliveries")
      .select("id", { count: "exact" })
      .eq("state", "pending")
      .is("scheduled_date", null);

    // Get delivery operations
    const { data: operations, error: operationsError } = await supabase
      .from("delivery_operations")
      .select(getDeliveryOperationsQuery())
      .eq("operation_type", "delivery")
      .gte("operation_date", startDate)
      .lte("operation_date", endDate) as { data: DeliveryOperation[] | null, error: any };

    if (scheduledError || unscheduledError || operationsError) {
      console.error("Error fetching data:", 
        scheduledError || unscheduledError || operationsError
      );
      return res.status(500).json({ error: "Failed to fetch data" });
    }

    // Process pending deliveries
    const processedPending: CalendarItem[] = (scheduledPending || []).map(delivery => ({
      id: delivery.id,
      type: "pending",
      display_date: delivery.scheduled_date,
      invoice_id: delivery.invoice_id,
      customer: {
        name: delivery.customers.name,
        address: delivery.customers.address,
        phone: delivery.customers.phone
      },
      created_by: delivery.created_by,
      items: delivery.delivery_items?.map(item => ({
        quantity: item.quantity,
        pending_quantity: item.pending_quantity,
        name: item.products.name
      })) || (delivery.products ? JSON.parse(delivery.products).map((p: Product) => ({
        quantity: p.quantity || 1,
        name: p.name
      })) : [])
    }));
    
    // Process operations
    const processedOperations: CalendarItem[] = (operations || []).map(operation => ({
      id: operation.id,
      type: "delivered",
      display_date: operation.operation_date,
      customer: {
        name: operation.delivery.customers.name,
        address: operation.delivery.customers.address,
        phone: operation.delivery.customers.phone
      },
      items: operation.operation_items?.map(item => ({
        quantity: item.quantity,
        name: item.products.name
      })) || [],
      operation_cost: operation.cost,
      carrier: operation.carriers?.name || null,
      pickup_store: operation.pickup_store
    }));
    const calculateDailyCosts = (operations: DeliveryOperation[]) => {
      return operations?.reduce((acc, operation) => {
        const date = operation.operation_date.split('T')[0];
        acc[date] = (acc[date] || 0) + (operation.cost || 0);
        return acc;
      }, {} as Record<string, number>) || {};
    };
    
    // In the handler function, before returning:
    const dailyCosts = calculateDailyCosts(operations || []);
    const totalCost = Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0);
        
    return res.status(200).json({
      feed: [...processedPending, ...processedOperations],
      totalItems: (scheduledPending?.length || 0) + (operations?.length || 0),
      unscheduledCount: unscheduledCount || 0,
      dailyCosts,
      totalCost    
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
}