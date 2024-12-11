import React, { useState } from "react";
import Router from "next/router";
import { Button } from "@/components/ui/button";
import { Comprobante } from "@/types/api";
import type { User } from "@supabase/supabase-js";
import InvoiceSelection from "@/components/InvoiceSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { sanitizePhoneNumber, validatePhoneNumber } from "@/utils/phone";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";

interface CreateProps {
  user: User;
}

interface FormData {
  products: string;
  address: string;
  phone: string;
  scheduled_date: string;
  notes: string;
  email: string | null;
}

const initialFormData: FormData = {
  products: "",
  address: "",
  phone: "",
  scheduled_date: "",
  notes: "",
  email: null
};

function FormField({
  label,
  name,
  value,
  onChange,
  disabled,
  error,
  isTextarea,
  type,
  placeholder,
  children
}: {
  label: string;
  name?: string;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  disabled?: boolean;
  error?: string;
  isTextarea?: boolean;
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children ||
        (isTextarea ? (
          <Textarea
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1"
            required
            disabled={disabled}
            placeholder={placeholder}
          />
        ) : (
          <Input
            name={name}
            value={value}
            onChange={onChange}
            type={type || "text"}
            className="mt-1"
            required={name !== "scheduled_date" && name !== "notes"}
            disabled={disabled}
            placeholder={placeholder}
          />
        ))}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {(name === "address" || name === "phone") && (
        <span className="text-sm mt-2 text-gray-500">
          Podés editarlo si no es correcto
        </span>
      )}
    </div>
  );
}

export default function CreateDelivery({ user }: CreateProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedComprobante, setSelectedComprobante] =
    useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const sanitizedPhone = sanitizePhoneNumber(value);
      setFormData((prev) => ({ ...prev, phone: sanitizedPhone }));

      if (!sanitizedPhone) {
        setPhoneError("");
      } else if (!validatePhoneNumber(sanitizedPhone)) {
        setPhoneError(
          "El número debe tener 10 dígitos. Sin 0 ni 15, sin espacios ni guiones."
        );
      } else {
        setPhoneError("");
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleComprobanteSelect = async (invoice_number: Comprobante) => {
    setSelectedComprobante(invoice_number);
    setFieldsLoading(true);
    setFormData((prev) => ({
      ...prev,
      address: "Cargando...",
      phone: "Cargando..."
    }));

    if (invoice_number?.IdCliente) {
      try {
        const res = await fetch(`/api/customer/${invoice_number.IdCliente}`);
        if (!res.ok) throw new Error("Failed to fetch customer data");
        const customer = await res.json();

        const sanitizedPhone = sanitizePhoneNumber(customer.Telefono || "");

        setFormData((prev) => ({
          ...prev,
          address:
            customer.Ciudad !== "VILLA CARLOS PAZ" &&
            customer.Ciudad !== "SIN IDENTIFICAR" &&
            customer.Ciudad !== ""
              ? `${customer.Domicilio} - ${customer.Ciudad}`
              : customer.Domicilio,
          phone: sanitizedPhone,
          email: customer.Email || null
        }));

        if (sanitizedPhone && !validatePhoneNumber(sanitizedPhone)) {
          setPhoneError(
            "El número debe tener 10 dígitos. Sin 0 ni 15, sin espacios ni guiones."
          );
        } else {
          setPhoneError("");
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setFormData((prev) => ({
          ...prev,
          address: "",
          phone: "",
          email: null
        }));
      } finally {
        setFieldsLoading(false);
      }
    } else {
      setFieldsLoading(false);
    }
  };

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedComprobante) {
      setError("No invoice_number selected.");
      return;
    }

    const sanitizedPhone = sanitizePhoneNumber(formData.phone);
    if (!validatePhoneNumber(sanitizedPhone)) {
      setPhoneError(
        "El número debe tener 10 dígitos. Sin 0 ni 15, sin espacios ni guiones."
      );
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...formData,
        phone: sanitizedPhone,
        order_date: new Date(selectedComprobante.FechaAlta)
          .toISOString()
          .split("T")[0],
        invoice_number: `${selectedComprobante.TipoFc} ${selectedComprobante.Numero}`,
        invoice_id: selectedComprobante.Id,
        balance: parseFloat(selectedComprobante.Saldo.replace(",", ".")) || 0,
        name: selectedComprobante.RazonSocial,
        created_by: user.id
      };

      const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred while saving.");
      }

      await Router.push("/");
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full md:w-[540px]">
      <CardHeader>
        <CardTitle>Nueva entrega</CardTitle>
      </CardHeader>
      <form onSubmit={submitData}>
        <CardContent>
          <div className="max-w-xl space-y-3">
            <FormField label="Factura">
              <InvoiceSelection
                onSelect={handleComprobanteSelect}
                placeholder="Seleccioná un comprobante"
              />
              {selectedComprobante && selectedComprobante?.Saldo !== "0,00" && (
                <Alert className="text-yellow-600 mt-3">
                  <AlertTitle>Factura adeudada</AlertTitle>
                  <AlertDescription>
                    Saldo: ${" "}
                    {selectedComprobante?.Saldo ||
                      "No se pudo obtener el balance. Aclarar en Notas si la factura está adeudada."}
                    . Recordá registrar la cobranza cuando cobremos.
                  </AlertDescription>
                </Alert>
              )}
            </FormField>
            <FormField
              label="Domicilio"
              name="address"
              value={fieldsLoading ? "Cargando..." : formData.address}
              onChange={handleInputChange}
              disabled={loading || fieldsLoading || !selectedComprobante}
              placeholder="Se completa con Contabilium"
            />
            <FormField
              label="Celular"
              name="phone"
              value={fieldsLoading ? "Cargando..." : formData.phone}
              onChange={handleInputChange}
              disabled={loading || fieldsLoading || !selectedComprobante}
              error={phoneError}
              placeholder="Se completa con Contabilium"
            />
            <FormField
              label="Producto"
              name="products"
              value={formData.products}
              onChange={handleInputChange}
              disabled={loading}
              isTextarea
              placeholder="Euro 140x190 + 2 Almohadas ZIP + 2 Bases 70x190"
            />
            <FormField
              label="Fecha de Entrega Programada (opcional)"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleInputChange}
              disabled={loading}
              type="date"
            />
            <FormField
              label="Notas"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Agregar notas y entre qué calles está"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="link" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Guardar"}
          </Button>
        </CardFooter>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </Card>
  );
}

CreateDelivery.displayName = 'CreateDelivery';