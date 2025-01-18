import { Customer, Delivery } from "@/types/types";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface Props {
  delivery: Delivery;
  customer: Customer;
  selectedItems?: {
    [sku: string]: number;
  };
}

export const RemitoDownload = ({ delivery, customer, selectedItems }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!delivery.scheduled_date) {
      setError("No se puede descargar el remito hasta asignar una fecha de entrega");
      return;
    }

    handleDownload();
  };

  const handleDownload = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get the products to include in the remito
      const productsToInclude = delivery.delivery_items
        ?.filter(item => selectedItems?.[item.product_sku])
        .map(item => ({
          name: item.products?.name || 'Unknown Product',
          quantity: selectedItems?.[item.product_sku] || 0,
          sku: item.product_sku
        }));

      if (!productsToInclude?.length) {
        throw new Error("No hay productos seleccionados");
      }

      if (!customer?.name || !customer.address || !customer.phone) {
        throw new Error("Datos del cliente incompletos");
      }

      const response = await fetch("/api/deliveries/generate-remito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          delivery: {
            ...delivery,
            products: productsToInclude
          }, 
          customer 
        })
      });

      if (!response.ok) {
        throw new Error("Error al generar el PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `remito-${customer.name}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <Button 
        onClick={handleClick} 
        disabled={isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        {isLoading ? "Generando PDF..." : "Descargar Remito"}
      </Button>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};