import React, { useCallback, useMemo } from "react";
import Head from "next/head";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { createClient } from "@/utils/supabase/component";
import { useRole } from "@/lib/hooks/useRole";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  path: string;
  label: string;
  showOnMobile: boolean;
  roles: ("admin" | "sales")[];
}

const Layout = ({
  children,
  title = "Entregas | ROHI Sommiers"
}: LayoutProps): JSX.Element => {
  const router = useRouter();
  const supabase = createClient();
  const { role, loading } = useRole();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        path: "/",
        label: "✔️ Entregas",
        showOnMobile: true,
        roles: ["admin", "sales"]
      },
      {
        path: "/deliveries/calendar",
        label: "🗓️ Calendario",
        showOnMobile: false,
        roles: ["admin", "sales"]
      },
      {
        path: "/price-checker",
        label: "🏷️ Precios",
        showOnMobile: true,
        roles: ["admin", "sales"]
      },
      {
        path: "/carriers",
        label: "🚚 Transportes",
        showOnMobile: true,
        roles: ["admin"]
      },
      {
        path: "/update-prices",
        label: "Actualizar Precios",
        showOnMobile: false,
        roles: ["admin"]
      },
      {
        path: "/tv",
        label: "📺 Teles",
        showOnMobile: false,
        roles: ["admin", "sales"]
      }
    ],
    []
  );

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem("supabase.auth.token");
      await router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error al cerrar sesión. Por favor, intente nuevamente.");
    }
  }, [router, supabase]);

  const getNavButtonClasses = useCallback(
    (path: string, showOnMobile: boolean): string => {
      const baseClasses = "text-gray-600";
      const mobileClasses = showOnMobile ? "" : "hidden md:block";
      const activeClasses = router.pathname === path ? "font-bold" : "";

      return `${baseClasses} ${mobileClasses} ${activeClasses}`.trim();
    },
    [router.pathname]
  );

  const renderNavButtons = useCallback(
    () =>
      navItems
        .filter(({ roles }) => role && roles.includes(role))
        .map(({ path, label, showOnMobile }) => (
          <Button
            key={path}
            variant="link"
            className={getNavButtonClasses(path, showOnMobile)}
            asChild
          >
            <Link href={path}>{label}</Link>
          </Button>
        )),
    [navItems, getNavButtonClasses, role]
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="bg-white justify-between p-3 flex border-b  border-grid">
        <nav className="flex overflow-x-scroll">{renderNavButtons()}</nav>
        <Button
          variant="link"
          className="text-gray-600 md:block hidden"
          onClick={handleSignOut}
        >
          Cerrar Sesión
        </Button>
      </header>
      <main className="p-4 md:p-8 mx-auto max-w-7xl min-h-screen">
        {children}
      </main>
    </>
  );
};

export default Layout;
