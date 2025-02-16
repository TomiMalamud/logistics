import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import { NextApiRequest, NextApiResponse } from "next";
import { storeMovementSchema } from "@/lib/validation/deliveries";

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

    // Validate request body using Zod
    const validationResult = storeMovementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: validationResult.error.errors[0].message,
      });
    }

    const { origin_store, dest_store, products, scheduled_date, created_by } =
      validationResult.data;

    // Create delivery record
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
          state: "pending",
        },
      ])
      .select()
      .single();

    if (deliveryError || !delivery) {
      throw new Error(deliveryError?.message || "Failed to create delivery");
    }

    const deliveryService = createDeliveryService(supabase);

    // Create delivery items using the service helper
    await deliveryService.createDeliveryItems(
      delivery.id,
      products.map((p) => ({
        product_sku: p.sku,
        quantity: p.quantity,
      }))
    );

    return res.status(200).json({
      message: "Store movement created successfully",
      delivery,
    });
  } catch (error) {
    console.error("Store movement error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
