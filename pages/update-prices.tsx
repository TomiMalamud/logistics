"use client";
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface ERPRow {
  SKU: string;
  "Precio Final": number;
}

interface EcommerceRow {
  "Código de barras": string;
  "Precio promocional": string;
  Precio: string;
  [key: string]: string;
}

export default function UpdatePrices({ user }: { user: User }) {
  const [erpData, setErpData] = useState<ERPRow[]>([]);
  const [ecommerceData, setEcommerceData] = useState<EcommerceRow[]>([]);
  const [result, setResult] = useState<string>("");
  const [notFoundProducts, setNotFoundProducts] = useState<EcommerceRow[]>([]);
  const erpButtonRef = useRef<HTMLButtonElement>(null);

  const handleErpUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (erpButtonRef.current) {
        erpButtonRef.current.textContent = "Cargando...";
        erpButtonRef.current.disabled = true;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          range: "A1:Q1048576"
        }) as ERPRow[];

        const roundedData = jsonData.map((row) => ({
          ...row,
          "Precio Final": Math.round(row["Precio Final"])
        }));

        setErpData(roundedData);
        setResult("Archivo de Contabilium subido correctamente.");
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
        setResult(
          "Error al procesar al archivo de Contabilium. Llamar a Tomi."
        );
      } finally {
        if (erpButtonRef.current) {
          erpButtonRef.current.textContent =
            "Archivo de Contabilium subido correctamente.";
          erpButtonRef.current.disabled = false;
        }
      }
    }
  };

  const handleEcommerceUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result;
        Papa.parse(csv as string, {
          complete: (results) => {
            setEcommerceData(results.data as EcommerceRow[]);
            setResult("Archivo de Tienda Nube subido correctamente.");
          },
          header: true,
          encoding: "ISO-8859-1"
        });
      };
      reader.readAsText(file, "ISO-8859-1");
    }
  };

  const updatePrices = () => {
    if (erpData.length === 0 || ecommerceData.length === 0) {
      setResult(
        "Por favor subir los dos archivos, de Contabilium y de Tienda Nube."
      );
      return;
    }

    console.log("ERP Data:", erpData);
    console.log("Ecommerce Data:", ecommerceData);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFound: EcommerceRow[] = [];

    const updatedData = ecommerceData.map((ecommerceRow) => {
      const erpRow = erpData.find(
        (erp) => erp.SKU === ecommerceRow["Código de barras"]
      );
      if (erpRow) {
        updatedCount++;
        console.log(`Matching SKU found: ${erpRow.SKU}`);
        console.log(
          `Old price: ${ecommerceRow["Precio promocional"]}, New price: ${erpRow["Precio Final"]}`
        );

        const newPrecioPromocional = erpRow["Precio Final"];
        const newPrecio = Math.round(newPrecioPromocional / (1 - 0.45));

        return {
          ...ecommerceRow,
          "Precio promocional": newPrecioPromocional.toString(),
          Precio: newPrecio.toString()
        };
      } else {
        notFoundCount++;
        notFound.push(ecommerceRow);
        console.log(
          `No matching SKU found for: ${ecommerceRow["Código de barras"]}`
        );
        return ecommerceRow;
      }
    });

    setNotFoundProducts(notFound);

    console.log(`Updated ${updatedCount} products`);
    console.log(`${notFoundCount} products not found in ERP data`);

    const csv = Papa.unparse(updatedData);

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "precios_actualizados_tiendanube.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setResult(
      `Proceso completado. ${updatedCount} productos actualizados. Por favor, revisá un colchón y un sommier antes de subirlos a Tienda Nube.`
    );
  };

  return (
    <div className="container mx-auto p-4">
      {result && (
        <Alert className="mb-4 max-w-md bg-green-100 mx-auto">
          <AlertTitle>¡Listo!</AlertTitle>
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      )}
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Actualización de precios de Tienda Nube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-10">
            <p className="text-gray-500 mb-2">
              Esta aplicación sirve para actualizar precios de Colchones y
              Sommiers en Tienda Nube. Los precios de almohadas, camas
              marineras, y sillones se actualizan automáticamente.
            </p>
            <ol className="list-decimal list-inside text-gray-800 space-y-2">
              <li>
                Descargá el archivo .xlsx de productos desde{" "}
                <a
                  href="https://app.contabilium.com/conceptos.aspx"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-900 transition underline underline-offset-4"
                >
                  Contabilium
                </a>
              </li>
              <li>
                Descargá el archivo .csv de productos desde{" "}
                <a
                  href="https://rohisommiers2.mitiendanube.com/admin/v2/products/import?categoryId=11051538&published=true"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-900 transition underline underline-offset-4"
                >
                  Tienda Nube
                </a>
              </li>
              <li>Subilos a ambos usando los botones de abajo</li>
              <li>Hacé click en el botón de Actualizar Precios</li>
              <li>
                Verificá que los precios se hayan actualizado abriendo{" "}
                <span className="text-gray-500">
                  precios_actualizados_tiendanube.csv
                </span>{" "}
                (que se acaba de descargar).
              </li>
              <li>
                Subí el archivo creado a{" "}
                <a
                  href="https://rohisommiers2.mitiendanube.com/admin/v2/products/import/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-900 transition underline underline-offset-4"
                >
                  Tienda Nube
                </a>
              </li>
              <li>
                ¡Listo! Verificá los cambios luego de 10 minutos en la página.
                Deben coindicir con Contabilium.
              </li>
            </ol>
          </div>
          <div>
            <input
              id="erpFile"
              type="file"
              accept=".xlsx"
              onChange={handleErpUpload}
              className="hidden"
            />
            <Button
              ref={erpButtonRef}
              onClick={() => document.getElementById("erpFile")?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" /> Subir archivo de Contabilium
              (.xlsx)
            </Button>
          </div>
          <div>
            <input
              id="ecommerceFile"
              type="file"
              accept=".csv"
              onChange={handleEcommerceUpload}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById("ecommerceFile")?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" /> Subir archivo de Tienda Nube
              (.csv)
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={updatePrices} className="w-full" variant="default">
            Actualizar Precios
          </Button>
        </CardFooter>
        <p className="text-center mb-4">
          Nota: Sólo sirve para actualizar colchones y sommiers
        </p>
      </Card>
      {notFoundProducts.length > 1 && (
        <Card className="w-full max-w-xl mx-auto mt-4">
          <CardHeader>
            <CardTitle>Productos no encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {notFoundProducts.map((product, index) => (
                <li key={index}>
                  Código de barras: {product["Código de barras"]}, Nombre:{" "}
                  {product["Nombre"]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
