import React from "react";
import Router from "next/router";
import { CopyToClipboard } from "./copy-to-clipboard";

export type EntregaProps = {
  id: string;
  punto_venta: String
  fecha: Date
  producto: String
  domicilio: String
  nombre: String
  celular: String
  notas: String
};

const Entrega: React.FC<{ entrega: EntregaProps }> = ({ entrega }) => {
  return (
    <div className="space-y-2">
      <p>Vendido en {entrega.punto_venta} el {entrega.fecha}</p>
      <p className="font-bold"> {entrega.producto}</p>
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600 mr-2 mb-0">{entrega.domicilio}</p>
        <CopyToClipboard text={entrega.domicilio} />
      </div>
      <div className="flex">
        <p>{entrega.nombre}</p>
        <a href={`tel:${entrega.celular}`} className="text-blue-500 hover:text-blue-700 mx-4">Llamar</a>
        <a href={`https://wa.me/54${entrega.celular}`} className="text-blue-500 hover:text-blue-700">Whatsapp</a>
      </div>
      <p className="text-sm text-slate-600">Notas: <span className="text-base text-slate-800">{entrega.notas}</span></p>
    </div>
  );
};

export default Entrega;
