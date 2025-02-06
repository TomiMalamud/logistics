import Layout from "@/components/Layout";
import HelpDialog from "@/components/price-checker/HelpDialog";
import PriceCalculator from "@/components/price-checker/PriceCalculator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PriceCalculatorPage() {
  return (
    <Layout title="Calculadora">
      <div className="max-w-xl mx-auto">
        <HelpDialog />
        <PriceCalculator />
        <Alert className="mt-4 space-y-4 text-lg p-6">
          <AlertTitle>Cómo usar la calculadora</AlertTitle>
          <AlertDescription className="text-base">
            <ol className="text-gray-800 space-y-2 list-decimal list-inside">
              <li>Ingresá el precio de Contabilium del total del pedido</li>
              <li>Seleccioná el medio de pago con mayor descuento</li>
              <li>Ingresá el monto por ese medio de pago</li>
              <li>Click en + Agregar Medio de Pago</li>
              <li>
                Completá con los otros medios de pago, agregando los que más
                descuento tengan primero
              </li>
              <li>
                El Restante se va a actualizar con el descuento que tenga el
                Medio de pago seleccionado
              </li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </Layout>
  );
}
