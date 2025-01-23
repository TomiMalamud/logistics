// pages/api/deliveries/notes.ts

import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
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

    // Validate request body
    const { delivery_id, text } = req.body;
    if (!delivery_id || !text) {
      return res.status(400).json({
        error: "Missing required fields: delivery_id and text are required",
      });
    }

    // Create note using delivery service
    const deliveryService = createDeliveryService(supabase);
    const result = await deliveryService.createNote({
      deliveryId: delivery_id,
      text,
    });

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      message: "Note created successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error in notes API:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
