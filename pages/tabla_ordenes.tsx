import React from "react";
import useSWR from "swr";
import LayoutDesktop from "../components/LayoutDesktop";
import EntregaDesktop, { EntregaProps } from "../components/EntregaDesktop";
import TablePlaceholder from "../components/TablePlaceholder";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

const Index: React.FC = () => {
  const { data } = useSWR(apiURL, fetcher);

  if (!data)
    return (
      <LayoutDesktop>
        <TablePlaceholder />
      </LayoutDesktop>
    );
  const count = data.length;

  return (
    <LayoutDesktop count={count}>
      {" "}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="relative pb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre de cliente o producto" className="pl-8 bg-white" />
          </div>
        </form>
      </div>
      {data.map((entrega: EntregaProps) => (
        <div className="py-2" key={entrega.id}>
          <EntregaDesktop entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </LayoutDesktop>
  );
};

export default Index;
