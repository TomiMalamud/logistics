// components/Layout.tsx

import React from "react";
import Head from "next/head";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCallback } from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout = ({ 
  children, 
  title = "Entregas | ROHI Sommiers" 
}: LayoutProps): JSX.Element => {
  const router = useRouter();
  

  // Memoize sign-out handler
  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <nav className="flex justify-between -mx-4">
            <Button 
              variant="link" 
              className="hidden text-gray-600 md:block"
              asChild
            >
              <Link href="/update-prices">Actualizar Precios</Link>
            </Button>
            <Button 
              variant="link" 
              className="text-gray-600" 
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </Button>
        </nav>

        <header className="flex mt-4 justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Entregas de ROHI Sommiers
          </h1>
          <Button asChild className="hidden md:block">
            <Link href="/create">+ Agregar</Link>
          </Button>
        </header>

        <section>
          {children}
        </section>
      </main>
    </>
  );
};

export default Layout;