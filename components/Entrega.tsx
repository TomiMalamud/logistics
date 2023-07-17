import React, { useState } from "react";
import Router from "next/router";
import { CopyToClipboard } from "./copy-to-clipboard";

import { Button } from "./ui/button"


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

  const updateEstado = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/publish/${entrega.id}`, {
        method: "PUT",
        body: JSON.stringify({ estado: !isEstadoUpdated }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setIsEstadoUpdated(!isEstadoUpdated);
        setIsUpdating(false);
        Router.reload(); // Refresh the page
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

  return (
    <div className="space-y-2">
      <p className="text-sm">
        Vendido en {entrega.punto_venta} el{" "}
        {new Date(entrega.fecha).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        })}
      </p>
      <p className="font-bold">{entrega.producto}</p>
      <div className="flex items-center">
        <p className="text-sm text-slate-600 mr-5 mb-0">{entrega.domicilio}</p>
        <CopyToClipboard text={entrega.domicilio.toString()} />
      </div>
      <div className="flex items-center">
        <p className="text-sm">{entrega.nombre}</p>
        <Button variant="ghost" className="mx-4 text-blue-700 hover:text-blue-900">
        <a href={`tel:${entrega.celular}`}>
          Llamar
        </a>
        </Button>
        <Button variant="ghost" className="text-blue-700 hover:text-blue-900">
        <a href={`https://wa.me/54${entrega.celular}`}>
          Whatsapp
        </a>
        </Button>
      </div>
      <p className="text-sm text-slate-600 mb-1">
        Notas: <span className="text-base text-slate-800">{entrega.notas}</span>
      </p>

      <div>
        {isUpdating ? (
          <Button disabled>
            Actualizando
          </Button>
        ) : (
          <Button variant="outline" onClick={toggleEstado}>
            {isEstadoUpdated ? 'Marcar como Pendiente' : 'Marcar como Entregado'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Entrega;
