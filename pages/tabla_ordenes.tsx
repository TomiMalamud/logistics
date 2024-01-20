import React, { useState } from "react";
import useSWR from "swr";
import LayoutDesktop from "../components/LayoutDesktop";
import EntregaDesktop, { EntregaProps } from "../components/EntregaDesktop";
import TablePlaceholder from "../components/TablePlaceholder";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { SelectGroup } from "@radix-ui/react-select";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

const DashboardDesktop: React.FC = () => {
  const { data } = useSWR(apiURL, fetcher);
  const [filterPagado, setFilterPagado] = useState("all"); // 'all', 'paid', 'notPaid'
  const [filterFechaProgramada, setFilterFechaProgramada] = useState("all"); // 'all', 'hasDate', 'noDate'

  if (!data)
    return (
      <LayoutDesktop>
        <TablePlaceholder />
      </LayoutDesktop>
    );
  const count = data.length;
  const filteredData = data.filter((entrega: EntregaProps) => {
    // Filter by 'pagado'
    if (filterPagado === "paid" && !entrega.pagado) return false;
    if (filterPagado === "notPaid" && entrega.pagado) return false;

    // Filter by 'fecha_programada'
    if (filterFechaProgramada === "hasDate" && !entrega.fecha_programada) return false;
    if (filterFechaProgramada === "noDate" && entrega.fecha_programada) return false;

    return true;
  });

  return (
    <LayoutDesktop count={count}>
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="flex space-x-2">
            <div className="relative w-full pb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de cliente o producto"
                className="pl-8 bg-white"
              />
            </div>
            <div className="flex w-auto">
              <Select
                value={filterPagado}
                onValueChange={(value) => setFilterPagado(value)}
              >
                <SelectTrigger
                  aria-label="Filter"
                  className="bg-white text-black"
                >
                  <SelectValue placeholder="Filtrar por 'pagado'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Estado del Pago</SelectLabel>
                    <SelectItem value="all">Estado del Pago: Todos</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                    <SelectItem value="notPaid">No Pagados</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-auto">
            <Select
                value={filterFechaProgramada}
                onValueChange={(value) => setFilterFechaProgramada(value)}
              >
                <SelectTrigger
                  aria-label="Filter"
                  className="bg-white text-black "
                >
                  <SelectValue placeholder="Filtrar por 'fecha programada'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Fecha Programada</SelectLabel>
                    <SelectItem value="all">Fecha Programada: Todas</SelectItem>
                    <SelectItem value="hasDate">Fecha programada</SelectItem>
                    <SelectItem value="noDate">Fecha no programada</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

            </div>
          </div>
        </form>
      </div>
      {filteredData.map((entrega: EntregaProps) => (
        <div className="py-2" key={entrega.id}>
          <EntregaDesktop entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </LayoutDesktop>
  );
};

export default DashboardDesktop;
