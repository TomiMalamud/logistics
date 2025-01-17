import { useRole } from "@/lib/hooks/useRole";
import { createClient } from "@/utils/supabase/component";
import { User } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "./ui/navigation-menu";

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
  const supabase = useMemo(() => createClient(), []);
  const { role, loading } = useRole();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        path: "/",
        label: "Entregas",
        showOnMobile: true,
        roles: ["admin", "sales"]
      },
      {
        path: "/calendar",
        label: "Calendario",
        showOnMobile: false,
        roles: ["admin", "sales"]
      },
      {
        path: "/price-checker",
        label: "Precios",
        showOnMobile: true,
        roles: ["admin", "sales"]
      },
      {
        path: "/carriers",
        label: "Transportes",
        showOnMobile: true,
        roles: ["admin"]
      },
      {
        path: "/tv",
        label: "Teles",
        showOnMobile: false,
        roles: ["admin", "sales"]
      },
      {
        path: "/targets",
        label: "Objetivos",
        showOnMobile: false,
        roles: ["admin", "sales"]
      },
      {
        path: "/update-prices",
        label: "Actualizar Precios",
        showOnMobile: false,
        roles: ["admin"]
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
      const baseClasses =
        router.pathname === path ? "text-gray-950" : "text-gray-600";
      const mobileClasses = showOnMobile ? "" : "hidden md:block";

      return `${baseClasses} ${mobileClasses}`.trim();
    },
    [router.pathname]
  );

  const renderNavButtons = useCallback(
    () => (
      <NavigationMenu>
        <NavigationMenuList className="flex gap-0">
          {navItems
            .filter(({ roles }) => role && roles.includes(role))
            .map(({ path, label, showOnMobile }) => (
              <NavigationMenuItem key={path}>
                <Link href={path} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()} ${getNavButtonClasses(
                      path,
                      showOnMobile
                    )}`}
                  >
                    {label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
        </NavigationMenuList>
      </NavigationMenu>
    ),
    [navItems, role, getNavButtonClasses]
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="bg-white justify-between p-3 flex border-b border-grid">
        <div className="flex items-center">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={50}
            height={50}
            className="mx-4"
            unoptimized
          />
          <nav className="flex items-center">{renderNavButtons()}</nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-gray-600 md:block hidden mr-4"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="p-4 md:p-8 mx-auto max-w-7xl min-h-screen">
        {children}
      </main>
    </>
  );
};

export default Layout;
