import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "./ui/alert-dialog";
import { Input } from "./ui/input";

const FechaProgramadaAlertDialog = ({
  fechaProgramada,
  setFechaProgramada,
  handleConfirmFechaProgramada,
  isConfirming
}) => {
  const handleFechaProgramadaChange = (e) => {
    const localDate = new Date(e.target.value);
    setFechaProgramada(localDate.toISOString().split("T")[0]); // Keep only the date part (YYYY-MM-DD)
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger>Actualizar Fecha de Entrega</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Actualizar Fecha de Entrega</AlertDialogTitle>
          <AlertDialogDescription>
            Seleccioná la nueva fecha programada para la entrega.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="date" 
          value={fechaProgramada ? fechaProgramada.slice(0, 10) : ""} // Adjust the value to slice only the date part (YYYY-MM-DD)
          onChange={handleFechaProgramadaChange}
          required
        />
        <AlertDialogFooter>          
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmFechaProgramada}
            disabled={isConfirming}
          >
            {isConfirming ? "Cargando..." : "Actualizar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FechaProgramadaAlertDialog;
