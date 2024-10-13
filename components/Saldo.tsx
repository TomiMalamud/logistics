// Saldo.tsx

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface SaldoProps {
  id_comprobante: number;
}

const Saldo: React.FC<SaldoProps> = ({ id_comprobante }) => {
  const [saldo, setSaldo] = useState<string | null>(null); // State to store the fetched Saldo
  const [error, setError] = useState<string | null>(null); // Optional: State to handle errors

  useEffect(() => {
    const fetchAndSetSaldo = async () => {
      if (id_comprobante) {
        try {
          const response = await fetch(`/api/get-comprobante?id_comprobante=${id_comprobante}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Parse the saldo string to a number
          // Replace comma with dot for proper parsing
          const parsedSaldo = parseFloat(data.Saldo.replace(',', '.'));

          if (isNaN(parsedSaldo)) {
            throw new Error('Saldo is not a valid number');
          }

          // Round the saldo to the nearest integer
          const roundedSaldo = Math.round(parsedSaldo);

          setSaldo(roundedSaldo.toString()); // Set the rounded Saldo as a string
        } catch (err) {
          console.error('Error fetching Saldo:', err);
          setError('Failed to fetch Saldo.');
        }
      }
    };

    fetchAndSetSaldo(); // Call the async function
  }, [id_comprobante]); // This effect will run whenever id_comprobante changes

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <>
      {saldo && 
      <Alert variant='destructive' className=" mt-3">
      <AlertTitle>Factura adeudada</AlertTitle>
      <AlertDescription>
        Saldo: $ {saldo}. Recordá registrar la cobranza en Contabilium si cobramos en contraentrega.
      </AlertDescription>
    </Alert>
    }
    </>
  )
  
  ;
};

export default Saldo;
