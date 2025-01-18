// pages/api/deliveries/create/pickup.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

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
      products,
      supplier_id,
      scheduled_date,
      delivery_cost,
      carrier_id,
      created_by
    } = req.body;

    // Validate required fields
    if (!products?.length || !supplier_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate supplier exists
    const { data: supplierExists, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", supplier_id)
      .single();

    if (supplierError || !supplierExists) {
      return res.status(400).json({ error: "Invalid supplier" });
    }

    // Create delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          supplier_id,
          scheduled_date: scheduled_date || null,
          delivery_cost: delivery_cost || null,
          carrier_id: carrier_id || null,
          created_by,
          type: "supplier_pickup",
          order_date: new Date().toISOString().split("T")[0],
          state: "pending"
        }
      ])
      .select()
      .single();

    if (deliveryError) {
      throw new Error(`Error creating delivery: ${deliveryError.message}`);
    }

    const deliveryItems = products.map((product) => ({
      delivery_id: delivery.id,
      product_sku: product.sku,
      quantity: product.quantity,
      pending_quantity: product.quantity
    }));

    const { error: itemsError } = await supabase
      .from("delivery_items")
      .insert(deliveryItems);

    if (itemsError) {
      throw new Error(`Error creating delivery items: ${itemsError.message}`);
    }

    return res.status(200).json(delivery);
  } catch (error) {
    console.error("Error in supplier pickup:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred"
    });
  }
}
