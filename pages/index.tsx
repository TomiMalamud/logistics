import React, { useState } from "react";
import useSWR from "swr";
import Layout from "../components/Layout";
import EntregaDesktop from "../components/EntregaDesktop";
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
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EntregaProps } from "../lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

const Index: React.FC = () => {
  const { data } = useSWR(apiURL, fetcher);
  const [filterPagado, setFilterPagado] = useState("all"); // 'all', 'paid', 'notPaid'
  const [filterFechaProgramada, setFilterFechaProgramada] = useState("all"); // 'all', 'hasDate', 'noDate'
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState("false"); // 'all', 'true', 'false'

  if (!data)
    return (
      <Layout>
        <TablePlaceholder />
      </Layout>
    );

  const filteredData = data.filter((entrega: EntregaProps) => {
    // Filter by 'pagado'
    if (filterPagado === "paid" && !entrega.pagado) return false;
    if (filterPagado === "notPaid" && entrega.pagado) return false;

    // Filter by 'fecha_programada'
    if (filterFechaProgramada === "hasDate" && !entrega.fecha_programada)
      return false;
    if (filterFechaProgramada === "noDate" && entrega.fecha_programada)
      return false;
      if (
        searchQuery &&
        !entrega.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !entrega.domicilio?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !entrega.producto?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      
    if (filterEstado === "true" && !entrega.estado) return false;
    if (filterEstado === "false" && entrega.estado) return false;

    return true;
  });
  const estadoTrueCount = data.filter(
    (entrega: EntregaProps) => entrega.estado
  ).length;
  const estadoFalseCount = data.filter(
    (entrega: EntregaProps) => !entrega.estado
  ).length;
  return (
    <Layout>
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Tabs
          defaultValue="false"
          className="w-full mb-10 mt-4"
          onValueChange={setFilterEstado}
        >
          <TabsList aria-label="Filter by estado">
            <TabsTrigger value="false">
              Pendientes {estadoFalseCount}
            </TabsTrigger>
            <TabsTrigger value="true">Entregadas {estadoTrueCount}</TabsTrigger>
          </TabsList>
        </Tabs>

        <form>
          <div className="flex space-x-2">
            <div className="relative w-full pb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, domicilio o producto"
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
    </Layout>
  );
};

export default Index;
