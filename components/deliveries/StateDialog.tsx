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
import { DeliveredType, DeliveryState, Store } from "@/types/types";
import { PICKUP_STORES } from "@/utils/constants";
import { useState } from "react";
import CostCarrierForm, { isDeliveryCostValid } from "./CostCarrierForm";

interface FormData {
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: Store;
  delivery_type: DeliveredType;
}

interface StateDialogProps {
  state: string;
  setState: (newState: DeliveryState) => void;
  setShowStateAlertDialog: (show: boolean) => void;
  initialDeliveryCost?: number;
  initialCarrierId?: number;
  onConfirm: (data: FormData) => Promise<void>;
  isConfirming: boolean;
}

export default function StateDialog({
  state,
  setState,
  setShowStateAlertDialog,
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isConfirming
}: StateDialogProps) {
  const [open, setOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveredType>("carrier");
  const [deliveryCost, setDeliveryCost] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState<
    number | undefined
  >();
  const [selectedStore, setSelectedStore] = useState<Store | undefined>();

  const handleDeliveryTypeChange = (value: string) => {
    setDeliveryType(value as DeliveredType);
    setDeliveryCost("");
    setSelectedCarrierId(undefined);
    setSelectedStore(undefined);
  };

  async function handleFormSubmit() {
    const formData: FormData = {
      delivery_type: deliveryType,
      ...(deliveryType === "carrier" && {
        delivery_cost: isDeliveryCostValid(deliveryCost)
          ? parseFloat(deliveryCost)
          : initialDeliveryCost,
        carrier_id: selectedCarrierId || initialCarrierId
      }),
      ...(deliveryType === "pickup" && {
        pickup_store: selectedStore
      })
    };

    if (
      (deliveryType === "carrier" &&
        (!formData.delivery_cost || !formData.carrier_id)) ||
      (deliveryType === "pickup" && !selectedStore)
    ) {
      return;
    }

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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como Entregada</DialogTitle>
          <DialogDescription>
            Seleccione el tipo de entrega y complete los datos correspondientes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <DeliveryTypeSelector
            value={deliveryType}
            onChange={handleDeliveryTypeChange}
          />

          {deliveryType === "carrier" && (
            <>
              <CostCarrierForm
                initialDeliveryCost={initialDeliveryCost}
                initialCarrierId={initialCarrierId}
                onCarrierChange={setSelectedCarrierId}
                onCostChange={setDeliveryCost}
                required
              />
            </>
          )}

          {deliveryType === "pickup" && (
            <PickupStoreSelector
              selectedStore={selectedStore}
              onStoreChange={(value) => setSelectedStore(value as Store)}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleFormSubmit}
            disabled={isSubmitDisabled}
            className="w-full"
          >
            {isConfirming ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
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
