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
  handleDeleteFechaProgramada,
  isConfirming
}) => {
  const handleFechaProgramadaChange = (e) => {
    const localDateTime = new Date(e.target.value);
    const adjustedDateTime = new Date(
      localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000
    );
    setFechaProgramada(adjustedDateTime.toISOString());
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        Actualizar Fecha de Entrega
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Actualizar Fecha de Entrega</AlertDialogTitle>
          <AlertDialogDescription>
            Seleccioná la nueva fecha programada para la entrega. Si no hay hora
            definida, ingresar 00:00.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="datetime-local"
          value={fechaProgramada ? fechaProgramada.slice(0, 16) : ""}
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
