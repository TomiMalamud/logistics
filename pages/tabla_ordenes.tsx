import React from "react";
import useSWR from "swr";
import LayoutDesktop from "../components/LayoutDesktop";
import EntregaDesktop, { EntregaProps } from "../components/EntregaDesktop";
import TablePlaceholder from "../components/TablePlaceholder";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

const Index: React.FC = () => {
  const { data } = useSWR(apiURL, fetcher);

  if (!data) return (<LayoutDesktop><TablePlaceholder/></LayoutDesktop>);
  const count = data.length;

  return (
    <LayoutDesktop count={count}>
      {data.map((entrega: EntregaProps) => (
        <div className="py-4" key={entrega.id}>
          <EntregaDesktop entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </LayoutDesktop>
  );
};

export default Index;
