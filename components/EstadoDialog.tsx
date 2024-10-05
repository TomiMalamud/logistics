// EstadoDialog.tsx

import React from "react";
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

interface EstadoDialogProps {
  isPaid: boolean;
  estado: string; 
  setEstado: (newEstado: string) => void; 
  setShowEstadoAlertDialog: (show: boolean) => void;
  dni: string;
  handleDniChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dniError: string;
  handleConfirmEstadoChange: () => void;
  isConfirming: boolean;
}

const EstadoDialog: React.FC<EstadoDialogProps> = ({
  isPaid,
  estado,
  setEstado,
  setShowEstadoAlertDialog,
  dni,
  handleDniChange,
  dniError,
  handleConfirmEstadoChange,
  isConfirming
}) => {
  // Function to handle the DialogTrigger click
  const handleDialogTriggerClick = () => {
    if (estado === "delivered") {
      // If already delivered, no action needed
      return;
    }

    if (!isPaid) {
      alert(
        "El cliente no pagó. Marcar primero el estado de pago y luego marcar la entrega."
      );
      return; // Exit the function, preventing the dialog from showing
    }

    setShowEstadoAlertDialog(true); // Show the dialog if conditions are met
  };

  // Function to handle estado toggle (optional, depending on desired behavior)
  const toggleEstadoLabel = () => {
    return estado === "delivered" ? "Pendiente" : "Entregado";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" onClick={handleDialogTriggerClick}>
          {toggleEstadoLabel()}
        </Button>
      </DialogTrigger>
      {isPaid && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar DNI de quien recibe</DialogTitle>
            <DialogDescription>
              Puede ser el comprador mismo o un familiar. Opcionalmente registrar
              parentesco con el cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              type="text"
              placeholder="DNI"
              value={dni}
              onChange={handleDniChange}
              required
              maxLength={11}
            />
            <Input
              type="text"
              placeholder="Parentesco con cliente (Opcional)"
              // You can manage this field's state similarly if needed
            />
            {dniError && (
              <p className="text-red-500 text-sm mt-1">{dniError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfirmEstadoChange}
              disabled={isConfirming}
              className="w-full"
            >
              {isConfirming ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default EstadoDialog;
