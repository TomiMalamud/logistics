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
import CostCarrierForm, { isDeliveryCostValid } from "./CostCarrierForm";

interface CostCarrierDialogProps {
  initialDeliveryCost?: number | null;
  initialCarrierId?: number | null;
  onConfirm: (data: {
    delivery_cost: number;
    carrier_id: number;
  }) => Promise<void>;
  isUpdating: boolean;
  trigger?: React.ReactNode;
}

export default function CostCarrierDialog({
  initialDeliveryCost,
  initialCarrierId,
  onConfirm,
  isUpdating,
  trigger
}: CostCarrierDialogProps) {
  const [deliveryCost, setDeliveryCost] = useState('');
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>();
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
      console.error("Failed to update delivery details:", error);
    }
  };

  const isSubmitDisabled =
    !selectedCarrierId ||
    !isDeliveryCostValid(deliveryCost) ||
    isUpdating;

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

        <CostCarrierForm
          initialDeliveryCost={initialDeliveryCost}
          initialCarrierId={initialCarrierId}
          onCarrierChange={setSelectedCarrierId}
          onCostChange={setDeliveryCost}
          className="py-4"
        />

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

CostCarrierDialog.displayName = "CostCarrierDialog";