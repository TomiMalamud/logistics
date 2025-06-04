// pages/api/deliveries/index.ts
import createClient from "@/lib/utils/supabase/api";
import { createDeliveryService } from "@/services/deliveries";
import type { NextApiRequest, NextApiResponse } from "next";
import { DeliveryState, DeliveryType } from "@/types/types";

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_STATE: DeliveryState = "pending";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(req, res);
    const deliveryService = createDeliveryService(supabase);

    // Authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to fetch user role");
    }

    // Parse query parameters
    const {
      state = DEFAULT_STATE,
      page = "1",
      pageSize = String(DEFAULT_PAGE_SIZE),
      search = "",
      scheduledDate = "all",
      type = "all",
    } = req.query;

    // Validate state parameter
    if (!["pending", "delivered", "cancelled"].includes(state as string)) {
      return res.status(400).json({ error: "Invalid state parameter" });
    }

    // Validate scheduledDate parameter
    if (!["all", "hasDate", "noDate", "thisWeek", "next30days", "longTerm"].includes(scheduledDate as string)) {
      return res.status(400).json({ error: "Invalid scheduledDate parameter" });
    }

    const result = await deliveryService.listDeliveries({
      state: state as DeliveryState,
      page: Number(page),
      pageSize: Number(pageSize),
      search: search as string,
      scheduledDate: scheduledDate as "all" | "hasDate" | "noDate" | "thisWeek" | "next30days" | "longTerm",
      type: type as DeliveryType,
      userId: user.id,
      userRole: profile.role,
    });

    if ("error" in result) {
      throw new Error(result.error);
    }

    const { data, count } = result;

    return res.status(200).json({
      feed: data,
      page: Number(page),
      totalPages: Math.ceil(count / Number(pageSize)),
      totalItems: count,
    });
  } catch (error) {
    console.error("Error in deliveries API:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
