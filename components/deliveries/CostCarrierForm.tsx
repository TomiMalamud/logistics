import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarriers } from "@/hooks/useCarriers";
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface CostCarrierFormProps {
  onCarrierChange: (id: number | undefined) => void;
  onCostChange: (cost: string) => void;
  required?: boolean;
  className?: string;
  initialCarrierId?: number;
  initialDeliveryCost?: string;
}

export function isDeliveryCostValid(cost: string): boolean {
  if (!cost) return false;
  const numValue = parseFloat(cost);
  return !isNaN(numValue) && numValue >= 1000;
}

export default function CostCarrierForm({
  onCarrierChange,
  onCostChange,
  required = false,
  className = "",
  initialCarrierId,
  initialDeliveryCost,
}: CostCarrierFormProps) {
  const [deliveryCost, setDeliveryCost] = useState(initialDeliveryCost || "");
  const [selectedCarrierId, setSelectedCarrierId] = useState(
    initialCarrierId ? initialCarrierId.toString() : ""
  );

  // Update state when initial values change
  useEffect(() => {
    if (initialDeliveryCost) {
      setDeliveryCost(initialDeliveryCost);
      onCostChange(initialDeliveryCost);
    }
    if (initialCarrierId) {
      setSelectedCarrierId(initialCarrierId.toString());
      onCarrierChange(initialCarrierId);
    }
  }, [initialCarrierId, initialDeliveryCost, onCarrierChange, onCostChange]);

  const {
    carriers,
    isLoading: isLoadingCarriers,
    error: carriersError,
    fetchCarriers,
  } = useCarriers();

  // Fetch carriers on component mount
  useEffect(() => {
    fetchCarriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeliveryCost(value);
    onCostChange(value);
  };

  const handleCarrierChange = (value: string) => {
    setSelectedCarrierId(value);
    onCarrierChange(value ? parseInt(value) : undefined);
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Costo de envío</label>
        <Input
          type="number"
          placeholder="Ingresá el costo"
          value={deliveryCost}
          onChange={handleCostChange}
          required={required}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Transporte</label>
        {carriersError ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span>Error al cargar transportes</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCarriers}
              disabled={isLoadingCarriers}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${
                  isLoadingCarriers ? "animate-spin" : ""
                }`}
              />
              Reintentar
            </Button>
          </div>
        ) : (
          <Select
            value={selectedCarrierId}
            onValueChange={handleCarrierChange}
            required={required}
            disabled={isLoadingCarriers}
            onOpenChange={(open) => {
              if (open && carriers.length === 0) {
                fetchCarriers();
              }
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingCarriers ? "Cargando..." : "Seleccioná un transporte"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {carriers.length === 0 && !isLoadingCarriers && !carriersError ? (
                <div className="p-2 text-center text-sm text-gray-500">
                  No hay transportes disponibles
                </div>
              ) : (
                carriers.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id.toString()}>
                    {carrier.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

CostCarrierForm.displayName = "CostCarrierForm";
