// EntregaDesktop.tsx

import React from "react";
import { useEntregaLogic } from "@/lib/useEntregaLogic";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { titleCase } from "title-case";
import EstadoDialog from "./EstadoDialog";
import FechaProgramadaAlertDialog from "./FechaProgramadaDialog";
import { DeliveryProps, Profile } from "types/types";
import Saldo from "./Saldo";

const EntregaDesktop: React.FC<DeliveryProps> = ({ entrega, fetchURL }) => {
  
  const entregaLogic = useEntregaLogic({
    entrega: {
      ...entrega,
      created_by:
        typeof entrega.created_by === "string"
          ? entrega.created_by
          : entrega.created_by?.id ?? null,
    },
    fetchURL,
  });

  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      {/* Error Alert */}
      {entregaLogic.error && (
        <Alert variant="destructive">
          <AlertDescription>{entregaLogic.error}</AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="flex justify-between text-sm pb-4 items-center text-slate-500 border-b">
        <div className="flex items-center">
          <p className="font-bold text-lg">
            {titleCase(entrega.customers.nombre)}
          </p>
          <span className="mx-2">|</span>
          {entrega.customers.celular && (
            <>
              <p className="text-slate-600 text-sm">
                {entregaLogic.formatArgentinePhoneNumber(
                  entrega.customers.celular
                )}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center">
          <p>
            {(entrega.created_by as Profile)?.name ??
              "Revisar Vendedor en Contabilium"}
          </p>
          <span className="mx-2">|</span>
          <p>{entregaLogic.formatDate(entrega.fecha_venta)}</p>
        </div>
      </div>

      {/* Delivery Date Section */}
      <div className="flex items-center py-4 justify-between">
        {entregaLogic.isUpdating ? (
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
              {entregaLogic.isToday(new Date(entrega.fecha_programada)) ? (
                <span>
                  Visitaremos el domicilio{" "}
                  <span className="font-bold text-black">
                    hoy, {entregaLogic.formatDate(entrega.fecha_programada)}
                  </span>
                </span>
              ) : (
                <span>
                  Visitaremos el domicilio el{" "}
                  <span className="font-bold">
                    {entregaLogic.formatDate(entrega.fecha_programada)}
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
              fechaProgramada={entregaLogic.fechaProgramada}
              setFechaProgramada={entregaLogic.setFechaProgramada}
              handleConfirmFechaProgramada={
                entregaLogic.handleConfirmFechaProgramada
              }
              isConfirming={entregaLogic.isUpdating}
            />
          </Button>
          <div className="w-24">
            <EstadoDialog
              estado={entregaLogic.estado}
              setEstado={entregaLogic.setEstado}
              setShowEstadoAlertDialog={
                entregaLogic.setShowEstadoAlertDialog
              }
              dni={entregaLogic.dni}
              handleDniChange={entregaLogic.handleDniChange}
              dniError={entregaLogic.dniError}
              handleConfirmEstadoChange={
                entregaLogic.handleConfirmEstadoChange
              }
              isConfirming={entregaLogic.isConfirming}
            />
          </div>
        </div>
      </div>

      {/* Product Alert */}
      <Alert className="bg-slate-50">
        <AlertDescription>{titleCase(entrega.producto)}</AlertDescription>
      </Alert>

      {/* Address */}
      <div className="flex py-2 items-center justify-between">
        <p className="text-sm text-slate-600 mr-5">
          {entrega.customers.domicilio}
        </p>
      </div>
      {entrega.estado === 'pending' && <Saldo id_comprobante={entrega.id_comprobante}/>}
      {/* Notes Section */}
      <div className="border-t pt-4">
        <ul className="list-disc list-inside">
          {entregaLogic.newNotas.map((note, index) => (
            <li
              className="text-sm text-slate-600 leading-6"
              key={note.id || index}
            >
              {note.text} | {entregaLogic.formatNoteDate(note.created_at || "")}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Note Input */}
      <div className="w-full space-x-2 pt-4 flex items-center justify-between">
        <Input
          type="text"
          value={entregaLogic.newNote}
          onChange={(e) => entregaLogic.setNewNote(e.target.value)}
          onKeyPress={(e) => {
            if (
              e.key === "Enter" &&
              !entregaLogic.isAddingNote &&
              entregaLogic.newNote.trim()
            ) {
              entregaLogic.handleAddNote();
            }
          }}
          placeholder="Añadir nueva nota"
          disabled={entregaLogic.isAddingNote}
        />
        <Button
          variant="outline"
          onClick={entregaLogic.handleAddNote}
          disabled={
            entregaLogic.isAddingNote || !entregaLogic.newNote.trim()
          }
        >
          {entregaLogic.isAddingNote ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
};

export default EntregaDesktop;