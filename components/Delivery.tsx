import React, { useEffect, useState } from "react";
import { useDeliveryLogic } from "@/lib/hooks/useDeliveryLogic";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { titleCase } from "title-case";
import StateDialog from "./StateDialog";
import ScheduledDateDialog from "./ScheduledDateDialog";
import { DeliveryProps, Profile } from "types/types";
import Balance from "./Balance";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import CostCarrierDialog from "./CostCarrierDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./ui/tooltip";

export default function Delivery({ delivery, fetchURL }: DeliveryProps) {
  const deliveryLogic = useDeliveryLogic({
    delivery: {
      ...delivery,
      created_by:
        typeof delivery.created_by === "string"
          ? delivery.created_by
          : delivery.created_by?.id ?? null
    },
    fetchURL
  });
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      {/* Error Alert */}
      {deliveryLogic.error && (
        <Alert variant="destructive">
          <AlertDescription>{deliveryLogic.error}</AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between text-sm pb-4 text-slate-500 border-b">
        <div className="flex items-center">
          <p className="font-bold text-lg">
            {titleCase(delivery.customers.name)}
          </p>
          {delivery.customers.phone && (
            <>
              <span className="mx-2">|</span>
              <p className="text-slate-600 text-sm">
                {deliveryLogic.formatArgentinePhoneNumber(
                  delivery.customers.phone
                )}
              </p>
            </>
          )}
        </div>

        <div id="user_date" className="flex items-center mt-2 md:mt-0">
          <p>
            {(delivery.created_by as Profile)?.name ??
              "Revisar Vendedor en Contabilium"}
          </p>
          <span className="mx-2">|</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p>{deliveryLogic.formatDate(delivery.order_date)}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Creado el{" "}
                  {new Date(new Date(delivery.created_at).getTime()- 6 * 60 * 60 * 1000)
                    .toISOString()
                    .replace("T", " a las ")
                    .slice(0, -5)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Delivery Date Section */}
      <div className="flex items-center py-4 justify-between">
        {deliveryLogic.isUpdating ? (
          <div>
            <h1 className="font-medium text-slate-500">
              Actualizando fecha de entrega...
            </h1>
            <p className="text-sm mt-1 text-slate-500">
              Visitaremos el domicilio...
            </p>
          </div>
        ) : delivery.state === "delivered" ? (
          <div>
            <h1 className="font-medium text-black">Entregado</h1>
            <p className="text-sm mt-1 text-slate-500">
              {delivery.delivery_date &&
                `El ${deliveryLogic.formatDate(delivery.delivery_date)}`}
            </p>
          </div>
        ) : delivery.scheduled_date ? (
          <div>
            {new Date(delivery.scheduled_date).toISOString().split("T")[0] <
            new Date().toISOString().split("T")[0] ? (
              <div>
                <h1 className="font-medium text-red-500">
                  !!! Entrega atrasada
                </h1>
                <p className="text-sm mt-1 text-red-500">
                  Teníamos que entregar el{" "}
                  <span className="font-bold">
                    {deliveryLogic.formatDate(delivery.scheduled_date)}
                  </span>
                  , reprogramá la entrega con el cliente y actualizá la fecha
                  acá
                </p>
              </div>
            ) : (
              <div>
                <h1 className="font-medium">Entrega programada</h1>
                <p className="text-sm mt-1 text-slate-500">
                  {deliveryLogic.isToday(new Date(delivery.scheduled_date)) ? (
                    <span>
                      Visitaremos el domicilio{" "}
                      <span className="font-bold text-black">
                        hoy, {deliveryLogic.formatDate(delivery.scheduled_date)}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Visitaremos el domicilio el{" "}
                      <span className="font-bold">
                        {deliveryLogic.formatDate(delivery.scheduled_date)}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            )}
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
          <div className="w-24">
            <StateDialog
              state={deliveryLogic.state}
              setState={deliveryLogic.setState}
              setShowStateAlertDialog={deliveryLogic.setShowStateAlertDialog}
              initialDeliveryCost={delivery.delivery_cost}
              initialCarrierId={delivery.carrier_id}
              onConfirm={deliveryLogic.handleConfirmStateChange}
              isConfirming={deliveryLogic.isConfirming}
            />
          </div>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ScheduledDateDialog
                  scheduledDate={deliveryLogic.scheduledDate}
                  setScheduledDate={deliveryLogic.setScheduledDate}
                  handleConfirmScheduledDate={() => {
                    deliveryLogic.handleConfirmScheduledDate();
                    setDropdownOpen(false);
                  }}
                  isConfirming={deliveryLogic.isUpdating}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <CostCarrierDialog
                  initialDeliveryCost={delivery.delivery_cost}
                  initialCarrierId={delivery.carrier_id}
                  onConfirm={deliveryLogic.handleUpdateDeliveryDetails}
                  isUpdating={deliveryLogic.isUpdatingDeliveryDetails}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Product Alert */}
      <Alert className="bg-slate-50">
        <AlertDescription>{titleCase(delivery.products)}</AlertDescription>
      </Alert>

      {/* Address */}
      <div className="flex py-2 items-center justify-between">
        <p className="text-sm text-slate-600 mr-5">
          {delivery.customers.address}
        </p>
      </div>
      {delivery.state === "pending" && (
        <Balance invoice_id={delivery.invoice_id} />
      )}

      {/* Notes Section */}
      <div className="border-t pt-4">
        <ul className="list-disc list-inside">
          {deliveryLogic.newNotas.map((note, index) => (
            <li
              className="text-sm text-slate-600 leading-6"
              key={note.id || index}
            >
              {note.text} |{" "}
              {deliveryLogic.formatNoteDate(note.created_at || "")}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Note Input */}
      <div className="w-full space-x-2 pt-4 flex items-center justify-between">
        <Input
          type="text"
          value={deliveryLogic.newNote}
          onChange={(e) => deliveryLogic.setNewNote(e.target.value)}
          onKeyPress={(e) => {
            if (
              e.key === "Enter" &&
              !deliveryLogic.isAddingNote &&
              deliveryLogic.newNote.trim()
            ) {
              deliveryLogic.handleAddNote();
            }
          }}
          placeholder="Añadir nueva nota"
          disabled={deliveryLogic.isAddingNote}
        />
        <Button
          variant="outline"
          onClick={deliveryLogic.handleAddNote}
          disabled={deliveryLogic.isAddingNote || !deliveryLogic.newNote.trim()}
        >
          {deliveryLogic.isAddingNote ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

Delivery.displayName = "Delivery";
