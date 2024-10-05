import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
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
  const [loadingClient, setLoadingClient] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const clientListContainerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
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

  const [inputFocused, setInputFocused] = useState(false); // To track input focus
  const [activeIndex, setActiveIndex] = useState<number>(-1); // For keyboard navigation

  const handleFocus = () => {
    setInputFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if blur event is related to the dropdown (using clientListContainerRef)
    if (
      clientListContainerRef.current &&
      !clientListContainerRef.current.contains(e.relatedTarget as Node)
    ) {
      setInputFocused(false);
      setActiveIndex(-1); // Reset active index when input loses focus
    }
  };

  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, "");
  };

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true); // Start loading state

    try {
      if (!validateCelular(celular)) {
        setCelularError(
          "Formato válido: 3541614107. Sin 0 ni 15, sin espacios ni guiones."
        );
        setLoading(false); // Stop loading if validation fails
        return;
      }

      const body = {
        fecha,
        producto,
        domicilio,
        nombre,
        celular,
        pagado,
        fecha_programada: fecha_programada || null,
        newNotaContent: newNotas.length > 0 ? newNotas[0].content : "",
        created_by: user.id
      };
      console.log("Body being sent:", body);

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
      setLoading(false); // Stop loading after submission
    }
  };

  // Debounce timer reference
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (nombre.length > 2) {
      setLoadingClient(true); // Start loading client search
      setError(null);

      // Clear the previous debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set a new debounce timer
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/search-client?filtro=${encodeURIComponent(nombre)}`
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
          setLoadingClient(false); // Stop loading client search
          setActiveIndex(-1); // Reset active index after search
        }
      }, 300); // 1 second debounce
    } else {
      // If input length <= 2, clear clients
      setClients([]);
      setLoadingClient(false);
      setActiveIndex(-1); // Reset active index
      // Clear any existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }

    // Cleanup function to clear the timeout if the component unmounts or nombre changes
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [nombre]); // Run this effect whenever 'nombre' changes

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (clients.length === 0 && nombre.length > 2) {
      // If no clients found, do nothing
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex < clients.length - 1 ? prevIndex + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : clients.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < clients.length) {
          handleClientSelect(clients[activeIndex]);
        }
        break;
      case "Escape":
        setClients([]);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  // Modified handleClientSelect Function
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
    setActiveIndex(-1); // Reset active index after selection
  };

  useEffect(() => {
    if (isLoaded && typeof google !== "undefined") {
      const autocomplete = new google.maps.places.Autocomplete(
        autocompleteRef.current as HTMLInputElement,
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
        setActiveIndex(-1); // Reset active index when clicking outside
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
                      disabled={loading}
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
                      disabled={loading}
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
                  disabled={loading}
                />
                <div className="mb-4 relative" ref={clientListContainerRef}>
                  <Label className="mt-2">Cliente</Label>
                  <Input
                    onChange={(e) => setNombre(e.target.value)} // Update 'nombre' state directly
                    onFocus={handleFocus} // Set input as focused
                    onBlur={handleBlur} // Close dropdown if input loses focus
                    onKeyDown={handleKeyDown} // Handle keyboard navigation
                    placeholder="Buscá un Cliente de Contabilium por nombre o DNI"
                    value={nombre}
                    required
                    disabled={loading}
                    autoComplete="off" // Disable browser autocomplete
                  />
                  <div id="customers_search" className="absolute z-10 w-full">
                    <div
                      className={`overflow-hidden transition-[max-height] mt-1 duration-300 ease-in-out ${
                        (loadingClient || clients.length > 0 || (nombre.length > 2 && !loadingClient)) &&
                        inputFocused
                          ? "max-h-60"
                          : "max-h-0"
                      }`}
                    >
                      {loadingClient ? (
                        <ul className="border border-gray-300 rounded-md">
                          <li className="animate-pulse h-16 bg-gray-50 p-2"></li>
                        </ul>
                      ) : clients.length > 0 ? (
                        <ul className="bg-gray-50 rounded-md p-2 border border-gray-300">
                          {clients.map((client, index) => (
                            <li
                              key={client.Id}
                              onClick={() => handleClientSelect(client)}
                              className={`cursor-pointer hover:bg-gray-200 p-2 ${
                                index === activeIndex ? "bg-gray-200" : ""
                              }`}
                              onMouseEnter={() => setActiveIndex(index)}
                              onMouseLeave={() => setActiveIndex(-1)}
                            >
                              {client.RazonSocial}
                            </li>
                          ))}
                        </ul>
                      ) : nombre.length > 2 ? ( // Show message only if a search was performed
                        <ul className="bg-gray-50 rounded-md p-2 border border-gray-300">
                          <li>No se encontraron clientes.</li>
                        </ul>
                      ) : null}
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    onChange={(e) => setNewNotas([{ content: e.target.value }])}
                    placeholder="Agregar saldos pendientes y entre qué calles está"
                    value={newNotas.length > 0 ? newNotas[0].content : ""}
                    className="mt-1"
                    disabled={loading} // Disable input during loading
                  />
                </div>
                <div className="items-top mt-4 bg-slate-50 p-4 rounded-md flex space-x-2">
                  <input
                    type="checkbox"
                    id="pagado"
                    checked={pagado}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4"
                    disabled={loading}
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
                  <Button type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Guardar"}
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
