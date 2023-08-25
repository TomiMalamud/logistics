import React from "react";
import { GetServerSideProps } from "next";
import Layout from "../components/Layout";
import Entrega, { EntregaProps } from "../components/Entrega";
import prisma from "../lib/prisma";

export const getServerSideProps: GetServerSideProps = async () => {
  const feed = await prisma.entrega.findMany({
    where: {
      estado: false
    },
    orderBy: [
      {
        fecha: "asc"
      }
    ]
  });

  return {
    props: {
      feed: JSON.parse(JSON.stringify(feed))
    }
  };
};

type Props = {
  feed: EntregaProps[];
};

const Index: React.FC<Props> = (props) => {
  const count = props.feed.length;

  return (
    <>
      <Layout count={count}>
          {props.feed.map((entrega) => (
            <div className="py-4" key={entrega.id}>
              <Entrega entrega={entrega} />
            </div>
          ))}
      </Layout>
    </>
  );
};

export default Index;
