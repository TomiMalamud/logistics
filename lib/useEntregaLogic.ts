// useEntregaLogic.ts

import { useState } from "react";
import { mutate } from "swr";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface Customer {
  nombre: string;
  domicilio: string;
  celular?: string;
}

interface Note {
  id: number;
  text: string;
  created_at?: string;
}

interface EntregaType {
  id: number;
  punto_venta: string;
  fecha_venta: string;
  producto: string;
  customer_id: number;
  pagado: boolean;
  estado: string;
  fecha_programada: string | null;
  created_at: string;
  created_by: string | null;
  customers: Customer;
  notes?: Note[];
}

interface UseEntregaLogicParams {
  entrega: EntregaType;
  fetchURL?: string;
}

export const useEntregaLogic = ({ entrega, fetchURL }: UseEntregaLogicParams) => {
  // State variables
  const [fechaProgramada, setFechaProgramada] = useState(() => {
    if (!entrega.fecha_programada) return "";
    const fecha = new Date(entrega.fecha_programada);
    return fecha.toISOString().slice(0, 10);
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [estado, setEstado] = useState(entrega.estado);
  const [newNotas, setNewNotas] = useState<Note[]>(entrega.notes ?? []);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPagadoUpdating, setIsPagadoUpdating] = useState(false);
  const [showEstadoAlertDialog, setShowEstadoAlertDialog] = useState(false);
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
    const today = new Date();
    return someDate.toDateString() === today.toDateString();
  };

  const updateField = async (fieldData: Partial<EntregaType>) => {
    try {
      const response = await fetch(`/api/delivery/${entrega.id}`, {
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

  const togglePagado = async () => {
    setIsPagadoUpdating(true);
    setError(null);

    const newPagadoStatus = !entrega.pagado;

    try {
      await updateField({ pagado: newPagadoStatus });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating payment status:", error);
      setError("Unable to update payment status.");
    } finally {
      setIsPagadoUpdating(false);
    }
  };

  const handleConfirmEstadoChange = async () => {
    if (!validateDni()) {
      setDniError("DNI must be 7, 8, or 11 digits.");
      return;
    }
    setIsConfirming(true);

    try {
      await toggleEstado();
      setShowEstadoAlertDialog(false);
    } catch (error) {
      console.error("Failed to update estado:", error);
      setError("Unable to update status.");
    } finally {
      setIsConfirming(false);
    }
  };

  const toggleEstado = async () => {
    const newEstado = estado === "delivered" ? "pending" : "delivered";
    setEstado(newEstado);

    try {
      await updateField({ estado: newEstado });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating estado:", error);
      setEstado(entrega.estado);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
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
          delivery_id: entrega.id,
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

  const handleConfirmFechaProgramada = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateField({ fecha_programada: fechaProgramada });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating scheduled date:", error);
      setError("Unable to update scheduled date.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteFechaProgramada = async () => {
    setIsUpdating(true);

    try {
      await updateField({ fecha_programada: null });
      setFechaProgramada("");
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
    fechaProgramada,
    setFechaProgramada,
    isUpdating,
    estado,
    setEstado,
    newNotas,
    newNote,
    setNewNote,
    isAddingNote,
    isPagadoUpdating,
    showEstadoAlertDialog,
    setShowEstadoAlertDialog,
    dni,
    dniError,
    handleDniChange,
    handleConfirmEstadoChange,
    isConfirming,
    error,
    setError,

    // Utility functions
    isToday,
    formatDate,
    formatNoteDate,
    formatArgentinePhoneNumber,

    // Action handlers
    togglePagado,
    handleAddNote,
    handleConfirmFechaProgramada,
    handleDeleteFechaProgramada,
    openInGoogleMaps: () => {
      if (!entrega.customers.domicilio) {
        alert("No registered address available");
        return;
      }
      const encodedAddress = encodeURIComponent(entrega.customers.domicilio);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank"
      );
    },
  };
};
