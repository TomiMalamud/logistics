import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarriers } from '@/lib/hooks/useCarriers';

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
  return !isNaN(numValue) && numValue >= 0;
}

export default function CostCarrierForm({
  initialDeliveryCost,
  initialCarrierId,
  onCarrierChange,
  onCostChange,
  required = false,
  className = '',
}: CostCarrierFormProps) {
  // Initialize state safely with empty string for cost if undefined/null
  const [deliveryCost, setDeliveryCost] = useState(() => {
    if (initialDeliveryCost === undefined || initialDeliveryCost === null) return '';
    return initialDeliveryCost.toString();
  });
  
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(
    initialCarrierId ?? undefined
  );
  
  const { 
    carriers, 
    isLoading: isLoadingCarriers, 
    error: carriersError 
  } = useCarriers();

  // Handle external changes to initial values
  useEffect(() => {
    if (initialDeliveryCost !== undefined && initialDeliveryCost !== null) {
      setDeliveryCost(initialDeliveryCost.toString());
    }
  }, [initialDeliveryCost]);

  useEffect(() => {
    setSelectedCarrierId(initialCarrierId ?? undefined);
  }, [initialCarrierId]);

  // Propagate changes up
  useEffect(() => {
    onCarrierChange(selectedCarrierId);
  }, [selectedCarrierId, onCarrierChange]);

  useEffect(() => {
    onCostChange(deliveryCost);
  }, [deliveryCost, onCostChange]);

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeliveryCost(value);
  };

  const handleCarrierChange = (value: string) => {
    setSelectedCarrierId(parseInt(value));
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Costo de envío
        </label>
        <Input
          type="number"
          placeholder="Ingresá el costo"
          value={deliveryCost}
          onChange={handleCostChange}
          required={required}
          min="0"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Transporte
        </label>
        {carriersError ? (
          <div className="text-sm text-red-500">{carriersError}</div>
        ) : (
          <Select 
            value={selectedCarrierId?.toString()} 
            onValueChange={handleCarrierChange}
            required={required}
            disabled={isLoadingCarriers}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={isLoadingCarriers ? "Cargando..." : "Seleccioná un transporte"} 
              />
            </SelectTrigger>
            <SelectContent>
              {carriers.map((carrier: Carrier) => (
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
  );
}

CostCarrierForm.displayName = 'CostCarrierForm';