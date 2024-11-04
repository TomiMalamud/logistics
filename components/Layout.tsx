// components/Layout.tsx
import React from "react";
import Head from "next/head";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCallback, useMemo } from "react";

// Define types for navigation items
type NavigationItem = {
  href: string;
  text: string;
};

// Define route configuration
const ROUTE_CONFIG: Record<string, NavigationItem> = {
  "/expedition": {
    href: "/",
    text: "Ir al Dashboard",
  },
  "/": {
    href: "/expedition",
    text: "Ir a Expedición",
  },
} as const;

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout = ({ 
  children, 
  title = "Entregas | ROHI Sommiers" 
}: LayoutProps): JSX.Element => {
  const router = useRouter();
  
  // Memoize navigation item based on current path
  const navigationItem = useMemo(() => 
    ROUTE_CONFIG[router.pathname] || { href: "/", text: "" },
    [router.pathname]
  );

  // Memoize sign-out handler
  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      // You might want to add proper error handling here (e.g., toast notification)
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <nav className="flex justify-between">
          {navigationItem.text && (
            <Button variant="link" className="-ml-2 text-gray-600">
              <Link href={navigationItem.href}>{navigationItem.text}</Link>
            </Button>
          )}
          
          <div className="flex items-center gap-x-2 -mr-2">
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
          </div>
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