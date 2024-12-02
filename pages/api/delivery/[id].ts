import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { id } = req.query;
    const { state, scheduled_date, delivery_cost, carrier_id, pickup_store } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing delivery ID" });
    }

    try {
      const { data: existingDelivery, error: fetchError } = await supabase
        .from("deliveries")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching delivery: ${fetchError.message}`);
      }

      if (!existingDelivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }

      // Prepare updates
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

      if (updateError) {
        throw new Error(`Error updating delivery: ${updateError.message}`);
      }

      // Add note for state change
      if (state && state !== existingDelivery.state) {
        const deliveryId = parseInt(id as string, 10);
        let noteText = "";

        if (state === "delivered") {
          if (pickup_store) {
            const storeNames = {
              cd: "CD",
              "9dejulio": "9 de Julio",
              carcano: "Carcano"
            };
            noteText = `Retiro en sucursal: ${storeNames[pickup_store]}`;
          } else if (carrier_id) {
            const { data: carrier, error: carrierError } = await supabase
              .from("carriers")
              .select("name")
              .eq("id", carrier_id)
              .single();

            if (carrierError) {
              throw new Error(`Error fetching carrier: ${carrierError.message}`);
            }

            noteText = `Entregado por ${carrier.name} con un costo de $${delivery_cost}`;
          }
        } else if (state === "pending") {
          noteText = "Marcado como 'Pendiente'";
        }

        const { error: noteError } = await supabase.from("notes").insert([
          {
            text: noteText,
            delivery_id: deliveryId
          }
        ]);

        if (noteError) {
          throw new Error(`Error adding note: ${noteError.message}`);
        }
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