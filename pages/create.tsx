import React, { useState } from "react";
import Layout from "../components/Layout";
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
    const finalFecha =
      fecha ||
      (() => {
        const today = new Date();
        return today.toISOString().slice(0, 10) + "T00:00:00Z";
      })();

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
        fecha_programada: fecha_programada ? new Date(fecha_programada).toISOString() : null, // Convert date string to ISO format for Prisma, handle null
        newNotaContent: newNotas.length > 0 ? newNotas[0].content : ''
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

  return (
    <>
      <main className="relative flex min-h-screen p-20 flex-col items-center justify-center">
        <div className=" max-w-xl mx-auto w-full">
          <form onSubmit={submitData}>
            <div className="space-y-12 max-w-xl">
              <div className="border-b border-gray-900/10 pb-12">
                <h1 className="text-2xl font-bold tracking-tight mb-4">
                  Nueva entrega
                </h1>
                <Label>Punto de Venta</Label>
                <Input
                  autoFocus
                  onChange={(e) => setPunto_venta(e.target.value)}
                  placeholder="Punto de Venta"
                  type="number"
                  value={punto_venta}
                  className="mb-2"
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
                      className="mb-2"
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
                      onChange={(e) =>
                        setFecha_programada(e.target.value)
                      } 
                      type="date"
                      placeholder="Fecha de Entrega Programada"
                      value={
                        fecha_programada ? fecha_programada.slice(0, 10) : ""
                      }
                      className="mb-2 w-full "
                    />
                  </div>
                </div>
                <Label>Producto</Label>
                <Input
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Euro 2x2 + bases + Almohadas"
                  value={producto}
                  className="mb-2"
                  required
                />
                <Label className="mt-2">Domicilio</Label>
                <Input
                  onChange={(e) => setDomicilio(e.target.value)}
                  placeholder="9 de Julio 322"
                  value={domicilio}
                  className="mb-2"
                  required
                />
                <Label className="mt-2">Nombre</Label>
                <Input
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  value={nombre}
                  className="mb-2"
                  required
                />
                <Label className="mt-2">Celular</Label>
                <Input
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="3541614107"
                  value={celular}
                  className="mb-2"
                  required
                />{" "}
                {celularError && (
                  <p className="text-sm text-red-500">{celularError}</p>
                )}
                <Label className="mt-2">Notas</Label>
                <Input
                  onChange={(e) => setNewNotas([{ content: e.target.value }])}
                  placeholder="Agregar fecha de entrega en lo posible. Agregar saldos pendientes"
                  value={newNotas.length > 0 ? newNotas[0].content : ""}
                  className="mb-2"
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
                    onClick={() => Router.push("/tabla_ordenes")}
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
      </main>
    </>
  );
};

export default Create;
