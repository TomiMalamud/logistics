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
import {
  DeliveredType,
  DeliveryItem,
  DeliveryState,
  Store
} from "@/types/types";
import { PICKUP_STORES } from "@/utils/constants";
import { useState } from "react";
import CostCarrierForm, { isDeliveryCostValid } from "./CostCarrierForm";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface FormData {
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: Store;
  delivery_type: DeliveredType;
  items: {
    product_sku: string;
    quantity: number;
  }[];
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
}

export default function StateDialog({
  state,
  setState,
  setShowStateAlertDialog,
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isConfirming,
  deliveryItems
}: StateDialogProps) {
  const [open, setOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveredType>();
  const [deliveryCost, setDeliveryCost] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState<
    number | undefined
  >();
  const [selectedStore, setSelectedStore] = useState<Store | undefined>();
  const [selectedItems, setSelectedItems] = useState<{
    [sku: string]: number;
  }>({});
  function ItemSelection() {
    if (!deliveryItems?.length) return null;

    return (
      <Alert>
        <AlertTitle className="mb-4 font-regular text-gray-500 tracking-wide">
          PRODUCTOS A ENTREGAR
        </AlertTitle>
        <AlertDescription className="space-y-4">
          {deliveryItems.map((item) => {
            const pendingQty = item.pending_quantity;
            if (pendingQty <= 0) return null;

            return (
              <div key={item.product_sku} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">
                    {item.products?.name.toLowerCase() || item.product_sku}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pendiente: {pendingQty}
                  </p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={pendingQty}
                  value={selectedItems[item.product_sku] || 0}
                  onChange={(e) => {
                    const qty = Math.min(
                      Math.max(0, parseInt(e.target.value) || 0),
                      pendingQty
                    );
                    setSelectedItems((prev) => ({
                      ...prev,
                      [item.product_sku]: qty
                    }));
                  }}
                  className="w-20"
                />
              </div>
            );
          })}
        </AlertDescription>
      </Alert>
    );
  }

  const handleDeliveryTypeChange = (value: string) => {
    setDeliveryType(value as DeliveredType);
    setDeliveryCost("");
    setSelectedCarrierId(undefined);
    setSelectedStore(undefined);
  };

  async function handleFormSubmit() {
    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([sku, quantity]) => ({
        product_sku: sku,
        quantity
      }));

    if (items.length === 0) {
      // Show error - must select at least one item
      return;
    }

    const formData: FormData = {
      delivery_type: deliveryType,
      items,
      ...(deliveryType === "carrier" && {
        delivery_cost: isDeliveryCostValid(deliveryCost)
          ? parseFloat(deliveryCost)
          : undefined,
        carrier_id: selectedCarrierId
      }),
      ...(deliveryType === "pickup" && {
        pickup_store: selectedStore
      })
    };

    try {
      await onConfirm(formData);
      setOpen(false);
    } catch (error) {
      console.error("Failed to confirm state change:", error);
    }
  }

  function handleDialogTriggerClick() {
    if (state === "delivered") return;
    setShowStateAlertDialog(true);
  }

  const isSubmitDisabled =
    isConfirming ||
    !deliveryType ||
    (deliveryType === "carrier" &&
      ((!selectedCarrierId && !initialCarrierId) ||
        (!isDeliveryCostValid(deliveryCost) && !initialDeliveryCost))) ||
    (deliveryType === "pickup" && !selectedStore);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" onClick={handleDialogTriggerClick}>
          {state === "delivered" ? "Pendiente" : "Entregado"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader className="mb-2">
          <DialogTitle>Marcar como Entregada</DialogTitle>
          <DialogDescription>
            Seleccioná el tipo de entrega y productos entregados o retirados
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <ItemSelection />

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            <DeliveryTypeSelector
              value={deliveryType}
              onChange={handleDeliveryTypeChange}
            />

            {deliveryType === "carrier" && (
              <CostCarrierForm
                initialDeliveryCost={initialDeliveryCost}
                initialCarrierId={initialCarrierId}
                onCarrierChange={setSelectedCarrierId}
                onCostChange={setDeliveryCost}
                required
              />
            )}

            {deliveryType === "pickup" && (
              <PickupStoreSelector
                selectedStore={selectedStore}
                onStoreChange={(value) => setSelectedStore(value as Store)}
              />
            )}

            <DialogFooter className="mt-auto">
              <Button
                onClick={handleFormSubmit}
                disabled={isSubmitDisabled}
                className="w-full"
              >
                {isConfirming ? "Procesando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </div>
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
  selectedStore?: Store;
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
          {PICKUP_STORES.map((store) => (
            <SelectItem key={store.value} value={store.value}>
              {store.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
