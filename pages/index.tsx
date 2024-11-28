import React, { useState } from "react";
import useSWR from "swr";
import Layout from "../components/Layout";
import Delivery from "../components/Delivery";
import TablePlaceholder from "../components/TablePlaceholder";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { SelectGroup } from "@radix-ui/react-select";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import type { User } from "@supabase/supabase-js";
import type { GetServerSidePropsContext } from "next";
import type { Profile } from "types/types";
import { createClient } from "@/utils/supabase/server-props";
import { useDeliveryCounts } from "@/lib/useDeliveryCounts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const apiURL = "/api/feed";

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
const Index: React.FC<IndexProps> = ({ user, profile }) => {
  const [page, setPage] = useState(1);
  const [filterEstado, setFilterEstado] = useState("pending");

  const { data } = useSWR<FeedResponse>(
    `/api/feed?state=${filterEstado}&page=${page}`,
    fetcher
  );

  const [filterScheduledDate, setFilterScheduledDate] = useState("all"); // 'all', 'hasDate', 'noDate'
  const [searchQuery, setSearchQuery] = useState("");
  const { counts } = useDeliveryCounts();

  if (!data)
    return (
      <Layout>
        <TablePlaceholder />
      </Layout>
    );

  const filteredData = data.feed.filter((delivery) => {
    // Filter by 'scheduled_date'
    if (filterScheduledDate === "hasDate" && !delivery.scheduled_date)
      return false;
    if (filterScheduledDate === "noDate" && delivery.scheduled_date)
      return false;

    // Search Filter
    if (
      searchQuery &&
      !delivery.customer.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !delivery.customer.address
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !delivery.products?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    return true;
  });

  const handleTabChange = (value: string) => {
    setFilterEstado(value);
    setPage(1); // Reset page when switching tabs
  };

  return (
    <Layout>
      <p className="text-yellow-800 font-medium ">
        Hola {profile ? profile.name : user.email.split("@")[0]}!
      </p>
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

        <form>
          <div className="flex space-x-2">
            <div className="relative w-full pb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, domicilio o productos"
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex w-auto">
              <Select
                value={filterScheduledDate}
                onValueChange={(value) => setFilterScheduledDate(value)}
              >
                <SelectTrigger
                  aria-label="Filter"
                  className="bg-white text-black "
                >
                  <SelectValue placeholder="Filtrar por 'fecha programada'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Fecha Programada</SelectLabel>
                    <SelectItem value="all">Fecha Programada: Todas</SelectItem>
                    <SelectItem value="hasDate">Fecha programada</SelectItem>
                    <SelectItem value="noDate">Fecha no programada</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </div>
      {filteredData.map((delivery: any) => (
        <div className="py-2" key={delivery.id}>
          <Delivery delivery={delivery} fetchURL={apiURL} />
        </div>
      ))}
    </Layout>
  );
};

export default Index;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

  // Fetch the authenticated user
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

  // Fetch the profile associated with the user.id
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
        profile: null // Handle this case as needed
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
