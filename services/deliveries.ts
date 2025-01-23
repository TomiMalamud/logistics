// lib/services/delivery.ts
import {
  Delivery,
  DeliveryState,
  DeliveryType,
  Product,
  Store,
} from "@/types/types";
import { SupabaseClient } from "@supabase/supabase-js";

interface DeliveryItem {
  product_sku: string;
  quantity: number;
  store_id: string;
}

interface ListDeliveriesParams {
  state: DeliveryState;
  page: number;
  pageSize: number;
  search?: string;
  scheduledDate?: "all" | "hasDate" | "noDate";
  type?: DeliveryType;
  userId?: string;
  userRole?: string;
}

interface ProcessItemsParams {
  operationId: number;
  deliveryId: number;
  items: DeliveryItem[];
}

interface RecordOperationParams {
  deliveryId: number;
  userId: string;
  operationType: "delivery" | "cancellation";
  carrierId?: number;
  deliveryCost?: number;
  pickupStore?: Store;
  items?: DeliveryItem[];
}

interface UpdateDeliveryParams {
  id: number;
  state?: DeliveryState;
  scheduledDate?: string | null;
}

const createDeliveryService = (supabase: SupabaseClient) => {
  const validateItems = async (deliveryId: number, items: DeliveryItem[]) => {
    const { data, error } = await supabase
      .from("delivery_items")
      .select("product_sku, pending_quantity")
      .eq("delivery_id", deliveryId);

    if (error) throw new Error("Failed to validate delivery items");
    if (!data) throw new Error("No delivery items found");

    for (const item of items) {
      if (!item.store_id) {
        throw new Error(`Store ID is required for product ${item.product_sku}`);
      }

      const existingItem = data.find((d) => d.product_sku === item.product_sku);
      if (!existingItem) {
        throw new Error(`Product ${item.product_sku} not found in delivery`);
      }
      if (existingItem.pending_quantity < item.quantity) {
        throw new Error(
          `Invalid quantity for product ${item.product_sku}. ` +
            `Requested: ${item.quantity}, Available: ${existingItem.pending_quantity}`
        );
      }
    }
  };

  const searchCustomers = async (search: string) => {
    if (!search) return null;

    const searchTerm = `%${search}%`;
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`);

    if (error) throw new Error("Failed to fetch customers");
    return data;
  };

  // lib/services/delivery.ts

  const listDeliveries = async ({
    state,
    page,
    pageSize,
    search,
    scheduledDate,
    type,
    userId,
    userRole,
  }: ListDeliveriesParams) => {
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

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
            store_id,
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

      if (search) {
        const customerIds = await searchCustomers(search);
        if (customerIds?.length) {
          query = query.in(
            "customer_id",
            customerIds.map((c) => c.id)
          );
        } else {
          return { data: [], count: 0 }; // No matching customers
        }
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

      const { data, error, count } = await query.range(start, end);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return { data, count };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };
  const processItems = async ({
    operationId,
    deliveryId,
    items,
  }: ProcessItemsParams) => {
    // Create operation items
    const { error: opItemsError } = await supabase
      .from("operation_items")
      .insert(
        items.map((item) => ({
          operation_id: operationId,
          product_sku: item.product_sku,
          quantity: item.quantity,
          store_id: item.store_id,
        }))
      );

    if (opItemsError) {
      throw new Error(
        `Error creating operation items: ${opItemsError.message}`
      );
    }

    // Update pending quantities
    for (const item of items) {
      const { error: updateError } = await supabase.rpc(
        "update_pending_quantity",
        {
          p_delivery_id: deliveryId,
          p_product_sku: item.product_sku,
          p_quantity: item.quantity,
        }
      );

      if (updateError) {
        throw new Error(
          `Error updating pending quantity: ${updateError.message}`
        );
      }
    }

    // Check if all items are delivered
    const { data: remainingItems, error: checkError } = await supabase
      .from("delivery_items")
      .select("pending_quantity")
      .eq("delivery_id", deliveryId)
      .gt("pending_quantity", 0);

    if (checkError) {
      throw new Error(`Error checking remaining items: ${checkError.message}`);
    }

    return !remainingItems?.length;
  };

  const recordOperation = async ({
    deliveryId,
    userId,
    operationType,
    carrierId,
    deliveryCost,
    pickupStore,
    items,
  }: RecordOperationParams) => {
    // For delivery operations, validate that either carrier info or pickup_store is provided
    if (operationType === "delivery") {
      if (pickupStore) {
        carrierId = null;
        deliveryCost = null;
      } else if (!carrierId || !deliveryCost) {
        throw new Error(
          "Either pickup_store or both carrier_id and delivery_cost must be provided for delivery operations"
        );
      }
    }

    // Create operation record
    const { data: operation, error: operationError } = await supabase
      .from("delivery_operations")
      .insert({
        delivery_id: deliveryId,
        carrier_id: carrierId,
        cost: deliveryCost,
        operation_date: new Date().toISOString().split("T")[0],
        created_by: userId,
        pickup_store: pickupStore,
        operation_type: operationType,
      })
      .select()
      .single();

    if (operationError) {
      throw new Error(`Error creating operation: ${operationError.message}`);
    }

    // Process items only for deliveries
    if (operationType === "delivery" && items?.length) {
      return await processItems({
        operationId: operation.id,
        deliveryId,
        items,
      });
    }

    return false;
  };

  const getDelivery = async (id: number) => {
    const { data: delivery, error } = await supabase
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
          pickup_store,
          operation_type,
          operation_items (
            product_sku,
            quantity,
            products (name)
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!delivery) throw new Error("Delivery not found");

    return delivery;
  };

  const updateDelivery = async ({
    id,
    state,
    scheduledDate,
  }: UpdateDeliveryParams) => {
    const updates = {
      ...(state && {
        state,
        ...(state === "cancelled" && { scheduled_date: null }),
      }),
      ...(scheduledDate !== undefined && { scheduled_date: scheduledDate }),
    };

    const { error } = await supabase
      .from("deliveries")
      .update(updates)
      .eq("id", id);

    if (error) throw new Error(`Error updating delivery: ${error.message}`);
  };

  const handleNotifications = async (delivery: Delivery) => {
    if (delivery.created_by?.email && delivery.customers) {
      const { scheduleFollowUpEmail } = await import("@/lib/utils/resend");
      await scheduleFollowUpEmail({
        salesPersonEmail: delivery.created_by.email,
        salesPersonName: delivery.created_by.name,
        customerName: delivery.customers.name || "Cliente",
        customerPhone: delivery.customers.phone || "",
      });
    }

    if (delivery.customers?.email) {
      const { triggerEmail } = await import("@/lib/utils/email");
      const hasGani = (delivery.products as Product[])?.some((p) =>
        p.name.toLowerCase().includes("colchon gani")
      );

      if (hasGani) {
        await triggerEmail(delivery.customers.email, "gani_warranty");
      }
      await triggerEmail(delivery.customers.email, "review_request");
    }
  };

  return {
    validateItems,
    processItems,
    recordOperation,
    getDelivery,
    updateDelivery,
    handleNotifications,
    listDeliveries,
    searchCustomers,
  };
};

export { createDeliveryService };
export type {
  DeliveryItem,
  ProcessItemsParams,
  RecordOperationParams,
  UpdateDeliveryParams,
};
