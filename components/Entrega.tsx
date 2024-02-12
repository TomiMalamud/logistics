import { useState } from "react";
import { mutate } from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Calendar, Navigation, Phone } from "lucide-react";
import { Input } from "./ui/input";
import { titleCase } from "title-case";

import EstadoDialog from "./EstadoDialog";
import FechaProgramadaAlertDialog from "./FechaProgramadaDialog";
import { EntregaProps } from "../lib/types";
import { CopyToClipboard } from "./copy-to-clipboard";

const Entrega: React.FC<{
  entrega: EntregaProps;
  fetchURL?: string;
}> = ({ entrega, fetchURL }) => {
  const [fechaProgramada, setFechaProgramada] = useState(() => {
    if (!entrega.fecha_programada) return "";

    // Extract the date and time
    const fecha = new Date(entrega.fecha_programada);
    const dateString = fecha.toISOString().slice(0, 10); // Extract date
    const timeString = fecha.toISOString().slice(11, 16); // Extract time

    // Only include the time in the state if it's not "00:00"
    return timeString !== "03:00" ? `${dateString}T${timeString}` : dateString;
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isEstadoUpdated, setIsEstadoUpdated] = useState(entrega.estado);
  const [newNotas, setNewNotas] = useState(entrega.new_notas ?? []);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
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
  const isToday = (someDate) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
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
    // Create a date object interpreting the input as UTC
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format the date part in UTC
    const formattedDate = date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    });

    // Extract the time parts in UTC
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    // Append the UTC time to the formatted date string if it's not "00:00"
    if (!(hours === "00" && minutes === "00")) {
      const localTimeString = `a las ${hours}:${minutes}`;
      return `${formattedDate} ${localTimeString}`;
    }

    return formattedDate;
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
  const openInGoogleMaps = () => {
    if (!entrega.domicilio) {
      alert("No existe un domicilio registrado");
      return;
    }
  
    const encodedAddress = encodeURIComponent(entrega.domicilio);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, "_blank");
  };
  
  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      <div className="pb-4 border-b">
        <div className="flex space-x-2 items-center justify-between">
          <p className="text-slate-500 text-xs">
            Vendido en {entrega.punto_venta} | {titleCase(entrega.nombre)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <DotsVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 448 512"
                  height="15px"
                  width="15px"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
                </svg>
                <a className="ml-2" href={`https://wa.me/54${entrega.celular}`}>
                  WhatsApp
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone size={15} />
                <a className="ml-2" href={`tel:${entrega.celular}`}>
                  Llamar
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar size={15} className="mr-2" />
                <FechaProgramadaAlertDialog
                  fechaProgramada={fechaProgramada}
                  setFechaProgramada={setFechaProgramada}
                  handleConfirmFechaProgramada={handleConfirmFechaProgramada}
                  isConfirming={isUpdating}
                  handleDeleteFechaProgramada={handleDeleteFechaProgramada}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      </div>

      <Alert className="bg-slate-50">
        <AlertDescription>{titleCase(entrega.producto)}</AlertDescription>
      </Alert>

      <div className="flex py-2 items-center justify-between">
        <p className="text-sm text-slate-600 mr-5">{entrega.domicilio}</p>
        <Button variant="outline" onClick={openInGoogleMaps} className="flex items-center"><Navigation className="w-4 h-4 mr-2"></Navigation>Ir</Button>

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
      <div className="pt-2">
      <EstadoDialog
        isPaid={entrega.pagado}
        isEstadoUpdated={isEstadoUpdated}
        setShowEstadoAlertDialog={setShowEstadoAlertDialog}
        dni={dni}
        handleDniChange={handleDniChange}
        dniError={dniError}
        handleConfirmEstadoChange={handleConfirmEstadoChange}
        isConfirming={isConfirming}
      /></div>
    </div>
  );
};

export default Entrega;
