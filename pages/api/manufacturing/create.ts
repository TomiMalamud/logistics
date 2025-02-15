import createClient from "@/lib/utils/supabase/api";
import { getProductCostBySku } from "@/lib/api";
import { NextApiRequest, NextApiResponse } from "next";

interface CreateManufacturingOrderRequest {
  delivery_id: number;
  product_name: string;
  product_sku: string;
  extra_product_sku?: string | null;
  extras: string | null;
  needs_packaging: boolean;
  notes: string | null;
  created_by: string;
}

const validateRequest = (body: CreateManufacturingOrderRequest): void => {
  const requiredFields = [
    "delivery_id",
    "product_name",
    "product_sku",
    "created_by",
  ];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
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
    } = body;

    // Validate that delivery exists
    const { data: deliveryExists, error: deliveryError } = await supabase
      .from("deliveries")
      .select("id")
      .eq("id", delivery_id)
      .single();

    if (deliveryError || !deliveryExists) {
      return res.status(400).json({ error: "Invalid delivery ID" });
    }

    // Get product costs from ERP
    let totalCost = 0;
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

    // Create manufacturing order
    const { data: order, error: orderError } = await supabase
      .from("manufacturing_orders")
      .insert([
        {
          delivery_id,
          product_name,
          extras,
          needs_packaging,
          notes,
          created_by,
          status: "pending",
          price: totalCost > 0 ? totalCost : null,
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
      price: totalCost > 0 ? totalCost : null,
    });
  } catch (error) {
    console.error("Manufacturing order creation error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
