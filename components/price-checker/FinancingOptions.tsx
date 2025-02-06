import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FINANCING_OPTIONS, FinancingOption } from "@/lib/utils/constants";
import { Plus } from "lucide-react";

interface FinancingOptionsProps {
  price: number;
}

const FinancingOptions = ({ price }: FinancingOptionsProps) => {
  const calculateFinalPrice = (basePrice: number, option: FinancingOption) => {
    if (option.discount) {
      return Math.floor(basePrice * (1 - option.discount / 100));
    }
    if (option.interest) {
      return Math.floor(basePrice * (1 + option.interest / 100));
    }
    return basePrice;
  };

  const calculateInstallment = (basePrice: number, option: FinancingOption) => {
    const finalPrice = calculateFinalPrice(basePrice, option);
    return Math.ceil(finalPrice / option.months);
  };

  // Calculate 6x payment for the button display
  const defaultOption = FINANCING_OPTIONS.find((opt) => opt.months === 6);
  const defaultInstallment = calculateInstallment(price, defaultOption!);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-0 hover:text-green-600">
          <Plus className="h-4 w-4 text-gray-500" />
          6x $ {defaultInstallment.toLocaleString("es-AR")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opciones de financiación</DialogTitle>
          <DialogDescription className="text-gray-500">
            Descuentos y financiación para Naranja y tarjetas bancarias
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {FINANCING_OPTIONS.map((option) => {
            const finalPrice = calculateFinalPrice(price, option);
            const installment = calculateInstallment(price, option);

            return (
              <Card key={option.months} className="bg-gray-50">
                <CardContent className="flex justify-between items-center p-4">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {option.label} de{" "}
                      <span className="font-bold">
                        $ {installment.toLocaleString("es-AR")}
                      </span>
                      {option.discount ? (
                        <span className="text-sm text-green-600 ml-2">
                          {option.discount}% OFF
                        </span>
                      ) : option.interest ? (
                        <span className="text-sm text-gray-600 ml-2">
                          {option.interest}% interés
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-gray-500">
                      {option.cards?.join(", ") || "Todas las tarjetas"}
                    </span>
                  </div>
                  <div className="text-right">
                    {(option.discount || option.interest) && (
                      <div className="text-sm text-gray-500 line-through">
                        $ {price.toLocaleString("es-AR")}
                      </div>
                    )}
                    <div className="font-bold">
                      $ {finalPrice.toLocaleString("es-AR")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancingOptions;
