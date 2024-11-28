// DeliveryMobile.tsx

import React from "react";
import { useDeliveryLogic } from "@/lib/useDeliveryLogic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Navigation, Phone } from "lucide-react";
import { Input } from "./ui/input";
import { titleCase } from "title-case";
import StateDialog from "./StateDialog";
import { DeliveryProps } from "types/types"

const DeliveryMobile: React.FC<DeliveryProps> = ({ delivery: delivery, fetchURL }) => {
  
  const deliveryLogic = useDeliveryLogic({ 
    delivery: {
      ...delivery,
      created_by: typeof delivery.created_by === 'string' ? delivery.created_by : delivery.created_by.id
    }, 
    fetchURL 
  });

  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      {/* Error Alert */}
      {deliveryLogic.error && (
        <Alert variant="destructive">
          <AlertDescription>{deliveryLogic.error}</AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="pb-4 border-b">
        <div className="flex space-x-2 items-center justify-between">
          <p className="text-slate-500 text-xs">
            {titleCase(delivery.customers.name)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <DotsVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {delivery.customers.phone && (
                <>
                  <DropdownMenuItem>
                    <svg
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="15px"
                      width="15px"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
                    </svg>
                    <a className="ml-2" href={`https://wa.me/54${delivery.customers.phone}`}>
                      WhatsApp
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Phone size={15} />
                    <a className="ml-2" href={`tel:${delivery.customers.phone}`}>
                      Llamar
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
        ) : delivery.scheduled_date ? (
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
        ) : (
          <div>
            <h1 className="text-orange-500">Fecha de entrega no programada</h1>
            <p className="text-sm mt-1 text-slate-500">
              Coordinar cuanto antes con el cliente
            </p>
          </div>
        )}
      </div>

      {/* Product Alert */}
      <Alert className="bg-slate-50">
        <AlertDescription>{titleCase(delivery.products)}</AlertDescription>
      </Alert>

      {/* Address and Navigation */}
      <div className="flex py-2 items-center justify-between">
        <p className="text-sm text-slate-600 mr-5">{delivery.customers.address}</p>
        <Button
          variant="outline"
          onClick={deliveryLogic.openInGoogleMaps}
          className="flex items-center"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Ir
        </Button>
      </div>

      {/* Notes Section */}
      <div className="border-t pt-4">
        <ul className="list-disc list-inside">
          {deliveryLogic.newNotas.map((note, index) => (
            <li className="text-sm text-slate-600 leading-6" key={index}>
              {note.text} | {deliveryLogic.formatNoteDate(note.created_at || "")}
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

      {/* State Dialog */}
      <div className="pt-2">
        <StateDialog
          state={deliveryLogic.state}
          setState={deliveryLogic.setState}
          setShowStateAlertDialog={deliveryLogic.setShowStateAlertDialog}
          dni={deliveryLogic.dni}
          handleDniChange={deliveryLogic.handleDniChange}
          dniError={deliveryLogic.dniError}
          handleConfirmStateChange={deliveryLogic.handleConfirmStateChange}
          isConfirming={deliveryLogic.isConfirming}
        />
      </div>
    </div>
  );
};

export default DeliveryMobile;
