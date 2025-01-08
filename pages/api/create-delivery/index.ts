// pages/api/create-delivery/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

interface DeliveryRequest {
  order_date: string;
  products: string;
  invoice_number: string;
  invoice_id: string;
  name: string;
  address: string;
  phone: string;
  scheduled_date?: string;
  notes?: string;
  created_by: string;
  email: string | null;
  emailBypassReason?: string;
}

const validateRequest = (body: DeliveryRequest) => {
  const {
    order_date,
    products,
    name,
    address,
    phone,
    email,
    emailBypassReason
  } = body;

  if (!order_date || !products || !name || !address || !phone) {
    throw new Error("Missing required fields");
  }

  if (!email && !emailBypassReason) {
    throw new Error("Either email or email bypass reason must be provided");
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const body = req.body as DeliveryRequest;
    validateRequest(body);

    const {
      order_date,
      products,
      invoice_number,
      invoice_id,
      name,
      address,
      phone,
      scheduled_date,
      notes,
      created_by,
      email,
      emailBypassReason
    } = body;

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

    // Handle customer creation or update
    const customer_id = await (async () => {
      if (customerData) {
        // Update existing customer
        await supabase
          .from("customers")
          .update({ email })
          .eq("id", customerData.id);
        return customerData.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([{ name, address, phone, email }])
          .select("id")
          .single();

        if (newCustomerError) {
          throw new Error(
            `Error creating customer: ${newCustomerError.message}`
          );
        }

        return newCustomer.id;
      }
    })();

    // Insert delivery
    const { data: deliveryData, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          order_date,
          products,
          customer_id,
          state: "pending",
          scheduled_date: scheduled_date || null,
          created_by,
          invoice_number,
          invoice_id,
          email_bypass_reason: emailBypassReason
        }
      ])
      .select("*")
      .single();

    if (deliveryError) {
      throw new Error(`Error creating delivery: ${deliveryError.message}`);
    }

    if (!deliveryData?.id) {
      throw new Error("Delivery creation failed");
    }

    // Handle notes if provided
    if (notes?.trim()) {
      const { error: noteError } = await supabase
        .from("notes")
        .insert([{ text: notes, delivery_id: deliveryData.id }]);

      if (noteError) {
        throw new Error(`Error creating note: ${noteError.message}`);
      }
    }

    res.status(200).json({ message: "Delivery created successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(400).json({ error: (error as Error).message });
  }
}
