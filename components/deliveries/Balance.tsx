// Balance.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface BalanceProps {
  balance: string | null;
  error: string | null;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

export default function Balance({ balance, error, isRefreshing, refetch }: BalanceProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    );
  }

  return (
    <>
      {balance && balance !== "0,00" && (
        <div className="relative group">
          <Alert
            variant="destructive"
            className={`mt-3 ${isRefreshing ? "text-red-200" : ""}`}
          >
            <AlertTitle>Factura adeudada</AlertTitle>
            <AlertDescription>
              Saldo: $ {balance}. Recordá registrar la cobranza en Contabilium
              si cobramos en contraentrega.
            </AlertDescription>
          </Alert>
          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            disabled={isRefreshing}
            className="hidden absolute group-hover:block top-4 right-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      )}
    </>
  );
}