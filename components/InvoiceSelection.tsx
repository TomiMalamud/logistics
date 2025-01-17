// components/InvoiceSelection.tsx

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Comprobante, SearchComprobanteResponse } from "@/types/api";
import { useEffect, useState } from "react";

export default function InvoiceSelection({
  onSelect,
  placeholder = "Select a invoice_number"
}) {
  const [invoices, setInvoices] = useState<Comprobante[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/search-invoices");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch invoices");
        }
        const data: SearchComprobanteResponse = await response.json();
        setInvoices(data.Items);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching invoices:", err);
        setError(err.message || "Unknown error");
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleSelect = (value: string) => {
    setSelected(value);
    const selectedInvoice = invoices.find((c) => c.Id === Number(value));
    if (selectedInvoice && onSelect) {
      onSelect(selectedInvoice);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Select onValueChange={handleSelect} value={selected}>
      <SelectTrigger className="mt-1">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Comprobantes</SelectLabel>
          {loading ? (
            <SelectItem value="loading">Cargando...</SelectItem>
          ) : (
            invoices.map((invoice_number) => (
              <SelectItem
                key={invoice_number.Id}
                value={String(invoice_number.Id)}
              >
                {invoice_number.TipoFc} {invoice_number.Numero} |{" "}
                {invoice_number.RazonSocial}
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
