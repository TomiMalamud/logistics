import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { data: orders, error } = await supabase
      .from("manufacturing_orders")
      .select(
        `
        id,
        completed_at,
        product_name,
        extras,
        price,
        deliveries (
          customers (
            name
          )
        )
      `
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching completed orders:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
