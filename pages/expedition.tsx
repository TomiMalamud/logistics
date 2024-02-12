import React, {useState} from "react";
import useSWR from "swr";
import Layout from "../components/Layout";
import Entrega from "../components/Entrega";
import { EntregaProps } from "../lib/types";
import TablePlaceholder from "../components/TablePlaceholder";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

const Expedition: React.FC = () => {
  const { data } = useSWR(apiURL, fetcher);
  const [filterPagado, setFilterPagado] = useState("paid"); // 'all', 'paid', 'notPaid'
  const [filterFechaProgramada, setFilterFechaProgramada] = useState("all"); // 'all', 'hasDate', 'noDate'
  const [filterEstado, setFilterEstado] = useState("false"); // 'all', 'true', 'false'

  if (!data) return (<Layout><TablePlaceholder/></Layout>);

  const filteredData = data.filter((entrega: EntregaProps) => {
    // Filter by 'pagado'
    if (filterPagado === "paid" && !entrega.pagado) return false;
    if (filterPagado === "notPaid" && entrega.pagado) return false;

    // Filter by 'fecha_programada'
    if (filterFechaProgramada === "hasDate" && !entrega.fecha_programada)
      return false;
    if (filterFechaProgramada === "noDate" && entrega.fecha_programada)
      return false;
    
    if (filterEstado === "true" && !entrega.estado) return false;
    if (filterEstado === "false" && entrega.estado) return false;

    return true;
  });

  return (
    
    <Layout> 
      <p className="text-sm text-gray-500 mb-4">Entregas sólo con pago recibido</p>               
      {filteredData.map((entrega: EntregaProps) => (
        <div className="py-4" key={entrega.id}>
          <Entrega entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </Layout>
  );
};

export default Expedition;
