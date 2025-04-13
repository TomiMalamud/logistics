import { getProductBySku } from "@/lib/api";
import createClient from "@/lib/utils/supabase/api";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { Database } from "@/supabase/types/supabase";

type ManufacturingStatus = Database["public"]["Enums"]["manufacturing_status"];

const manufacturingOrderSchema = z
  .object({
    delivery_id: z.number().optional(),
    product_name: z.string().min(1, "Product name is required"),
    product_sku: z.string().optional(),
    extra_product_sku: z.string().nullable().optional(),
    extras: z.string().nullable(),
    needs_packaging: z.boolean().default(false),
    notes: z.string().nullable(),
    created_by: z.string().min(1, "Created by is required"),
    is_custom_order: z.boolean().optional(),
    price: z.number().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.is_custom_order) {
      if (!data.price || data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Price is required and must be greater than 0 for custom orders",
        });
      }
    } else if (!data.delivery_id || !data.product_sku) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "delivery_id and product_sku are required for non-custom orders",
      });
    }
  });

type CreateManufacturingOrderRequest = z.infer<typeof manufacturingOrderSchema>;
type ManufacturingOrderInsert =
  Database["public"]["Tables"]["manufacturing_orders"]["Insert"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

    const result = manufacturingOrderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

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
    } = result.data;

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
        const mainProduct = await getProductBySku(product_sku);
        totalCost += mainProduct.CostoInterno;

        if (extra_product_sku) {
          const extraProduct = await getProductBySku(extra_product_sku);
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
        orderError?.message || "Failed to create manufacturing order",
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
