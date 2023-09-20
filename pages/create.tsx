import React, { useState } from "react";
import Layout from "../components/Layout";
import Router from "next/router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const Create: React.FC = () => {
  const [punto_venta, setPunto_venta] = useState("");
  const [fecha, setFecha] = useState("");
  const [producto, setProducto] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [celularError, setCelularError] = useState("");
  const [newNotas, setNewNotas] = useState<{ content: string }[]>([]);

  const validateCelular = (value: string) => {
    const celularRegex = /^\d{10}$/;
    return celularRegex.test(value);
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
        fecha,
        producto,
        domicilio,
        nombre,
        celular,
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

  return (
    <Layout>
      <main className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
          <form onSubmit={submitData}>
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="font-semibold leading-7 mb-4 text-xl text-gray-900">
                  Nueva entrega
                </h2>
                <Label>Punto de Venta</Label>
                <Input
                  autoFocus
                  onChange={(e) => setPunto_venta(e.target.value)}
                  placeholder="Punto de Venta"
                  type="number"
                  value={punto_venta}
                  className="mb-2"
                />
                <Label className="mt-2">Fecha de venta</Label>
                <Input
                  onChange={(e) => setFecha(`${e.target.value}T00:00:00Z`)}
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  type="date"
                  placeholder="Fecha"
                  value={fecha.slice(0, 10)}
                  className="mb-2"
                />
                <Label>Producto</Label>
                <Input
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Euro 2x2 + bases + Almohadas"
                  value={producto}
                  className="mb-2"
                />
                <Label className="mt-2">Domicilio</Label>
                <Input
                  onChange={(e) => setDomicilio(e.target.value)}
                  placeholder="9 de Julio 322"
                  value={domicilio}
                  className="mb-2"
                />
                <Label className="mt-2">Nombre</Label>
                <Input
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  value={nombre}
                  className="mb-2"
                />
                <Label className="mt-2">Celular</Label>
                <Input
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="3541614107"
                  value={celular}
                  className="mb-2"
                />{" "}
                {celularError && (
                  <p className="text-sm text-red-500">{celularError}</p>
                )}
                <Label className="mt-2">Notas</Label>
                <Input
                  onChange={(e) => setNewNotas([{ content: e.target.value }])}
                  placeholder="Agregar fecha de entrega en lo posible."
                  value={newNotas.length > 0 ? newNotas[0].content : ""}
                  className="mb-2"
                />
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
      </main>
    </Layout>
  );
};

export default Create;
