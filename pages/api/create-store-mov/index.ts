import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const {
      origin_store,
      dest_store,
      products,
      scheduled_date,
      created_by
    } = req.body;

    // Validate required fields and product structure
    if (!products || !origin_store || !dest_store || !Array.isArray(products)) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    // Validate product structure
    const isValidProduct = (p: any): p is Product => 
      typeof p === "object" && 
      typeof p.name === "string" && 
      typeof p.quantity === "number";

    if (!products.every(isValidProduct)) {
      return res.status(400).json({ error: "Invalid product format" });
    }

    // Create delivery with JSONB products
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          products,  // This will be stored as JSONB
          created_by,
          scheduled_date: scheduled_date || null,
          type: "stores_movement",
          origin_store,     
          dest_store,       
          order_date: new Date().toISOString().split("T")[0],
          state: "pending"
        }
      ])
      .select()
      .single();

    if (deliveryError) {
      console.error("Delivery error details:", deliveryError);
      throw new Error(`Error creating delivery: ${deliveryError.message}`);
    }

    return res.status(200).json(delivery);
  } catch (error) {
    console.error("Error in store movement:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    });
  }
}
