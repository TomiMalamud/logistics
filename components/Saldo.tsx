// Saldo.tsx

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getSaldoFromCache, setSaldoInCache } from '@/lib/saldoCache';

interface SaldoProps {
  id_comprobante: number;
}

const Saldo: React.FC<SaldoProps> = ({ id_comprobante }) => {
  const [saldo, setSaldo] = useState<string | null>(null); // State to store the fetched Saldo
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    const fetchAndSetSaldo = async () => {
      if (!id_comprobante) return;

      // Check if saldo is cached
      const cachedSaldo = getSaldoFromCache(id_comprobante);
      if (cachedSaldo !== undefined) {
        setSaldo(cachedSaldo);
        return;
      }

      try {
        const response = await fetch(`/api/get-comprobante?id_comprobante=${id_comprobante}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const fetchedSaldo = data.Saldo.toString();
        setSaldo(fetchedSaldo);
        setSaldoInCache(id_comprobante, fetchedSaldo);
      } catch (err) {        
        setError('No se encontró la factura. Probá recargando la página.');
      }
    };

    fetchAndSetSaldo(); // Call the async function
  }, [id_comprobante]); // This effect will run whenever id_comprobante changes

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <>
      {saldo && saldo !== "0,00" && 
        <Alert variant='destructive' className="mt-3">
          <AlertTitle>Factura adeudada</AlertTitle>
          <AlertDescription>
            Saldo: $ {saldo}. Recordá registrar la cobranza en Contabilium si cobramos en contraentrega.
          </AlertDescription>
        </Alert>
      }
    </>
  );
};

export default Saldo;
