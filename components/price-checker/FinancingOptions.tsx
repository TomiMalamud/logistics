import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FINANCING_OPTIONS, FinancingOption } from "@/lib/utils/constants";
import { Plus } from "lucide-react";

interface FinancingOptionsProps {
  price: number;
}

// Define credit card options
const CREDIT_CARDS = [
  { id: "bancaria", label: "Bancaria" },
  { id: "naranja", label: "Naranja" },
  { id: "amex", label: "American Express" },
];

// Define POS mappings for each card type
const POS_MAPPINGS = {
  bancaria: "Payway nuestro",
  naranja: "Payway nuestro",
  amex: "Mercado Pago",
};

const FinancingOptions = ({ price }: FinancingOptionsProps) => {
  const [selectedCard, setSelectedCard] = useState<string>("");

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

  // Calculate 12x payment for the button display
  const defaultOption = FINANCING_OPTIONS.find((opt) => opt.months === 12);
  const defaultInstallment = calculateInstallment(price, defaultOption!);

  // Filter financing options based on selected card
  const filterOptions = (options: FinancingOption[]) => {
    if (!selectedCard) return [];

    return options.filter((option) => {
      // If Naranja card is selected, show only Naranja options
      if (selectedCard === "naranja") {
        return !option.cards || option.cards.includes("Naranja");
      }

      // For other cards, exclude options exclusive to Naranja
      if (option.cards && option.cards.includes("Naranja")) {
        return selectedCard === "naranja";
      }

      return true;
    });
  };

  const filteredOptions = selectedCard ? filterOptions(FINANCING_OPTIONS) : [];
  const posToUse = selectedCard
    ? POS_MAPPINGS[selectedCard as keyof typeof POS_MAPPINGS]
    : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-0 hover:text-green-600">
          <Plus className="h-4 w-4 text-gray-500" />
          12x $ {defaultInstallment.toLocaleString("es-AR")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opciones de financiación</DialogTitle>
          <DialogDescription className="text-gray-500">
            Seleccioná la tarjeta para ver las opciones disponibles
          </DialogDescription>
        </DialogHeader>

        {/* Credit Card Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">
            Seleccionar Tarjeta
          </label>
          <Select value={selectedCard} onValueChange={setSelectedCard}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione una tarjeta" />
            </SelectTrigger>
            <SelectContent>
              {CREDIT_CARDS.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* POS Display */}
        {selectedCard && posToUse && (
          <div className="mb-4 p-4 bg-blue-50 rounded-md">
            <p className="font-medium text-slate-600">
              Terminal a utilizar (POS):
              <span className="ml-2 font-bold text-blue-800">{posToUse}</span>
            </p>
          </div>
        )}

        {/* Financing Options */}
        {selectedCard && (
          <div className="grid gap-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
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

                        {option.helper && (
                          <div className="text-sm text-gray-500">
                            {option.helper}
                          </div>
                        )}
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
              })
            ) : (
              <div className="text-center py-4 text-gray-500">
                No hay opciones de financiación disponibles para esta selección.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinancingOptions;
