import React, { useState } from "react";
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

type CostCarrierDialogProps = {
  initialDeliveryCost?: number;
  initialCarrierId?: number;
  carriers: Array<{ id: number; name: string }>;
  onConfirm: (data: { delivery_cost: number; carrier_id: number }) => Promise<void>;
  isUpdating: boolean;
  trigger?: React.ReactNode;
};

export default function CostCarrierDialog({
  initialDeliveryCost,
  initialCarrierId,
  carriers,
  onConfirm,
  isUpdating,
  trigger
}: CostCarrierDialogProps) {
  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost?.toString() ?? "");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(initialCarrierId);
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    if (!isDeliveryCostValid(deliveryCost) || !selectedCarrierId) return;

    try {
      await onConfirm({
        delivery_cost: parseFloat(deliveryCost),
        carrier_id: selectedCarrierId
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to update delivery details:', error);
    }
  };

  const isDeliveryCostValid = (cost: string): boolean => {
    const numValue = parseFloat(cost);
    return !isNaN(numValue) && numValue >= 0;
  };

  const isSubmitDisabled = !selectedCarrierId || !isDeliveryCostValid(deliveryCost) || isUpdating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span>Actualizar costo y transporte</span>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Actualizar detalles de envío</DialogTitle>
          <DialogDescription>
            Modificá el costo de envío y el transporte asignado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Costo de envío</label>
            <Input
              type="number"
              placeholder="Costo"
              value={deliveryCost}
              onChange={(e) => setDeliveryCost(e.target.value)}
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
            onClick={handleConfirm}
            disabled={isSubmitDisabled}
            className="w-full"
          >
            {isUpdating ? "Actualizando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

CostCarrierDialog.displayName = 'CostCarrierDialog';