import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const ScheduledDateAlertDialog = ({
  scheduledDate,
  setScheduledDate,
  handleConfirmScheduledDate,
  isConfirming
}) => {
  const handleScheduledDateChange = (e) => {
    const localDate = new Date(e.target.value);
    setScheduledDate(localDate.toISOString().split("T")[0]);
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
          value={scheduledDate ? scheduledDate.slice(0, 10) : ""} // Adjust the value to slice only the date part (YYYY-MM-DD)
          onChange={handleScheduledDateChange}
          required
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmScheduledDate}
            disabled={isConfirming}
          >
            {isConfirming ? "Cargando..." : "Actualizar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ScheduledDateAlertDialog;
