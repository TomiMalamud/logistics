import { useState } from "react";
import { mutate } from "swr";

import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

import { Input } from "./ui/input";
import { titleCase } from "title-case";

import PaymentStatusDialog from "./PaymentStatusDialog";
import PaymentStatusBadge from "./PaymentStatusBadge";
import EstadoDialog from "./EstadoDialog";
import FechaProgramadaAlertDialog from "./FechaProgramadaDialog";

export type EntregaProps = {
  id: string;
  punto_venta: string;
  fecha: Date;
  producto: string;
  domicilio: string;
  nombre: string;
  celular: string;
  notas: string;
  new_notas?: string[];
  estado: boolean;
  pagado: boolean;
  fecha_programada: Date;
  fetchURL?: string;
};

export type NotaType = {
  id: string;
  content: string;
  entrega_id: string;
};

const Entrega: React.FC<{ entrega: EntregaProps; fetchURL?: string }> = ({
  entrega,
  fetchURL
}) => {
  const [fechaProgramada, setFechaProgramada] = useState(() => {
    // Format the initial fecha_programada to the appropriate format if it exists
    return entrega.fecha_programada
      ? new Date(entrega.fecha_programada).toISOString().slice(0, 10) +
          "T00:00:00Z"
      : "";
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isEstadoUpdated, setIsEstadoUpdated] = useState(entrega.estado);
  const [newNotas, setNewNotas] = useState(entrega.new_notas ?? []);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPagadoUpdating, setIsPagadoUpdating] = useState(false);
  const [showEstadoAlertDialog, setShowEstadoAlertDialog] = useState(false); // New state for Estado AlertDialog visibility
  const [dni, setDni] = useState("");
  const [dniError, setDniError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDniChange = (e) => {
    setDni(e.target.value);
    setDniError(""); // Reset error message on new input
  };

  const validateDni = () => {
    const length = dni.length;
    return length === 7 || length === 8 || length === 11;
  };

  const updateField = async (fieldData) => {
    try {
      const response = await fetch(`/api/entregas/${entrega.id}`, {
        method: "PUT",
        body: JSON.stringify(fieldData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status !== 200) {
        throw new Error(`Failed to update`);
      }

      const updatedEntrega = await response.json();
      return updatedEntrega;
    } catch (error) {
      throw error;
    }
  };
  const togglePagado = () => {
    setIsPagadoUpdating(true);

    const newPagadoStatus = !entrega.pagado;

    updateField({ pagado: newPagadoStatus })
      .then(() => {
        mutate(fetchURL);
      })
      .catch((error) => {
        console.error("Failed to update pagado status: ", error);
      })
      .finally(() => {
        setIsPagadoUpdating(false);
      });
  };
  const handleConfirmEstadoChange = async () => {
    if (!validateDni()) {
      setDniError("El DNI debe tener 7, 8 o 11 dígitos.");
      return; // Prevent further action
    }
    setIsConfirming(true); // Start loading

    try {
      await toggleEstado(); // Assuming this is an async operation
      setShowEstadoAlertDialog(false); // Close the dialog
    } catch (error) {
      console.error("Failed to update estado: ", error);
    } finally {
      setIsConfirming(false); // Stop loading
    }
  };

  const toggleEstado = async () => {
    const newEstado = !isEstadoUpdated;
    setIsEstadoUpdated(newEstado);

    try {
      const response = await updateField({ estado: newEstado }); // Assuming updateField is async
      // Handle response if necessary
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating estado: ", error);
      setIsEstadoUpdated(!newEstado); // Revert state in case of error
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Format the date
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short"
    });
  };
  const handleDeleteFechaProgramada = async () => {
    setIsUpdating(true); // Show loading state
    
    try {
      await updateField({ fecha_programada: null }); // Update the backend
      setFechaProgramada(null); // Clear the input field by setting an empty string
      mutate(fetchURL); // Revalidate the data
    } catch (error) {
      console.error("Error deleting fecha_programada: ", error);
      // Optionally handle error state
    } finally {
      setIsUpdating(false); // Stop showing loading state
    }
  };
    
  
  const handleAddNote = async () => {
    setIsAddingNote(true);

    const timestamp = formatDate(new Date().toISOString());
    const updatedNote = `${newNote} | ${timestamp}`;

    const updatedNotas = [...newNotas, { content: updatedNote }];
    // @ts-ignore
    setNewNotas(updatedNotas);

    try {
      await updateField({ new_notas: [updatedNote] });
      setNewNote("");

      mutate(fetchURL);
    } catch (error) {
      setNewNotas(newNotas);
      console.error("Could not add note: ", error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleConfirmFechaProgramada = async () => {
    setIsUpdating(true);
    try {
      await updateField({ fecha_programada: fechaProgramada });
      mutate(fetchURL);
    } catch (error) {
      console.error("Error updating fecha_programada: ", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      <div className="flex justify-between text-sm pb-4 items-center text-slate-500  border-b">
        <div className="flex">
          <p>
            Vendido en {entrega.punto_venta} el {formatDate(entrega.fecha)}
          </p>
        </div>
        <div className="flex">
          <p>{entrega.nombre}</p>
          <span className="mx-2">|</span>
          <p className="text-slate-600 text-sm">{entrega.celular}</p>
          <span className="mx-2">|</span>
          <a
            className="text-blue-700 hover:text-blue-900"
            href={`https://wa.me/54${entrega.celular}`}
          >
            WhatsApp
          </a>
        </div>
      </div>
      <div className="flex items-center py-4 justify-between">
        {entrega.fecha_programada ? (
          <div>
            <h1 className="font-medium">Entrega programada</h1>
            <p className="text-sm mt-1 text-slate-500">
              Visitaremos el domicilio el {formatDate(entrega.fecha_programada)}
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
        <div className="space-x-2">
          <FechaProgramadaAlertDialog
            fechaProgramada={fechaProgramada}
            setFechaProgramada={setFechaProgramada}
            handleConfirmFechaProgramada={handleConfirmFechaProgramada}
            isConfirming={isUpdating}
            handleDeleteFechaProgramada={handleDeleteFechaProgramada}

          />          
          <EstadoDialog
            isPaid = {entrega.pagado}
            isEstadoUpdated={isEstadoUpdated}
            setShowEstadoAlertDialog={setShowEstadoAlertDialog}
            dni={dni}
            handleDniChange={handleDniChange}
            dniError={dniError}
            handleConfirmEstadoChange={handleConfirmEstadoChange}
            isConfirming={isConfirming}
          />
        </div>
      </div>

      <Alert className="bg-slate-50">
        <AlertDescription>{titleCase(entrega.producto)}</AlertDescription>
      </Alert>

      <div className="flex py-2 items-center justify-between">
        <p className="text-sm text-slate-600 mr-5">{entrega.domicilio}</p>
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
            <li className="text-sm text-slate-600  leading-6" key={index}>
              {/*// @ts-ignore*/}
              {note.content}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full space-x-2 pt-4 flex items-center justify-between">
        <Input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
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

export default Entrega;
