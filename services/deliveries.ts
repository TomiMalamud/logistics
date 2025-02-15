// lib/services/deliveries.ts
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

interface CreateNoteParams {
  deliveryId: number;
  text: string;
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
  startDate?: string;
  endDate?: string;
}

interface ListOperationsParams {
  startDate: string;
  endDate: string;
  type: "delivery" | "cancellation";
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

const TYPE_ORDER: Record<DeliveryType, number> = {
  store_movement: 1,
  supplier_pickup: 2,
  home_delivery: 3,
  all: 4,
} as const;

const createDeliveryService = (supabase: SupabaseClient) => {
  const ensureProductsExist = async (
    products: Array<{ sku: string; name?: string }>
  ) => {
    // Get all products that don't exist in the database
    const { data: existingProducts, error: lookupError } = await supabase
      .from("products")
      .select("sku")
      .in(
        "sku",
        products.map((p) => p.sku)
      );

    if (lookupError) {
      throw new Error(`Error looking up products: ${lookupError.message}`);
    }

    const existingSkus = new Set(existingProducts?.map((p) => p.sku) || []);
    const missingSkus = products
      .filter((p) => !existingSkus.has(p.sku))
      .map((p) => p.sku);

    if (missingSkus.length > 0) {
      // If we have missing products, fetch them from ERP
      const { searchProducts } = await import("@/lib/api");
      const erpProducts = await searchProducts();

      const productsToUpsert = erpProducts.Items.filter(
        (product) =>
          missingSkus.includes(product.Codigo) && product.Estado === "Activo"
      ).map((product) => ({
        sku: product.Codigo,
        name: product.Nombre,
      }));

      if (productsToUpsert.length > 0) {
        const { error: insertError } = await supabase
          .from("products")
          .upsert(productsToUpsert);

        if (insertError) {
          throw new Error(`Error creating products: ${insertError.message}`);
        }
      }

      // Check if any required products are inactive or not found in ERP
      const syncedSkus = new Set(productsToUpsert.map((p) => p.sku));
      const unavailableSkus = missingSkus.filter((sku) => !syncedSkus.has(sku));

      if (unavailableSkus.length > 0) {
        throw new Error(
          `Some products are not available in ERP or are inactive: ${unavailableSkus.join(
            ", "
          )}`
        );
      }
    }
  };

  const createDeliveryItems = async (
    deliveryId: number,
    items: Array<{ product_sku: string; quantity: number; name?: string }>
  ) => {
    // First ensure all products exist
    await ensureProductsExist(
      items.map((item) => ({
        sku: item.product_sku,
        name: item.name,
      }))
    );

    // Create delivery items
    const deliveryItems = items.map((item) => ({
      delivery_id: deliveryId,
      product_sku: item.product_sku,
      quantity: item.quantity,
      pending_quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("delivery_items")
      .insert(deliveryItems);

    if (itemsError) {
      throw new Error(`Error creating delivery items: ${itemsError.message}`);
    }
  };

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
        customers ( name, address, phone, dni ),
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
          .order("type", { ascending: false })
          .order("scheduled_date")
          .order("order_date");
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
  const listOperations = async ({
    startDate,
    endDate,
    type,
  }: ListOperationsParams) => {
    try {
      const { data, error } = await supabase
        .from("delivery_operations")
        .select(
          `
          id,
          delivery:deliveries (
            id,
            type,
            customers (
              name,
              address,
              phone
            )
          ),
          operation_date,
          cost,
          pickup_store,
          carriers (
            name
          ),
          operation_items (
            quantity,
            products (
              name
            )
          )
        `
        )
        .eq("operation_type", type)
        .gte("operation_date", startDate)
        .lte("operation_date", endDate);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch operations",
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
  const processStoreMovement = async (
    operation: {
      delivery_id: number;
      pickup_store: string;
    },
    items: Array<{
      product_sku: string;
      quantity: number;
      store_id: string;
    }>,
    delivery: {
      origin_store: string;
      dest_store: string;
    }
  ) => {
    const { createInventoryMovement } = await import("@/lib/api");

    // Process each item as a separate inventory movement in the ERP
    await Promise.all(
      items.map(async (item) => {
        try {
          await createInventoryMovement({
            idDepositoOrigen: delivery.origin_store,
            idDepositoDestino: delivery.dest_store,
            codigo: item.product_sku,
            cantidad: item.quantity,
          });
        } catch (error) {
          console.error(`Error moving product ${item.product_sku}:`, error);
          throw error;
        }
      })
    );
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
    // Get the delivery details first
    const delivery = await getDelivery(deliveryId);

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

    // Handle store movement in ERP if this is a store movement delivery
    if (
      operationType === "delivery" &&
      delivery.type === "store_movement" &&
      items?.length &&
      delivery.origin_store &&
      delivery.dest_store
    ) {
      await processStoreMovement(operation, items, delivery);
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

  const createNote = async ({ deliveryId, text }: CreateNoteParams) => {
    try {
      // Validate delivery exists
      const delivery = await getDelivery(deliveryId);

      // Insert the note
      const { data, error } = await supabase
        .from("notes")
        .insert([
          {
            delivery_id: deliveryId,
            text,
          },
        ])
        .select("*");

      if (error) throw new Error(`Error creating note: ${error.message}`);
      if (!data?.length) throw new Error("Note created but no data returned");

      return { data: data[0] };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to create note",
      };
    }
  };

  return {
    validateItems,
    processItems,
    recordOperation,
    processStoreMovement,
    getDelivery,
    updateDelivery,
    handleNotifications,
    listDeliveries,
    searchCustomers,
    createNote,
    listOperations,
    createDeliveryItems,
  };
};

export { createDeliveryService };
export type {
  CreateNoteParams,
  DeliveryItem,
  ListDeliveriesParams,
  ProcessItemsParams,
  RecordOperationParams,
  UpdateDeliveryParams,
};
