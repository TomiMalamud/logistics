// pages/api/deliveries/create/store-mov.ts
import { createInventoryMovement } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/types";
import { STORES } from "@/utils/constants";
import { NextApiRequest, NextApiResponse } from "next";

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
      products, // Keep for backwards compatibility
      scheduled_date,
      created_by
    } = req.body;

    // Validate required fields and product structure
    if (!products || !origin_store || !dest_store || !Array.isArray(products)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields" });
    }

    // Validate product structure
    const isValidProduct = (p: any): p is Product =>
      typeof p === "object" &&
      typeof p.name === "string" &&
      typeof p.sku === "string" &&
      typeof p.quantity === "number";

    if (!products.every(isValidProduct)) {
      return res.status(400).json({ error: "Invalid product format" });
    }

    const originStore = STORES.find((store) => store.id === origin_store);
    const destStore = STORES.find((store) => store.id === dest_store);

    if (!originStore || !destStore) {
      return res.status(400).json({ error: "Invalid store IDs" });
    }

    // Create inventory movements in ERP for each product
    await Promise.all(
      products.map(async (product) => {
        try {
          await createInventoryMovement({
            idDepositoOrigen: origin_store,
            idDepositoDestino: dest_store,
            codigo: product.sku,
            cantidad: product.quantity
          });
        } catch (error) {
          console.error(`Error moving product ${product.sku}:`, error);
          throw error;
        }
      })
    );

    // Create delivery without products field
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          created_by,
          scheduled_date: scheduled_date || null,
          type: "store_movement",
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

    // Create delivery items
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
    console.error("Error in store movement:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred"
    });
  }
}
