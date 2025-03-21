import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatLongDate } from "@/lib/utils/format";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PaymentForm } from "./PaymentForm";

interface Props {
  user: {
    id: string;
  };
}

export function Balance({ user }: Props) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["manufacturer-balance"],
    queryFn: async () => {
      const response = await fetch("/api/manufacturing/balance");
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error al cargar el balance:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </AlertDescription>
      </Alert>
    );
  }

  const { transactions, totalBalance, initialBalance } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Cuenta Corriente - Stilo Propio</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Mostrando últimos 30 días
          </p>
        </div>
        <PaymentForm
          user={user}
          onSuccess={() => refetch()}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo Pago
            </Button>
          }
        />
      </CardHeader>

      <CardContent>
        <div className="text-sm text-muted-foreground mb-4 text-right">
          Saldo anterior:{" "}
          <span
            className={initialBalance > 0 ? "text-red-600" : "text-green-600"}
          >
            {formatCurrency(initialBalance)}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={`${transaction.date}-${index}`}>
                <TableCell>{formatLongDate(transaction.date)}</TableCell>
                <TableCell>{transaction.concept}</TableCell>
                <TableCell className="text-right">
                  {transaction.debit > 0 && formatCurrency(transaction.debit)}
                </TableCell>
                <TableCell className="text-right">
                  {transaction.credit > 0 && formatCurrency(transaction.credit)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    transaction.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(transaction.balance)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} className="text-right font-bold">
                Saldo Total
              </TableCell>
              <TableCell
                className={`text-right font-bold ${
                  totalBalance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatCurrency(totalBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
