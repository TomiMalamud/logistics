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
      if (fetchURL) await mutate(fetchURL);
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

      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update delivery state");

      setState("delivered");
      setShowStateDialog(false);
      return response.json();
    });
  };

  const handleCancellation = async () => {
    return handleApiCall("state", async () => {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "cancelled" }),
      });

      if (!response.ok) throw new Error("Failed to cancel delivery");

      setState("cancelled");
      setShowStateDialog(false);
      return response.json();
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
      setNotes((prev) => [...prev, data[0]]);
      setNewNote("");
    });
  };

  const updateScheduledDate = async () => {
    return handleApiCall("update", async () => {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_date: scheduledDate }),
      });

      if (!response.ok) throw new Error("Failed to update scheduled date");
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
