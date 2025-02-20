import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders";
import { useRole } from "@/hooks/useRole";
import {
  Bed,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  Rocket,
  Truck,
  Tv,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSignOut: () => void;
}

export function AppSidebar({ onSignOut, ...props }: AppSidebarProps) {
  const router = useRouter();
  const { role, loading: roleLoading } = useRole();
  const { hasNewOrders } = useManufacturingOrders({
    updateLastViewed: router.pathname === "/manufacturing",
  });

  const navigationItems = [
    {
      title: "Entregas",
      url: "/",
      roles: ["admin", "sales"],
      icon: Truck,
    },
    {
      title: "Calendario",
      url: "/calendar",
      roles: ["admin", "sales"],
      icon: Calendar,
    },
    {
      title: "Camas con Cajones",
      url: "/manufacturing",
      roles: ["admin", "sales"],
      icon: Bed,
      badge:
        role === "admin" && hasNewOrders ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        ) : null,
    },
    {
      title: "Precios",
      url: "/price-checker",
      roles: ["admin", "sales"],
      icon: DollarSign,
    },
    {
      title: "Transportes",
      url: "/carriers",
      roles: ["admin"],
      icon: Truck,
    },
    {
      title: "Teles",
      url: "/tv",
      roles: ["admin", "sales"],
      icon: Tv,
    },
    {
      title: "Objetivos",
      url: "/targets",
      roles: ["admin", "sales"],
      icon: Rocket,
    },
  ];

  const tools = {
    title: "Herramientas",
    items: [
      {
        title: "Actualizar Precios",
        url: "/update-prices",
        roles: ["admin", "sales"],
        icon: RefreshCw,
      },
      {
        title: "Actualizar Stock",
        url: "/update-stock",
        roles: ["admin", "sales"],
        icon: Package,
      },
    ],
  };

  const LoadingMenuItem = () => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={60}
          height={60}
          className=""
          unoptimized
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleLoading
                ? // Show 5 loading menu items while role is loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <LoadingMenuItem key={i} />
                  ))
                : navigationItems
                    .filter(({ roles }) => role && roles.includes(role))
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={router.pathname === item.url}
                        >
                          <Link href={item.url}>
                            {item.icon && (
                              <item.icon className="mr-2 h-4 w-4" />
                            )}
                            {item.title}
                            {item.badge}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{tools.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleLoading
                ? // Show 2 loading menu items for tools while role is loading
                  Array.from({ length: 2 }).map((_, i) => (
                    <LoadingMenuItem key={i} />
                  ))
                : tools.items
                    .filter(({ roles }) => role && roles.includes(role))
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={router.pathname === item.url}
                        >
                          <Link href={item.url}>
                            {item.icon && (
                              <item.icon className="mr-2 h-4 w-4" />
                            )}
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onSignOut}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
