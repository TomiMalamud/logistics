// pages/api/post/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { sendDeliveryScheduleEmail } from "@/utils/emails";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const {
        order_date,
        products,
        invoice_number,
        invoice_id,
        balance,
        name,
        address,
        phone,
        scheduled_date,
        notes,
        created_by
      } = req.body;

      // Check for missing required fields
      if (!order_date || !products || !name || !address || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if customer exists
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("name", name)
        .eq("address", address)
        .eq("phone", phone)
        .maybeSingle();

      if (customerError) {
        throw new Error(`Error fetching customer: ${customerError.message}`);
      }

      let customer_id: string;

      if (customerData) {
        // Customer exists
        customer_id = customerData.id;
        await supabase
          .from("customers")
          .update({ email: req.body.email })
          .eq("id", customer_id);
      } else {
        // Insert new customer and retrieve the id
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([{ name, address, phone, email: req.body.email || null }])
          .select("id")
          .single();

        if (newCustomerError) {
          throw new Error(
            `Error creating customer: ${newCustomerError.message}`
          );
        }

        customer_id = newCustomer.id;
      }

      // Insert delivery with the obtained customer_id
      const { data: deliveryData, error: deliveryError } = await supabase
        .from("deliveries")
        .insert([
          {
            order_date,
            products,
            customer_id,
            state: "pending",
            scheduled_date: scheduled_date || null,
            created_by: created_by,
            invoice_number,
            invoice_id,
            balance
          }
        ])
        .select("*")
        .single();

      if (deliveryError) {
        throw new Error(`Error creating delivery: ${deliveryError.message}`);
      }

      // Ensure we have valid delivery data
      if (!deliveryData || !deliveryData.id) {
        throw new Error(
          "Delivery creation failed, delivery data is null or invalid"
        );
      }

      if (notes && notes.trim() !== "") {
        const { error: noteError } = await supabase
          .from("notes")
          .insert([{ text: notes, delivery_id: deliveryData.id }]);

        if (noteError) {
          throw new Error(`Error creating note: ${noteError.message}`);
        }
      }

      res.status(200).json({ message: "Delivery created successfully" });
      // In your POST handler, after successful delivery creation:
      if (scheduled_date && req.body.email) {
        await sendDeliveryScheduleEmail({
          email: req.body.email,
          customerName: name,
          scheduledDate: scheduled_date,
          phone,
          address
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
