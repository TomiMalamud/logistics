import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/utils/supabase/component";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout = ({
  children,
  title = "Entregas | ROHI Sommiers",
}: LayoutProps): JSX.Element => {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SidebarProvider>
        <AppSidebar onSignOut={handleSignOut} />
        <SidebarInset className="bg-gray-50">
          <SidebarTrigger className="m-2 text-stone-700" />
          <main className="p-4 md:p-8 bg-gray-50">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  );
};

export default Layout;
