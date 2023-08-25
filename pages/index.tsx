import React, { Suspense } from "react";
import fetcher from "../components/fetcher";
import Layout from "../components/Layout";
import Entrega, { EntregaProps } from "../components/Entrega";
import TablePlaceholder from "../components/TablePlaceholder";

const apiURL = "/api/feed";
const resource = fetcher(apiURL);

const Index: React.FC = () => {
  return (
    <Layout>
      <Suspense fallback={<TablePlaceholder />}>
        <DataComponent />
      </Suspense>
    </Layout>
  );
};

const DataComponent: React.FC = () => {
  const data: EntregaProps[] = resource.read();
  const count = data.length;

  return (
    <>
      {count > 0 && data.map((entrega: EntregaProps) => (
        <div className="py-4" key={entrega.id}>
          <Entrega entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </>
  );
};

export default Index;
