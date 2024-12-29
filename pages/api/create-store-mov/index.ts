// pages/api/create-store-mov.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/types";
import { createInventoryMovement } from "@/lib/api";

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

    console.log(products);

    // Validate product structure
    const isValidProduct = (p: any): p is Product => 
      typeof p === "object" && 
    typeof p.name === "string" && 
    typeof p.sku === "string" &&
    typeof p.quantity === "number"

    if (!products.every(isValidProduct)) {
      return res.status(400).json({ error: "Invalid product format" });
    }

    // Get deposit IDs from store codes
    const STORE_TO_DEPOSIT_MAP: Record<string, string> = {
      'cd': '60835',
      '9dejulio': '24471',
      'carcano': '31312'
    };

    const originDepositId = STORE_TO_DEPOSIT_MAP[origin_store];
    const destDepositId = STORE_TO_DEPOSIT_MAP[dest_store];

    if (!originDepositId || !destDepositId) {
      return res.status(400).json({ error: "Invalid store codes" });
    }

    // Create inventory movements in ERP for each product
    await Promise.all(
      products.map(async (product) => {
        try {
          console.log(`Moving product ${product.sku} from ${originDepositId} to ${destDepositId}`);
          await createInventoryMovement({
            idDepositoOrigen: originDepositId,
            idDepositoDestino: destDepositId,
            codigo: product.sku,
            cantidad: product.quantity
          });
        } catch (error) {
          console.error(`Error moving product ${product.sku}:`, error);
          throw error;
        }
      })
    );

    // Create delivery record in Supabase
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          products,
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

    return res.status(200).json(delivery);
  } catch (error) {
    console.error("Error in store movement:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    });
  }
}