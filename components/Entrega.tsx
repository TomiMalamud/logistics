import React, { useState, useEffect } from "react";
import { CopyToClipboard } from "./copy-to-clipboard";
import { Pencil2Icon, CaretSortIcon } from "@radix-ui/react-icons";

import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "./ui/collapsible";
import Router from "next/router";
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
};

const Entrega: React.FC<{ entrega: EntregaProps }> = ({ entrega }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEstadoUpdated, setIsEstadoUpdated] = useState(entrega.estado);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotas, setEditedNotas] = useState(entrega.notas);
  const [isSaving, setIsSaving] = useState(false);

  const updateEstado = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/publish/${entrega.id}`, {
        method: "PUT",
        body: JSON.stringify({ estado: !isEstadoUpdated }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200) {
        setIsEstadoUpdated(!isEstadoUpdated);
        setIsUpdating(false);
      } else {
        setIsUpdating(false);
        // handle error here
      }
    } catch (error) {
      setIsUpdating(false);
      // handle error here
    }
  };

  const toggleEstado = () => {
    if (!isUpdating) {
      updateEstado();
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
                  {entrega.notas}
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
