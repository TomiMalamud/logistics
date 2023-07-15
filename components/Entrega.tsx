import React, { useState } from "react";
import Router from "next/router";
import { CopyToClipboard } from "./copy-to-clipboard";

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
      <p>
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
      <div className="flex">
        <p>{entrega.nombre}</p>
        <a href={`tel:${entrega.celular}`} className="text-blue-500 hover:text-blue-700 mx-8">
          Llamar
        </a>
        <a href={`https://wa.me/54${entrega.celular}`} className="text-blue-500 hover:text-blue-700">
          Whatsapp
        </a>
      </div>
      <p className="text-sm text-slate-600">
        Notas: <span className="text-base text-slate-800">{entrega.notas}</span>
      </p>

      <div>
        {isUpdating ? (
          <button
          className="bg-slate-200 text-slate-950 text-sm px-3 py-2 rounded"
          disabled
          >
            Actualizando...
          </button>
        ) : (
          <button
            className="bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-950 text-sm px-3 py-2 rounded"
            onClick={toggleEstado}
          >
            {isEstadoUpdated ? 'Marcar como Pendiente' : 'Marcar como Entregado'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Entrega;
