// pages/api/deliveries/calendar.ts

import { supabase } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";

type FeedResponse = {
  feed: any[];
  totalItems: number;
};

type ErrorResponse = {
  error: string;
};

const getDeliverySelect = () => `
  *,
  customers!inner (
    name,
    address,
    phone
  ),
  carriers (
    name
  ),
  notes (
    id,
    text,
    created_at
  ),
  created_by:profiles (
    email,
    name
  ),
  delivery_items (
    product_sku,
    quantity,
    pending_quantity,
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
    // Query pending deliveries with scheduled dates in range
    const { data: scheduledPending, error: scheduledError } = await supabase
      .from("deliveries")
      .select(getDeliverySelect())
      .eq("state", "pending")
      .not("scheduled_date", "is", null)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true });

    // Query pending deliveries without scheduled dates
    const { data: unscheduledPending, error: unscheduledError } = await supabase
      .from("deliveries")
      .select(getDeliverySelect())
      .eq("state", "pending")
      .is("scheduled_date", null)
      .order("order_date", { ascending: true });

    // Query delivered items with delivery dates in range
    const { data: deliveredItems, error: deliveredError } = await supabase
      .from("deliveries")
      .select(getDeliverySelect())
      .eq("state", "delivered")
      .not("delivery_date", "is", null)
      .gte("delivery_date", startDate)
      .lte("delivery_date", endDate)
      .order("delivery_date", { ascending: true });

    if (scheduledError || unscheduledError || deliveredError) {
      console.error(
        "Error fetching deliveries:",
        scheduledError || unscheduledError || deliveredError
      );
      return res.status(500).json({ error: "Failed to fetch deliveries." });
    }

    // Process deliveries to ensure backward compatibility
    const processDelivery = (delivery: any) => {
      // If we have products as a string (jsonb), parse it
      if (typeof delivery.products === 'string') {
        try {
          delivery.products = JSON.parse(delivery.products);
        } catch (e) {
          delivery.products = [];
        }
      }
      return delivery;
    };
    
    
    const allDeliveries = [
      ...(scheduledPending || []).map((d) => ({ ...processDelivery(d), type: "pending" })),
      ...(unscheduledPending || []).map((d) => ({ ...processDelivery(d), type: "pending" })),
      ...(deliveredItems || []).map((d) => ({ ...processDelivery(d), type: "delivered" }))
    ];

    return res.status(200).json({
      feed: allDeliveries,
      totalItems: allDeliveries.length
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
}