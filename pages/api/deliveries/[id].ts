// pages/api/deliveries/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { PICKUP_STORES } from "@/utils/constants";
import { Product, Store } from "@/types/types";

interface UpdateDeliveryBody {
  state?: 'delivered' | 'pending' | 'cancelled';
  scheduled_date?: string;
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: Store;
  items?: {
    product_sku: string;
    quantity: number;
  }[];
}


const hasGaniProduct = (products: Product[] | string | null): boolean => {
  if (!products) return false;

  try {
    // Handle both string and array cases
    const productsArray: Product[] =
      typeof products === "string" ? JSON.parse(products) : products;

    return productsArray.some((product) =>
      product.name.toLowerCase().includes("colchon gani")
    );
  } catch (error) {
    console.error("Error parsing products:", error);
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
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
      // Fetch existing delivery with customer data
      const { data: existingDelivery, error: fetchError } = await supabase
        .from("deliveries")
        .select(
          `
        *,
        customers (
          name,
          email,
          address,
          phone
        ),
        suppliers (
          name
        ),
        created_by (
          email,
          name
        )
      `
        )
        .eq("id", id)
        .single();

      if (fetchError)
        throw new Error(`Error fetching delivery: ${fetchError.message}`);
      if (!existingDelivery)
        return res.status(404).json({ error: "Delivery not found" });

      // Update delivery
      const updates = {
        ...(state && {
          state,
          ...(state === "delivered" && {
            delivery_date: new Date().toLocaleString("en-US", {
              timeZone: "America/Argentina/Buenos_Aires"
            })
          }),
          ...(state === "cancelled" && {
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

      const { data, error: updateError } = await supabase
        .from("deliveries")
        .update(updates)
        .eq("id", id)
        .select();

      if (updateError)
        throw new Error(`Error updating delivery: ${updateError.message}`);

      // Handle email notifications for delivered state
      if (state === "delivered" && state !== existingDelivery.state) {
        const shouldScheduleEmail =
          existingDelivery.created_by?.email && 
          existingDelivery.created_by?.name && 
          existingDelivery.customers;

        if (shouldScheduleEmail) {
          const { scheduleFollowUpEmail } = await import("@/utils/resend");
          await scheduleFollowUpEmail({
            salesPersonEmail: existingDelivery.created_by.email,
            salesPersonName: existingDelivery.created_by.name,
            customerName: existingDelivery.customers.name || "Cliente",
            customerPhone: existingDelivery.customers.phone || ""
          });
        }

        if (state === "delivered") {
          if (!items?.length) {
            return res.status(400).json({ error: "No items specified for delivery" });
          }
  
          // Create delivery operation
          const { data: operation, error: operationError } = await supabase
            .from('delivery_operations')
            .insert({
              delivery_id: parseInt(id as string),
              carrier_id: carrier_id || null,
              cost: delivery_cost || 0,
              operation_date: new Date().toISOString().split('T')[0],
              created_by: user.id
            })
            .select()
            .single();
        
          if (operationError) throw new Error(`Error creating operation: ${operationError.message}`);
        
          // Create operation items
          const { error: opItemsError } = await supabase
            .from('operation_items')
            .insert(items.map(item => ({
              operation_id: operation.id,
              ...item
            })));
        
          if (opItemsError) throw new Error(`Error creating operation items: ${opItemsError.message}`);
        
          // Update pending quantities in delivery_items
          for (const item of items) {
            const { error: updateError } = await supabase.rpc('update_pending_quantity', {
              p_delivery_id: parseInt(id as string),
              p_product_sku: item.product_sku,
              p_quantity: item.quantity
            });
        
            if (updateError) throw new Error(`Error updating pending quantity: ${updateError.message}`);
          }
        
          // Check if all items are delivered
          const { data: remainingItems, error: checkError } = await supabase
            .from('delivery_items')
            .select('pending_quantity')
            .eq('delivery_id', id)
            .gt('pending_quantity', 0);
        
          if (checkError) throw new Error(`Error checking remaining items: ${checkError.message}`);
        
          // Only set state to delivered if all items are delivered
          if (!remainingItems?.length) {
            const { error: updateError } = await supabase
              .from('deliveries')
              .update({ state: 'delivered' })
              .eq('id', id);
        
            if (updateError) throw new Error(`Error updating delivery state: ${updateError.message}`);
          }
        }                      

        // Handle product-specific emails
        if (existingDelivery.customers?.email) {
          const { triggerEmail } = await import("@/utils/email");
          
          // Send warranty email for Gani products
          if (hasGaniProduct(existingDelivery.products)) {
            await triggerEmail(existingDelivery.customers.email, "gani_warranty");
          }
          
          // Send review request email
          await triggerEmail(existingDelivery.customers.email, "review_request");
        }
      }

      // Add state change note
      if (state && state !== existingDelivery.state) {
        const deliveryId = parseInt(id as string, 10);
        let noteText = "";

        switch (state) {
          case "delivered":
            if (pickup_store) {
              const store = PICKUP_STORES.find((s) => s.value === pickup_store);
              noteText = `Retiro en sucursal: ${store?.label ?? pickup_store}`;
            } else if (carrier_id) {
              const { data: carrier, error: carrierError } = await supabase
                .from("carriers")
                .select("name")
                .eq("id", carrier_id)
                .single();

              if (carrierError)
                throw new Error(`Error fetching carrier: ${carrierError.message}`);
              noteText = `Entregado por ${carrier.name} con un costo de $${delivery_cost}`;
            }
            break;
          case "pending":
            noteText = "Marcado como 'Pendiente'";
            break;
          case "cancelled":
            noteText = "Entrega cancelada";
            break;
        }

        const { error: noteError } = await supabase
          .from("notes")
          .insert([{ text: noteText, delivery_id: deliveryId }]);

        if (noteError)
          throw new Error(`Error adding note: ${noteError.message}`);
      }

      res.status(200).json({ message: "Delivery updated successfully" });
    } catch (error: any) {
      console.error("Unexpected error: ", error);
      res.status(400).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}