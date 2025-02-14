// pages/api/deliveries/create/pickup.ts
import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import { NextApiRequest, NextApiResponse } from "next";

interface PickupRequest {
  products: Array<{
    sku: string;
    quantity: number;
  }>;
  supplier_id: number;
  scheduled_date?: string;
  created_by: string;
}

const validateRequest = (body: PickupRequest): void => {
  if (!body.products?.length) {
    throw new Error("Products array is required and cannot be empty");
  }
  if (!body.supplier_id) {
    throw new Error("Supplier ID is required");
  }
};

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
    const deliveryService = createDeliveryService(supabase);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body as PickupRequest;
    validateRequest(body);

    const { products, supplier_id, scheduled_date, created_by } = body;

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
          created_by,
          type: "supplier_pickup",
          order_date: new Date().toISOString().split("T")[0],
          state: "pending",
        },
      ])
      .select()
      .single();

    if (deliveryError || !delivery) {
      throw new Error(deliveryError?.message || "Failed to create delivery");
    }

    // Create delivery items using the service helper
    await deliveryService.createDeliveryItems(
      delivery.id,
      products.map((p) => ({
        product_sku: p.sku,
        quantity: p.quantity,
      }))
    );

    return res.status(200).json({
      message: "Pickup delivery created successfully",
      delivery,
    });
  } catch (error) {
    console.error("Pickup creation error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
