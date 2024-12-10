import React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type DeliveryType = "carrier" | "pickup";
type PickupStore = "cd" | "9dejulio" | "carcano";

interface Carrier {
  id: number;
  name: string;
}

interface FormData {
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: PickupStore;
  delivery_type: DeliveryType;
}

interface StateDialogProps {
  state: string;
  setState: (newState: string) => void;
  setShowStateAlertDialog: (show: boolean) => void;
  initialDeliveryCost?: number;
  initialCarrierId?: number;
  onConfirm: (data: FormData) => Promise<void>;
  isConfirming: boolean;
}

const PICKUP_STORES = [
  { value: "cd", label: "CD" },
  { value: "9dejulio", label: "9 de Julio" },
  { value: "carcano", label: "Carcano" }
] as const;

function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCarriers() {
      try {
        const response = await fetch('/api/carriers');
        if (!response.ok) throw new Error('Failed to fetch carriers');
        const data = await response.json();
        setCarriers(data);
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error'));
        setCarriers([]);
      }
    }
    
    fetchCarriers();
  }, []);

  return { carriers, error };
}

function isDeliveryCostValid(cost: string): boolean {
  const numValue = parseFloat(cost);
  return !isNaN(numValue) && numValue > 0;
}

function useFormState(initialDeliveryCost?: number, initialCarrierId?: number) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("carrier");
  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost?.toString() ?? "");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(initialCarrierId);
  const [selectedStore, setSelectedStore] = useState<PickupStore | undefined>();

  useEffect(() => {
    setDeliveryCost("");
    setSelectedCarrierId(undefined);
    setSelectedStore(undefined);
  }, [deliveryType]);

  return {
    deliveryType,
    setDeliveryType,
    deliveryCost,
    setDeliveryCost,
    selectedCarrierId,
    setSelectedCarrierId,
    selectedStore,
    setSelectedStore
  };
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
  const { carriers, error: carriersError } = useCarriers();
  const {
    deliveryType,
    setDeliveryType,
    deliveryCost,
    setDeliveryCost,
    selectedCarrierId,
    setSelectedCarrierId,
    selectedStore,
    setSelectedStore
  } = useFormState(initialDeliveryCost, initialCarrierId);

  async function handleFormSubmit() {
    const formData: FormData = {
      delivery_type: deliveryType,
      ...(deliveryType === "carrier" && {
        delivery_cost: isDeliveryCostValid(deliveryCost) ? parseFloat(deliveryCost) : undefined,
        carrier_id: selectedCarrierId
      }),
      ...(deliveryType === "pickup" && {
        pickup_store: selectedStore
      })
    };

    if (
      (deliveryType === "carrier" && (!isDeliveryCostValid(deliveryCost) || !selectedCarrierId)) ||
      (deliveryType === "pickup" && !selectedStore)
    ) {
      return;
    }

    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('Failed to confirm state change:', error);
    }
  }
  
  function handleDialogTriggerClick() {
    if (state === "delivered") return;
    setShowStateAlertDialog(true);
  }

  const isSubmitDisabled = 
    isConfirming || 
    (deliveryType === "carrier" && (!selectedCarrierId || !isDeliveryCostValid(deliveryCost))) ||
    (deliveryType === "pickup" && !selectedStore);

  if (carriersError) {
    return <div>Error loading carriers: {carriersError.message}</div>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="w-full" 
          onClick={handleDialogTriggerClick}
        >
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
            onChange={(value) => setDeliveryType(value as DeliveryType)}
          />

          {deliveryType === "carrier" ? (
            <CarrierForm
              deliveryCost={deliveryCost}
              onDeliveryCostChange={(e) => setDeliveryCost(e.target.value)}
              selectedCarrierId={selectedCarrierId}
              onCarrierChange={(value) => setSelectedCarrierId(parseInt(value))}
              carriers={carriers}
            />
          ) : (
            <PickupStoreSelector
              selectedStore={selectedStore}
              onStoreChange={(value) => setSelectedStore(value as PickupStore)}
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
  value: DeliveryType; 
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup 
      value={value}
      onValueChange={onChange}
      className="gap-4"
    >
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

function CarrierForm({
  deliveryCost,
  onDeliveryCostChange,
  selectedCarrierId,
  onCarrierChange,
  carriers
}: {
  deliveryCost: string;
  onDeliveryCostChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCarrierId?: number;
  onCarrierChange: (value: string) => void;
  carriers: Carrier[];
}) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Costo de envío</label>
        <Input
          type="number"
          placeholder="Ingresá el costo"
          value={deliveryCost}
          onChange={onDeliveryCostChange}
          required
          min="0"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Transporte</label>
        <Select 
          value={selectedCarrierId?.toString()} 
          onValueChange={onCarrierChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná un transporte" />
          </SelectTrigger>
          <SelectContent>
            {carriers.map((carrier) => (
              <SelectItem 
                key={carrier.id} 
                value={carrier.id.toString()}
              >
                {carrier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function PickupStoreSelector({
  selectedStore,
  onStoreChange
}: {
  selectedStore?: PickupStore;
  onStoreChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Sucursal</label>
      <Select
        value={selectedStore}
        onValueChange={onStoreChange}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccioná una sucursal" />
        </SelectTrigger>
        <SelectContent>
          {PICKUP_STORES.map((store) => (
            <SelectItem 
              key={store.value} 
              value={store.value}
            >
              {store.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}