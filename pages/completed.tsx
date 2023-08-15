import React from "react"
import { GetServerSideProps } from "next"
import Layout from "../components/Layout"
import Entrega, { EntregaProps } from "../components/Entrega"
import prisma from '../lib/prisma';
import Link from "next/link";
import { Button } from "../components/ui/button"
import { useUser } from '@auth0/nextjs-auth0/client';

export const getServerSideProps: GetServerSideProps = async () => {
    const feed = await prisma.entrega.findMany({
        where: {
            estado: true,
        },
        orderBy: [
            {
                fecha: 'asc',
            },
        ],
    });

    return {
        props: {
            feed: JSON.parse(JSON.stringify(feed)),
        },
    };
};

type Props = {
    feed: EntregaProps[];
};

const Completed: React.FC<Props> = (props) => {

    const { user, error, isLoading } = useUser();
    const allowAccess = user && user.email === 'rohi.sommiers@gmail.com';

    if (isLoading) return <div>Cargando...</div>;
    if (error) return <div>{error.message}</div>;

    return (
        !allowAccess ? (
            <Layout>
                <div>
                    <main className="relative flex min-h-screen flex-col items-center justify-center">
                        <div className="bg-white/30 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
                            <div className="flex justify-between items-center">
                                <h2 className="text:md md:text-xl font-semibold text-slate-500 mr-40">Entregas Completadas</h2>
                                <Button variant="ghost">
                                    <Link href="/">Pendientes</Link>
                                </Button>
                            </div>
                            <Button variant="ghost" className="text-blue-500 hover:text-blue-700">
                                <Link href="/create">+ Nueva Entrega</Link>
                            </Button>
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
        ) : (<>
            <main className="relative flex min-h-screen flex-col items-center justify-center">
                <div className="bg-white/30 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
                    <div className="text-center items-center mb-4">
                        <h2 className="text:md md:text-xl font-semibold mb-5">Entregas</h2>
                        <Button>
                            <a href="/api/auth/login">Iniciar sesión</a>
                        </Button>
                    </div>
                </div>
            </main>
        </>
        ))
}

export default Completed
