import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { STORES } from "@/lib/utils/constants";
import {
  Customer,
  DeliveredType,
  Delivery,
  DeliveryItem,
  DeliveryState,
  Store
} from "@/types/types";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import CostCarrierForm, { isDeliveryCostValid } from "./CostCarrierForm";
import { RemitoDownload } from "./RemitoDownload";

interface FormData {
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: string;
  delivery_type: DeliveredType;
  items: {
    product_sku: string;
    quantity: number;
    store_id: string;
  }[];
}

interface SelectedItem {
  quantity: number;
  store_id: string;
}

interface StateDialogProps {
  state: string;
  setState: (newState: DeliveryState) => void;
  setShowStateAlertDialog: (show: boolean) => void;
  initialDeliveryCost?: number;
  initialCarrierId?: number;
  onConfirm: (data: FormData) => Promise<void>;
  isConfirming: boolean;
  deliveryItems: DeliveryItem[];
  delivery: Delivery;
  customer: Customer;
  disabled: boolean;
}

export default function StateDialog({
  state,
  setState,
  setShowStateAlertDialog,
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isConfirming,
  deliveryItems,
  delivery,
  customer,
  disabled
}: StateDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveredType>();
  const [deliveryCost, setDeliveryCost] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState<
    number | undefined
  >();
  const [selectedStore, setSelectedStore] = useState<Store | undefined>();
  const [selectedItems, setSelectedItems] = useState<{
    [sku: string]: SelectedItem;
  }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>();

  const checkFormDirty = useCallback(() => {
    const hasSelectedItems = Object.values(selectedItems).some(
      (item) => item.quantity > 0
    );
    const hasDeliveryCostChanged =
      deliveryCost !== String(initialDeliveryCost || "");
    const hasCarrierChanged = selectedCarrierId !== initialCarrierId;
    const hasDeliveryTypeChanged = !!deliveryType;
    const hasStoreChanged = !!selectedStore;

    return (
      hasSelectedItems ||
      hasDeliveryCostChanged ||
      hasCarrierChanged ||
      hasDeliveryTypeChanged ||
      hasStoreChanged
    );
  }, [
    selectedItems,
    deliveryCost,
    selectedCarrierId,
    deliveryType,
    selectedStore,
    initialDeliveryCost,
    initialCarrierId
  ]);

  // Update dirty state whenever form values change
  useEffect(() => {
    setIsDirty(checkFormDirty());
  }, [
    selectedItems,
    deliveryCost,
    selectedCarrierId,
    deliveryType,
    selectedStore,
    checkFormDirty
  ]);

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (open === false && isDirty) {
      // Show confirmation dialog
      const willClose = window.confirm(
        "Hay cambios sin guardar. ¿Estás seguro que querés cerrar?"
      );
      if (!willClose) return;
    }

    // Reset form if closing
    if (open === false) {
      setSelectedItems({});
      setDeliveryType(undefined);
      setDeliveryCost("");
      setSelectedCarrierId(undefined);
      setSelectedStore(undefined);
      setError(null);
      setIsDirty(false);
    }

    setOpen(open);
  };

  function getDeliveryStatusText() {
    const pendingItems = Object.values(selectedItems).filter(
      (item) => item.quantity > 0
    ).length;
    const totalItems = deliveryItems.filter(
      (item) => item.pending_quantity > 0
    ).length;

    if (pendingItems === totalItems) {
      return "Confirmar entrega total";
    }
    return "Confirmar entrega parcial";
  }

  const validateForm = () => {
    const items = Object.entries(selectedItems)
      .filter(([_, item]) => item.quantity > 0)
      .map(([sku, item]) => ({
        product_sku: sku,
        quantity: item.quantity,
        store_id: item.store_id
      }));

    if (items.length === 0) {
      return "Seleccioná al menos un producto";
    }

    if (!deliveryType) {
      return "Seleccioná el tipo de entrega";
    }

    const missingStore = items.some((item) => !item.store_id);
    if (missingStore) {
      return "Seleccioná una sucursal para cada producto";
    }

    // Validate carrier/pickup store selection
    if (deliveryType === "carrier" && !selectedCarrierId && !initialCarrierId) {
      return "Seleccioná un transportista";
    }
    if (
      deliveryType === "carrier" &&
      !isDeliveryCostValid(deliveryCost) &&
      !initialDeliveryCost
    ) {
      return "Ingresá un costo válido";
    }
    if (deliveryType === "pickup" && !selectedStoreId) {
      return "Seleccioná una sucursal";
    }

    return null;
  };

  function ItemSelectionTable({
    deliveryItems,
    selectedItems,
    setSelectedItems
  }: {
    deliveryItems: DeliveryItem[];
    selectedItems: { [sku: string]: SelectedItem };
    setSelectedItems: (items: { [sku: string]: SelectedItem }) => void;
  }) {
    if (!deliveryItems?.length) return null;

    const pendingItems = deliveryItems.filter(
      (item) => item.pending_quantity > 0
    );
    if (pendingItems.length === 0) return null;

    return (
      <div className="border rounded-md">
        <Table className="w-full">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Local</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingItems.map((item) => {
              const selectedQuantity =
                selectedItems[item.product_sku]?.quantity || 0;

              return (
                <TableRow
                  key={item.product_sku}
                  className="border-b last:border-b-0"
                >
                  <TableCell className="p-3">
                    <p className="text-sm capitalize">
                      {item.products?.name.toLowerCase() || item.product_sku}
                    </p>
                  </TableCell>
                  <TableCell className="p-3 text-center text-sm">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="p-3">
                    <Input
                      type="number"
                      min="0"
                      max={item.pending_quantity}
                      value={selectedQuantity}
                      onChange={(e) => {
                        const qty = Math.min(
                          Math.max(0, parseInt(e.target.value) || 0),
                          item.pending_quantity
                        );
                        setSelectedItems({
                          ...selectedItems,
                          [item.product_sku]: {
                            ...selectedItems[item.product_sku],
                            quantity: qty,
                            // Reset store selection if quantity becomes 0
                            ...(qty === 0 && { store_id: "" })
                          }
                        });
                      }}
                      className="w-20 mx-auto"
                    />
                  </TableCell>
                  <TableCell className="p-3">
                    <Select
                      value={selectedItems[item.product_sku]?.store_id || ""}
                      onValueChange={(value) => {
                        setSelectedItems({
                          ...selectedItems,
                          [item.product_sku]: {
                            ...selectedItems[item.product_sku],
                            store_id: value
                          }
                        });
                      }}
                      disabled={selectedQuantity === 0}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {STORES.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
  const handleDeliveryTypeChange = (value: string) => {
    setDeliveryType(value as DeliveredType);
    setDeliveryCost("");
    setSelectedCarrierId(undefined);
    setSelectedStore(undefined);
  };

  async function handleFormSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const formData: FormData = {
      delivery_type: deliveryType,
      items: Object.entries(selectedItems)
        .filter(([_, item]) => item.quantity > 0)
        .map(([sku, item]) => ({
          product_sku: sku,
          quantity: item.quantity,
          store_id: item.store_id
        })),
      ...(deliveryType === "carrier" && {
        delivery_cost: isDeliveryCostValid(deliveryCost)
          ? parseFloat(deliveryCost)
          : undefined,
        carrier_id: selectedCarrierId
      }),
      ...(deliveryType === "pickup" && {
        pickup_store: selectedStoreId
      })
    };

    try {
      await onConfirm(formData);
      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al procesar la entrega"
      );
    }
  }

  function handleDialogTriggerClick() {
    if (state === "delivered") return;
    setShowStateAlertDialog(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full" onClick={handleDialogTriggerClick} disabled={disabled}>
          {state === "delivered" ? "Pendiente" : "Entregado"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>Marcar como Entregada</DialogTitle>
          <DialogDescription>
            <p>
              Seleccioná el tipo de entrega y productos entregados o retirados.
            </p>
            <p>
              Para el remito, ingresá la cantidad de productos a entregar y tocá
              Descargar Remito
            </p>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-6">
          <ItemSelectionTable
            deliveryItems={deliveryItems}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />

          <DeliveryTypeSelector
            value={deliveryType}
            onChange={handleDeliveryTypeChange}
          />

          {deliveryType === "carrier" && (
            <CostCarrierForm
              onCarrierChange={setSelectedCarrierId}
              onCostChange={setDeliveryCost}
              required
            />
          )}

          {deliveryType === "pickup" && (
            <PickupStoreSelector
              selectedStore={selectedStoreId}
              onStoreChange={setSelectedStoreId}
            />
          )}

          <DialogFooter>
            <div className="flex w-full gap-2">
              <Button
                onClick={handleFormSubmit}
                disabled={isConfirming}
                className="flex-1"
              >
                {isConfirming ? "Procesando..." : getDeliveryStatusText()}
              </Button>
              <RemitoDownload
                delivery={delivery}
                customer={customer}
                selectedItems={Object.fromEntries(
                  Object.entries(selectedItems).map(([sku, item]) => [
                    sku,
                    item.quantity
                  ])
                )}
              />
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryTypeSelector({
  value,
  onChange
}: {
  value: DeliveredType;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="carrier" id="carrier" />
        <Label htmlFor="carrier">Envío por transporte</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pickup" id="pickup" />
        <Label htmlFor="pickup">Retiro en sucursal</Label>
      </div>
    </RadioGroup>
  );
}

function PickupStoreSelector({
  selectedStore,
  onStoreChange
}: {
  selectedStore?: string;
  onStoreChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Sucursal</label>
      <Select value={selectedStore} onValueChange={onStoreChange} required>
        <SelectTrigger>
          <SelectValue placeholder="Seleccioná una sucursal" />
        </SelectTrigger>
        <SelectContent>
          {STORES.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
