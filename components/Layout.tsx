import React from "react";
import Head from "next/head";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCallback, useMemo } from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  path: string;
  label: string;
  showOnMobile: boolean;
}

const Layout = ({ 
  children, 
  title = "Entregas | ROHI Sommiers" 
}: LayoutProps): JSX.Element => {
  const router = useRouter();
  
  const navItems: NavItem[] = useMemo(() => [
    { path: "/", label: "✔️ Entregas", showOnMobile: true },
    { path: "/deliveries/calendar", label: "🗓️ Calendario", showOnMobile: true },
    { path: "/carriers", label: "🚚 Transportes", showOnMobile: true },
    { path: "/update-prices", label: "Actualizar Precios", showOnMobile: false }
  ], []);

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [router]);

  const getNavButtonClasses = useCallback((path: string, showOnMobile: boolean): string => {
    const baseClasses = "text-gray-600";
    const mobileClasses = showOnMobile ? "" : "hidden md:block";
    const activeClasses = router.pathname === path ? "font-bold" : "";
    
    return `${baseClasses} ${mobileClasses} ${activeClasses}`.trim();
  }, [router.pathname]);

  const renderNavButtons = useCallback(() => 
    navItems.map(({ path, label, showOnMobile }) => (
      <Button 
        key={path}
        variant="link" 
        className={getNavButtonClasses(path, showOnMobile)}
        asChild
      >
        <Link href={path}>{label}</Link>
      </Button>
    ))
  , [navItems, getNavButtonClasses]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <nav className="flex justify-between -mx-4 mb-4">
          <div className="flex items-center space-x-2">
            {renderNavButtons()}
          </div>
          <Button 
            variant="link" 
            className="text-gray-600 md:block hidden" 
            onClick={handleSignOut}
          >
            Cerrar Sesión
          </Button>
        </nav>
        <section>
          {children}
        </section>
      </main>
    </>
  );
};

export default Layout;