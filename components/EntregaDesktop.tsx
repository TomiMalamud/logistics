import { useState } from "react";
import { mutate } from "swr";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

import { Input } from "./ui/input";
import { titleCase } from "title-case";

import PaymentStatusDialog from "./PaymentStatusDialog";
import PaymentStatusBadge from "./PaymentStatusBadge";
import EstadoDialog from "./EstadoDialog";
import FechaProgramadaAlertDialog from "./FechaProgramadaDialog";

interface Customer {
  nombre: string;
  domicilio: string;
  celular?: string; // If celular is part of customers
}

interface Note {
  id: number;
  text: string;
  created_at?: string;
}

interface Entrega {
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

const EntregaDesktop: React.FC<{
  entrega: Entrega;
  fetchURL?: string;
}> = ({ entrega, fetchURL }) => {
  const [fechaProgramada, setFechaProgramada] = useState(() => {
    if (!entrega.fecha_programada) return "";
    const fecha = new Date(entrega.fecha_programada);
    return fecha.toISOString().slice(0, 10); // Only take the date part (YYYY-MM-DD)
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
  const [error, setError] = useState<string | null>(null); // For user feedback

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

    const someDateUTC = someDate.toISOString().slice(0, 10);
    const todayUTC = today.toISOString().slice(0, 10);

    return someDateUTC === todayUTC;
  };

  const updateField = async (fieldData: Partial<Entrega>) => {
    try {
      const response = await fetch(`/api/delivery/${entrega.id}`, {
        method: "PUT",
        body: JSON.stringify(fieldData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`);
      }

      const updatedEntrega = await response.json();
      return updatedEntrega;
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
      console.error("Error al cargar el estado de pago:", error);
      setError("No se pudo actualizar el estado de pago.");
    } finally {
      setIsPagadoUpdating(false);
    }
  };

  const handleConfirmEstadoChange = async () => {
    if (!validateDni()) {
      setDniError("El DNI debe tener 7, 8 o 11 dígitos.");
      return;
    }
    setIsConfirming(true);

    try {
      await toggleEstado();
      setShowEstadoAlertDialog(false);
    } catch (error) {
      console.error("Failed to update estado:", error);
      setError("No se pudo actualizar el estado.");
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
      setEstado(entrega.estado); // Revert on error
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
      month: "short"
    });
  };

  const formatNoteDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false    });
  };

  const handleAddNote = async () => {
    setIsAddingNote(true);
    setError(null);

    const updatedNoteText = `${newNote}`;

    try {
      // Send a POST request to the new notes endpoint
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          delivery_id: entrega.id,
          text: updatedNoteText
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add note: ${response.statusText}`);
      }

      const result = await response.json();

      const newNoteData = result.data[0];
      setNewNotas([
        ...newNotas,
        {
          id: newNoteData.id,
          text: newNoteData.text,
          created_at: newNoteData.created_at
        }
      ]);
      setNewNote("");
      mutate(fetchURL);
    } catch (error: any) {
      console.error("Could not add note:", error);
      setError("No se pudo agregar la nota.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const formatArgentinePhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return "Número no disponible";

    const parsedNumber = parsePhoneNumberFromString(phoneNumber, "AR");
    if (parsedNumber) {
      let formattedNumber = parsedNumber.formatInternational();
      formattedNumber = formattedNumber.replace("+54 ", "");
      return formattedNumber;
    }
    return "El número de teléfono es inválido";
  };

  const handleConfirmFechaProgramada = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateField({ fecha_programada: fechaProgramada });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating fecha_programada:", error);
      setError("No se pudo actualizar la fecha programada.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between text-sm pb-4 items-center text-slate-500 border-b">
        <div className="flex items-center">
          <p className="font-bold text-lg">
            {titleCase(entrega.customers.nombre)}
          </p>
          <span className="mx-2">|</span>
          {entrega.customers.celular && (
            <>
              <p className="text-slate-600 text-sm">
                {formatArgentinePhoneNumber(entrega.customers.celular)}
              </p>
              <span className="mx-2">|</span>
              <a
                className="text-blue-700 hover:text-blue-900"
                href={`https://wa.me/54${entrega.customers.celular}`}
              >
                WhatsApp
              </a>
            </>
          )}
        </div>
        <div className="flex items-center">
          <p>
            Vendido en {entrega.punto_venta} el{" "}
            {formatDate(entrega.fecha_venta)}
          </p>
        </div>
      </div>

      <div className="flex items-center py-4 justify-between">
        {isUpdating ? (
          <div>
            <h1 className="font-medium text-slate-500">
              Actualizando fecha de entrega...
            </h1>
            <p className="text-sm mt-1 text-slate-500">
              Visitaremos el domicilio...
            </p>
          </div>
        ) : entrega.fecha_programada ? (
          <div>
            <h1 className="font-medium">Entrega programada</h1>
            <p className="text-sm mt-1 text-slate-500">
              {isToday(new Date(entrega.fecha_programada)) ? (
                <span>
                  Visitaremos el domicilio{" "}
                  <span className="font-bold text-black">
                    hoy, {formatDate(entrega.fecha_programada)}
                  </span>
                </span>
              ) : (
                <span>
                  Visitaremos el domicilio el{" "}
                  <span className="font-bold">
                    {formatDate(entrega.fecha_programada)}
                  </span>
                </span>
              )}
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-orange-500">Fecha de entrega no programada</h1>
            <p className="text-sm mt-1 text-slate-500">
              Coordinar cuanto antes con el cliente
            </p>
          </div>
        )}

        <div className="space-x-2 flex">
          <Button variant="outline">
            <FechaProgramadaAlertDialog
              fechaProgramada={fechaProgramada}
              setFechaProgramada={setFechaProgramada}
              handleConfirmFechaProgramada={handleConfirmFechaProgramada}
              isConfirming={isUpdating}
            />
          </Button>
          <div className="w-24">
            <EstadoDialog
              isPaid={entrega.pagado}
              estado={estado}
              setEstado={setEstado}
              setShowEstadoAlertDialog={setShowEstadoAlertDialog}
              dni={dni}
              handleDniChange={handleDniChange}
              dniError={dniError}
              handleConfirmEstadoChange={handleConfirmEstadoChange}
              isConfirming={isConfirming}
            />
          </div>
        </div>
      </div>

      <Alert className="bg-slate-50">
        <AlertDescription>{titleCase(entrega.producto)}</AlertDescription>
      </Alert>

      <div className="flex py-2 items-center justify-between">
        <p className="text-sm text-slate-600 mr-5">
          {entrega.customers.domicilio}
        </p>
      </div>

      <div className="pb-2">
        <PaymentStatusBadge isPaid={entrega.pagado} />
        <PaymentStatusDialog
          isPaid={entrega.pagado}
          onConfirm={togglePagado}
          onDisabled={isPagadoUpdating}
        />
      </div>

      <div className="border-t pt-4">
        <ul className="list-disc list-inside">
          {newNotas.map((note, index) => (
            <li className="text-sm text-slate-600 leading-6" key={index}>
              {note.text} | {formatNoteDate(note.created_at)}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full space-x-2 pt-4 flex items-center justify-between">
        <Input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isAddingNote && newNote.trim()) {
              handleAddNote();
            }
          }}
          placeholder="Añadir nueva nota"
          disabled={isAddingNote}
        />
        <Button
          variant="outline"
          onClick={handleAddNote}
          disabled={isAddingNote || !newNote.trim()}
        >
          {isAddingNote ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
};

export default EntregaDesktop;
