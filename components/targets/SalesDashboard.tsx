import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PeriodOption, useSalesData } from "@/lib/hooks/useSalesData";
import type { Profile } from "@/types/types";
import { ERP_PROFILES } from "@/utils/constants";
import { Rocket } from "lucide-react";
import { useState } from "react";
import SalesChart from "./SalesChart";
import TierProgress from "./TierProgress";

// Loading skeleton for the sales table
const TableSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

interface SalesDashboardProps {
  profile: Profile;
}

export default function SalesDashboard({ profile }: SalesDashboardProps) {
  const periodOptions = [
    { value: "this-month", label: "Este mes" },
    { value: "last-month", label: "Mes pasado" }
  ] as const;

  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodOption>("this-month");
  const [selectedVendedor, setSelectedVendedor] = useState<string>(() => {
    // If profile is not Tomi or Cari and has user_id_erp, use that as initial value
    if (
      profile?.name !== "Tomi" &&
      profile?.name !== "Cari" &&
      profile?.user_id_erp
    ) {
      return profile.user_id_erp;
    }
    return "all";
  });

  const { data, isLoading, error } = useSalesData(
    selectedPeriod,
    selectedVendedor
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading sales data: {error}</AlertDescription>
      </Alert>
    );
  }

  const showVendedorFilter =
    profile?.name === "Tomi" || profile?.name === "Cari";

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-x-4">
          Mis objetivos
          <Rocket color="#51302d" />
        </h2>
        <div className="flex items-center gap-4">
          {showVendedorFilter && (
            <Select
              value={selectedVendedor}
              onValueChange={setSelectedVendedor}
            >
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Seleccionar Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Vendedores</SelectItem>
                {Object.entries(ERP_PROFILES).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TierProgress
        totalSales={data?.totalSales}
        isLoading={isLoading}
        employeeId={selectedVendedor}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Últimas ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell>{sale.customer}</TableCell>
                      <TableCell className="text-right">
                        ${sale.amount.toLocaleString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="col-span-3">
          <SalesChart data={data} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
