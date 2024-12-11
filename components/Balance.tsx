// Saldo.tsx
import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { getSaldoFromCache as getBalanceFromCache, setSaldoInCache, removeFromCache } from '@/lib/balanceCache';

interface BalanceProps {
  invoice_id: number;
}

export default function Balance({ invoice_id }: BalanceProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalance = useCallback(async (skipCache = false) => {
    if (!invoice_id) return;

    // Check cache unless skipCache is true
    if (!skipCache) {
      const cachedBalance = getBalanceFromCache(invoice_id);
      if (cachedBalance !== undefined) {
        setBalance(cachedBalance);
        return;
      }
    }

    try {
      const response = await fetch(`/api/get-invoice_number?invoice_id=${invoice_id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fetchedBalance = data.Saldo.toString();
      
      setBalance(fetchedBalance);
      setSaldoInCache(invoice_id, fetchedBalance);
      setError(null);
    } catch (err) {
      setError('No se encontró la factura y no conocemos el saldo pendiente. Recargá la página.');
    }
  }, [invoice_id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    removeFromCache(invoice_id);
    await fetchBalance(true);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <>
      {balance && balance !== "0,00" && (
        <div className="relative group">
          <Alert variant="destructive" className={`mt-3 ${isRefreshing ? 'text-red-200' : ''}`}>
            <AlertTitle>Factura adeudada</AlertTitle>
            <AlertDescription>
              Saldo: $ {balance}. Recordá registrar la cobranza en Contabilium si cobramos en contraentrega.
            </AlertDescription>
          </Alert>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden absolute group-hover:block top-4 right-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}
    </>
  );
}