// components/ComprobantesSelect.tsx

import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchComprobanteResponse, Comprobante } from '@/types/api';

interface ComprobantesSelectProps {
  onSelect?: (comprobante: Comprobante) => void;
  placeholder?: string;
}

const ComprobantesSelect: React.FC<ComprobantesSelectProps> = ({ onSelect, placeholder = 'Select a comprobante' }) => {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComprobantes = async () => {
      try {
        const response = await fetch('/api/search-comprobantes');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch comprobantes');
        }
        const data: SearchComprobanteResponse = await response.json();
        setComprobantes(data.Items);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching comprobantes:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    };

    fetchComprobantes();
  }, []);

  const handleSelect = (value: string) => {
    setSelected(value);
    const selectedComprobante = comprobantes.find((c) => c.Id === Number(value));
    if (selectedComprobante && onSelect) {
      onSelect(selectedComprobante);
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
            comprobantes.map((comprobante) => (
              <SelectItem key={comprobante.Id} value={String(comprobante.Id)}>
                {comprobante.TipoFc} {comprobante.Numero} | {comprobante.RazonSocial}
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ComprobantesSelect;
