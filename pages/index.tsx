import Layout from "@/components/Layout";
import DeliveryList from "@/components/deliveries/DeliveryList";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCarriers } from "@/lib/hooks/useCarriers";
import { createClient } from "@/utils/supabase/server-props";
import { SelectGroup } from "@radix-ui/react-select";
import type { User } from "@supabase/supabase-js";
import {
  Calendar,
  CalendarOff,
  ChevronDown,
  Factory,
  Home,
  Search,
  Store
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
  scheduledDate: "all",
  type: "all",
  carrier: "all"
};

export default function Index({ profile }: IndexProps) {
  const router = useRouter();

  // Get current filters from URL or use defaults
  const currentFilters = useMemo(
    () => ({
      state: (router.query.state as string) ?? DEFAULT_FILTERS.state,
      page: (router.query.page as string) ?? DEFAULT_FILTERS.page,
      search: (router.query.search as string) ?? DEFAULT_FILTERS.search,
      scheduledDate:
        (router.query.scheduledDate as string) ?? DEFAULT_FILTERS.scheduledDate,
      type: (router.query.type as string) ?? DEFAULT_FILTERS.type,
      carrier: (router.query.carrier as string) ?? DEFAULT_FILTERS.carrier
    }),
    [router.query]
  );

  // Update URL with new filters
  const updateFilters = useCallback(
    (newFilters: Partial<typeof currentFilters>) => {
      const updatedQuery = {
        ...router.query,
        ...newFilters,
        page: newFilters.state ? "1" : router.query.page // Reset page when changing filters
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
          query: updatedQuery
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  const handleCarrierChange = useCallback(
    (value: string) => {
      updateFilters({ carrier: value });
    },
    [updateFilters]
  );

  // Handlers for filter changes
  const handleTabChange = useCallback(
    (value: string) => {
      updateFilters({ state: value });
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
        shallow: true
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
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return `/api/deliveries?${params.toString()}`;
  }, [currentFilters]);
  const {
    carriers,
    isLoading: isLoadingCarriers,
    fetchCarriers
  } = useCarriers();

  // Fetch data
  const { data, error, isLoading, isValidating } = useSWR<FeedResponse>(
    apiUrl,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false
    }
  );

  // Create a function to determine if we should show the placeholder
  const shouldShowPlaceholder = useMemo(() => {
    // Show placeholder when:
    // 1. Initial loading (no data yet)
    // 2. Validating (loading new data) and filters have changed
    const isInitialLoading = !data && isLoading;
    const isFilteringOrSearching =
      isValidating &&
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
    router.query
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

              {/* Carrier Filter */}
              <div className="w-auto hidden sm:flex">
                <Select
                  value={currentFilters.carrier}
                  onValueChange={handleCarrierChange}
                  onOpenChange={(open) => {
                    if (open) {
                      fetchCarriers();
                    }
                  }}
                >
                  <SelectTrigger
                    aria-label="Filter Carrier"
                    className="bg-white text-black"
                  >
                    <SelectValue placeholder="Filtrar por transporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Transporte</SelectLabel>
                      <SelectItem value="all">Transporte</SelectItem>
                      {isLoadingCarriers ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        carriers.map((carrier) => (
                          <SelectItem
                            key={carrier.id}
                            value={carrier.id.toString()}
                          >
                            {carrier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                      <SelectItem value="all">Fecha Programada</SelectItem>
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
      carriers,
      isLoadingCarriers,
      fetchCarriers,
      handleCarrierChange,
      handleTabChange,
      handleScheduledDateChange,
      handleDeliveryTypeChange,
      handleBlur,
      handleChange,
      handleKeyDown
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
        <div className="divide-y divide-gray-900/5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="py-3 space-y-2 animate-pulse">
              <div className="animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-gray-200 animate-pulse" />
              <div className="h-1.5" />
              <div className="font-bold h-4 w-48 rounded-md bg-gray-200 animate-pulse" />
              <div className="h-2" />
            </div>
          ))}
        </div>
      ) : (
        <DeliveryList data={data} searchUrl={apiUrl} />
      )}
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

  // Use getUser instead of checking session
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
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
        profile: null
      }
    };
  }

  return {
    props: {
      user,
      profile: profile || null // Ensure we always return null if no profile
    }
  };
}
