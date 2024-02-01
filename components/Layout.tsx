import React, { ReactNode } from "react";
import Head from "next/head";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "./ui/button";
import Footer from "./Footer";
import { useRouter } from "next/router";
import Link from "next/link";
import TablePlaceholder from "./TablePlaceholder";

type Props = {
  children: ReactNode;
};

const Layout: React.FC<Props> = (props) => {
  const { user, error, isLoading } = useUser();
  const allowAccess =
    user && user.email === process.env.NEXT_PUBLIC_ALLOWED_USER;
    const router = useRouter();
    const currentPath = router.pathname;
    let linkHref = "/";
    let linkText = "";
  
    if (currentPath === "/expedition") {
      linkHref = "/";
      linkText = "Ir al Dashboard";
    }
  
    if (currentPath === "/") {
      linkHref = "/expedition";
      linkText = "Ir a Expedición";
    }
  
  
  return allowAccess ? (
    <html lang="es" className="h-full bg-gray-50">
      <Head>
        <title>Entregas | ROHI Sommiers</title>
      </Head>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div>
          <Button variant="link" className="-ml-4 text-gray-500">
            <Link href={linkHref}>{linkText}</Link>
          </Button>
          <div className="flex mt-2 justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Entregas de ROHI Sommiers
            </h1>
            <Button className="hidden md:block">
              <Link href="/create">+ Agregar</Link>
            </Button>
          </div>
          {isLoading ? (
            <TablePlaceholder />
          ) : error ? (
            <div>{error.message}</div>
          ) : (
            <div>{props.children}</div>
          )}
        </div>
      </main>
    </html>
  ) : (
    <>
      <main className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="bg-white/30 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
          <div className="text-center items-center mb-4">
            <h2 className="text:md md:text-xl font-semibold mb-5">
              Entregas - ROHI Sommiers
            </h2>
            <Button>
              <Link href="/api/auth/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
};

export default Layout;
