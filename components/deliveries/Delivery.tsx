import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDelivery } from "@/hooks/useDelivery";
import { useDeliveryBalance } from "@/hooks/useDeliveryBalance";
import { getStore } from "@/lib/utils/constants";
import {
  formatDate,
  formatLongDate,
  formatNoteDate,
  formatPhoneNumber,
} from "@/lib/utils/format";
import {
  Calendar,
  Factory,
  Home,
  MoreHorizontal,
  Package,
  StickyNote,
  Store,
  X,
} from "lucide-react";
import React from "react";
import { DeliveryOperation, DeliveryProps, Profile } from "types/types";
import { Button } from "../ui/button";
import Balance from "./Balance";
import CancelDialog from "./CancelAlertDialog";
import { DeliveryOperationsDialog } from "./DeliveryOperationsDialog";
import NotesDialog from "./NotesDialog";
import ScheduledDateDialog from "./ScheduledDateDialog";
import StateDialog from "./StateDialog";

export default function Delivery({ delivery, fetchURL }: DeliveryProps) {
  // Normalize the created_by data structure
  const normalizedDelivery = {
    ...delivery,
    created_by: {
      id:
        typeof delivery.created_by === "string"
          ? delivery.created_by
          : delivery.created_by?.id ?? "",
      name:
        typeof delivery.created_by === "string"
          ? ""
          : delivery.created_by?.name ?? "",
      email:
        typeof delivery.created_by === "string"
          ? ""
          : delivery.created_by?.email ?? "",
    },
  };

  const {
    // State
    state,
    setState,
    scheduledDate,
    setScheduledDate,
    notes,
    newNote,
    setNewNote,
    showStateDialog,
    setShowStateDialog,
    isLoading,
    error,

    // Actions
    handleStateChange,
    handleCancellation,
    addNote,
    updateScheduledDate,
  } = useDelivery({ delivery: normalizedDelivery, fetchURL });

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  const balanceData = useDeliveryBalance({
    invoice_id: delivery.state === "pending" ? delivery.invoice_id : null,
  });

  const isDeliveryDisabled =
    balanceData.balance && balanceData.balance !== "0,00";

  const getLatestOperation = (operations?: DeliveryOperation[]) => {
    if (!operations?.length) return null;
    return operations.sort((a, b) => b.id - a.id)[0];
  };

  const latestOperation = getLatestOperation(delivery.operations);

  const getDisplayName = () => {
    switch (delivery.type) {
      case "supplier_pickup":
        return delivery.suppliers?.name;
      case "store_movement":
        return `Movimiento de ${
          getStore(delivery.origin_store)?.label || delivery.origin_store
        } a ${getStore(delivery.dest_store)?.label || delivery.dest_store}`;
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

  const today = new Date().toISOString().split("T")[0];

  const handleCancelClick = () => {
    setDropdownOpen(false);
    setIsCancelDialogOpen(true);
  };

  const renderProducts = () => {
    const items = delivery.delivery_items || [];
    return items.map((item, index) => (
      <div
        key={index}
        className={`grid grid-cols-[50%,35%,15%] gap-2 items-center text-sm ${
          index !== items.length - 1 ? "border-b border-b-gray-200 pb-2" : ""
        }`}
      >
        <span className="capitalize truncate">
          {item.products?.name?.toLowerCase() || "Unknown Product"}
        </span>

        <span
          className={`whitespace-nowrap ${
            item.pending_quantity > 0 ? "text-yellow-600" : "text-green-600"
          }`}
        >
          {item.pending_quantity} pendiente de {item.quantity}
        </span>

        <span className="text-slate-500 text-right mr-8 font-mono text-xs">
          {item.product_sku}
        </span>
      </div>
    ));
  };
  return (
    <div className="rounded-lg space-y-2 bg-white border p-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
                  {formatPhoneNumber(displayPhone)}
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
        {isLoading.update ? (
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
        ) : delivery.state !== "pending" ? (
          <div>
            {latestOperation && (
              <div>
                <h1 className="font-medium text-black">
                  {latestOperation.operation_type === "cancellation"
                    ? "Cancelada"
                    : latestOperation.pickup_store
                    ? `Retiro en ${
                        getStore(latestOperation.pickup_store)?.label ||
                        latestOperation.pickup_store
                      }`
                    : latestOperation.carriers
                    ? `Entregado por ${latestOperation.carriers.name}`
                    : delivery.type === "supplier_pickup"
                    ? "Retirado"
                    : "Entregado"}
                </h1>
                <p className="text-sm mt-1 text-slate-500">
                  {`El ${formatLongDate(latestOperation.operation_date)}`}
                </p>
              </div>
            )}{" "}
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
                  {formatDate(delivery.scheduled_date) === formatDate(today) ? (
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
          {delivery.state === "pending" && (
            <div className="w-24">
              <StateDialog
                state={state}
                setState={setState}
                setShowStateAlertDialog={setShowStateDialog}
                onConfirm={handleStateChange}
                isConfirming={isLoading.state}
                deliveryItems={delivery.delivery_items}
                delivery={delivery}
                customer={delivery.customers}
                disabled={isDeliveryDisabled}
              />{" "}
            </div>
          )}

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {delivery.state === "pending" && (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Calendar size={12} className="text-gray-600" />
                  <ScheduledDateDialog
                    scheduledDate={scheduledDate}
                    setScheduledDate={setScheduledDate}
                    handleConfirmScheduledDate={() => {
                      updateScheduledDate();
                      setDropdownOpen(false);
                    }}
                    isConfirming={isLoading.update}
                  />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setDropdownOpen(false);
                  setIsNotesDialogOpen(true);
                }}
              >
                <StickyNote size={12} className="text-gray-600" />
                Notas
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Package size={12} className="text-gray-600" />
                <DeliveryOperationsDialog
                  operations={delivery.operations}
                  trigger={<span>Historial de Entregas</span>}
                />
              </DropdownMenuItem>

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
          notes={notes}
          newNote={newNote}
          setNewNote={setNewNote}
          isAddingNote={isLoading.note}
          onAddNote={addNote}
          formatNoteDate={formatNoteDate}
        />
        <CancelDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          onConfirm={handleCancellation}
          isConfirming={isLoading.state}
        />
      </div>
      {/* Product Alert */}
      <Alert className="bg-slate-50">
        <AlertDescription>
          {delivery.delivery_items && delivery.delivery_items.length > 0 ? (
            <div className="space-y-2">{renderProducts()}</div>
          ) : delivery.products && delivery.products.length > 0 ? (
            <div className="space-y-2">
              {delivery.products.map((product, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr,auto,auto] gap-4 items-center text-sm"
                >
                  <span className="capitalize truncate">
                    {product.quantity}x {product.name.toLowerCase()}
                  </span>
                  <span className="whitespace-nowrap">
                    {product.quantity} total
                  </span>
                  {product.sku && (
                    <span className="text-slate-500 font-mono text-xs">
                      {product.sku}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-500 font-medium">
              <p>NO SE ENCONTRARON PRODUCTOS. REVISÁ CON ADMINISTRADOR</p>
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
      {delivery.state === "pending" && delivery.invoice_id && (
        <Balance {...balanceData} />
      )}
      {/* Notes Section */}
      <div className="border-t pt-4">
        {notes.length > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {notes[notes.length - 1].text.toLowerCase()} |{" "}
              {formatNoteDate(notes[notes.length - 1].created_at || "")}
            </p>
            {notes.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotesDialogOpen(true)}
                className="text-xs text-slate-500"
              >
                Ver {notes.length - 1} notas más
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay notas</p>
        )}
      </div>
    </div>
  );
}

Delivery.displayName = "Delivery";
