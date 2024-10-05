import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

interface Customer {
  id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const {
        fecha,
        producto,
        nombre,
        domicilio,
        celular,
        pagado,
        fecha_programada,
        newNotaContent
      } = req.body;
      
      const pagadoValue = pagado === true || pagado === "true";

      // Check for missing required fields
      if (!fecha || !producto || !nombre || !domicilio || !celular) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if customer exists
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("nombre", nombre)
        .eq("domicilio", domicilio)
        .eq("celular", celular)
        .maybeSingle();

      if (customerError) {
        throw new Error(`Error fetching customer: ${customerError.message}`);
      }

      let customer_id: string;

      if (customerData) {
        // Customer exists
        customer_id = customerData.id;
      } else {
        // Insert new customer and retrieve the id
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([{ nombre, domicilio, celular }])
          .select("id") // Ensure the id is returned
          .single();

        if (newCustomerError) {
          throw new Error(`Error creating customer: ${newCustomerError.message}`);
        }

        customer_id = newCustomer.id;
      }

      // Insert delivery with the obtained customer_id
      const { data: deliveryData, error: deliveryError } = await supabase
        .from("deliveries")
        .insert([
          {
            fecha_venta: fecha,  // Store plain date without time component
            producto,
            customer_id,
            pagado: pagadoValue,
            estado: "pending",
            fecha_programada: fecha_programada || null  // Store plain date or null
          }
        ])
        .select("*")
        .single();

      if (deliveryError) {
        throw new Error(`Error creating delivery: ${deliveryError.message}`);
      }

      // Ensure we have valid delivery data
      if (!deliveryData || !deliveryData.id) {
        throw new Error("Delivery creation failed, delivery data is null or invalid");
      }

      if (newNotaContent && newNotaContent.trim() !== "") {
        const { error: noteError } = await supabase
          .from("notes")
          .insert([{ text: newNotaContent, delivery_id: deliveryData.id }]);

        if (noteError) {
          throw new Error(`Error creating note: ${noteError.message}`);
        }
      }

      res.status(200).json({ message: "Delivery created successfully" });
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
