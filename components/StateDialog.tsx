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

type Carrier = {
  id: number;
  name: string;
};

type FormData = {
  delivery_cost?: number;
  carrier_id?: number;
  pickup_store?: "cd" | "9dejulio" | "carcano";
  delivery_type: "carrier" | "pickup";
};

type StateDialogProps = {
  state: string;
  setState: (newState: string) => void;
  setShowStateAlertDialog: (show: boolean) => void;
  initialDeliveryCost?: number;
  initialCarrierId?: number;
  onConfirm: (data: FormData) => Promise<void>;
  isConfirming: boolean;
};

const PICKUP_STORES = [
  { value: "cd", label: "CD" },
  { value: "9dejulio", label: "9 de Julio" },
  { value: "carcano", label: "Carcano" }
] as const;

const useCarriers = () => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);

  useEffect(() => {
    const fetchCarriers = async () => {
      try {
        const response = await fetch('/api/carriers');
        const data = await response.json();
        setCarriers(data);
      } catch (error) {
        console.error('Failed to fetch carriers:', error);
        setCarriers([]);
      }
    };
    
    fetchCarriers();
  }, []);

  return carriers;
};

const isDeliveryCostValid = (cost: string): boolean => {
  const numValue = parseFloat(cost);
  return !isNaN(numValue) && numValue > 0;
};

const StateDialog: React.FC<StateDialogProps> = ({
  state,
  setState,
  setShowStateAlertDialog,
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isConfirming
}) => {
  const [deliveryType, setDeliveryType] = useState<"carrier" | "pickup">("carrier");
  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost?.toString() ?? "");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(initialCarrierId);
  const [selectedStore, setSelectedStore] = useState<"cd" | "9dejulio" | "carcano" | undefined>();
  
  const carriers = useCarriers();

  const handleDeliveryCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryCost(e.target.value);
  };

  const handleFormSubmit = async () => {
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
  };
  
  const handleDialogTriggerClick = () => {
    if (state === "delivered") return;
    setShowStateAlertDialog(true);
  };

  const isSubmitDisabled = 
    isConfirming || 
    (deliveryType === "carrier" && (!selectedCarrierId || !isDeliveryCostValid(deliveryCost))) ||
    (deliveryType === "pickup" && !selectedStore);

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
          <RadioGroup 
            defaultValue="carrier"
            value={deliveryType}
            onValueChange={(value) => setDeliveryType(value as "carrier" | "pickup")}
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

          {deliveryType === "carrier" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Costo de envío</label>
                <Input
                  type="number"
                  placeholder="Costo"
                  value={deliveryCost}
                  onChange={handleDeliveryCostChange}
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Transporte</label>
                <Select 
                  value={selectedCarrierId?.toString()} 
                  onValueChange={(value) => setSelectedCarrierId(parseInt(value))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar transporte" />
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
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sucursal</label>
              <Select
                value={selectedStore}
                onValueChange={(value) => setSelectedStore(value as typeof selectedStore)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
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
};

export default StateDialog;