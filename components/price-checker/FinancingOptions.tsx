import React from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const calculateInstallment = (price: number, months: number, discount = 0) => {
  const discountedPrice = price * (1 - discount / 100);
  return Math.floor(discountedPrice / months);
};

interface FinancingOptionsProps {
  price: number;
}

const FinancingOptions = ({ price }: FinancingOptionsProps) => {
  const options = [
    { months: 6, discount: 0, label: "6 cuotas" },
    { months: 3, discount: 5, label: "3 cuotas" },
    { months: 1, discount: 15, label: "1 cuota" },
  ];
  const calculateMonthlyPrice = (price: number) => Math.floor(price / 6);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="p-0 hover:text-green-600 text-md"
        >
          <Plus className="h-4 w-4 text-gray-500 text-xs" />
          6x $ {calculateMonthlyPrice(price).toLocaleString("es-AR")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opciones de financiación</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {options.map((option) => (
            <Card key={option.months} className="bg-gray-50">
              <CardContent className="flex justify-between items-center p-4">
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  {option.discount > 0 && (
                    <span className="text-sm text-green-600">
                      {option.discount}% OFF
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    $ {calculateInstallment(price, option.months, option.discount)
                        .toLocaleString("es-AR")}
                  </div>
                  <div className="text-sm text-gray-500">
                    $ {(calculateInstallment(price, option.months, option.discount) * option.months)
                      .toLocaleString("es-AR")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancingOptions;