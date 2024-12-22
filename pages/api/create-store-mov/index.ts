// pages/api/create-store-mov/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

// pages/api/create-store-mov/index.ts
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

    // Validate required fields
    if (!products || !origin_store || !dest_store) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          products,
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
      console.error("Delivery error details:", deliveryError); // Added for better debugging
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