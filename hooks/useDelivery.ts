// hooks/useDelivery.ts
import {
  DeliveredType,
  DeliveryState,
  Note,
  UseDeliveryLogicParams,
} from "@/types/types";
import { useState } from "react";
import { mutate } from "swr";

interface DeliveryMutationState {
  isLoading: {
    update: boolean;
    note: boolean;
    state: boolean;
    details: boolean;
  };
  error: string | null;
}

// hooks/useDelivery.ts
export interface DeliveryUpdateParams {
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: string;
  delivery_type?: DeliveredType;
  items?: {
    product_sku: string;
    quantity: number;
    store_id: string;
  }[];
  state?: DeliveryState;
}

interface DeliveryFeed {
  feed: Array<any>;
  page: number;
  totalPages: number;
  totalItems: number;
}

const isDeliveryFeed = (data: any): data is DeliveryFeed => {
  return data && "feed" in data && Array.isArray(data.feed);
};

export const useDelivery = ({ delivery, fetchURL }: UseDeliveryLogicParams) => {
  const [state, setState] = useState<DeliveryState>(delivery.state);
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (!delivery.scheduled_date) return "";
    return new Date(delivery.scheduled_date).toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState<Note[]>(delivery.notes ?? []);
  const [newNote, setNewNote] = useState("");
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [mutationState, setMutationState] = useState<DeliveryMutationState>({
    isLoading: {
      update: false,
      note: false,
      state: false,
      details: false,
    },
    error: null,
  });

  const updateDeliveryState = async (newState: DeliveryState) => {
    setState(newState);
    await handleStateChange({ state: newState });
  };

  const updateMutationState = (
    key: keyof DeliveryMutationState["isLoading"],
    isLoading: boolean,
    error: string | null = null
  ) => {
    setMutationState((prev) => ({
      isLoading: { ...prev.isLoading, [key]: isLoading },
      error,
    }));
  };

  const handleApiCall = async (
    key: keyof DeliveryMutationState["isLoading"],
    apiCall: () => Promise<any>
  ) => {
    updateMutationState(key, true);
    try {
      const result = await apiCall();
      return result;
    } catch (error: any) {
      updateMutationState(key, false, error.message);
      throw error;
    } finally {
      updateMutationState(key, false);
    }
  };

  const updateDeliveryDetails = async (data: {
    delivery_cost: number;
    carrier_id: number;
  }) => {
    return handleApiCall("details", async () => {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update delivery details");
      return response.json();
    });
  };

  const updateCache = async (newState: DeliveryState) => {
    if (!fetchURL) return;

    // Get all cached keys that match our pattern
    const cacheKeys = Object.keys(window?.["$swr"] || {})
      .filter((key) => key.startsWith("/api/deliveries"))
      .map((key) => key.replace(/^"(.*)"$/, "$1")); // Remove quotes if present

    // Update each relevant cache key
    for (const key of cacheKeys) {
      await mutate(
        key,
        async (currentData: any) => {
          if (!currentData || !isDeliveryFeed(currentData)) return currentData;

          const url = new URL(key, window.location.origin);
          const listState = url.searchParams.get("state") || "pending";

          // If this is the current state list, remove the item
          if (listState === state) {
            return {
              ...currentData,
              feed: currentData.feed.filter((item) => item.id !== delivery.id),
              totalItems: Math.max(0, currentData.totalItems - 1),
            };
          }

          // If this is the target state list, add the item
          if (listState === newState) {
            const updatedDelivery = {
              ...delivery,
              state: newState,
              // Include any additional updates
              ...(newState === "delivered" && {
                operations: [
                  ...(delivery.operations || []),
                  {
                    operation_type: "delivery",
                    operation_date: new Date().toISOString().split("T")[0],
                  },
                ],
              }),
            };

            return {
              ...currentData,
              feed: [updatedDelivery, ...currentData.feed],
              totalItems: currentData.totalItems + 1,
            };
          }

          return currentData;
        },
        false // Don't revalidate immediately
      );
    }

    // Force revalidation of all delivery-related cache keys
    await Promise.all(cacheKeys.map((key) => mutate(key)));
  };

  const handleStateChange = async (formData: DeliveryUpdateParams) => {
    return handleApiCall("state", async () => {
      if (state !== "pending") {
        throw new Error("Only pending deliveries can be marked as delivered");
      }

      const updateData = {
        state: "delivered",
        items: formData.items,
        ...(formData.delivery_type === "carrier" && {
          delivery_cost: formData.delivery_cost,
          carrier_id: formData.carrier_id,
          pickup_store: null,
        }),
        ...(formData.delivery_type === "pickup" && {
          pickup_store: formData.pickup_store,
          delivery_cost: null,
          carrier_id: null,
        }),
      };

      // Optimistically update the UI
      if (fetchURL) {
        await mutate(
          fetchURL,
          async (currentData: any) => {
            if (!currentData || !isDeliveryFeed(currentData))
              return currentData;
            return {
              ...currentData,
              feed: currentData.feed.filter((item) => item.id !== delivery.id),
              totalItems: Math.max(0, currentData.totalItems - 1),
            };
          },
          false // Don't revalidate immediately
        );
      }

      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If there's an error, revalidate to restore the correct state
        if (fetchURL) {
          await mutate(fetchURL);
        }
        throw new Error(errorData.error || "Failed to update delivery state");
      }

      setState("delivered");
      setShowStateDialog(false);

      // Revalidate after successful update
      if (fetchURL) {
        await mutate(fetchURL);
      }

      return await response.json();
    });
  };

  const handleCancellation = async () => {
    return handleApiCall("state", async () => {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "cancelled" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel delivery");
      }

      setState("cancelled");
      setShowStateDialog(false);

      // Force a fresh fetch from the API
      if (fetchURL) {
        await mutate(fetchURL, undefined, { revalidate: true });
      }

      return await response.json();
    });
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    return handleApiCall("note", async () => {
      const response = await fetch("/api/deliveries/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_id: delivery.id,
          text: newNote,
        }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      const { data } = await response.json();
      setNotes((prev) => [...prev, data]);
      setNewNote("");
    });
  };

  const updateScheduledDate = async () => {
    return handleApiCall("update", async () => {
      // Optimistically update the UI
      if (fetchURL) {
        await mutate(
          fetchURL,
          async (currentData: any) => {
            if (!currentData || !isDeliveryFeed(currentData))
              return currentData;
            return {
              ...currentData,
              feed: currentData.feed.map((item) => {
                if (item.id === delivery.id) {
                  return {
                    ...item,
                    scheduled_date: scheduledDate,
                  };
                }
                return item;
              }),
            };
          },
          false // Don't revalidate immediately
        );
      }

      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_date: scheduledDate }),
      });

      if (!response.ok) {
        // If there's an error, revalidate to restore the correct state
        if (fetchURL) {
          await mutate(fetchURL);
        }
        throw new Error("Failed to update scheduled date");
      }

      // Revalidate after successful update
      if (fetchURL) {
        await mutate(fetchURL);
      }

      return response.json();
    });
  };

  return {
    // State
    state,
    setState,
    scheduledDate,
    setScheduledDate,
    notes,
    newNote,
    setNewNote,
    showStateDialog,
    setShowStateDialog,
    isLoading: mutationState.isLoading,
    error: mutationState.error,

    // Actions
    updateDeliveryDetails,
    handleStateChange,
    handleCancellation,
    addNote,
    updateScheduledDate,
  };
};
