import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/utils/supabase/component";
import { z } from "zod";
import React, { useState } from "react";

interface PaymentFormProps {
  carrierId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface FormErrors {
  payment_date?: string;
  amount?: string;
  payment_method?: string;
}

// Define validation schema using zod
const paymentSchema = z.object({
  payment_date: z.string().min(1, "La fecha de pago es requerida"),
  amount: z.string().min(1, "El monto es requerido"),
  payment_method: z.string().min(1, "El método de pago es requerido"),
  notes: z.string().optional(),
});

const PaymentForm: React.FC<PaymentFormProps> = ({
  carrierId,
  onSuccess,
  trigger,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "",
    notes: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  const supabase = createClient();

  const validateForm = (): boolean => {
    try {
      paymentSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          if (field in errors) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("carrier_payments").insert({
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        carrier_id: parseInt(carrierId, 10),
        amount: parseInt(formData.amount, 10),
      });

      if (error) throw error;

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Registrar Pago</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_date">Fecha de Pago</Label>
            <Input
              id="payment_date"
              name="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={handleChange}
            />
            {errors.payment_date && (
              <p className="text-sm text-red-500">{errors.payment_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select
              name="payment_method"
              value={formData.payment_method}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, payment_method: value }));
                setErrors((prev) => ({ ...prev, payment_method: undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-sm text-red-500">{errors.payment_method}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Si pagó el cliente, indicá quién"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentForm;
