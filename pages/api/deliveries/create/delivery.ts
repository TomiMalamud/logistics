// pages/api/deliveries/create/delivery.ts
import { createOrUpdateContact, formatPerfitContact } from "@/lib/perfit";
import createClient from "@/lib/utils/supabase/api";
import { homeDeliverySchema } from "@/lib/validation/deliveries";
import { createDeliveryService } from "@/services/deliveries";
import { NextApiRequest, NextApiResponse } from "next";
import { titleCase } from "title-case";

const syncWithPerfit = async (email: string, name: string): Promise<void> => {
  try {
    const perfitContact = formatPerfitContact(
      email,
      titleCase(name.toLowerCase()),
    );
    await createOrUpdateContact(perfitContact);
  } catch (error) {
    console.error("Failed to sync contact with Perfit:", error);
    // Continue with delivery creation even if Perfit sync fails
  }
};

const findOrUpdateCustomer = async (supabase, customerData) => {
  try {
    // First try to find the customer by DNI
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("dni", customerData.dni)
      .maybeSingle();

    if (existingCustomer) {
      // Update customer information if they exist
      const { data: updatedCustomer, error: updateError } = await supabase
        .from("customers")
        .update({
          name: customerData.name,
          address: customerData.address,
          phone: customerData.phone,
          email: customerData.email,
        })
        .eq("id", existingCustomer.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update customer: ${updateError.message}`);
      }

      return updatedCustomer.id;
    }

    // Create new customer if they don't exist
    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert([
        {
          name: customerData.name,
          address: customerData.address,
          phone: customerData.phone,
          email: customerData.email,
          dni: customerData.dni,
        },
      ])
      .select()
      .single();

    if (createError || !newCustomer) {
      throw new Error(
        `Failed to create customer: ${createError?.message || "Unknown error"}`,
      );
    }

    return newCustomer.id;
  } catch (error) {
    throw error; // Re-throw the error to be caught by the handler
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

    // Validate request body using Zod
    const validationResult = homeDeliverySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: validationResult.error.errors[0].message,
      });
    }

    const {
      order_date,
      products,
      invoice_number,
      invoice_id,
      name,
      address,
      phone,
      dni,
      scheduled_date,
      notes,
      created_by,
      email,
      emailBypassReason,
      store_id,
    } = validationResult.data;

    // Sync with Perfit if email is provided
    if (email) {
      await syncWithPerfit(email, name);
    }

    // Find or create customer
    const customer_id = await findOrUpdateCustomer(supabase, {
      name,
      address,
      phone,
      email,
      dni,
    });

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

    // Create delivery items using the service helper
    await deliveryService.createDeliveryItems(
      delivery.id,
      products.map((p) => ({
        product_sku: p.sku,
        quantity: p.quantity,
        name: p.name,
      })),
    );

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
