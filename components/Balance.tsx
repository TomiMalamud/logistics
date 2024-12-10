// Saldo.tsx

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getSaldoFromCache, setSaldoInCache } from '@/lib/balanceCache';

interface SaldoProps {
  invoice_id: number;
}

export default function Saldo({ invoice_id }: SaldoProps) {
  const [balance, setSaldo] = useState<string | null>(null); // State to store the fetched Saldo
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    const fetchAndSetSaldo = async () => {
      if (!invoice_id) return;

      // Check if balance is cached
      const cachedSaldo = getSaldoFromCache(invoice_id);
      if (cachedSaldo !== undefined) {
        setSaldo(cachedSaldo);
        return;
      }

      try {
        const response = await fetch(`/api/get-invoice_number?invoice_id=${invoice_id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const fetchedSaldo = data.Saldo.toString();
        setSaldo(fetchedSaldo);
        setSaldoInCache(invoice_id, fetchedSaldo);
      } catch (err) {        
        setError('No se encontró la factura y no conocemos el saldo pendiente. Recargá la página.');
      }
    };

    fetchAndSetSaldo(); // Call the async function
  }, [invoice_id]); // This effect will run whenever invoice_id changes

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <>
      {balance && balance !== "0,00" && 
        <Alert variant='destructive' className="mt-3">
          <AlertTitle>Factura adeudada</AlertTitle>
          <AlertDescription>
            Saldo: $ {balance}. Recordá registrar la cobranza en Contabilium si cobramos en contraentrega.
          </AlertDescription>
        </Alert>
      }
    </>
  );
};