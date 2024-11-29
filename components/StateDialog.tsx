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

const isDeliveryCostValid = (cost: string): boolean => {
  const numValue = parseFloat(cost);
  return !isNaN(numValue) && numValue > 0;
};


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

  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost?.toString() ?? "");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(initialCarrierId);
  
  const carriers = useCarriers();



  const handleDeliveryCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryCost(e.target.value);
  };

  const handleConfirmStateChange = async () => {
    if (!isDeliveryCostValid(deliveryCost) || !selectedCarrierId) {
      return;
    }
  
    const formData = {
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

  const isSubmitDisabled = !selectedCarrierId || isConfirming;

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
            Indicá el costo de envío estimado y el transporte responsable.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">

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