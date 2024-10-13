import React, { useState } from "react";
import Router from "next/router";
import { Button } from "../components/ui/button";
import { Comprobante } from "../types/api";
import type { User } from "@supabase/supabase-js";
import type { GetServerSidePropsContext } from "next";
import { createClient } from "@/utils/supabase/server-props";
import ComprobantesSelect from "@/components/ComprobantesSelect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import FormField from "@/components/FormField";

interface CreateProps {
  user: User;
}

interface FormData {
  producto: string;
  domicilio: string;
  celular: string;
  fecha_programada: string;
  newNotaContent: string;
}

const initialFormData: FormData = {
  producto: "",
  domicilio: "",
  celular: "",
  fecha_programada: "",
  newNotaContent: "",
};

const Create: React.FC<CreateProps> = ({ user }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celularError, setCelularError] = useState("");

  const validateCelular = (value: string) => /^\d{10}$/.test(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'celular') {
      if (!value) {
        setCelularError("");
      } else if (!validateCelular(value)) {
        setCelularError("Formato válido: 3541614107. Sin 0 ni 15, sin espacios ni guiones.");
      } else {
        setCelularError("");
      }
    }
  };

  const handleComprobanteSelect = async (comprobante: Comprobante) => {
    setSelectedComprobante(comprobante);
    if (comprobante?.IdCliente) {
      try {
        const res = await fetch(`/api/customer/${comprobante.IdCliente}`);
        if (!res.ok) throw new Error("Failed to fetch customer data");
        const customer = await res.json();
        setFormData(prev => ({
          ...prev,
          domicilio: customer.Ciudad !== "VILLA CARLOS PAZ" && customer.Ciudad !== "SIN IDENTIFICAR" && customer.Ciudad !== ""
            ? `${customer.Domicilio} - ${customer.Ciudad}`
            : customer.Domicilio,
          celular: customer.Telefono || ""
        }));
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    }
  };

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedComprobante) {
      setError("No comprobante selected.");
      return;
    }
    if (!validateCelular(formData.celular)) {
      setCelularError("Formato válido: 3541614107. Sin 0 ni 15, sin espacios ni guiones.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...formData,
        fecha: new Date(selectedComprobante.FechaAlta).toISOString().split('T')[0],
        comprobante: `${selectedComprobante.TipoFc} ${selectedComprobante.Numero}`,
        id_comprobante: selectedComprobante.Id,
        saldo: parseFloat(selectedComprobante.Saldo.replace(',', '.')) || 0,
        nombre: selectedComprobante.RazonSocial,
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
                  <ComprobantesSelect
                    onSelect={handleComprobanteSelect}
                    placeholder="Seleccioná un comprobante"
                  />
                  {selectedComprobante && selectedComprobante?.Saldo !== "0,00" && (
                    <Alert className="text-yellow-600 mt-3">
                      <AlertTitle>Factura adeudada</AlertTitle>
                      <AlertDescription>
                        Saldo: $ {parseFloat(selectedComprobante?.Saldo.replace(',', '.')) || 0}. Recordá
                        registrar la cobranza cuando cobremos.
                      </AlertDescription>
                    </Alert>
                  )}
                </FormField>
                <FormField label="Domicilio" name="domicilio" value={formData.domicilio} onChange={handleInputChange} disabled={loading || !selectedComprobante} placeholder="Se completa con Contabilium"/>
                <FormField label="Celular" name="celular" value={formData.celular} onChange={handleInputChange} disabled={loading || !selectedComprobante} error={celularError} placeholder="Se completa con Contabilium"/>
                <FormField label="Producto" name="producto" value={formData.producto} onChange={handleInputChange} disabled={loading} isTextarea placeholder="Euro 140x190 + 2 Almohadas ZIP + 2 Bases 70x190" />
                <FormField label="Fecha de Entrega Programada (opcional)" name="fecha_programada" value={formData.fecha_programada} onChange={handleInputChange} disabled={loading} type="date" />
                <FormField label="Notas" name="newNotaContent" value={formData.newNotaContent} onChange={handleInputChange} disabled={loading} placeholder="Agregar notas y entre qué calles está" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="link" onClick={() => Router.push("/")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Loading..." : "Guardar"}
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