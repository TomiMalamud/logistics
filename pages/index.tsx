import React from "react";
import useSWR from "swr";
import Layout from "../components/Layout";
import Entrega, { EntregaProps } from "../components/Entrega";
import TablePlaceholder from "../components/TablePlaceholder";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

const Index: React.FC = () => {
  const { data, error } = useSWR(apiURL, fetcher);

  if (error) return <div>Error al cargar</div>;
  if (!data) return (<Layout><TablePlaceholder/></Layout>);
  const count = data.length;

  return (
    <Layout count={count}>
      {data.map((entrega: EntregaProps) => (
        <div className="py-4" key={entrega.id}>
          <Entrega entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </Layout>
  );
};

export default Index;
