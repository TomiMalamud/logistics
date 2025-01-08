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

      // Check if scheduled_date has changed
      const isScheduleDateChanged =
        scheduled_date &&
        (!existingDelivery.scheduled_date ||
          new Date(scheduled_date).getTime() !==
            new Date(existingDelivery.scheduled_date).getTime());

      // Update delivery
      const updates = {
        ...(state &&
          ["pending", "delivered"].includes(state) && {
            state,
            ...(state === "delivered" && {
              delivery_date: new Date().toLocaleString("en-US", {
                timeZone: "America/Argentina/Buenos_Aires"
              })
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

      // Schedule emails if delivery is marked as delivered
      if (state === "delivered" && state !== existingDelivery.state) {
        const shouldScheduleEmail =
          existingDelivery.created_by?.email && // Has sales person email
          existingDelivery.created_by?.name && // Has sales person name
          existingDelivery.customers; // Has customer data

        if (shouldScheduleEmail) {
          console.log(
            `Scheduling follow-up email to ${existingDelivery.created_by.email}`
          );

          const { scheduleFollowUpEmail } = await import("@/utils/resend");
          await scheduleFollowUpEmail({
            salesPersonEmail: existingDelivery.created_by.email,
            salesPersonName: existingDelivery.created_by.name,
            customerName: existingDelivery.customers.name || "Cliente",
            customerPhone: existingDelivery.customers.phone || ""
          });
        } else {
          console.log("No follow-up email scheduled: ", {
            hasSalesPerson: Boolean(existingDelivery.created_by),
            hasEmail: Boolean(existingDelivery.created_by?.email),
            hasCustomer: Boolean(existingDelivery.customers)
          });
        }

        // Trigger warranty email for Gani products
        const hasGani = hasGaniProduct(existingDelivery.products);

        if (hasGani && existingDelivery.customers?.email) {
          const { triggerEmail: triggerEmail } = await import("@/utils/email");
          await triggerEmail(existingDelivery.customers.email, "gani_warranty");
        }

        // Trigger email for review request
        if (existingDelivery.customers?.email) {
          const { triggerEmail: triggerEmail } = await import("@/utils/email");
          await triggerEmail(
            existingDelivery.customers.email,
            "review_request"
          );
        }
      }

      // Add state change note
      if (state && state !== existingDelivery.state) {
        const deliveryId = parseInt(id as string, 10);
        let noteText = "";

        if (state === "delivered") {
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
              throw new Error(
                `Error fetching carrier: ${carrierError.message}`
              );
            noteText = `Entregado por ${carrier.name} con un costo de $${delivery_cost}`;
          }
        } else if (state === "pending") {
          noteText = "Marcado como 'Pendiente'";
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
