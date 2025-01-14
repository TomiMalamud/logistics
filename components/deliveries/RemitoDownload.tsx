import { Customer, Delivery } from "@/types/types";
import { Download } from "lucide-react";
import { useState } from "react";

interface Props {
  delivery: Delivery;
  customer: Customer;
}

export const RemitoDownload = ({ delivery, customer }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required data before making the request
      if (!delivery.scheduled_date || !Array.isArray(delivery.products)) {
        throw new Error("Datos de entrega incompletos");
      }

      if (!customer?.name || !customer.address || !customer.phone) {
        throw new Error("Datos del cliente incompletos");
      }

      const response = await fetch("/api/generate-remito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ delivery, customer }),
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
    <div className="flex items-center w-full" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? 'Generando PDF...' : 'Descargar Remito'}
      {error && <span className="ml-2 text-red-500 text-sm">{error}</span>}
    </div>
  );
};