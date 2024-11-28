// StateDialog.tsx

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

interface StateDialogProps {
  state: string; 
  setState: (newState: string) => void; 
  setShowStateAlertDialog: (show: boolean) => void;
  dni: string;
  handleDniChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dniError: string;
  handleConfirmStateChange: () => void;
  isConfirming: boolean;
}

const StateDialog: React.FC<StateDialogProps> = ({
  state,
  setState: setState,
  setShowStateAlertDialog: setShowStateAlertDialog,
  dni,
  handleDniChange,
  dniError,
  handleConfirmStateChange: handleConfirmStateChange,
  isConfirming
}) => {
  // Function to handle the DialogTrigger click
  const handleDialogTriggerClick = () => {
    if (state === "delivered") {
      // If already delivered, no action needed
      return;
    }    

    setShowStateAlertDialog(true); // Show the dialog if conditions are met
  };

  // Function to handle state toggle (optional, depending on desired behavior)
  const toggleStateLabel = () => {
    return state === "delivered" ? "Pendiente" : "Entregado";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" onClick={handleDialogTriggerClick}>
          {toggleStateLabel()}
        </Button>
      </DialogTrigger>
      
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
            />
            {dniError && (
              <p className="text-red-500 text-sm mt-1">{dniError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfirmStateChange}
              disabled={isConfirming}
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
