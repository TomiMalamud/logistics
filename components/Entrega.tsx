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
  fetchURL?: string; // Add this line
};
export type NotaType = {
  id: string;
  content: string;
  entrega_id: string;
};

type NoteObject = { content: string };

const Entrega: React.FC<{ entrega: EntregaProps; fetchURL?: string }> = ({
  entrega,
  fetchURL
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEstadoUpdated, setIsEstadoUpdated] = useState(entrega.estado);
  const [newNotas, setNewNotas] = useState(entrega.new_notas ?? []); // Use nullish coalescing
  const [newNote, setNewNote] = useState(""); // State for the new note
  const [isAddingNote, setIsAddingNote] = useState(false); // New state for saving status

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

  const toggleEstado = () => {
    const newEstado = !isEstadoUpdated;
    setIsEstadoUpdated(newEstado);

    // Corrected line: Pass an object to updateField
    updateField({ estado: newEstado })
      .then(() => {
        mutate(fetchURL);
      })
      .catch((error) => {
        setIsEstadoUpdated(!newEstado);
      });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    // Adjust the date to the server's time zone
    const serverDate = new Date(year, month, day);

    return serverDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit"
    });
  };

  const handleAddNote = async () => {
    setIsAddingNote(true);

    const timestamp = formatDate(new Date().toISOString());
    const updatedNote = `${newNote} | ${timestamp}`; // Append timestamp to the new note

    const updatedNotas = [...newNotas, { content: updatedNote }];
    {/*// @ts-ignore*/}
    setNewNotas(updatedNotas);

    try {
      await updateField({ new_notas: [updatedNote] }); // Send the note with appended timestamp
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
            <div className="">
              {isUpdating ? (
                <Button disabled>Actualizando</Button>
              ) : (
                <Button variant="outline" onClick={toggleEstado}>
                  {isEstadoUpdated ? "Pendiente" : "Entregado"}
                </Button>
              )}
            </div>
            <div>
              <Button
                variant="ghost"
                className="text-blue-700 hover:text-blue-900"
              >
                <a href={`tel:${entrega.celular}`}>Llamar</a>
              </Button>
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
          {/* Adapted section for adding a new Nota */}
          <div className="w-full space-x-2 pt-2 flex items-center justify-between">
            <Input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Añadir nueva nota"
              disabled={isAddingNote} // Disable input during saving
            />
            <Button
              variant="outline"
              onClick={handleAddNote}
              disabled={isAddingNote || !newNote.trim()} // Disable button if saving or input is empty
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
