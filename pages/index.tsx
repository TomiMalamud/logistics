import React from "react"
import { GetStaticProps } from "next"
import Layout from "../components/Layout"
import Entrega, { EntregaProps } from "../components/Entrega"
import prisma from '../lib/prisma';
import Link from "next/link";
export const getStaticProps: GetStaticProps = async () => {
  const feed = await prisma.entrega.findMany();
  return {
    props: { feed },
    revalidate: 10,
  };
};
type Props = {
  feed: EntregaProps[]
}

const Blog: React.FC<Props> = (props) => {
  return (
    <Layout>
      <div>
        <main className="relative flex min-h-screen flex-col items-center justify-center">
          <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Entregas</h2><span className="text-blue-500 hover:text-blue-700">
                  <Link href="/create"> Nueva Entrega</Link></span>
              </div>
            </div>
            <div className="divide-y divide-gray-900/5">
              {props.feed.map((entrega) => (
                <div className="py-4" key={entrega.id}>
                  <Entrega entrega={entrega} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  )
}

export default Blog
