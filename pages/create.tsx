import React, { useState, useEffect, useRef } from "react";
import { Libraries, useLoadScript } from "@react-google-maps/api";
import Router from "next/router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Client } from "../types/api";
import type { User } from "@supabase/supabase-js";
import type { GetServerSidePropsContext } from "next";

import { createClient } from "@utils/supabase/server-props";

const libraries: Libraries = ["places"];

interface CreateProps {
  user: User;
}
const Create: React.FC<CreateProps> = ({ user }) => {
  const [producto, setProducto] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [celularError, setCelularError] = useState("");
  const [newNotas, setNewNotas] = useState<{ content: string }[]>([]);
  const [pagado, setPagado] = useState(false);
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const autocompleteRef = useRef(null);
  const clientListContainerRef = useRef<HTMLDivElement>(null); // Added ref
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [fecha_programada, setFecha_programada] = useState("");

  const validateCelular = (value: string) => {
    const celularRegex = /^\d{10}$/;
    return celularRegex.test(value);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagado(event.target.checked);
  };

  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, "");
  };

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
  
    try {
      if (!validateCelular(celular)) {
        setCelularError(
          "Formato válido: 3541614107. Sin 0 ni 15, sin espacios ni guiones."
        );
        return;
      }
  
      // Only use the date strings without converting to ISO
      const body = {
        fecha,  // Use the date value as is
        producto,
        domicilio,
        nombre,
        celular,
        pagado,
        fecha_programada: fecha_programada || null,  // Use the value directly
        newNotaContent: newNotas.length > 0 ? newNotas[0].content : "",
      };
      console.log("Body being sent:", body);
  
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
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };
    
  const handleClientSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
    if (e.target.value.length > 2) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search-client?filtro=${e.target.value}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        const data = await response.json();
        console.log("API Response:", data); // Debugging the response

        // Correctly access the 'Items' key
        if (data && data.Items) {
          setClients(data.Items);
          console.log("Updated clients:", data.Items); // Check if clients data is correct
        } else {
          console.log("No Items key found in response");
          setClients([]);
        }
      } catch (err) {
        console.error("Error during client search:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setClients([]);
    }
  };

  // *** Modified handleClientSelect Function ***
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setNombre(client.RazonSocial);
    setCelular(cleanPhoneNumber(client.Telefono || ""));

    // Check if 'Ciudad' is neither 'VILLA CARLOS PAZ' nor 'SIN IDENTIFICAR'
    if (
      client.Ciudad !== "VILLA CARLOS PAZ" &&
      client.Ciudad !== "SIN IDENTIFICAR"
    ) {
      // Append ' | Ciudad' to 'Domicilio'
      setDomicilio(`${client.Domicilio || ""} | ${client.Ciudad || ""}`);
    } else {
      // Keep only 'Domicilio'
      setDomicilio(client.Domicilio || "");
    }

    setClients([]);
  };

  useEffect(() => {
    if (isLoaded && typeof google !== "undefined") {
      const autocomplete = new google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          types: ["address"]
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setDomicilio(place.formatted_address);
      });
    }
  }, [isLoaded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientListContainerRef.current &&
        !clientListContainerRef.current.contains(event.target as Node)
      ) {
        setClients([]);
      }
    };

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loadError) return <div>Error al cargar Google Maps</div>;

  return (
    <>
      <main className="relative flex min-h-screen p-10 flex-col items-center justify-center">
        <div className=" items-start">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">
            Nueva entrega
          </h1>
          <div className=" max-w-xl mx-auto w-full bg-white px-10 py-8 rounded-lg">
            <form onSubmit={submitData}>
              <div className="max-w-xl">
                <div className="flex items-center space-x-5">
                  <div>
                    <Label htmlFor="fecha" className="my-2 flex w-full">
                      Fecha de venta
                    </Label>
                    <Input
                      onChange={(e) => setFecha(e.target.value)}
                      type="date"
                      placeholder="Fecha"
                      value={fecha.slice(0, 10)}
                      className="mb-4"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="fecha_programada"
                      className="flex w-full my-2"
                    >
                      Fecha de Entrega Programada (opcional)
                    </Label>
                    <Input
                      onChange={(e) => setFecha_programada(e.target.value)}
                      type="date"
                      placeholder="Fecha de Entrega Programada"
                      value={
                        fecha_programada ? fecha_programada.slice(0, 10) : ""
                      }
                      className="mb-4 w-full"
                    />
                  </div>
                </div>
                <Label>Producto</Label>
                <Textarea
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Euro 2x2 + bases + Almohadas"
                  value={producto}
                  className="mb-4"
                  required
                />
                <div className="mb-4 relative" ref={clientListContainerRef}>
                  <Label className="mt-2">Cliente</Label>
                  <Input
                    onChange={handleClientSearch}
                    placeholder="Buscá un Cliente de Contabilium por nombre o DNI"
                    value={nombre}
                    required
                  />
                  <div id="customers_search" className="absolute z-10 w-full">
                    <div
                      className={`overflow-hidden transition-[max-height] mt-1 duration-300 ease-in-out ${
                        loading || clients.length > 0 ? "max-h-60" : "max-h-0"
                      }`}
                    >
                      {loading ? (
                        <ul className="border border-gray-300 rounded-md">
                          <li className="animate-pulse h-16 bg-gray-50 p-2"></li>
                        </ul>
                      ) : clients.length > 0 ? (
                        <ul className="bg-gray-50 rounded-md p-2 border border-gray-300">
                          {clients.map((client) => (
                            <li
                              key={client.Id}
                              onClick={() => handleClientSelect(client)}
                              className="cursor-pointer hover:bg-gray-200 p-2"
                            >
                              {client.RazonSocial}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    {error && (
                      <p style={{ color: "red" }}>Error: {error}</p>
                    )}
                  </div>
                  <span className="text-sm mt-2 text-gray-500">
                    Buscá clientes de Contabilium
                  </span>
                </div>
                <div className="mb-4">
                  <Label>Domicilio</Label>
                  <Input
                    ref={autocompleteRef}
                    onChange={(e) => setDomicilio(e.target.value)}
                    placeholder="9 de Julio 322"
                    value={domicilio}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm mt-2 text-gray-500">
                    Podés editarlo si no es correcto
                  </span>
                </div>
                <div className="mb-4">
                  <Label className="mt-2">Celular</Label>
                  <Input
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="3541614107"
                    value={celular}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm mt-2 text-gray-500">
                    Podés editarlo si no es correcto
                  </span>
                  {celularError && (
                    <p className="text-sm text-red-500">{celularError}</p>
                  )}
                </div>
                <div className="mb-4">
                  <Label className="mt-2">Notas</Label>
                  <Input
                    onChange={(e) =>
                      setNewNotas([{ content: e.target.value }])
                    }
                    placeholder="Agregar saldos pendientes y entre qué calles está"
                    value={
                      newNotas.length > 0 ? newNotas[0].content : ""
                    }
                    className="mt-1"
                  />
                </div>
                <div className="items-top mt-4 bg-slate-50 p-4 rounded-md flex space-x-2">
                  <input
                    type="checkbox"
                    id="pagado"
                    checked={pagado}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="pagado"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Está pagado en su totalidad
                    </label>
                    <p className="text-sm text-slate-600 text-muted-foreground">
                      Cualquier saldo que quede pendiente, agregar a notas.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => Router.push("/")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" value="Create">
                    Guardar
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
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
