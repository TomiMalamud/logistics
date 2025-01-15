import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCarriers } from "@/lib/hooks/useCarriers";
import { useState } from "react";

interface Carrier {
  id: number;
  name: string;
}

interface CostCarrierFormProps {
  initialDeliveryCost?: number | null;
  initialCarrierId?: number | null;
  onCarrierChange: (id: number | undefined) => void;
  onCostChange: (cost: string) => void;
  required?: boolean;
  className?: string;
}

export function isDeliveryCostValid(cost: string): boolean {
  if (!cost) return false;
  const numValue = parseFloat(cost);
  return !isNaN(numValue) && numValue >= 1000;
}

export default function CostCarrierForm({
  initialDeliveryCost,
  initialCarrierId,
  onCarrierChange,
  onCostChange,
  required = false,
  className = ""
}: CostCarrierFormProps) {
  // Initialize state with initial values
  const [deliveryCost, setDeliveryCost] = useState(
    () => initialDeliveryCost?.toString() ?? ""
  );

  const [selectedCarrierId, setSelectedCarrierId] = useState<string>(
    initialCarrierId?.toString() ?? ""
  );

  const {
    carriers,
    isLoading: isLoadingCarriers,
    error: carriersError
  } = useCarriers();

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
          <div className="text-sm text-red-500">{carriersError}</div>
        ) : (
          <Select
            value={selectedCarrierId}
            onValueChange={handleCarrierChange}
            required={required}
            disabled={isLoadingCarriers}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingCarriers ? "Cargando..." : "Seleccioná un transporte"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {carriers.map((carrier: Carrier) => (
                <SelectItem key={carrier.id} value={carrier.id.toString()}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

CostCarrierForm.displayName = "CostCarrierForm";
