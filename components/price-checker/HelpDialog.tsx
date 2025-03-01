import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, HelpCircle, Truck } from "lucide-react";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Ayuda sobre cobros y envíos
          </DialogTitle>
          <DialogDescription>
            <ul>
              <li>Payway de CCD: Cotización.</li>
              <li>Payway nuestro: Factura.</li>
              <li>Mercado Pago Point: Factura.</li>
              <li>Transferencias: A Mercado Pago (Factura).</li>
              <li>QR: Mercado Pago. QR Modo: Payway.</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={20} />
            <h3 className="text-lg font-bold teaxt-stone-700">
              Financiación con tarjeta
            </h3>
          </div>
          <p className="text-sm text-stone-700">
            Buscá un producto y mirá las opciones de financiación y por dónde
            pasar la tarjeta.
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 my-2">
            <Truck size={20} />
            <h3 className="text-lg font-bold teaxt-stone-700">Envíos</h3>
          </div>
          <p className="text-sm text-stone-700">
            Revisá el costo de envío en el calculador de la página.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
