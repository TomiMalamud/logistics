// pages/api/deliveries/index.ts

import createClient from "@/lib/utils/supabase/api";
import type { NextApiRequest, NextApiResponse } from "next";
import { SupabaseClient } from "@supabase/supabase-js";
import { DeliveryState, DeliveryType } from "@/types/types";

// Types
type ScheduledDateFilter = "all" | "hasDate" | "noDate";

interface QueryParams {
  state: DeliveryState;
  page: string;
  pageSize: string;
  search: string;
  scheduledDate: ScheduledDateFilter;
  type: DeliveryType;
  carrier?: string;
}

interface FeedResponse {
  feed: any[];
  page: number;
  totalPages: number;
  totalItems: number;
}

interface ErrorResponse {
  error: string;
}

// Constants
const DEFAULT_PAGE_SIZE = "40";
const DEFAULT_STATE: DeliveryState = "pending";

// Helper functions
function validateQueryParams(
  params: Partial<QueryParams>
): params is QueryParams {
  const { state, scheduledDate } = params;

  if (state && !["pending", "delivered", "cancelled"].includes(state)) {
    throw new Error("Invalid state parameter");
  }

  if (scheduledDate && !["all", "hasDate", "noDate"].includes(scheduledDate)) {
    throw new Error("Invalid scheduledDate parameter");
  }

  return true;
}

async function getCustomerIds(supabase: SupabaseClient, search: string) {
  if (!search) return null;

  const searchTerm = `%${search}%`;
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`);

  if (error) {
    throw new Error("Failed to fetch customers");
  }

  return data;
}

async function buildDeliveryQuery(
  supabase: SupabaseClient,
  params: QueryParams,
  userId: string,
  userRole: string,
  customerIds: { id: number }[] | null
) {
  const { state, type, scheduledDate, page, pageSize } = params;
  const start = (Number(page) - 1) * Number(pageSize);
  const end = start + Number(pageSize) - 1;

  // For delivered state, we'll first get the max operation id for each delivery
  if (state === "delivered") {
    const deliveriesQuery = supabase
      .from("deliveries")
      .select(
        `
        *,
        customers ( name, address, phone ),
        notes ( id, text, created_at ),
        created_by:profiles ( email, name ),
        suppliers ( name ),
        delivery_items (
          product_sku,
          quantity,
          pending_quantity,
          products ( name )
        ),
        operations:delivery_operations (
          id,
          carrier_id,
          carriers (name),
          cost,
          operation_date,
          created_at,
          created_by,
          profiles (id, name),
          pickup_store,
          operation_type,
          operation_items (
            product_sku,
            quantity,
            products (name)
          )
        )
      `,
        { count: "exact" }
      )
      .eq("state", state);

    // Apply standard filters
    if (userRole === "sales") {
      deliveriesQuery.eq("created_by", userId);
    }

    if (type && type !== "all") {
      deliveriesQuery.eq("type", type);
    }

    if (customerIds) {
      deliveriesQuery.in(
        "customer_id",
        customerIds.map((c) => c.id)
      );
    }

    if (scheduledDate === "hasDate") {
      deliveriesQuery.not("scheduled_date", "is", null);
    } else if (scheduledDate === "noDate") {
      deliveriesQuery.is("scheduled_date", null);
    }

    // Order by the latest operation id by using a subquery
    return deliveriesQuery
      .order("id", { ascending: false })
      .range(start, end);
  }

  // For other states, use the original query structure
  let query = supabase
    .from("deliveries")
    .select(
      `
      *,
      customers ( name, address, phone ),
      notes ( id, text, created_at ),
      created_by:profiles ( email, name ),
      suppliers ( name ),
      delivery_items (
        product_sku,
        quantity,
        pending_quantity,
        products ( name )
      ),
      operations:delivery_operations (
        id,
        carrier_id,
        carriers (name),
        cost,
        operation_date,
        created_at,
        created_by,
        profiles (id, name),
        pickup_store,
        operation_type,
        operation_items (
          product_sku,
          quantity,
          products (name)
        )
      )
    `,
      { count: "exact" }
    )
    .eq("state", state);

  // Apply filters
  if (userRole === "sales") {
    query = query.eq("created_by", userId);
  }

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  if (customerIds) {
    query = query.in(
      "customer_id",
      customerIds.map((c) => c.id)
    );
  }

  if (scheduledDate === "hasDate") {
    query = query.not("scheduled_date", "is", null);
  } else if (scheduledDate === "noDate") {
    query = query.is("scheduled_date", null);
  }

  // Apply appropriate sorting
  if (state === "pending") {
    query = query
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("order_date", { ascending: true });
  } else {
    query = query.order("order_date", { ascending: false });
  }

  return query.range(start, end);
}

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(req, res);

    // Authentication
    const {
      data: { user },
      error: userError
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

    // Parse and validate query parameters
    const queryParams = {
      state: (req.query.state as DeliveryState) || DEFAULT_STATE,
      page: (req.query.page as string) || "1",
      pageSize: (req.query.pageSize as string) || DEFAULT_PAGE_SIZE,
      search: (req.query.search as string) || "",
      scheduledDate: (req.query.scheduledDate as ScheduledDateFilter) || "all",
      type: (req.query.type as DeliveryType) || "all",
      carrier: (req.query.carrier as string) || "all"
    };

    validateQueryParams(queryParams);

    // Get matching customer IDs for search
    const customerIds = await getCustomerIds(supabase, queryParams.search);

    // Build and execute query
    const query = await buildDeliveryQuery(
      supabase,
      queryParams,
      user.id,
      profile.role,
      customerIds
    );

    const { data, error, count } = await query;

    if (error) throw new Error("Failed to fetch deliveries");
    if (!data || count === null)
      throw new Error("Invalid response from database");

    return res.status(200).json({
      feed: data,
      page: Number(queryParams.page),
      totalPages: Math.ceil(count / Number(queryParams.pageSize)),
      totalItems: count
    });
  } catch (error) {
    console.error("Error in deliveries API:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred"
    });
  }
}
