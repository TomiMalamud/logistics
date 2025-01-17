// useDeliveryLogic.ts

import { useState } from "react";
import { mutate } from "swr";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Note, Delivery, UseDeliveryLogicParams, Store, DeliveredType } from "types/types";

export const useDeliveryLogic = ({
  delivery: delivery,
  fetchURL
}: UseDeliveryLogicParams) => {
  // State variables
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (!delivery.scheduled_date) return "";
    const date = new Date(delivery.scheduled_date);
    return date.toISOString().slice(0, 10);
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [state, setState] = useState(delivery.state);
  const [newNotas, setNewNotas] = useState<Note[]>(delivery.notes ?? []);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showStateAlertDialog, setShowStateAlertDialog] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingDeliveryDetails, setIsUpdatingDeliveryDetails] =
    useState(false);
  const handleUpdateDeliveryDetails = async (data: {
    delivery_cost: number;
    carrier_id: number;
  }) => {
    setIsUpdatingDeliveryDetails(true);
    try {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to update delivery details");

      // Refresh the delivery data
      if (fetchURL) {
        await mutate(fetchURL);
      }
    } catch (error) {
      console.error("Error updating delivery details:", error);
      setError("Error al actualizar los detalles de envío");
    } finally {
      setIsUpdatingDeliveryDetails(false);
    }
  };


  const isToday = (someDate: Date) => {
    return (
      new Date().toISOString().split("T")[0] ===
      new Date(someDate).toISOString().split("T")[0]
    );
  };

  const updateField = async (fieldData: Partial<Delivery>) => {
    try {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        body: JSON.stringify(fieldData),
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmStateChange = async (formData: {
    delivery_cost?: number;
    carrier_id?: number;
    pickup_store?: Store;
    delivery_type: DeliveredType;
  }) => {
    setIsConfirming(true);
  
    try {
      // Determine the new state based on current state
      let newState;
      if (state === "cancelled") {
        newState = "pending"; // Allow uncancelling
      } else if (state === "delivered") {
        newState = "pending";
      } else if (state === "pending") {
        newState = "delivered";
      }
  
      // Prepare update data
      const updateData = {
        state: newState,
        ...(newState === "delivered" && {
          ...(formData.delivery_type === "carrier" && {
            delivery_cost: formData.delivery_cost,
            carrier_id: formData.carrier_id,
            pickup_store: null
          }),
          ...(formData.delivery_type === "pickup" && {
            pickup_store: formData.pickup_store,
            delivery_cost: null,
            carrier_id: null
          })
        })
      };
  
      await updateField(updateData);
      setState(newState);
      setShowStateAlertDialog(false);
      mutate(fetchURL);
    } catch (error) {
      console.error("Failed to update state:", error);
      setError("Unable to update status.");
    } finally {
      setIsConfirming(false);
    }
  };
  
  const handleCancelDelivery = async () => {
    setIsConfirming(true);
    try {
      await updateField({ state: "cancelled" });
      setState("cancelled");
      setShowStateAlertDialog(false);
      mutate(fetchURL);
    } catch (error) {
      console.error("Failed to cancel delivery:", error);
      setError("Unable to cancel delivery.");
    } finally {
      setIsConfirming(false);
    }
  };

  const formatNoteDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const handleAddNote = async () => {
    setIsAddingNote(true);
    setError(null);

    try {
      const response = await fetch("/api/deliveries/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_id: delivery.id,
          text: newNote
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add note: ${response.statusText}`);
      }

      const result = await response.json();
      const newNoteData = result.data[0];
      setNewNotas([...newNotas, newNoteData]);
      setNewNote("");
      mutate(fetchURL);
    } catch (error) {
      console.error("Could not add note:", error);
      setError("Unable to add note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const formatArgentinePhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return "Number not available";

    const parsedNumber = parsePhoneNumberFromString(phoneNumber, "AR");
    return parsedNumber
      ? parsedNumber.formatInternational().replace("+54 ", "")
      : "Invalid phone number";
  };

  const handleConfirmScheduledDate = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateField({ scheduled_date: scheduledDate });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating scheduled date:", error);
      setError("Unable to update scheduled date.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteScheduledDate = async () => {
    setIsUpdating(true);

    try {
      await updateField({ scheduled_date: null });
      setScheduledDate("");
      mutate(fetchURL);
    } catch (error) {
      console.error("Error deleting scheduled date:", error);
      setError("Unable to delete scheduled date.");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    // State variables
    scheduledDate,
    setScheduledDate,
    isUpdating,
    state,
    setState,
    newNotas,
    newNote,
    setNewNote,
    isAddingNote,
    showStateAlertDialog,
    setShowStateAlertDialog,
    handleConfirmStateChange,
    isConfirming,
    error,
    setError,
    isUpdatingDeliveryDetails,


    // Utility functions
    isToday,
    formatNoteDate,
    formatArgentinePhoneNumber,

    // Action handlers
    handleAddNote,
    handleConfirmScheduledDate,
    handleCancelDelivery,
    handleDeleteScheduledDate,
    handleUpdateDeliveryDetails,      
  };
};
