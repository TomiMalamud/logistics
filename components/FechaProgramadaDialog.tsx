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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./ui/tooltip";

const FechaProgramadaAlertDialog = ({
  fechaProgramada,
  setFechaProgramada,
  handleConfirmFechaProgramada,
  handleDeleteFechaProgramada, // New handler for deleting fecha_programada
  isConfirming
}) => {
  const handleFechaProgramadaChange = (e) => {
    const newDate = e.target.value + "T00:00:00Z";
    setFechaProgramada(newDate);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Actualizar Fecha de Entrega</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Actualizar Fecha de Entrega</AlertDialogTitle>
          <AlertDialogDescription>
            Seleccioná la nueva fecha programada para la entrega o eliminala si
            se debe volver a coordinar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="date"
          value={fechaProgramada ? fechaProgramada.slice(0, 10) : ""} // Check for null before slicing
          onChange={handleFechaProgramadaChange}
          required
        />
        <AlertDialogFooter>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {" "}
                <AlertDialogAction
                  className="bg-white border-0 shadow-none hover:bg-white focus:bg-white text-red-500 hover:text-red-700 focus:text-red-700"
                  onClick={handleDeleteFechaProgramada}
                  disabled={true}
                >
                  Eliminar fecha de entrega
                </AlertDialogAction>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Función en desarrollo. Avisar a Tomi para eliminar una fecha
                  programada.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
