import React from "react";
import useSWR from "swr";
import Layout from "../components/Layout";
import TablePlaceholder from "../components/TablePlaceholder";
import Entrega from "../components/Entrega";
import type { User } from "@supabase/supabase-js";
import type { GetServerSidePropsContext } from "next";

import { createClient } from "@/utils/supabase/server-props";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

interface ExpeditionProps {
  user: User;
}

const Expedition: React.FC<ExpeditionProps> = ({ user }) => {
  const { data } = useSWR<any[]>(apiURL, fetcher);

  if (!data)
    return (
      <Layout>
        <TablePlaceholder />
      </Layout>
    );

  const filteredData = data.filter((entrega) => {
    return entrega.estado === "pending";
  });

  return (
    <Layout>
      <p className="text-gray-600 text-sm my-4">
        Hay{" "}
        <span className="font-bold text-blue-400">{filteredData.length}</span>{" "}
        Entregas pendientes con pago recibido
      </p>
      {filteredData.map((entrega: any) => (
        <div className="py-4" key={entrega.id}>
          <Entrega entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </Layout>
  );
};

export default Expedition;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  return {
    props: {
      user: data.user
    }
  };
}
