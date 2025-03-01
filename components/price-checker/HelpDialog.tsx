import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Truck } from "lucide-react";

export default function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="text-blue-500 hover:text-blue-700 hover:underline"
          variant="link"
        >
          <HelpCircle className="w-4 h-4" />
          Ayuda sobre cobros y envíos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Ayuda sobre cobros y envíos
          </DialogTitle>
          <DialogDescription>
            Payway de CCD: Cotización. Payway nuestro: Factura.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-stone-700">
          <h3 className="text-lg font-bold">Naranja</h3>
          <ul className="list-disc list-inside space-y-1 text-md">
            <li>
              <span className="font-bold">Terminal:</span> Payway nuestro
            </li>
            <li>
              3 cuotas (Plan Z): Código{" "}
              <span className="font-mono px-1 bg-gray-200 text-gray-900 rounded-sm">
                11
              </span>
            </li>
            <li>
              6 cuotas: Código{" "}
              <span className="font-mono px-1 bg-gray-200 text-gray-900 rounded-sm">
                6
              </span>
            </li>
            <li>
              12 cuotas: Código{" "}
              <span className="font-mono px-1 bg-gray-200 text-gray-900 rounded-sm">
                12
              </span>
            </li>
          </ul>
        </div>
        <div className="space-y-2 text-stone-700">
          <h3 className="text-lg font-bold">
            Visa, Mastercard, Cabal bancarias
          </h3>
          <ul className="list-disc list-inside space-y-1 text-md">
            <li>
              <span className="font-bold">Terminal:</span> Payway nuestro
            </li>
            <li>
              3 cuotas: Código{" "}
              <span className="font-mono px-1 bg-gray-200 text-gray-900 rounded-sm">
                13
              </span>
            </li>
            <li>
              6 cuotas: Código{" "}
              <span className="font-mono px-1 bg-gray-200 text-gray-900 rounded-sm">
                16
              </span>
            </li>
            <li>
              12 cuotas: Aplicar descuento de 1 pago en crédito en el Point y el
              cliente paga el interés.
            </li>
          </ul>
          <div className="flex items-center gap-2">
            <Truck size={20} />
            <h3 className="text-lg font-bold teaxt-stone-700">Envíos</h3>
          </div>
          <p>Revisá el costo de envío en el calculador de la página.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
