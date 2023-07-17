import React from "react"
import { GetStaticProps } from "next"
import Layout from "../components/Layout"
import Entrega, { EntregaProps } from "../components/Entrega"
import prisma from '../lib/prisma';
import Link from "next/link";
import { Button } from "../components/ui/button"
export const getStaticProps: GetStaticProps = async () => {
    const feed = await prisma.entrega.findMany({
        where: {
            estado: true,
        },
        orderBy: [
            {
                fecha: 'asc', // Ascending order of fecha
            },
        ],
    });
    return {
        props: { feed: JSON.parse(JSON.stringify(feed)) },
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
                    <div className="bg-white/30 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center">
                                    <h2 className="text:md md:text-xl font-semibold mr-40">Entregas Completadas</h2>
                                    <Button variant="ghost">
                                        <Link href="/">Pendientes</Link>
                                    </Button>
                                </div>
                                <Button variant="ghost" className="text-blue-500 hover:text-blue-700">
                                    <Link href="/create">+ Nueva Entrega</Link>
                                </Button>
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
