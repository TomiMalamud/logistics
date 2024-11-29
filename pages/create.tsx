import React, { useState } from "react";
import Router from "next/router";
import { Button } from "@/components/ui/button";
import { Comprobante } from "@/types/api";
import type { User } from "@supabase/supabase-js";
import type { GetServerSidePropsContext } from "next";
import { createClient } from "@/utils/supabase/server-props";
import InvoiceSelection from "@/components/InvoiceSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import FormField from "@/components/FormField";

interface CreateProps {
  user: User;
}

interface FormData {
  products: string;
  address: string;
  phone: string;
  scheduled_date: string;
  notes: string;
}

const initialFormData: FormData = {
  products: "",
  address: "",
  phone: "",
  scheduled_date: "",
  notes: "",
};

// Pure function to sanitize phone number
const sanitizePhoneNumber = (phone: string): string => 
  phone.replace(/[^0-9]/g, '');

// Pure function to validate phone number
const validatePhoneNumber = (phone: string): boolean => 
  /^\d{10}$/.test(phone);

const Create: React.FC<CreateProps> = ({ user }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const sanitizedPhone = sanitizePhoneNumber(value);
      setFormData(prev => ({ ...prev, phone: sanitizedPhone }));
      
      if (!sanitizedPhone) {
        setPhoneError("");
      } else if (!validatePhoneNumber(sanitizedPhone)) {
        setPhoneError("El número debe tener 10 dígitos. Sin 0 ni 15, sin espacios ni guiones.");
      } else {
        setPhoneError("");
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleComprobanteSelect = async (invoice_number: Comprobante) => {
    setSelectedComprobante(invoice_number);
    setFieldsLoading(true);
    setFormData(prev => ({
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
        
        setFormData(prev => ({
          ...prev,
          address: customer.Ciudad !== "VILLA CARLOS PAZ" && customer.Ciudad !== "SIN IDENTIFICAR" && customer.Ciudad !== ""
            ? `${customer.Domicilio} - ${customer.Ciudad}`
            : customer.Domicilio,
          phone: sanitizedPhone
        }));
        
        // Validate the sanitized phone number
        if (sanitizedPhone && !validatePhoneNumber(sanitizedPhone)) {
          setPhoneError("El número debe tener 10 dígitos. Sin 0 ni 15, sin espacios ni guiones.");
        } else {
          setPhoneError("");
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setFormData(prev => ({
          ...prev,
          address: "",
          phone: ""
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
      setPhoneError("El número debe tener 10 dígitos. Sin 0 ni 15, sin espacios ni guiones.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...formData,
        phone: sanitizedPhone,
        order_date: new Date(selectedComprobante.FechaAlta).toISOString().split('T')[0],
        invoice_number: `${selectedComprobante.TipoFc} ${selectedComprobante.Numero}`,
        invoice_id: selectedComprobante.Id,
        balance: parseFloat(selectedComprobante.Saldo.replace(',', '.')) || 0,
        name: selectedComprobante.RazonSocial,
        created_by: user.id,
      };

      const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred while saving.");
      }

      await Router.push("/");
    } catch (error) {
      console.error("Submit error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen md:p-10 items-center justify-center">
      <div className="items-start">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Nueva entrega</h1>
        <Card>
          <form onSubmit={submitData}>
            <CardContent className="w-full md:w-[540px] px-2 py-6 md:px-6 md:py-8">
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
                        Saldo: $ {selectedComprobante?.Saldo || 'No se pudo obtener el balance. Aclarar en Notas si la factura está adeudada.'}. Recordá
                        registrar la cobranza cuando cobremos.
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
              <Button type="button" variant="link" onClick={() => Router.push("/")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Cargando..." : "Guardar"}
              </Button>
            </CardFooter>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>
        </Card>
      </div>
    </main>
  );
};

export default Create;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  return {
    props: {
      user: data.user
    }
  };
}