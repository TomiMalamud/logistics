// components/DeliveryOperationsDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { formatLongDate, formatCurrency } from "@/utils/format";
import { Package, XCircle } from "lucide-react";
import { DeliveryOperation, OperationType } from "@/types/types";
import { getStore } from "@/utils/constants";

interface DeliveryOperationsDialogProps {
  operations?: DeliveryOperation[];
  trigger?: React.ReactNode;
}

function getOperationIcon(type: OperationType) {
  return type === "cancellation" ? XCircle : Package;
}

function getOperationTitle(operation: DeliveryOperation) {
  if (operation.operation_type === "cancellation") {
    return "Cancelación";
  }
  
  if (operation.pickup_store) {
    const store = getStore(operation.pickup_store);
    return `Retiro en ${store?.label || operation.pickup_store}`;
  }
  
  return operation.carriers
    ? `Entregado por ${operation.carriers.name}`
    : "Entrega";
}


export function DeliveryOperationsDialog({
  operations = [],
  trigger
}: DeliveryOperationsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de Operaciones</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto mt-2 max-h-96 pr-2">
          {operations.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay operaciones registradas
            </p>
          ) : (
            operations
              .sort(
                (a, b) =>
                  new Date(b.operation_date).getTime() -
                  new Date(a.operation_date).getTime()
              )
              .map((operation) => {
                const OperationIcon = getOperationIcon(
                  operation.operation_type as OperationType
                );
                const isDelivery = operation.operation_type === "delivery";

                return (
                  <div
                    key={operation.id}
                    className={`border rounded-lg p-4 space-y-4 ${operation.operation_type === "cancellation" && 'bg-red-100'}`}
                  >
                    <div className="flex justify-between text-stone-800 items-start">
                      <div className="flex items-center gap-2 ">
                        <OperationIcon
                          className={`h-4 w-4 ${
                            operation.operation_type === "cancellation"
                              ? "text-red-500"
                              : "text-slate-500"
                          }`}
                        />
                        <p>
                          {getOperationTitle(operation)}
                          {isDelivery && operation.cost > 0 && (
                            <span> por ${formatCurrency(operation.cost)}</span>
                          )}
                        </p>
                      </div>
                        {operation.profiles?.name && (
                          <p className="text-sm text-slate-600">
                            {operation.profiles.name} | {formatLongDate(operation.operation_date)}
                          </p>
                        )}
                    </div>

                    {isDelivery && operation.operation_items && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-600">
                          Productos entregados:
                        </p>
                        {operation.operation_items.map((item, idx) => (
                          <div
                            key={`${operation.id}-${idx}`}
                            className="flex items-center text-sm"
                          >
                            <span className="font-medium">
                              {item.quantity}x
                            </span>
                            <span className="ml-2 text-slate-600 capitalize">
                              {item.products?.name.toLowerCase() || item.product_sku}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
