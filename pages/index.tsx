import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef
} from "react";
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
import type { User } from "@supabase/supabase-js";
import type { GetServerSidePropsContext } from "next";
import type { Profile } from "types/types";
import { createClient } from "@/utils/supabase/server-props";
import { useDeliveryCounts } from "@/lib/useDeliveryCounts";
import { debounce } from "lodash";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

// Pure function to build URL with search params
const buildSearchUrl = ({
  state,
  page,
  search,
  scheduledDate
}: {
  state: string;
  page: number;
  search: string;
  scheduledDate: string;
}) => {
  const params = new URLSearchParams({
    state,
    page: page.toString(),
    search,
    scheduledDate
  });
  return `/api/feed?${params.toString()}`;
};

const Index: React.FC<IndexProps> = ({ user, profile }) => {
  const [page, setPage] = useState(1);
  const [filterEstado, setFilterEstado] = useState("pending");
  const [filterScheduledDate, setFilterScheduledDate] = useState("all");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { counts } = useDeliveryCounts();

  // Create a ref for the debounced search function
  const debouncedSearchRef = useRef(
    debounce((value: string, callback: (value: string) => void) => {
      callback(value);
    }, 500)
  );

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const debouncedFn = debouncedSearchRef.current;
    return () => {
      debouncedFn.cancel();
    };
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      debouncedSearchRef.current(value, handleSearch);
    },
    [handleSearch]
  );

  const handleTabChange = useCallback((value: string) => {
    setFilterEstado(value);
    setPage(1);
  }, []);

  const handleScheduledDateChange = useCallback((value: string) => {
    setFilterScheduledDate(value);
    setPage(1);
  }, []);

  // Memoize URL building
  const searchUrl = useMemo(
    () =>
      buildSearchUrl({
        state: filterEstado,
        page,
        search: searchQuery,
        scheduledDate: filterScheduledDate
      }),
    [filterEstado, page, searchQuery, filterScheduledDate]
  );

  const { data, error } = useSWR<FeedResponse>(searchUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false
  });

  const headerContent = useMemo(
    () => (
      <>
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Entregas de ROHI Sommiers
          </h1>
          <Button asChild className="hidden md:block">
            <Link href="/create">+ Agregar</Link>
          </Button>
        </header>
        <p className="text-yellow-800 font-medium">
          Hola {profile ? profile.name : user.email.split("@")[0]}!
        </p>
        <div className="bg-gray-100">
          <Tabs
            defaultValue="pending"
            className="w-full mb-4 mt-6"
            onValueChange={handleTabChange}
            value={filterEstado}
          >
            <TabsList aria-label="Filter by state">
              <TabsTrigger value="pending">
                Pendientes
                <span className="text-gray-500 font-light ml-2">
                  {counts?.pending ?? "-"}
                </span>
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Entregadas
                <span className="text-gray-500 font-light ml-2">
                  {counts?.delivered ?? "-"}
                </span>
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
                  value={inputValue}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="flex w-auto">
                <Select
                  value={filterScheduledDate}
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
                        Fecha Programada: Todas
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
      handleTabChange,
      filterEstado,
      counts?.pending,
      counts?.delivered,
      inputValue,
      handleSearchChange,
      filterScheduledDate,
      handleScheduledDateChange
    ]
  );

  if (error) {
    return (
      <Layout>
        <p className="text-red-500">Error loading deliveries</p>
      </Layout>
    );
  }

  return (
    <Layout>
      {headerContent}
      {!data ? (
        <TablePlaceholder />
      ) : (
        <DeliveryList
          data={data}
          searchUrl={searchUrl}
          onPageChange={setPage}
          currentPage={page}
        />
      )}
    </Layout>
  );
};

export default Index;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  const user = data.user;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
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
      profile: profileData
    }
  };
}
