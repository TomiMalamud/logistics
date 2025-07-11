import Layout from "@/components/Layout";
import DeliveryList from "@/components/deliveries/DeliveryList";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/utils/supabase/server-props";
import type { User } from "@supabase/supabase-js";
import {
  Calendar,
  CalendarOff,
  ChevronDown,
  Factory,
  Home,
  Search,
  Store,
} from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import type { Profile } from "types/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface IndexProps {
  user: User;
  profile: Profile;
}

interface FeedResponse {
  feed: any[];
  page: number;
  totalPages: number;
  totalItems: number;
}

// Default filter values
const DEFAULT_FILTERS = {
  state: "pending",
  page: "1",
  search: "",
  scheduledDate: "next30days",
  type: "all",
};

export default function Index({ profile }: IndexProps) {
  const router = useRouter();
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [isInitialPendingLoad, setIsInitialPendingLoad] = useState(true);

  // Get current filters from URL or use defaults
  const currentFilters = useMemo(
    () => ({
      state: (router.query.state as string) ?? DEFAULT_FILTERS.state,
      page: (router.query.page as string) ?? DEFAULT_FILTERS.page,
      search: (router.query.search as string) ?? DEFAULT_FILTERS.search,
      scheduledDate:
        (router.query.scheduledDate as string) ?? DEFAULT_FILTERS.scheduledDate,
      type: (router.query.type as string) ?? DEFAULT_FILTERS.type,
    }),
    [router.query]
  );

  // Update URL with new filters
  const updateFilters = useCallback(
    (newFilters: Partial<typeof currentFilters>) => {
      const updatedQuery = {
        ...router.query,
        ...newFilters,
        page: newFilters.state ? "1" : router.query.page, // Reset page when changing filters
      };

      // Remove default values from URL
      Object.entries(updatedQuery).forEach(([key, value]) => {
        if (value === DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS]) {
          delete updatedQuery[key];
        }
      });

      router.push(
        {
          pathname: router.pathname,
          query: updatedQuery,
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  // Handlers for filter changes
  const handleTabChange = useCallback(
    (value: string) => {
      updateFilters({ state: value });
      // Reset pending deliveries when changing state
      if (value !== "pending") {
        setPendingDeliveries([]);
      }
    },
    [updateFilters]
  );

  const handleScheduledDateChange = useCallback(
    (value: string) => {
      updateFilters({ scheduledDate: value });
    },
    [updateFilters]
  );
  const [searchInput, setSearchInput] = useState(
    (router.query.search as string) || ""
  );

  const handleSearch = useCallback(
    (value: string) => {
      const query = { ...router.query };
      if (value.trim()) {
        query.search = value.trim();
      } else {
        delete query.search;
      }
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch(searchInput);
      }
    },
    [searchInput, handleSearch]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
      // If input is cleared, remove the search filter
      if (!e.target.value.trim()) {
        handleSearch("");
      }
    },
    [handleSearch]
  );

  const handleBlur = useCallback(() => {
    handleSearch(searchInput);
  }, [searchInput, handleSearch]);

  // Build API URL for SWR
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    // For pending state, only include non-search filters in the API URL
    if (currentFilters.state === "pending") {
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (key !== "search" && value) {
          params.append(key, value);
        }
      });
    } else {
      // For other states, include all filters
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    return `/api/deliveries?${params.toString()}`;
  }, [currentFilters]);

  // Fetch data
  const { data, error, isLoading, isValidating } = useSWR<FeedResponse>(
    apiUrl,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        // Update pending deliveries whenever data changes in pending state
        if (currentFilters.state === "pending") {
          setPendingDeliveries(data.feed);
          if (isInitialPendingLoad) {
            setIsInitialPendingLoad(false);
          }
        }
      },
    }
  );

  // Filter pending deliveries client-side
  const filteredData = useMemo(() => {
    if (currentFilters.state !== "pending" || !pendingDeliveries.length) {
      return data;
    }

    const searchTerm = currentFilters.search.toLowerCase();
    if (!searchTerm) {
      return {
        ...data,
        feed: pendingDeliveries,
      };
    }

    const filtered = pendingDeliveries.filter((delivery) => {
      // Search in customer name
      const customerName = delivery.customers?.name?.toLowerCase() || "";
      // Search in customer address
      const customerAddress = delivery.customers?.address?.toLowerCase() || "";
      // Search in supplier name
      const supplierName = delivery.suppliers?.name?.toLowerCase() || "";
      // Search in store names for store movements
      const storeNames =
        delivery.type === "store_movement"
          ? `${delivery.origin_store} ${delivery.dest_store}`.toLowerCase()
          : "";

      return (
        customerName.includes(searchTerm) ||
        customerAddress.includes(searchTerm) ||
        supplierName.includes(searchTerm) ||
        storeNames.includes(searchTerm)
      );
    });

    return {
      ...data,
      feed: filtered,
      totalItems: filtered.length,
    };
  }, [currentFilters.state, currentFilters.search, pendingDeliveries, data]);

  // Create a function to determine if we should show the placeholder
  const shouldShowPlaceholder = useMemo(() => {
    // Show placeholder when:
    // 1. Initial loading (no data yet)
    // 2. Validating (loading new data) and filters have changed
    const isInitialLoading = !data && isLoading;
    const isFilteringOrSearching =
      isValidating &&
      currentFilters.state !== "pending" && // Only show loading for server-side search
      (searchInput !== currentFilters.search || // Search changed
        router.query.state !== currentFilters.state || // State changed
        router.query.scheduledDate !== currentFilters.scheduledDate); // Date filter changed

    return isInitialLoading || isFilteringOrSearching;
  }, [
    data,
    isLoading,
    isValidating,
    searchInput,
    currentFilters,
    router.query,
  ]);
  const handleDeliveryTypeChange = useCallback(
    (value: string) => {
      updateFilters({ type: value });
    },
    [updateFilters]
  );

  const headerContent = useMemo(
    () => (
      <>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Entregas de ROHI Sommiers
          </h1>

          <DropdownMenu>
            <Button asChild>
              <DropdownMenuTrigger className="mr-2">
                Agregar
                <ChevronDown className="ml-2 h-4 w-4" />
              </DropdownMenuTrigger>
            </Button>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={"/create/delivery"}>
                  <Home size={12} className=" text-gray-600" />
                  Entrega
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/create/pickup"}>
                  <Factory size={12} className=" text-gray-600" />
                  Retiro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/create/store-mov"}>
                  <Store size={12} className="text-gray-600" />
                  Entre Locales
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-yellow-800 font-medium">
          Hola {profile && profile.name}!
        </p>
        <div className="bg-gray-50">
          <div className="flex-row inline-flex items-center gap-x-2 justify-start mb-4 mt-6">
            <Tabs
              value={currentFilters.state}
              className="w-full"
              onValueChange={handleTabChange}
            >
              <TabsList aria-label="Filter by state">
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="delivered">Entregadas</TabsTrigger>
                <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-gray-500 font-light ml-2">
              {data && data.totalItems}
            </span>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex space-x-2">
              <div className="relative w-full pb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o domicilio del cliente"
                  className="pl-8 bg-white"
                  value={searchInput}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                />
              </div>

              {/* Delivery Type Filter */}
              <div className="w-auto hidden sm:flex">
                <Select
                  value={currentFilters.type}
                  onValueChange={handleDeliveryTypeChange}
                >
                  <SelectTrigger
                    aria-label="Filter Type"
                    className="bg-white text-black"
                  >
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tipo de Entrega</SelectLabel>
                      <SelectItem value="all">Tipo</SelectItem>
                      <SelectItem value="home_delivery">
                        <Home
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Entrega a Domicilio
                      </SelectItem>
                      <SelectItem value="supplier_pickup">
                        <Factory
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Retiro de Proveedor
                      </SelectItem>
                      <SelectItem
                        value="store_movement"
                        className="flex items-center"
                      >
                        <Store
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Entre Locales
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Existing scheduled date filter */}
              <div className="hidden sm:flex w-auto">
                <Select
                  value={currentFilters.scheduledDate}
                  onValueChange={handleScheduledDateChange}
                >
                  <SelectTrigger
                    aria-label="Filter Date"
                    className="bg-white text-black"
                  >
                    <SelectValue placeholder="Filtrar por fecha programada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fecha Programada</SelectLabel>                      
                      <SelectItem value="thisWeek">
                        <Calendar
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Esta semana
                      </SelectItem>
                      <SelectItem value="next30days">
                        <Calendar
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Próximos 30 días
                      </SelectItem>
                      <SelectItem value="longTerm">
                        <Calendar
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Largo plazo
                      </SelectItem>
                      <SelectSeparator />
                      <SelectItem value="all">Todas las fechas</SelectItem>
                      <SelectItem value="hasDate">
                        <Calendar
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Con fecha
                      </SelectItem>
                      <SelectItem value="noDate">
                        <CalendarOff
                          className="inline-block mr-2 text-gray-700"
                          size={12}
                        />
                        Sin fecha
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>
      </>
    ),
    [
      profile,
      searchInput,
      currentFilters,
      data,
      handleTabChange,
      handleScheduledDateChange,
      handleDeliveryTypeChange,
      handleBlur,
      handleChange,
      handleKeyDown,
    ]
  );

  if (error) {
    return (
      <Layout title="Entregas">
        <p className="text-red-500">Error al cargar. Actualizá la página.</p>
      </Layout>
    );
  }

  return (
    <Layout title="Entregas">
      {headerContent}
      {error ? (
        <p className="text-red-500">Error al cargar. Actualizá la página.</p>
      ) : shouldShowPlaceholder ? (
        Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="space-y-4 min-h-24 mt-4 rounded-lg bg-white border p-6"
          >
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))
      ) : (
        <DeliveryList data={filteredData} searchUrl={apiUrl} />
      )}
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

  // Use getUser instead of checking session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return {
      props: {
        user,
        profile: null,
      },
    };
  }

  return {
    props: {
      user,
      profile: profile || null, // Ensure we always return null if no profile
    },
  };
}
