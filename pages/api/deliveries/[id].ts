import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { PICKUP_STORES } from "@/utils/constants";
import { Product } from "@/types/types";

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
    const { id } = req.query;
    const { state, scheduled_date, delivery_cost, carrier_id, pickup_store } =
      req.body;

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