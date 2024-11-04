// components/Layout.tsx
import React, { ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { createClient } from "@/utils/supabase/component";

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

  // State to track if the component has mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Optionally, render a loading state or null to prevent hydration mismatch
    return null;
  }

  // Sign-Out Handler
  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      // Optionally, display an error message to the user
    } else {
      // Redirect the user after sign-out
      router.push("/login"); // Change "/login" to your desired redirect path
    }
  };

  return (
    <>
      <Head>
        <title>Entregas | ROHI Sommiers</title>
      </Head>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="flex justify-between">
          <Button variant="link" className="-ml-2 text-gray-600">
            <Link href={linkHref}>{linkText}</Link>
          </Button>
          <div className="flex items-center gap-x-2 -mr-2 ">
            <Button variant="link" className="hidden text-gray-600 md:block">
              <Link href="/update-prices">Actualizar Precios</Link>
            </Button>
            <Button variant="link" className="text-gray-600" onClick={handleSignOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
        <div className="flex mt-4 justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Entregas de ROHI Sommiers
          </h1>
          <Button className="hidden md:block">
            <Link href="/create">+ Agregar</Link>
          </Button>
        </div>
        <div className="">{children}</div>
      </main>
    </>
  );
};

export default Layout;
