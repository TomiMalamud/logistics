import { getProductCostBySku } from "@/lib/api";
import createClient from "@/lib/utils/supabase/api";
import { NextApiRequest, NextApiResponse } from "next";

interface CreateManufacturingOrderRequest {
  delivery_id?: number;
  product_name: string;
  product_sku?: string;
  extra_product_sku?: string | null;
  extras: string | null;
  needs_packaging: boolean;
  notes: string | null;
  created_by: string;
  is_custom_order?: boolean;
  price?: number;
}

const validateRequest = (body: CreateManufacturingOrderRequest): void => {
  const requiredFields = ["product_name", "created_by"];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // Validate that either it's a custom order with price or has required delivery fields
  if (body.is_custom_order) {
    if (!body.price || body.price <= 0) {
      throw new Error(
        "Price is required and must be greater than 0 for custom orders"
      );
    }
  } else {
    if (!body.delivery_id || !body.product_sku) {
      throw new Error(
        "delivery_id and product_sku are required for non-custom orders"
      );
    }
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

    const body = req.body as CreateManufacturingOrderRequest;
    validateRequest(body);

    const {
      delivery_id,
      product_name,
      product_sku,
      extra_product_sku,
      extras,
      needs_packaging,
      notes,
      created_by,
      is_custom_order,
      price,
    } = body;

    // Only validate delivery if it's not a custom order
    if (!is_custom_order && delivery_id) {
      const { data: deliveryExists, error: deliveryError } = await supabase
        .from("deliveries")
        .select("id")
        .eq("id", delivery_id)
        .single();

      if (deliveryError || !deliveryExists) {
        return res.status(400).json({ error: "Invalid delivery ID" });
      }
    }

    // Get product costs from ERP only for non-custom orders
    let totalCost = 0;
    if (!is_custom_order && product_sku) {
      try {
        const mainProduct = await getProductCostBySku(product_sku);
        totalCost += mainProduct.CostoInterno;

        if (extra_product_sku) {
          const extraProduct = await getProductCostBySku(extra_product_sku);
          totalCost += extraProduct.CostoInterno;
        }
      } catch (error) {
        console.error("Error fetching product costs:", error);
        // Continue without cost if API fails
      }
    }

    // Create manufacturing order
    const { data: order, error: orderError } = await supabase
      .from("manufacturing_orders")
      .insert([
        {
          delivery_id: delivery_id || null,
          product_name,
          extras,
          needs_packaging,
          notes,
          created_by,
          status: "pending",
          price: is_custom_order ? price : totalCost > 0 ? totalCost : null,
          is_custom_order: !!is_custom_order,
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(
        orderError?.message || "Failed to create manufacturing order"
      );
    }

    return res.status(200).json({
      message: "Manufacturing order created successfully",
      order,
      price: is_custom_order ? price : totalCost > 0 ? totalCost : null,
    });
  } catch (error) {
    console.error("Manufacturing order creation error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
