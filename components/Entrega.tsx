import React, { useState, useEffect } from "react";
import { CopyToClipboard } from "./copy-to-clipboard";
import { Pencil2Icon, CaretSortIcon } from "@radix-ui/react-icons";
import { mutate } from 'swr';

import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "./ui/collapsible";

export type EntregaProps = {
  id: string;
  punto_venta: string;
  fecha: Date;
  producto: string;
  domicilio: string;
  nombre: string;
  celular: string;
  notas: string;
  estado: boolean;
  fetchURL?: string; // Add this line
};

const Entrega: React.FC<{ entrega: EntregaProps; fetchURL?: string }> = ({ entrega, fetchURL }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEstadoUpdated, setIsEstadoUpdated] = useState(entrega.estado);
  const [isEditing, setIsEditing] = useState(false);
  const [notas, setNotas] = useState(entrega.notas); // Change to separate state for notas
  const [editedNotas, setEditedNotas] = useState(entrega.notas);
  const [isSaving, setIsSaving] = useState(false);

  const toggleEstado = () => {
    // Optimistically update the UI
    const newEstado = !isEstadoUpdated;
    setIsEstadoUpdated(newEstado);
  
    // Send the update to the server
    updateEstado(newEstado)
      .then(() => {
        // Trigger revalidation of data (refresh the list)
        mutate(fetchURL); // Replace with the correct URL if you have a different one for completed tasks
      })
      .catch((error) => {
        // Optionally revert the state change if an error occurs
        setIsEstadoUpdated(!newEstado);
        // Handle error here
      });
  };
    
  const updateEstado = async (newEstado) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/publish/${entrega.id}`, {
        method: "PUT",
        body: JSON.stringify({ estado: newEstado }),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.status !== 200) {
        // Handle error here
        throw new Error("Failed to update estado");
      }
  
      const updatedEntrega = await response.json();
      setIsEstadoUpdated(updatedEntrega.estado);
      setIsUpdating(false);
    } catch (error) {
      setIsUpdating(false);
      throw error; // Re-throw the error to be handled by the caller
    }
  };
    

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/post/${entrega.id}`, {
        method: "PUT",
        body: JSON.stringify({ notas: editedNotas }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200) {
        setIsSaving(false);
        setIsEditing(false);
        setNotas(editedNotas); // Update notas state here
      } else {
        setIsEditing(false);
        setIsSaving(false);
        // handle error here
      }
    } catch (error) {
      setIsEditing(false);
      setIsSaving(false);
      // handle error here
    }
  };

  useEffect(() => {
    setEditedNotas(entrega.notas);
    setNotas(entrega.notas); // Keep the notas state updated with prop changes
  }, [entrega.notas]);

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        Vendido en {entrega.punto_venta} el{" "}
        {new Date(entrega.fecha).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit"
        })}
      </p>
      <Collapsible>
        <div className="flex items-center justify-between">
          <p className="font-bold">{entrega.producto}</p>
          <CollapsibleTrigger asChild>
            <Button variant="ghost">
              <CaretSortIcon />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-slate-600 mr-5 mb-0">
              {entrega.domicilio}
            </p>
            <CopyToClipboard text={entrega.domicilio.toString()} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">{entrega.nombre}</p>
            <div>
              <Button
                variant="ghost"
                className="mx-4 text-blue-700 hover:text-blue-900"
              >
                <a href={`tel:${entrega.celular}`}>Llamar</a>
              </Button>
              <Button
                variant="ghost"
                className="text-blue-700 hover:text-blue-900"
              >
                <a href={`https://wa.me/54${entrega.celular}`}>Whatsapp</a>
              </Button>
            </div>
          </div>
          <div className="inline-flex items-center justify-between">
            <p className="text-sm text-slate-600 my-2">
              Notas:{" "}
              {isEditing ? (
                <textarea
                  className="text-base text-slate-800 border rounded px-2 py-1 focus:outline-none"
                  value={editedNotas}
                  onChange={(e) => setEditedNotas(e.target.value)}
                />
              ) : (
                <span className="text-base text-slate-800">
                  {notas}
                </span>
              )}
            </p>
            {!isEditing ? (
              <Button variant="ghost" className="ml-3" onClick={handleEdit}>
                <Pencil2Icon />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </div>
          <div className="mt-2">
            {isUpdating ? (
              <Button disabled>Actualizando</Button>
            ) : (
              <Button variant="outline" onClick={toggleEstado}>
                {isEstadoUpdated
                  ? "Marcar como Pendiente"
                  : "Marcar como Entregado"}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default Entrega;
