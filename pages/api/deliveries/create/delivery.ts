// pages/api/deliveries/create/delivery.ts
import { createOrUpdateContact, formatPerfitContact } from "@/lib/perfit";
import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import { NextApiRequest, NextApiResponse } from "next";
import { titleCase } from "title-case";

interface DeliveryRequest {
  order_date: string;
  products: Array<{
    name: string;
    sku: string;
    quantity: number;
  }>;
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
  store_id: string;
}

const validateRequest = (body: DeliveryRequest): void => {
  const requiredFields = [
    "order_date",
    "products",
    "name",
    "address",
    "phone",
    "store_id",
  ];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  if (!body.email && !body.emailBypassReason) {
    throw new Error("Either email or email bypass reason must be provided");
  }
};

const syncWithPerfit = async (email: string, name: string): Promise<void> => {
  try {
    const perfitContact = formatPerfitContact(
      email,
      titleCase(name.toLowerCase())
    );
    await createOrUpdateContact(perfitContact);
  } catch (error) {
    console.error("Failed to sync contact with Perfit:", error);
    // Continue with delivery creation even if Perfit sync fails
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
    const supabase = createClient(req, res);
    const deliveryService = createDeliveryService(supabase);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
      emailBypassReason,
      store_id,
    } = body;

    // Sync with Perfit if email is provided
    if (email) {
      await syncWithPerfit(email, name);
    }

    // Find or create customer
    const { data: customerData } = await supabase
      .from("customers")
      .select("id")
      .eq("name", name)
      .eq("address", address)
      .eq("phone", phone)
      .maybeSingle();

    // Create customer if not found
    const customer_id =
      customerData?.id ||
      (await (async () => {
        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert([
            {
              name: name,
              address: address,
              phone: phone,
              email: email,
            },
          ])
          .select("id")
          .single();

        if (createError || !newCustomer) {
          throw new Error(createError?.message || "Failed to create customer");
        }

        return newCustomer.id;
      })());

    // Create delivery transaction
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([
        {
          order_date,
          customer_id,
          state: "pending",
          scheduled_date: scheduled_date || null,
          created_by,
          invoice_number,
          invoice_id,
          type: "home_delivery",
          email_bypass_reason: emailBypassReason,
          store_id,
        },
      ])
      .select()
      .single();

    if (deliveryError || !delivery) {
      throw new Error(deliveryError?.message || "Failed to create delivery");
    }

    // Create delivery items
    const deliveryItems = products.map((product) => ({
      delivery_id: delivery.id,
      product_sku: product.sku,
      quantity: product.quantity,
      pending_quantity: product.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("delivery_items")
      .insert(deliveryItems);

    if (itemsError) {
      throw new Error(`Error creating delivery items: ${itemsError.message}`);
    }

    // Add note if provided
    if (notes?.trim()) {
      await deliveryService.createNote({
        deliveryId: delivery.id,
        text: notes,
      });
    }

    return res.status(200).json({
      message: "Delivery created successfully",
      delivery,
    });
  } catch (error) {
    console.error("Delivery creation error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
