import { getStore } from "@/lib/utils/constants";
import createClient from "@/lib/utils/supabase/api";
import { Product } from "@/types/types";
import { NextApiRequest, NextApiResponse } from "next";

interface StoreMovementRequest {
  origin_store: string;
  dest_store: string;
  products: Array<{
    name: string;
    sku: string;
    quantity: number;
  }>;
  scheduled_date?: string;
  created_by: string;
}

const validateRequest = (body: StoreMovementRequest): void => {
  if (!body.origin_store || !body.dest_store) {
    throw new Error("Origin and destination stores are required");
  }

  if (!body.products?.length) {
    throw new Error("Products array is required and cannot be empty");
  }

  if (!Array.isArray(body.products)) {
    throw new Error("Products must be an array");
  }

  const isValidProduct = (p: any): p is Product =>
    typeof p === "object" &&
    typeof p.name === "string" &&
    typeof p.sku === "string" &&
    typeof p.quantity === "number";

  if (!body.products.every(isValidProduct)) {
    throw new Error("Invalid product format");
  }

  const originStore = getStore(body.origin_store);
  const destStore = getStore(body.dest_store);

  if (!originStore || !destStore) {
    throw new Error("Invalid store IDs");
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

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body as StoreMovementRequest;
    validateRequest(body);

    const { origin_store, dest_store, products, scheduled_date, created_by } =
      body;

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

    // Create delivery items
    const deliveryItems = products.map((product) => ({
      delivery_id: delivery.id,
      product_sku: product.sku,
      quantity: product.quantity,
      pending_quantity: product.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("delivery_items")
      .insert(deliveryItems);

    if (itemsError) {
      throw new Error(`Error creating delivery items: ${itemsError.message}`);
    }

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
