// pages/api/deliveries/[id].ts

import { Product, Store } from "@/types/types";
import createClient from "@/utils/supabase/api";
import { NextApiRequest, NextApiResponse } from "next";

interface UpdateDeliveryBody {
  state?: "delivered" | "pending" | "cancelled";
  scheduled_date?: string;
  delivery_cost?: number | null;
  carrier_id?: number | null;
  pickup_store?: Store | null;
  items?: {
    product_sku: string;
    quantity: number;
  }[];
}

async function validateDeliveryItems(
  supabase: any,
  deliveryId: number,
  items: { product_sku: string; quantity: number }[]
) {
  const { data, error } = await supabase
    .from("delivery_items")
    .select("product_sku, pending_quantity")
    .eq("delivery_id", deliveryId);

  if (error) throw new Error("Failed to validate delivery items");
  if (!data) throw new Error("No delivery items found");

  for (const item of items) {
    const existingItem = data.find((d) => d.product_sku === item.product_sku);
    if (!existingItem) {
      throw new Error(`Product ${item.product_sku} not found in delivery`);
    }
    if (existingItem.pending_quantity < item.quantity) {
      throw new Error(
        `Invalid quantity for product ${item.product_sku}. ` +
          `Requested: ${item.quantity}, Available: ${existingItem.pending_quantity}`
      );
    }
  }
}

async function processItems(
  supabase: any,
  operation_id: number,
  delivery_id: number,
  items: { product_sku: string; quantity: number }[]
) {
  // Create operation items
  const { error: opItemsError } = await supabase.from("operation_items").insert(
    items.map((item) => ({
      operation_id,
      ...item
    }))
  );

  if (opItemsError) {
    throw new Error(`Error creating operation items: ${opItemsError.message}`);
  }

  // Update pending quantities
  for (const item of items) {
    const { error: updateError } = await supabase.rpc(
      "update_pending_quantity",
      {
        p_delivery_id: delivery_id,
        p_product_sku: item.product_sku,
        p_quantity: item.quantity
      }
    );

    if (updateError) {
      throw new Error(
        `Error updating pending quantity: ${updateError.message}`
      );
    }
  }

  // Check if all items are delivered
  const { data: remainingItems, error: checkError } = await supabase
    .from("delivery_items")
    .select("pending_quantity")
    .eq("delivery_id", delivery_id)
    .gt("pending_quantity", 0);

  if (checkError) {
    throw new Error(`Error checking remaining items: ${checkError.message}`);
  }

  return !remainingItems?.length;
}

async function recordOperation(
  supabase: any,
  delivery_id: number,
  userId: string,
  operationType: "delivery" | "cancellation",
  carrier_id?: number,
  delivery_cost?: number,
  pickup_store?: Store,
  items?: { product_sku: string; quantity: number }[]
) {
  // For delivery operations, validate that either carrier info or pickup_store is provided
  if (operationType === "delivery") {
    if (pickup_store) {
      // If pickup_store is provided, carrier and cost should be null
      carrier_id = null;
      delivery_cost = null;
    } else if (!carrier_id || !delivery_cost) {
      // If no pickup_store, both carrier and cost are required
      throw new Error(
        "Either pickup_store or both carrier_id and delivery_cost must be provided for delivery operations"
      );
    }
  }

  // Create operation record
  const { data: operation, error: operationError } = await supabase
    .from("delivery_operations")
    .insert({
      delivery_id,
      carrier_id,
      cost: delivery_cost,
      operation_date: new Date().toISOString().split("T")[0],
      created_by: userId,
      pickup_store,
      operation_type: operationType
    })
    .select()
    .single();

  if (operationError) {
    throw new Error(`Error creating operation: ${operationError.message}`);
  }

  // Process items only for deliveries
  if (operationType === "delivery" && items?.length) {
    const isFullyDelivered = await processItems(
      supabase,
      operation.id,
      delivery_id,
      items
    );
    return isFullyDelivered;
  }

  return false;
}
async function handleEmailNotifications(delivery: any) {
  if (delivery.created_by?.email && delivery.customers) {
    const { scheduleFollowUpEmail } = await import("@/utils/resend");
    await scheduleFollowUpEmail({
      salesPersonEmail: delivery.created_by.email,
      salesPersonName: delivery.created_by.name,
      customerName: delivery.customers.name || "Cliente",
      customerPhone: delivery.customers.phone || ""
    });
  }

  if (delivery.customers?.email) {
    const { triggerEmail } = await import("@/utils/email");
    const hasGani = (delivery.products as Product[])?.some((p) =>
      p.name.toLowerCase().includes("colchon gani")
    );

    if (hasGani) {
      await triggerEmail(delivery.customers.email, "gani_warranty");
    }
    await triggerEmail(delivery.customers.email, "review_request");
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createClient(req, res);
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  const {
    state,
    scheduled_date,
    delivery_cost,
    carrier_id,
    pickup_store,
    items
  } = req.body as UpdateDeliveryBody;

  if (!id) {
    return res.status(400).json({ error: "Missing delivery ID" });
  }

  try {
    // Fetch existing delivery
    const { data: delivery, error: fetchError } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        customers (name, email, address, phone),
        suppliers (name),
        created_by (email, name)
      `
      )
      .eq("id", id)
      .single();

    if (fetchError)
      throw new Error(`Error fetching delivery: ${fetchError.message}`);
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    // Validate items if present
    if (items?.length) {
      await validateDeliveryItems(supabase, parseInt(id as string), items);
    }

    // Record operation if state is changing
    let finalState = state;
    // In the PUT handler of [id].ts
    if (state && state !== delivery.state) {
      try {
        const isFullyDelivered = await recordOperation(
          supabase,
          parseInt(id as string),
          user.id,
          state === "cancelled" ? "cancellation" : "delivery",
          carrier_id || undefined,
          delivery_cost || undefined,
          pickup_store || undefined,
          items
        );

        // Only allow delivered state if all items are delivered
        if (state === "delivered" && !isFullyDelivered) {
          finalState = "pending";
        }
      } catch (error: any) {
        if (error.message.includes("delivery operations")) {
          return res.status(400).json({
            error:
              "Invalid delivery operation: Either provide a pickup store or both carrier and cost"
          });
        }
        throw error;
      }
    }
    // Update delivery
    const updates = {
      ...(finalState && {
        state: finalState,
        ...(finalState === "delivered" && {
          delivery_date: new Date().toLocaleString("en-US", {
            timeZone: "America/Argentina/Buenos_Aires"
          })
        }),
        ...(finalState === "cancelled" && {
          delivery_date: null,
          delivery_cost: null,
          carrier_id: null,
          pickup_store: null,
          scheduled_date: null
        })
      }),
      ...(scheduled_date && { scheduled_date }),
      ...(delivery_cost && { delivery_cost }),
      ...(carrier_id && { carrier_id }),
      ...(pickup_store && { pickup_store })
    };

    const { error: updateError } = await supabase
      .from("deliveries")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      throw new Error(`Error updating delivery: ${updateError.message}`);
    }

    // Handle notifications for completed deliveries
    if (finalState === "delivered" && finalState !== delivery.state) {
      await handleEmailNotifications(delivery);
    }

    return res.status(200).json({ message: "Delivery updated successfully" });
  } catch (error: any) {
    console.error("Unexpected error: ", error);
    return res.status(400).json({ error: error.message });
  }
}
