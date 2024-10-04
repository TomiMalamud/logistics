// components/Layout.tsx
import React, { ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import Link from "next/link";

type Props = {
  children: ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
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

  // Determine if the environment is development
  const isDevelopment = process.env.NODE_ENV === "development";


  // State to track if the component has mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Optionally, render a loading state or null to prevent hydration mismatch
    return null;
  }

  return (
    <>
      <Head>
        <title>Entregas | ROHI Sommiers</title>
      </Head>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div>
          <div className="flex justify-between">
            <Button variant="link" className="-ml-4 text-gray-500">
              <Link href={linkHref}>{linkText}</Link>
            </Button>
            <Button variant="link" className="hidden md:block">
              <Link href="/update-prices">Actualizar Precios</Link>
            </Button>
          </div>
          <div className="flex mt-2 justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Entregas de ROHI Sommiers
            </h1>
            <Button className="hidden md:block">
              <Link href="/create">+ Agregar</Link>
            </Button>
          </div>
          <div>{children}</div>
        </div>
      </main>
    </>
  ) 
};

export default Layout;
