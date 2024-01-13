import React, { useState } from "react";
import { CopyToClipboard } from "./copy-to-clipboard";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { mutate } from "swr";

import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "./ui/collapsible";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "./ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEstadoUpdated, setIsEstadoUpdated] = useState(entrega.estado);
  const [newNotas, setNewNotas] = useState(entrega.new_notas ?? []);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPagadoUpdating, setIsPagadoUpdating] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
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
  const handleConfirmPaymentReceived = () => {
    togglePagado();
    setShowAlertDialog(false); // Close the dialog after confirmation
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
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const serverDate = new Date(year, month, day);

    return serverDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit"
    });
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

  return (
    <div className="space-y-2">
      {entrega.pagado == true ? (
        <div className="justify-between items-center flex">
          <Badge
            variant="outline"
            className=" bg-green-50 border-green-400 text-slate-600 font-normal"
          >
            Pagado
          </Badge>
          <Button
            variant="link"
            className="text-xs h-4 text-slate-600"
            disabled={isPagadoUpdating}
            onClick={togglePagado}
          >
            Marcar pago pendiente
          </Button>{" "}
        </div>
      ) : (
        <div className="justify-between items-center flex">
          <Badge
            variant="outline"
            className=" bg-yellow-50 border-yellow-400 text-slate-600 font-normal"
          >
            Falta cobrar
          </Badge>
          {/* AlertDialog for Confirming Payment */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="link"
                className="text-xs h-4 text-slate-600"
                disabled={isPagadoUpdating}
                onClick={() => setShowAlertDialog(true)}
              >
                Marcar pago recibido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Entrega cobrada en su totalidad
                </AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro que querés marcar el pago como recibido?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowAlertDialog(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmPaymentReceived}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="flex items-center text-slate-500">
        <p className="text-sm">
          Vendido en {entrega.punto_venta} el {formatDate(entrega.fecha)}
        </p>
        <span className="mx-2 text-sm">·</span>
        <p className="text-sm">{entrega.nombre}</p>
      </div>
      <Collapsible className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-bold">{entrega.producto}</p>
          <CollapsibleTrigger asChild>
            <Button variant="ghost">
              <CaretSortIcon />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 mr-5">{entrega.domicilio}</p>
            <CopyToClipboard text={entrega.domicilio.toString()} />
          </div>
          <div className="flex items-center py-4 space-x-2 justify-between">
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setShowEstadoAlertDialog(true)}
                  >
                    {isEstadoUpdated ? "Pendiente" : "Entregado"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ingresar DNI de quien recibe</DialogTitle>
                    <DialogDescription>
                      Puede ser el comprador mismo o un familiar. Opcionalmente
                      registrar parentesco con el cliente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-x-4">
                    <Input
                      type="text"
                      placeholder="DNI"
                      value={dni}
                      onChange={handleDniChange}
                      required
                    />

                    <Input type="text" placeholder="Parentesco con cliente" />
                  </div>
                  {dniError && (
                    <p className="text-red-500 text-sm">{dniError}</p>
                  )}

                  <DialogFooter>
                    <Button
                      onClick={handleConfirmEstadoChange}
                      disabled={isConfirming}
                    >
                      {isConfirming ? "Procesando..." : "Confirmar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-blue-700 md:hidden hover:text-blue-900"
              >
                <a href={`tel:${entrega.celular}`}>Llamar</a>
              </Button>
              <p className="text-slate-600 hidden md:block text-sm">
                {entrega.celular}
              </p>
              <Button
                variant="ghost"
                className="text-blue-700 ml-2 hover:text-blue-900"
              >
                <a href={`https://wa.me/54${entrega.celular}`}>WhatsApp</a>
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600">Notas:</p>
            <ul className="list-disc list-inside">
              {newNotas.map((note, index) => (
                <li className="text-sm text-slate-600  leading-6" key={index}>
                  {/*// @ts-ignore*/}
                  {note.content}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full space-x-2 pt-2 flex items-center justify-between">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default Entrega;
