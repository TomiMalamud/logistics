import React, { useState, useEffect, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";
import Router from "next/router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const Create: React.FC = () => {
  const [punto_venta, setPunto_venta] = useState("");
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
  const autocompleteRef = useRef(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, 
    libraries: ["places"]
  });
  const allowedValues = ["1", "6", "7", "13"];

  const handleChange = (e) => {
    const value = e.target.value;
    if (allowedValues.includes(value)) {
      setPunto_venta(value);
    } else {      
      setPunto_venta(""); 
    }
  };

  const [fecha_programada, setFecha_programada] = useState("");

  const validateCelular = (value: string) => {
    const celularRegex = /^\d{10}$/;
    return celularRegex.test(value);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagado(event.target.checked);
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
      const body = {
        punto_venta,
        fecha: new Date(fecha).toISOString(), // Convert date string to ISO format for Prisma
        producto,
        domicilio,
        nombre,
        celular,
        pagado,
        fecha_programada: fecha_programada
          ? new Date(fecha_programada).toISOString()
          : null, // Convert date string to ISO format for Prisma, handle null
        newNotaContent: newNotas.length > 0 ? newNotas[0].content : ""
      };

      await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      await Router.push("/");
    } catch (error) {
      console.error(error);
    }
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
                <div>
                  <Label className="my-2">Punto de Venta</Label>
                  <Input
                    autoFocus
                    onChange={handleChange} // Use the custom handler
                    placeholder="Punto de Venta"
                    type="number"
                    value={punto_venta}
                    className="mb-4 w-40"
                    required
                  />
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
                        className=" flex w-full my-2"
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
                        className="mb-4 w-full "
                      />
                    </div>
                  </div>
                  <Label>Producto</Label>
                  <Input
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder="Euro 2x2 + bases + Almohadas"
                    value={producto}
                    className="mb-4"
                    required
                  />
                  <Label className="mt-2">Domicilio</Label>
                  <Input
                    ref={autocompleteRef}
                    onChange={(e) => setDomicilio(e.target.value)}
                    placeholder="9 de Julio 322"
                    value={domicilio}
                    className="mb-4"
                    required
                  />
                  <Label className="mt-2">Nombre</Label>
                  <Input
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    value={nombre}
                    className="mb-4"
                    required
                  />
                  <Label className="mt-2">Celular</Label>
                  <Input
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="3541614107"
                    value={celular}
                    className="mb-4"
                    required
                  />{" "}
                  {celularError && (
                    <p className="text-sm text-red-500">{celularError}</p>
                  )}
                  <Label className="mt-2">Notas</Label>
                  <Input
                    onChange={(e) => setNewNotas([{ content: e.target.value }])}
                    placeholder="Agregar saldos pendientes y entre qué calles está"
                    value={newNotas.length > 0 ? newNotas[0].content : ""}
                    className="mb-4"
                  />
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
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default Create;
