// pages/api/delivery/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { id } = req.query;
    const { estado, pagado, fecha_programada } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing delivery ID" });
    }

    if (!estado && typeof pagado === "undefined" && !fecha_programada) {
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
      if (estado && (estado === "pending" || estado === "delivered")) {
        updates.estado = estado;
      }
      if (typeof pagado !== "undefined") {
        updates.pagado = pagado;
      }
      if (fecha_programada) {
        updates.fecha_programada = fecha_programada;
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

      // Check if 'estado' has changed
      if (estado && estado !== existingDelivery.estado) {
        const noteText = `Estado cambiado de ${existingDelivery.estado} a ${estado}`;

        const { data: noteData, error: noteError } = await supabase
          .from("notes")
          .insert([{ text: noteText, delivery_id: deliveryId }]);

        if (noteError) {
          throw new Error(`Error adding note: ${noteError.message}`);
        }

        console.log("Note added due to 'estado' change:", noteData);
      }

      // Check if 'pagado' has changed
      if (typeof pagado !== "undefined" && pagado !== existingDelivery.pagado) {
        const noteText = `Estado de pago cambiado de ${
          existingDelivery.pagado ? "pagado" : "no pagado"
        } a ${pagado ? "pagado" : "no pagado"}`;

        const { data: noteData, error: noteError } = await supabase
          .from("notes")
          .insert([{ text: noteText, delivery_id: deliveryId }]);

        if (noteError) {
          throw new Error(`Error adding note: ${noteError.message}`);
        }

        console.log("Note added due to 'pagado' change:", noteData);
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
