import React, { useState, useEffect } from "react";
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

type Carrier = {
  id: number;
  name: string;
};

type CostCarrierDialogProps = {
  initialDeliveryCost?: number;
  initialCarrierId?: number;
  onConfirm: (data: { delivery_cost: number; carrier_id: number }) => Promise<void>;
  isUpdating: boolean;
  trigger?: React.ReactNode;
};

export default function CostCarrierDialog({
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isUpdating,
  trigger
}: CostCarrierDialogProps) {
  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost?.toString() ?? "");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(initialCarrierId);
  const [open, setOpen] = useState(false);
  
  // Move carriers state inside component
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch carriers only when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchCarriers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/carriers");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCarriers(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch carriers:", error);
        setError("Error al cargar transportes. Por favor, intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarriers();
  }, [open]); // Only run when dialog opens

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

  const isSubmitDisabled = !selectedCarrierId || 
    !isDeliveryCostValid(deliveryCost) || 
    isUpdating || 
    isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <span>Actualizar costo y transporte</span>}
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
            {error ? (
              <div className="text-sm text-red-500">{error}</div>
            ) : (
              <Select 
                value={selectedCarrierId?.toString()} 
                onValueChange={(value) => setSelectedCarrierId(parseInt(value))}
                required
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Cargando..." : "Seleccionar transporte"} />
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
            )}
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