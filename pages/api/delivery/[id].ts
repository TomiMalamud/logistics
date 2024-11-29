// pages/api/delivery/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { id } = req.query;
    const { state, scheduled_date } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing delivery ID" });
    }

    if (!state && !scheduled_date) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    try {
      // Fetch existing delivery
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
      const updates: any = {};
      if (state && (state === "pending" || state === "delivered")) {
        updates.state = state;
      }
      if (scheduled_date) {
        updates.scheduled_date = scheduled_date;
      }

      // Update delivery
      const { data, error: updateError } = await supabase
        .from("deliveries")
        .update(updates)
        .eq("id", id)
        .select();

      if (updateError) {
        throw new Error(`Error updating delivery: ${updateError.message}`);
      }

      const deliveryId = parseInt(id as string, 10);

      // Check if 'state' has changed
      if (state && state !== existingDelivery.state) {
        const noteText = `Estado cambiado de ${existingDelivery.state} a ${state}`;

        const { data: noteData, error: noteError } = await supabase
          .from("notes")
          .insert([{ text: noteText, delivery_id: deliveryId }]);

        if (noteError) {
          throw new Error(`Error adding note: ${noteError.message}`);
        }

        console.log("Note added due to 'state' change:", noteData);
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
