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
const EstadoDialog = ({
  isPaid,
  isEstadoUpdated,
  setShowEstadoAlertDialog,
  dni,
  handleDniChange,
  dniError,
  handleConfirmEstadoChange,
  isConfirming
}) => {
  // Function to handle the DialogTrigger click
  const handleDialogTriggerClick = () => {
    if (!isEstadoUpdated) {
      // Assuming 'Entregado' status is represented by isEstadoUpdated being false
      if (!isPaid) {
        alert(
          "El cliente no pagó. Marcar primero el estado de pago  y luego marcar la entrega."
        );
        return; // Exit the function, preventing the dialog from showing
      }
    }
    setShowEstadoAlertDialog(true); // Show the dialog if conditions are met
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" onClick={handleDialogTriggerClick}>
          {isEstadoUpdated ? "Pendiente" : "Entregado"}
        </Button>
      </DialogTrigger>
      {isPaid && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar DNI de quien recibe</DialogTitle>
            <DialogDescription>
              Puede ser el comprador mismo o un familiar. Opcionalmente
              registrar parentesco con el cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-x-4">
            <Input
              type="text"
              placeholder="DNI"
              value={dni}
              onChange={handleDniChange}
              required
            />
            <Input type="text" placeholder="Parentesco con cliente" />
          </div>
          {dniError && <p className="text-red-500 text-sm">{dniError}</p>}
          <DialogFooter>
            <Button onClick={handleConfirmEstadoChange} disabled={isConfirming}>
              {isConfirming ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default EstadoDialog;
