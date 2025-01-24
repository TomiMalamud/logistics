// pages/api/inventory/movement.ts
import { createInventoryMovement } from "@/lib/api";
import createClient from "@/lib/utils/supabase/api";
import { NextApiRequest, NextApiResponse } from "next";

interface InventoryMovementRequest {
  origin_store: string;
  dest_store: string;
  product_sku: string;
  quantity: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const supabase = createClient(req, res);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { origin_store, dest_store, product_sku, quantity } =
      req.body as InventoryMovementRequest;

    // Validate request
    if (!origin_store || !dest_store || !product_sku || !quantity) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Create inventory movement in ERP
    await createInventoryMovement({
      idDepositoOrigen: origin_store,
      idDepositoDestino: dest_store,
      codigo: product_sku,
      cantidad: quantity,
    });

    return res.status(200).json({
      message: "Inventory movement created successfully",
    });
  } catch (error: any) {
    console.error("Inventory movement error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
