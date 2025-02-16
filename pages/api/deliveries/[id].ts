// pages/api/deliveries/[id].ts
import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import { DeliveryState } from "@/types/types";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { Database } from "@/supabase/types/supabase";

type StoreEnum = Database["public"]["Enums"]["store"];
type DeliveryStateEnum = Database["public"]["Enums"]["delivery_state"];

const querySchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid delivery ID"),
});

// This matches the service's DeliveryItem interface
const itemSchema = z
  .object({
    product_sku: z.string().min(1, "Product SKU is required"),
    quantity: z.number().positive("Quantity must be positive"),
    store_id: z.enum(["60835", "24471", "31312", "70749"] as const),
  })
  .strict();

const storeSchema = z
  .object({
    id: z.enum(["60835", "24471", "31312", "70749"] as const),
    label: z.string().min(1, "Store label is required"),
  })
  .strict();

const updateDeliverySchema = z
  .object({
    state: z.enum(["pending", "delivered", "cancelled"] as const).optional(),
    scheduled_date: z.string().optional(),
    delivery_cost: z
      .number()
      .positive("Delivery cost must be positive")
      .nullable()
      .optional(),
    carrier_id: z
      .number()
      .positive("Carrier ID must be positive")
      .nullable()
      .optional(),
    pickup_store: z
      .enum(["60835", "24471", "31312", "70749"] as const)
      .transform((val) => val as Database["public"]["Enums"]["store"])
      .nullable()
      .optional(),
    items: z.array(itemSchema).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.state === "delivered" && !data.carrier_id && !data.pickup_store) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either provide a pickup store or carrier for delivery",
      });
    }
    if (data.carrier_id && !data.delivery_cost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Delivery cost is required when carrier is provided",
      });
    }
  });

// Type assertions to ensure our Zod schemas match the database types
type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
type DeliveryItem = {
  product_sku: string;
  quantity: number;
  store_id: StoreEnum;
};
type Store = {
  id: StoreEnum;
  label: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const queryResult = querySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({ error: queryResult.error.issues[0].message });
  }

  const id = Number(queryResult.data.id);
  const deliveryService = createDeliveryService(supabase);

  if (req.method === "GET") {
    try {
      const delivery = await deliveryService.getDelivery(id);
      return res.status(200).json(delivery);
    } catch (error: any) {
      console.error("Error fetching delivery:", error);
      if (error.message === "Delivery not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Failed to fetch delivery" });
    }
  }

  if (req.method === "PUT") {
    const updateResult = updateDeliverySchema.safeParse(req.body);
    if (!updateResult.success) {
      return res.status(400).json({
        error: updateResult.error.issues[0].message,
        details: updateResult.error.issues,
      });
    }

    const {
      state,
      scheduled_date,
      delivery_cost,
      carrier_id,
      pickup_store,
      items,
    } = updateResult.data;

    try {
      // Fetch current delivery state
      const delivery = await deliveryService.getDelivery(id);

      // Only allow cancellation state changes
      if (state && state !== delivery.state) {
        if (state !== "cancelled") {
          return res.status(400).json({
            error: "Invalid state transition",
            details: "State can only be changed to cancelled",
          });
        }
      }

      // Validate items if present
      if (items?.length) {
        try {
          await deliveryService.validateItems(id, items as DeliveryItem[]);
        } catch (error: any) {
          return res.status(400).json({
            error: "Item validation failed",
            details: error.message,
          });
        }
      }

      // Handle state changes and operations
      let finalState = delivery.state; // Start with current state
      let allItemsDelivered = false;

      // Process delivery operation if items are present
      if (items?.length) {
        try {
          const result = await deliveryService.recordOperation({
            deliveryId: id,
            userId: user.id,
            operationType: "delivery",
            carrierId: carrier_id,
            deliveryCost: delivery_cost,
            pickupStore: pickup_store as unknown as Store,
            items: items as DeliveryItem[],
          });

          // Set state based on whether all items are delivered
          allItemsDelivered = result.allItemsDelivered;
          finalState = allItemsDelivered ? "delivered" : "pending";
        } catch (error: any) {
          return res.status(400).json({
            error: "Operation recording failed",
            details: error.message,
          });
        }
      } else if (state === "cancelled") {
        // Handle cancellation
        try {
          await deliveryService.recordOperation({
            deliveryId: id,
            userId: user.id,
            operationType: "cancellation",
          });
          finalState = "cancelled";
        } catch (error: any) {
          return res.status(400).json({
            error: "Operation recording failed",
            details: error.message,
          });
        }
      }

      // Update delivery
      await deliveryService.updateDelivery({
        id,
        state: finalState,
        scheduledDate: scheduled_date,
      });

      // Handle notifications for completed deliveries
      if (finalState === "delivered" && finalState !== delivery.state) {
        await deliveryService.handleNotifications(delivery);
      }

      return res.status(200).json({
        message: "Delivery updated successfully",
        allItemsDelivered,
      });
    } catch (error: any) {
      console.error("Error updating delivery:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
