"use client";
import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

interface ERPRow {
  Codigo: string;
  Nombre: string;
  "Stock Disponible": number;
}

interface SkuRow {
  SKU: string;
}

interface ComparisonResult {
  sku: string;
  name: string;
  physicalCount: number;
  systemStock: number;
  difference: number;
}

interface MissingResult {
  sku: string;
  name: string;
  systemStock: number;
  status: "missing" | "extra";
}

interface LoadingState {
  erp: boolean;
  sku: boolean;
  comparison: boolean;
}

export default function CompareStock() {
  const [erpData, setErpData] = useState<ERPRow[]>([]);
  const [skuData, setSkuData] = useState<SkuRow[]>([]);
  const [result, setResult] = useState<string>("");
  const [stockComparison, setStockComparison] = useState<ComparisonResult[]>(
    []
  );
  const [missingItems, setMissingItems] = useState<MissingResult[]>([]);
  const [erpSheets, setErpSheets] = useState<string[]>([]);
  const [skuSheets, setSkuSheets] = useState<string[]>([]);
  const [selectedErpSheet, setSelectedErpSheet] = useState<string>("");
  const [selectedSkuSheet, setSelectedSkuSheet] = useState<string>("");
  const [isLoading, setIsLoading] = useState<LoadingState>({
    erp: false,
    sku: false,
    comparison: false,
  });
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  const validateFile = (file: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Formato de archivo inválido. Por favor subí un archivo Excel (.xlsx)"
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new Error("El archivo es demasiado grande. Máximo 5MB permitido.");
    }
  };

  // Add column validation helper function
  const validateColumns = (headers: string[], requiredColumns: string[]) => {
    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col)
    );
    if (missingColumns.length > 0) {
      throw new Error(`Columnas faltantes: ${missingColumns.join(", ")}`);
    }
  };

  const handleErpUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      setIsLoading((prev) => ({ ...prev, erp: true }));
      validateFile(file);

      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const sheets = workbook.SheetNames;
      setErpSheets(sheets);

      const firstSheet = sheets[0];
      setSelectedErpSheet(firstSheet);

      const sheet = workbook.Sheets[firstSheet];

      // Get headers from the first row
      const headers = Object.keys(XLSX.utils.sheet_to_json(sheet)[0] || {});

      // Validate required columns
      const requiredColumns = ["Codigo", "Stock Disponible", "Nombre"];
      validateColumns(headers, requiredColumns);

      const jsonData = XLSX.utils.sheet_to_json(sheet) as ERPRow[];
      setErpData(jsonData);
      setResult("Archivo de ERP subido correctamente.");
    } catch (error) {
      setResult(
        error instanceof Error
          ? `Error: ${error.message}. Las columnas deben ser exactamente: 'Codigo', 'Stock Disponible', y 'Nombre' (respetando mayúsculas y minúsculas). Descargá el archivo sin modificar de Contabilium.`
          : "Error desconocido al procesar el archivo."
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, erp: false }));
    }
  };

  const handleSkuUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      setIsLoading((prev) => ({ ...prev, sku: true }));
      validateFile(file);

      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const sheets = workbook.SheetNames;
      setSkuSheets(sheets);

      const firstSheet = sheets[0];
      setSelectedSkuSheet(firstSheet);

      const sheet = workbook.Sheets[firstSheet];

      // Get headers from the first row
      const headers = Object.keys(XLSX.utils.sheet_to_json(sheet)[0] || {});

      // Validate required columns
      const requiredColumns = ["SKU"];
      validateColumns(headers, requiredColumns);

      const jsonData = XLSX.utils.sheet_to_json(sheet) as SkuRow[];
      setSkuData(jsonData);
      setResult("Archivo de SKUs subido correctamente.");
    } catch (error) {
      setResult(
        error instanceof Error
          ? `Error: ${error.message}. La columna debe ser exactamente 'SKU' (respetando mayúsculas). Los SKU deben tener el dígito de control.`
          : "Error desconocido al procesar el archivo."
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, sku: false }));
    }
  };

  const erpDropzone = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    onDrop: handleErpUpload,
    multiple: false,
  });

  const skuDropzone = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    onDrop: handleSkuUpload,
    multiple: false,
  });

  const compareStock = () => {
    if (erpData.length === 0 || skuData.length === 0) {
      setResult("Por favor subir ambos archivos.");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, comparison: true }));

      const physicalInventory = skuData.reduce<Record<string, number>>(
        (acc, row) => {
          const cleanSku = row.SKU.slice(0, -1).toUpperCase();
          acc[cleanSku] = (acc[cleanSku] || 0) + 1;
          return acc;
        },
        {}
      );

      const systemInventory = erpData.reduce<Record<string, ERPRow>>(
        (acc, row) => {
          acc[row.Codigo.toUpperCase()] = row;
          return acc;
        },
        {}
      );

      const quantityComparison: ComparisonResult[] = Object.entries(
        physicalInventory
      ).map(([sku, quantity]) => {
        const erpProduct = systemInventory[sku];
        return {
          sku,
          name: erpProduct?.Nombre || "No encontrado en sistema",
          physicalCount: quantity,
          systemStock: erpProduct?.["Stock Disponible"] || 0,
          difference: quantity - (erpProduct?.["Stock Disponible"] || 0),
        };
      });

      const inventoryDiscrepancies: MissingResult[] = [];

      Object.entries(systemInventory).forEach(([sku, product]) => {
        if (!physicalInventory[sku] && product["Stock Disponible"] > 0) {
          inventoryDiscrepancies.push({
            sku,
            name: product.Nombre,
            systemStock: product["Stock Disponible"],
            status: "missing",
          });
        }
      });

      Object.entries(physicalInventory).forEach(([sku, count]) => {
        if (!systemInventory[sku]) {
          inventoryDiscrepancies.push({
            sku,
            name: "No encontrado en sistema",
            systemStock: 0,
            status: "extra",
          });
        }
      });

      setStockComparison(quantityComparison);
      setMissingItems(inventoryDiscrepancies);

      const ws1 = XLSX.utils.json_to_sheet(quantityComparison);
      const ws2 = XLSX.utils.json_to_sheet(inventoryDiscrepancies);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, "Comparación de Cantidades");
      XLSX.utils.book_append_sheet(wb, ws2, "Items Faltantes o Sobrantes");
      XLSX.writeFile(wb, "reporte_inventario.xlsx");

      setResult("Comparación completada. Se ha descargado el reporte.");
    } catch (error) {
      setResult("Error al realizar la comparación.");
    } finally {
      setIsLoading((prev) => ({ ...prev, comparison: false }));
    }
  };

  const handleErpSheetChange = (value: string) => {
    setSelectedErpSheet(value);
    const sheet = XLSX.utils.sheet_to_json(
      XLSX.read(erpData, { type: "array" }).Sheets[value]
    ) as ERPRow[];
    setErpData(sheet);
  };

  const handleSkuSheetChange = (value: string) => {
    setSelectedSkuSheet(value);
    const sheet = XLSX.utils.sheet_to_json(
      XLSX.read(skuData, { type: "array" }).Sheets[value]
    ) as SkuRow[];
    setSkuData(sheet);
  };

  return (
    <Layout title="Comparar Inventario">
      {result && (
        <Alert
          className={`mb-4 max-w-md mx-auto ${
            result.startsWith("Error:") ? "bg-red-100" : "bg-green-100"
          }`}
        >
          <AlertTitle>
            {result.startsWith("Error:") ? "Error" : "¡Listo!"}
          </AlertTitle>
          <AlertDescription>{result.replace("Error: ", "")}</AlertDescription>
        </Alert>
      )}
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Comparación de Inventario Físico vs Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div
              {...erpDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${
            erpDropzone.isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300"
          }`}
            >
              <input {...erpDropzone.getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                {isLoading.erp ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
                <p className="text-sm text-gray-600">
                  {erpDropzone.isDragActive
                    ? "Soltá el archivo acá"
                    : "Arrastrá o hacé click para subir el archivo del Sistema (.xlsx)"}
                </p>
              </div>
            </div>

            <Select
              value={selectedErpSheet}
              onValueChange={handleErpSheetChange}
            >
              <SelectTrigger
                className={`${
                  erpSheets.length !== 0 ? "bg-green-50" : ""
                } w-full`}
                disabled={erpSheets.length === 0}
              >
                <SelectValue placeholder="Seleccionar hoja" />
              </SelectTrigger>
              <SelectContent>
                {erpSheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div
              {...skuDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${
            skuDropzone.isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300"
          }`}
            >
              <input {...skuDropzone.getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                {isLoading.sku ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
                <p className="text-sm text-gray-600">
                  {skuDropzone.isDragActive
                    ? "Soltá el archivo acá"
                    : "Arrastrá o hacé click para subir el archivo de Inventario Físico (.xlsx)"}
                </p>
              </div>
            </div>

            <Select
              value={selectedSkuSheet}
              onValueChange={handleSkuSheetChange}
            >
              <SelectTrigger
                className={`${
                  skuSheets.length !== 0 ? "bg-green-50" : ""
                } w-full`}
                disabled={skuSheets.length === 0}
              >
                <SelectValue placeholder="Seleccionar hoja" />
              </SelectTrigger>
              <SelectContent>
                {skuSheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={compareStock}
            className="w-full"
            disabled={
              isLoading.comparison || !erpData.length || !skuData.length
            }
          >
            {isLoading.comparison ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparando...
              </>
            ) : (
              "Comparar Inventario"
            )}
          </Button>
        </CardFooter>
      </Card>

      {(stockComparison.length > 0 || missingItems.length > 0) && (
        <Card className="w-full max-w-8xl mx-auto mt-4">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quantities">
              <TabsList className="w-full">
                <TabsTrigger value="quantities" className="flex-1">
                  Diferencias de Cantidad
                </TabsTrigger>
                <TabsTrigger value="missing" className="flex-1">
                  Faltantes/Sobrantes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quantities">
                <div className="m-4 flex items-center justify-end space-x-2">
                  <Checkbox
                    id="differences"
                    checked={showOnlyDifferences}
                    onCheckedChange={(checked) =>
                      setShowOnlyDifferences(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="differences"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mostrar solo diferencias
                  </label>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 py-2">SKU</TableHead>
                        <TableHead className="px-4 py-2">Nombre</TableHead>
                        <TableHead className="px-4 py-2">Físico</TableHead>
                        <TableHead className="px-4 py-2">Sistema</TableHead>
                        <TableHead className="px-4 py-2">Diferencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockComparison
                        .filter(
                          (item) =>
                            !showOnlyDifferences || item.difference !== 0
                        )
                        .map((item, index) => (
                          <TableRow
                            key={index}
                            className={
                              item.difference !== 0 ? "bg-yellow-100" : ""
                            }
                          >
                            <TableCell className="px-4 py-2">
                              {item.sku}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              {item.name}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              {item.physicalCount}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              {item.systemStock}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              {item.difference}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="missing">
                <div className="max-h-96 overflow-y-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 py-2">SKU</TableHead>
                        <TableHead className="px-4 py-2">Nombre</TableHead>
                        <TableHead className="px-4 py-2">Sistema</TableHead>
                        <TableHead className="px-4 py-2">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missingItems.map((item, index) => (
                        <TableRow
                          key={index}
                          className={
                            item.status === "missing"
                              ? "bg-red-100"
                              : "bg-blue-100"
                          }
                        >
                          <TableCell className="px-4 py-2">
                            {item.sku}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            {item.name}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            {item.systemStock}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            {item.status === "missing"
                              ? "Faltante"
                              : "Sobrante"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
