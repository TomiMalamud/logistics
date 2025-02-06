import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";

export default function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="text-blue-500 hover:text-blue-700 hover:underline"
          variant="link"
        >
          <HelpCircle className="w-4 h-4" />
          ¿Cómo paso la tarjeta?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Cómo pasar la tarjeta
          </DialogTitle>
          <DialogDescription>Payway de CCD: Cotización. </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-stone-700">
          <h3 className="text-lg font-bold">Naranja</h3>
          <ul className="list-disc list-inside space-y-1 text-md">
            <li>SIEMPRE en la terminal de Payway de CCD</li>
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
              10 cuotas: Código{" "}
              <span className="font-mono px-1 bg-gray-200 text-gray-900 rounded-sm">
                10
              </span>
            </li>
          </ul>
        </div>
        <div className="space-y-2 text-stone-700">
          <h3 className="text-lg font-bold">
            Visa, Mastercard, Cabal bancarias
          </h3>
          <ul className="list-disc list-inside space-y-1 text-md">
            <li>Mercado Pago Point</li>
            <li>
              Sin códigos. Cada tarjeta indica la cantidad de cuotas
              disponibles.
            </li>
            <li>
              En determinados períodos, avisados por WhatsApp, se cobra con la
              terminal de Payway de CCD con los códigos:
              <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1 text-md">
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
              </ul>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
