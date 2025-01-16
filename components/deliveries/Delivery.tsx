import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useDeliveryLogic } from "@/lib/hooks/useDeliveryLogic";
import { PICKUP_STORES } from "@/utils/constants";
import { formatLongDate } from "@/utils/format";
import {
  Calendar,
  Factory,
  Home,
  MoreHorizontal,
  PiggyBank,
  StickyNote,
  Store,
  X
} from "lucide-react";
import React from "react";
import { DeliveryProps, Profile } from "types/types";
import { Button } from "../ui/button";
import Balance from "./Balance";
import CancelDialog from "./CancelAlertDialog";
import CostCarrierDialog from "./CostCarrierDialog";
import NotesDialog from "./NotesDialog";
import { RemitoDownload } from "./RemitoDownload";
import ScheduledDateDialog from "./ScheduledDateDialog";
import StateDialog from "./StateDialog";

export default function Delivery({ delivery, fetchURL }: DeliveryProps) {
  const deliveryLogic = useDeliveryLogic({
    delivery: {
      ...delivery,
      created_by: {
        id:
          typeof delivery.created_by === "string"
            ? delivery.created_by
            : delivery.created_by?.id ?? "",
        name:
          typeof delivery.created_by === "string"
            ? "" // default empty string when we only have the id
            : delivery.created_by?.name ?? "",
        email:
          typeof delivery.created_by === "string"
            ? "" // default empty string when we only have the id
            : delivery.created_by?.email ?? ""
      }
    },
    fetchURL
  });
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  const getStoreLabel = (storeValue: string) => {
    const store = PICKUP_STORES.find((store) => store.value === storeValue);
    return store ? store.label : storeValue;
  };

  const getDisplayName = () => {
    switch (delivery.type) {
      case "supplier_pickup":
        return delivery.suppliers?.name;
      case "store_movement":
        return `Movimiento de ${getStoreLabel(
          delivery.origin_store
        )} a ${getStoreLabel(delivery.dest_store)}`;
      default:
        return delivery.customers?.name;
    }
  };

  const displayName = getDisplayName();

  const displayPhone =
    delivery.type === "home_delivery" ? delivery.customers?.phone : null;

  const displayAddress =
    delivery.type === "home_delivery" ? delivery.customers?.address : null;

  const getDisplayIcon = () => {
    switch (delivery.type) {
      case "supplier_pickup":
        return <Factory className="h-4 w-4" />;
      case "store_movement":
        return <Store className="h-4 w-4" />;
      default:
        return <Home size={16} />;
    }
  };

  const displayIcon = getDisplayIcon();

  const handleCancelClick = () => {
    setDropdownOpen(false);
    setIsCancelDialogOpen(true);
  };

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
          <p className="font-bold text-lg flex items-center gap-x-2">
            {displayIcon}
            {displayName}
          </p>
          {displayPhone && (
            <>
              <span className="mx-2">|</span>
              <a
                href={`https://wa.me/549${displayPhone}`}
                target="_blank"
                rel="noreferrer"
              >
                <p className="text-slate-600 text-sm hover:underline-offset-4 hover:underline ">
                  {deliveryLogic.formatArgentinePhoneNumber(displayPhone)}
                </p>
              </a>
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
                <p>{formatLongDate(delivery.order_date)}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Creado el{" "}
                  {new Date(
                    new Date(delivery.created_at).getTime() - 6 * 60 * 60 * 1000
                  )
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
              {delivery.type === "supplier_pickup"
                ? "Programando retiro..."
                : "Visitaremos el domicilio..."}
            </p>
          </div>
        ) : delivery.state === "delivered" ? (
          <div>
            <h1 className="font-medium text-black">
              {delivery.type === "supplier_pickup" ? "Retirado" : "Entregado"}
            </h1>
            <p className="text-sm mt-1 text-slate-500">
              {delivery.delivery_date &&
                `El ${formatLongDate(delivery.delivery_date)}`}
            </p>
          </div>
        ) : delivery.scheduled_date ? (
          <div>
            {new Date(delivery.scheduled_date).toISOString().split("T")[0] <
            new Date().toISOString().split("T")[0] ? (
              <div>
                <h1 className="font-medium text-red-500">
                  {delivery.type === "supplier_pickup"
                    ? "!!! Retiro en fárbica atrasado"
                    : "!!! Entrega atrasada"}
                </h1>
                <p className="text-sm mt-1 text-red-500">
                  {delivery.type === "supplier_pickup"
                    ? `Teníamos que retirar el ${formatLongDate(
                        delivery.scheduled_date
                      )}, reprogramá el retiro y actualizá la fecha acá`
                    : `Teníamos que entregar el ${formatLongDate(
                        delivery.scheduled_date
                      )}, reprogramá la entrega con el cliente y actualizá la fecha acá`}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="font-medium">
                  {delivery.type === "supplier_pickup"
                    ? "Retiro en fábrica programado"
                    : "Entrega programada"}
                </h1>
                <p className="text-sm mt-1 text-slate-500">
                  {deliveryLogic.isToday(new Date(delivery.scheduled_date)) ? (
                    <span>
                      {delivery.type === "supplier_pickup"
                        ? "Retiro programado "
                        : "Visitaremos el domicilio "}
                      <span className="font-bold text-black">
                        hoy, {formatLongDate(delivery.scheduled_date)}
                      </span>
                    </span>
                  ) : (
                    <span>
                      {delivery.type === "supplier_pickup"
                        ? `Retiro programado para el ${formatLongDate(
                            delivery.scheduled_date
                          )}`
                        : `Visitaremos el domicilio el ${formatLongDate(
                            delivery.scheduled_date
                          )}`}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-orange-500">
              {delivery.type === "supplier_pickup"
                ? "Fecha de retiro en fábrica no programada"
                : "Fecha de entrega no programada"}
            </h1>
            <p className="text-sm mt-1 text-slate-500">
              {delivery.type === "supplier_pickup"
                ? "Coordinar retiro cuanto antes"
                : "Coordinar cuanto antes con el cliente"}
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
                <Calendar size={12} className="text-gray-600" />
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
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <PiggyBank size={12} className="text-gray-600" />
                <CostCarrierDialog
                  initialDeliveryCost={delivery.delivery_cost}
                  initialCarrierId={delivery.carrier_id}
                  onConfirm={deliveryLogic.handleUpdateDeliveryDetails}
                  isUpdating={deliveryLogic.isUpdatingDeliveryDetails}
                />
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setDropdownOpen(false);
                  setIsNotesDialogOpen(true);
                }}
              >
                <StickyNote size={12} className="text-gray-600" />
                Notas
              </DropdownMenuItem>
              <RemitoDownload
                delivery={delivery}
                customer={delivery.customers}
              />
              {delivery.state !== "cancelled" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleCancelClick}
                    className="text-red-600"
                  >
                    <X size={12} className="mr-2" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <NotesDialog
          isOpen={isNotesDialogOpen}
          onClose={() => setIsNotesDialogOpen(false)}
          notes={deliveryLogic.newNotas}
          newNote={deliveryLogic.newNote}
          setNewNote={deliveryLogic.setNewNote}
          isAddingNote={deliveryLogic.isAddingNote}
          onAddNote={deliveryLogic.handleAddNote}
          formatNoteDate={deliveryLogic.formatNoteDate}
        />
        <CancelDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          onConfirm={deliveryLogic.handleCancelDelivery}
          isConfirming={deliveryLogic.isConfirming}
        />
      </div>
      {/* Product Alert */}
      <Alert className="bg-slate-50">
        <AlertDescription>
          {delivery.products && delivery.products.length > 0 && (
            <div className="space-y-1">
              {delivery.products.map((product, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="font-medium">{product.quantity}x</span>
                  <span className="ml-2 capitalize">
                    {product.name.toLowerCase()}
                  </span>
                  {product.sku && (
                    <span className="ml-2 text-slate-500">{product.sku}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </AlertDescription>
      </Alert>
      {/* Address */}
      {displayAddress && (
        <div className="flex py-2 items-center justify-between">
          <p className="text-sm text-slate-600 mr-5 capitalize">
            {displayAddress.toLowerCase()}
          </p>
        </div>
      )}
      {delivery.state === "pending" && delivery.type !== "supplier_pickup" && (
        <Balance invoice_id={delivery.invoice_id} />
      )}
      {/* Notes Section */}
      <div className="border-t pt-4">
        {deliveryLogic.newNotas.length > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {deliveryLogic.newNotas[
                deliveryLogic.newNotas.length - 1
              ].text.toLowerCase()}{" "}
              |{" "}
              {deliveryLogic.formatNoteDate(
                deliveryLogic.newNotas[deliveryLogic.newNotas.length - 1]
                  .created_at || ""
              )}
            </p>
            {deliveryLogic.newNotas.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotesDialogOpen(true)}
                className="text-xs text-slate-500"
              >
                Ver {deliveryLogic.newNotas.length - 1} notas más
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay notas</p>
        )}
      </div>{" "}
    </div>
  );
}

Delivery.displayName = "Delivery";
