// useDeliveryLogic.ts

import { useState } from "react";
import { mutate } from "swr";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Note, Delivery, UseDeliveryLogicParams } from "types/types";


export const useDeliveryLogic = ({ delivery: delivery, fetchURL }: UseDeliveryLogicParams) => {
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
  const [dni, setDni] = useState("");
  const [dniError, setDniError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers and utility functions
  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDni(e.target.value);
    setDniError("");
  };

  const validateDni = () => {
    const length = dni.length;
    return length === 7 || length === 8 || length === 11;
  };

  const isToday = (someDate: Date) => {
    return new Date().toISOString().split('T')[0] === new Date(someDate).toISOString().split('T')[0]
  };

  const updateField = async (fieldData: Partial<Delivery>) => {
    try {
      const response = await fetch(`/api/delivery/${delivery.id}`, {
        method: "PUT",
        body: JSON.stringify(fieldData),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };


  const handleConfirmStateChange = async () => {
    if (!validateDni()) {
      setDniError("DNI must be 7, 8, or 11 digits.");
      return;
    }
    setIsConfirming(true);

    try {
      await toggleState();
      setShowStateAlertDialog(false);
    } catch (error) {
      console.error("Failed to update state:", error);
      setError("Unable to update status.");
    } finally {
      setIsConfirming(false);
    }
  };

  const toggleState = async () => {
    const newState = state === "delivered" ? "pending" : "delivered";
    setState(newState);

    try {
      await updateField({ state: newState });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating state:", error);
      setState(delivery.state);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    });
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
      hour12: false,
    });
  };

  const handleAddNote = async () => {
    setIsAddingNote(true);
    setError(null);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_id: delivery.id,
          text: newNote,
        }),
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
    dni,
    dniError,
    handleDniChange,
    handleConfirmStateChange,
    isConfirming,
    error,
    setError,

    // Utility functions
    isToday,
    formatDate,
    formatNoteDate,
    formatArgentinePhoneNumber,

    // Action handlers
    handleAddNote,
    handleConfirmScheduledDate,
    handleDeleteScheduledDate,
    openInGoogleMaps: () => {
      if (!delivery.customers.address) {
        alert("No registered address available");
        return;
      }
      const encodedAddress = encodeURIComponent(delivery.customers.address);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank"
      );
    },
  };
};
