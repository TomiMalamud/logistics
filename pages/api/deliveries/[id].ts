// pages/api/deliveries/[id].ts
import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import { DeliveryState, Store } from "@/types/types";
import { NextApiRequest, NextApiResponse } from "next";

interface UpdateDeliveryBody {
  state?: DeliveryState;
  scheduled_date?: string;
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: Store;
  items?: {
    product_sku: string;
    quantity: number;
    store_id: string;
  }[];
}

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

  const id = Number(req.query.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid delivery ID" });
  }

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
    const {
      state,
      scheduled_date,
      delivery_cost,
      carrier_id,
      pickup_store,
      items,
    } = req.body as UpdateDeliveryBody;

    try {
      // Fetch current delivery state
      const delivery = await deliveryService.getDelivery(id);

      // Validate items if present
      if (items?.length) {
        await deliveryService.validateItems(id, items);
      }

      // Handle state changes and operations
      let finalState = state;
      if (state && state !== delivery.state) {
        // Only allow pending -> delivered or any -> cancelled transitions
        if (
          (delivery.state === "pending" && state === "delivered") ||
          (state === "cancelled" && delivery.state !== "cancelled")
        ) {
          try {
            const isFullyDelivered = await deliveryService.recordOperation({
              deliveryId: id,
              userId: user.id,
              operationType:
                state === "cancelled" ? "cancellation" : "delivery",
              carrierId: carrier_id,
              deliveryCost: delivery_cost,
              pickupStore: pickup_store,
              items,
            });

            // Only set state to delivered if all items are delivered
            if (state === "delivered" && !isFullyDelivered) {
              finalState = "pending";
            }
          } catch (error: any) {
            if (error.message.includes("pickup_store or both carrier")) {
              return res.status(400).json({
                error:
                  "Invalid delivery operation: Either provide a pickup store or both carrier and cost",
              });
            }
            throw error;
          }
        } else {
          return res.status(400).json({ error: "Invalid state transition" });
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

      return res.status(200).json({ message: "Delivery updated successfully" });
    } catch (error: any) {
      console.error("Error updating delivery:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
