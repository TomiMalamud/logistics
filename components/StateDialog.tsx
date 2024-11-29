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
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definitions
type Carrier = {
  id: number;
  name: string;
};

type FormData = {
  dni: string;
  delivery_cost: number;
  carrier_id: number;
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

// Pure functions for validation
const isDniValid = (dni: string): boolean => /^\d{8,11}$/.test(dni);

const isDeliveryCostValid = (cost: string): boolean => {
  const numValue = parseFloat(cost);
  return !isNaN(numValue) && numValue > 0;
};

const sanitizeDni = (value: string): string => value.replace(/[^0-9]/g, '');

// Custom hooks
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

// Main component
const StateDialog: React.FC<StateDialogProps> = ({
  state,
  setState,
  setShowStateAlertDialog,
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isConfirming
}) => {
  // Form state with typed useState hooks
  const [dni, setDni] = useState("");
  const [dniError, setDniError] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost?.toString() ?? "");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(initialCarrierId);
  
  const carriers = useCarriers();

  // Event handlers as pure functions
  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeDni(e.target.value);
    setDni(sanitizedValue);
    setDniError(isDniValid(sanitizedValue) ? "" : "DNI debe tener entre 8 y 11 dígitos");
  };

  const handleDeliveryCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryCost(e.target.value);
  };

  const handleConfirmStateChange = async () => {
    if (!isDniValid(dni) || !isDeliveryCostValid(deliveryCost) || !selectedCarrierId) {
      return;
    }
  
    const formData = {
      dni,
      delivery_cost: parseFloat(deliveryCost),
      carrier_id: selectedCarrierId
    };
  
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

  const isSubmitDisabled = !dni || !selectedCarrierId || isConfirming || !isDniValid(dni);

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
            Ingresá el DNI de quien recibió, el costo de envío y el transportista.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">DNI del receptor</label>
            <Input
              type="text"
              placeholder="DNI"
              value={dni}
              onChange={handleDniChange}
              required
              maxLength={11}
            />
            {dniError && (
              <p className="text-red-500 text-sm">{dniError}</p>
            )}
          </div>

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
            <label className="text-sm font-medium">Transportista</label>
            <Select 
              value={selectedCarrierId?.toString()} 
              onValueChange={(value) => setSelectedCarrierId(parseInt(value))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar transportista" />
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirmStateChange}
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