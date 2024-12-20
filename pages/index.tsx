import { useRouter } from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import Layout from "@/components/Layout";
import DeliveryList from "@/components/DeliveryList";
import TablePlaceholder from "@/components/TablePlaceholder";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { SelectGroup } from "@radix-ui/react-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "types/types";
import { createClient } from "@/utils/supabase/server-props";
import { GetServerSidePropsContext } from "next";

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
  scheduledDate: "all"
};

export default function Index({ user, profile }: IndexProps) {
  const router = useRouter();

  // Get current filters from URL or use defaults
  const currentFilters = useMemo(
    () => ({
      state: (router.query.state as string) ?? DEFAULT_FILTERS.state,
      page: (router.query.page as string) ?? DEFAULT_FILTERS.page,
      search: (router.query.search as string) ?? DEFAULT_FILTERS.search,
      scheduledDate:
        (router.query.scheduledDate as string) ?? DEFAULT_FILTERS.scheduledDate
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
    return `/api/feed?${params.toString()}`;
  }, [currentFilters]);

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

  const headerContent = useMemo(
    () => (
      <>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Entregas de ROHI Sommiers
          </h1>
          <Button asChild className="hidden md:block">
            <Link href="/create">+ Agregar</Link>
          </Button>
        </div>
        <p className="text-yellow-800 font-medium">
          Hola {profile ? profile.name : user.email.split("@")[0]}!
        </p>
        <div className="bg-gray-100">
          <Tabs
            value={currentFilters.state}
            className="w-full mb-4 mt-6"
            onValueChange={handleTabChange}
          >
            <TabsList aria-label="Filter by state">
              <TabsTrigger value="pending">
                Pendientes
                <span className="text-gray-500 font-light ml-2">
                  {data && data.totalItems}
                </span>
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Entregadas
              </TabsTrigger>
            </TabsList>
          </Tabs>

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

              <div className="flex w-auto">
                <Select
                  value={currentFilters.scheduledDate}
                  onValueChange={handleScheduledDateChange}
                >
                  <SelectTrigger
                    aria-label="Filter"
                    className="bg-white text-black"
                  >
                    <SelectValue placeholder="Filtrar por 'fecha programada'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fecha Programada</SelectLabel>
                      <SelectItem value="all">
                        Fecha Programada
                      </SelectItem>
                      <SelectItem value="hasDate">Fecha programada</SelectItem>
                      <SelectItem value="noDate">
                        Fecha no programada
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
      user.email,
      searchInput,
      currentFilters,
      data,
      handleTabChange,
      handleScheduledDateChange,
      handleBlur,
      handleChange,
      handleKeyDown
    ]
  );

  if (error) {
    return (
      <Layout>
        <p className="text-red-500">Error al cargar. Actualizá la página.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      {headerContent}
      {error ? (
        <p className="text-red-500">Error al cargar. Actualizá la página.</p>
      ) : shouldShowPlaceholder ? (
        <TablePlaceholder />
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
