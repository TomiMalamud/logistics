import createClient from "@/lib/utils/supabase/api";
import { NextApiRequest, NextApiResponse } from "next";

interface CreatePaymentRequest {
  amount: number;
  payment_date: string;
  payment_method: "cash" | "bank_transfer";
  notes?: string;
  created_by: string;
  order_ids?: number[];
  is_advance_payment?: boolean;
}

const validateRequest = (body: CreatePaymentRequest): void => {
  const requiredFields = [
    "amount",
    "payment_date",
    "payment_method",
    "created_by",
  ];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  if (body.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!["cash", "bank_transfer"].includes(body.payment_method)) {
    throw new Error("Invalid payment method");
  }

  // Only validate order_ids if it's not an advance payment
  if (
    !body.is_advance_payment &&
    (!body.order_ids || body.order_ids.length === 0)
  ) {
    throw new Error("At least one order must be selected for regular payments");
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

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body as CreatePaymentRequest;
    validateRequest(body);

    const {
      amount,
      payment_date,
      payment_method,
      notes,
      created_by,
      order_ids,
      is_advance_payment,
    } = body;

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from("manufacturing_payments")
      .insert([
        {
          amount,
          payment_date: `${payment_date}T21:00:00.000Z`,
          payment_method,
          notes,
          created_by,
          is_advance_payment: !!is_advance_payment,
        },
      ])
      .select()
      .single();

    if (paymentError || !payment) {
      throw new Error(paymentError?.message || "Failed to create payment");
    }

    // Only update orders if this is not an advance payment and order_ids are provided
    if (!is_advance_payment && order_ids && order_ids.length > 0) {
      const { error: updateError } = await supabase
        .from("manufacturing_orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: payment.id,
        })
        .in("id", order_ids);

      if (updateError) {
        throw new Error(updateError?.message || "Failed to update orders");
      }
    }

    return res.status(200).json({
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
