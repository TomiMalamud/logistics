// components/Layout.tsx
import React, { ReactNode, useEffect, useState } from "react";
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

const Layout: React.FC<Props> = ({ children }) => {
  const { user, error, isLoading } = useUser();
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

  // Determine if access should be allowed
  const allowAccess =
    isDevelopment ||
    (user && user.email === process.env.NEXT_PUBLIC_ALLOWED_USER);

  // Optionally, mock user data in development
  const effectiveUser = isDevelopment
    ? {
        email: process.env.NEXT_PUBLIC_ALLOWED_USER,
        // Add other user properties if needed
      }
    : user;

  // State to track if the component has mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Optionally, render a loading state or null to prevent hydration mismatch
    return null;
  }

  return allowAccess ? (
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
          {isLoading ? (
            <TablePlaceholder />
          ) : error ? (
            <div>{error.message}</div>
          ) : (
            <div>{children}</div>
          )}
        </div>
      </main>
    </>
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
