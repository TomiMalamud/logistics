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
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Upload } from "lucide-react";

interface ERPRow {
  SKU: string;
  "Precio Final": number;
}

interface EcommerceRow {
  SKU: string;
  "Precio promocional": string;
  Precio: string;
  [key: string]: string;
}

export default function UpdatePrices() {
  const [erpData, setErpData] = useState<ERPRow[]>([]);
  const [ecommerceData, setEcommerceData] = useState<EcommerceRow[]>([]);
  const [result, setResult] = useState<string>("");
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
          erpButtonRef.current.textContent = "Subir el archivo ERP (.xlsx)";
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

    const updatedData = ecommerceData.map((ecommerceRow) => {
      const erpRow = erpData.find((erp) => erp.SKU === ecommerceRow.SKU);
      if (erpRow) {
        const newPrecioPromocional = erpRow["Precio Final"];
        const newPrecio = Math.round(newPrecioPromocional / (1 - 0.45));
        return {
          ...ecommerceRow,
          "Precio promocional": newPrecioPromocional.toString(),
          Precio: newPrecio.toString()
        };
      }
      return ecommerceRow;
    });

    const csv = Papa.unparse(updatedData);

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "updated_ecommerce_prices.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setResult(
      "Los precios fueron actualizados. Por favor, revisá un colchón y un sommier antes de subirlos a Tienda Nube."
    );
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Actualización de precios de Tienda Nube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-20">
            <p className="text-gray-500 mb-2">
              Esta aplicación sirve para actualizar precios de Colchones y
              Sommiers en Tienda Nube. Los precios de almohadas, camas
              marineras, y sillones se actualizan automáticamente.
            </p>
            <ol className="list-decimal list-inside text-gray-800 leading-7">
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
                  href="https://rohisommiers2.mitiendanube.com/admin/v2/products/import?categoryId=11051538"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-900 transition underline underline-offset-4"
                >
                  Tienda Nube
                </a>
              </li>
              <li>Subilos a ambos usando los botones de abajo</li>
              <li>Hacé click en el botón de Actualizar Precios</li>
              <li>Verificá que los precios se hayan actualizado abriendo el archivo que se acaba de descargar.</li>
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
              variant="secondary"
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
      </Card>
      {result && (
        <Alert className="mt-4 max-w-md mx-auto">
          <AlertTitle>Estado</AlertTitle>
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
