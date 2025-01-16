import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CASH_DISCOUNT, FINANCING_OPTIONS } from "@/utils/constants";

interface PaymentSplit {
  id: string;
  method: string;
  amount: number;
}

const FlexiblePriceCalculator = ({ basePrice = 0 }) => {
  const [price, setPrice] = useState(basePrice);
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: '1', method: '6', amount: 0 }
  ]);

  const getDiscount = (method: string) => {
    if (method === 'cash') return CASH_DISCOUNT;
    const option = FINANCING_OPTIONS.find(opt => opt.months.toString() === method);
    return option?.discount || 0;
  };

  const calculateDiscountedAmount = (amount: number, method: string) => {
    const discount = getDiscount(method);
    return amount * (1 - discount / 100);
  };

  const addPaymentMethod = () => {
    const newId = (payments.length + 1).toString();
    setPayments([...payments, { id: newId, method: '6', amount: 0 }]);
  };

  const removePaymentMethod = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const updatePayment = (id: string, field: keyof PaymentSplit, value: string | number) => {
    setPayments(payments.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = price - totalPaid;
  const finalTotal = payments.reduce((sum, p) => 
    sum + calculateDiscountedAmount(p.amount, p.method), 0
  );
  const totalSavings = price - finalTotal;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio base</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Método de pago</Label>
                <Select
                  value={payment.method}
                  onValueChange={(value) => updatePayment(payment.id, 'method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      Contado ({CASH_DISCOUNT}% OFF)
                    </SelectItem>
                    {FINANCING_OPTIONS.map((option) => (
                      <SelectItem key={option.months} value={option.months.toString()}>
                        {option.label} {option.discount > 0 && `(${option.discount}% OFF)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    updatePayment(payment.id, 'amount', value > price ? price : value);
                  }}
                  max={price}
                />
              </div>

              {payments.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePaymentMethod(payment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={addPaymentMethod}
          disabled={totalPaid >= price}
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar método de pago
        </Button>

        <div className="pt-4 border-t space-y-2">
          {payments.map((payment) => {
            const discountedAmount = calculateDiscountedAmount(payment.amount, payment.method);
            const savings = payment.amount - discountedAmount;
            if (payment.amount <= 0) return null;
            
            return (
              <div key={payment.id} className="text-sm">
                <div className="flex justify-between">
                  <span>
                    {payment.method === 'cash' ? 'Contado' : 
                     `${payment.method} cuotas`}:
                  </span>
                  <span>${payment.amount.toLocaleString('es-AR')}</span>
                </div>
                {savings > 0 && (
                  <div className="text-green-600 text-xs text-right">
                    Ahorro: ${savings.toLocaleString('es-AR')}
                  </div>
                )}
              </div>
            );
          })}

          {remaining > 0 && (
            <div className="text-amber-600">
              Restante: ${remaining.toLocaleString('es-AR')}
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${finalTotal.toLocaleString('es-AR')}</span>
            </div>
            {totalSavings > 0 && (
              <div className="text-sm text-green-600">
                Ahorro total: ${totalSavings.toLocaleString('es-AR')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlexiblePriceCalculator;