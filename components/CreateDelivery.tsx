import InvoiceItems from "@/components/InvoiceItems";
import InvoiceSelection from "@/components/InvoiceSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Comprobante } from "@/types/api";
import { InvoiceItem } from "@/types/types";
import { sanitizePhoneNumber, validatePhoneNumber } from "@/utils/format";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Router from "next/router";
import React, { useState } from "react";
import CustomerInfo from "./CustomerInfo";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateProps {
  user: User;
}

interface FormData {
  address: string;
  phone: string;
  scheduled_date: string;
  notes: string;
  email: string | null;
  emailBypassReason?: string;
}

const initialFormData: FormData = {
  address: "",
  phone: "",
  scheduled_date: "",
  notes: "",
  email: "",
  emailBypassReason: ""
};

function FormField({
  label,
  name,
  value,
  onChange,
  disabled,
  error,
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
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children || (
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
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {(name === "address" || name === "phone") && (
        <span className="text-sm mt-2 text-gray-500">
          Si no es correcto, modificalo en Contabilium y volvé a intentar acá.
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
  const [addressError, setAddressError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

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
        setPhoneError("Sin 0 ni 15, sin espacios ni guiones.");
      } else {
        setPhoneError("");
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setAddressError("");
    setPhoneError("");
    setEmailError("");

    if (!formData.address.trim()) {
      setAddressError("La dirección es requerida.");
      isValid = false;
    }

    const sanitizedPhone = sanitizePhoneNumber(formData.phone);
    if (!sanitizedPhone) {
      setPhoneError("El teléfono es requerido.");
      isValid = false;
    } else if (!validatePhoneNumber(sanitizedPhone)) {
      setPhoneError("Sin 0 ni 15, sin espacios ni guiones.");
      isValid = false;
    }

    if (!formData.email && !formData.emailBypassReason) {
      setEmailError(
        "El email es requerido o se debe indicar por qué no lo tenemos haciendo click en 'Sin email.'"
      );
      isValid = false;
    }

    return isValid;
  };
  const handleAddressUpdate = (newAddress: string) => {
    setFormData((prev) => ({
      ...prev,
      address: newAddress
    }));
    setAddressError(""); // Clear any existing address error
  };

  const handleComprobanteSelect = async (invoice: Comprobante) => {
    setSelectedComprobante(invoice);
    setFieldsLoading(true);
    setFormData((prev) => ({
      ...prev,
      address: "Cargando...",
      phone: "Cargando...",
      email: "Cargando..."
    }));

    if (invoice?.Id) {
      try {
        // First fetch customer data
        if (invoice.IdCliente) {
          const customerRes = await fetch(`/api/customer/${invoice.IdCliente}`);
          if (!customerRes.ok) throw new Error("Failed to fetch customer data");
          const customer = await customerRes.json();

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
            email: customer.Email || null,
            emailBypassReason: ""
          }));

          if (sanitizedPhone && !validatePhoneNumber(sanitizedPhone)) {
            setPhoneError("Sin 0 ni 15, sin espacios ni guiones.");
          } else {
            setPhoneError("");
          }
        }

        // Then fetch invoice items
        const itemsRes = await fetch(
          `/api/invoices/${invoice.Id}`
        );
        if (!itemsRes.ok) throw new Error("Failed to fetch invoice items");
        const itemsData = await itemsRes.json();

        setInvoiceItems(itemsData.Items || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFormData((prev) => ({
          ...prev,
          address: "",
          phone: "",
          email: null
        }));
        setInvoiceItems([]);
      } finally {
        setFieldsLoading(false);
      }
    } else {
      setFieldsLoading(false);
      setInvoiceItems([]);
    }
  };

  const handleSaveItems = (items: InvoiceItem[]) => {
    const transformedItems = items.map((item) => ({
      name: item.Concepto,
      sku: item.Codigo,
      quantity: item.Cantidad
    }));
    setFormData((prev) => ({
      ...prev,
      products: JSON.stringify(transformedItems)
    }));
    setInvoiceItems(items);
    setIsEditing(false);
  };

  const prepareRequestBody = () => {
    if (!selectedComprobante) return null;

    const transformedItems = invoiceItems.map((item) => ({
      name: item.Concepto,
      sku: item.Codigo,
      quantity: item.Cantidad
    }));

    return {
      ...formData,
      phone: sanitizePhoneNumber(formData.phone),
      order_date: new Date(selectedComprobante.FechaAlta)
        .toISOString()
        .split("T")[0],
      invoice_number: `${selectedComprobante.TipoFc} ${selectedComprobante.Numero}`,
      invoice_id: selectedComprobante.Id,
      name: selectedComprobante.RazonSocial,
      created_by: user.id,
      products: transformedItems
    };
  };
  const handleEmailBypass = (reason: string) => {
    setFormData((prev) => ({
      ...prev,
      emailBypassReason: reason
    }));
    setEmailError(""); // Clear any existing email error
  };

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedComprobante) {
      setError("No invoice_number selected.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const sanitizedPhone = sanitizePhoneNumber(formData.phone);
    if (!validatePhoneNumber(sanitizedPhone)) {
      setPhoneError("Sin 0 ni 15, sin espacios ni guiones.");
      return;
    }

    setLoading(true);
    try {
      const body = prepareRequestBody();
      if (!body) throw new Error("Failed to prepare request body");

      const response = await fetch("/api/deliveries/create/delivery", {
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
    <Card className="mx-auto max-w-4xl w-[600px]">
      <CardHeader>
        <CardTitle>Nueva entrega</CardTitle>
      </CardHeader>
      <form onSubmit={submitData}>
        <CardContent className="w-full">
          <div className="space-y-3">
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
                      "No se pudo obtener el saldo. Aclarar en Notas si la factura está adeudada."}
                    . Recordá registrar la cobranza cuando cobremos.
                  </AlertDescription>
                </Alert>
              )}
            </FormField>

            {selectedComprobante && (
              <>
                <CustomerInfo
                  address={formData.address}
                  phone={formData.phone}
                  email={formData.email}
                  isLoading={fieldsLoading}
                  phoneError={phoneError}
                  addressError={addressError}
                  emailError={emailError}
                  onBypassEmail={handleEmailBypass}
                  onUpdateAddress={handleAddressUpdate}
                  emailBypassReason={formData.emailBypassReason}
                />
                <div className="justify-end text-right">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <InvoiceItems
                      invoice_id={selectedComprobante.Id}
                      initialItems={invoiceItems}
                      editable={isEditing}
                      onSubmit={handleSaveItems}
                    />
                  </div>
                  <div className="mt-2 space-x-2 flex items-center justify-end">
                    {!isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        type="button"
                        variant="outline"
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>

                <FormField
                  label="Fecha de Entrega Programada"
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
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between w-full">
            <Button type="button" variant="link" asChild>
              <Link href="/">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading || isEditing}>
              {loading ? "Cargando..." : "Guardar"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardFooter>{" "}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </Card>
  );
}

CreateDelivery.displayName = "CreateDelivery";
