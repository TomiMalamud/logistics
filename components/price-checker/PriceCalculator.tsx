import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CASH_DISCOUNT, FINANCING_OPTIONS } from "@/lib/utils/constants";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface PaymentSplit {
  id: string;
  method: string;
  amount: number;
  error?: string;
}

export default function PriceCalculator() {
  const [price, setPrice] = useState(100000);
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: "1", method: "6", amount: 0 },
  ]);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: 0,
        useGrouping: true,
      }),
    []
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }),
    []
  );

  const addPaymentMethod = useCallback(() => {
    setPayments((prev) => [
      ...prev,
      { id: (prev.length + 1).toString(), method: "6", amount: 0 },
    ]);
  }, []);

  const removePaymentMethod = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Payment calculations
  const paymentTotals = useMemo(() => {
    const getDiscount = (method: string) => {
      if (method === "cash") return CASH_DISCOUNT;
      const option = FINANCING_OPTIONS.find(
        (opt) => opt.months.toString() === method
      );
      return option?.discount || 0;
    };

    // Calculate total paid with discounts applied
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate total original amount (before discounts)
    const totalOriginalAmount = payments.reduce((sum, p) => {
      const discount = getDiscount(p.method);
      const originalAmount = p.amount / (1 - discount / 100);
      return sum + originalAmount;
    }, 0);

    // Calculate remaining amount with selected payment method discount
    const remainingWithDiscount = (() => {
      const lastPayment = payments[payments.length - 1];
      const selectedDiscount = getDiscount(lastPayment.method);
      const rawRemaining = price - totalOriginalAmount;

      // Apply the discount of the selected payment method to the remaining amount
      return rawRemaining > 0 ? rawRemaining * (1 - selectedDiscount / 100) : 0;
    })();

    const totalSavings = payments.reduce((sum, p) => {
      const discount = getDiscount(p.method);
      const originalAmount = p.amount / (1 - discount / 100);
      return sum + (originalAmount - p.amount);
    }, 0);

    return {
      totalPaid,
      totalOriginalAmount,
      totalSavings,
      remaining: remainingWithDiscount,
      finalTotal: payments.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments, price]);

  const validatePaymentAmount = useCallback(
    (amount: number, paymentId: string): string | undefined => {
      const currentPayment = payments.find((p) => p.id === paymentId);
      const maxAmount = paymentTotals.remaining + (currentPayment?.amount || 0);

      if (amount > maxAmount) {
        return `El monto no puede superar ${currencyFormatter.format(
          maxAmount
        )}`;
      }
      return undefined;
    },
    [payments, paymentTotals.remaining, currencyFormatter]
  );

  const updatePayment = useCallback(
    (id: string, field: keyof PaymentSplit, value: string | number) => {
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          if (field === "amount") {
            const parsedValue =
              typeof value === "string"
                ? Number(value.replace(/\D/g, ""))
                : value;
            const error = validatePaymentAmount(parsedValue, id);
            return { ...p, [field]: parsedValue, error };
          }

          return { ...p, [field]: value };
        })
      );
    },
    [validatePaymentAmount]
  );
  return (
    <Card className="w-full mt-2">
      <CardContent className="pt-6 space-y-4">
        {/* Price Input */}
        <div className="flex items-center pb-6 border-b mb-10">
          <Label htmlFor="price" className="w-96 flex items-center gap-x-2">
            <DollarSign size={16} className="hidden sm:block" />
            Precio de Contabilium
          </Label>
          <Input
            id="price"
            value={numberFormatter.format(price)}
            onChange={(e) => {
              const newValue = e.target.value.replace(/\D/g, "");
              setPrice(Number(newValue) || 0);
            }}
            className="w-full ml-2 text-right"
          />
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="space-y-1">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Medio de pago</Label>
                  <Select
                    value={payment.method}
                    onValueChange={(value) =>
                      updatePayment(payment.id, "method", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCING_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.months}
                          value={option.months.toString()}
                        >
                          {option.label}{" "}
                          {option.discount > 0 && `(${option.discount}% OFF)`}
                        </SelectItem>
                      ))}
                      <SelectItem value="cash">
                        Contado ({CASH_DISCOUNT}% OFF)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Monto</Label>
                  <Input
                    value={numberFormatter.format(payment.amount)}
                    onChange={(e) => {
                      const newValue = e.target.value.replace(/\D/g, "");
                      updatePayment(payment.id, "amount", newValue);
                    }}
                    className={cn(
                      "text-right",
                      payment.error &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
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
              {payment.error && (
                <p className="text-sm text-red-500">{payment.error}</p>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={addPaymentMethod}
          disabled={paymentTotals.totalPaid >= price}
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar Medio de Pago
        </Button>

        {/* Payment Summary */}
        <div className="pt-4 border-t space-y-2">
          {payments.map((payment) => {
            if (payment.amount <= 0) return null;

            // Calculate discount and savings for this payment
            const discount =
              payment.method === "cash"
                ? CASH_DISCOUNT
                : FINANCING_OPTIONS.find(
                    (opt) => opt.months.toString() === payment.method
                  )?.discount || 0;

            const originalAmount = payment.amount / (1 - discount / 100);
            const savings = originalAmount - payment.amount;
            const monthlyPayment =
              payment.method !== "cash"
                ? payment.amount / parseInt(payment.method)
                : 0;

            return (
              <div key={payment.id} className="text-sm">
                <div className="flex justify-between">
                  <span>
                    {payment.method === "cash"
                      ? "Contado"
                      : `${payment.method} cuotas de ${currencyFormatter.format(
                          monthlyPayment
                        )}`}
                  </span>
                  <span>{currencyFormatter.format(payment.amount)}</span>
                </div>
                {savings > 0 && (
                  <div className="text-green-600 text-xs text-right">
                    Ahorro: {currencyFormatter.format(savings)}
                  </div>
                )}
              </div>
            );
          })}

          <div className="text-amber-600 justify-between flex">
            <span>
              Restante{" "}
              {payments[payments.length - 1]?.method !== "6" && (
                <span className="text-gray-500 text-sm">
                  {" "}
                  (descuento incluido)
                </span>
              )}
            </span>

            {currencyFormatter.format(paymentTotals.remaining)}
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{currencyFormatter.format(paymentTotals.finalTotal)}</span>
            </div>
            {paymentTotals.totalSavings > 0 && (
              <div className="text-lg text-green-600 justify-between flex">
                <span>Ahorro total </span>
                <span>
                  {currencyFormatter.format(paymentTotals.totalSavings)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
