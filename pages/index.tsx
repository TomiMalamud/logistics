import React, { useState } from "react"
import useSWR from "swr"
import Layout from "../components/Layout"
import EntregaDesktop from "../components/EntregaDesktop"
import TablePlaceholder from "../components/TablePlaceholder"
import { Input } from "../components/ui/input"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { SelectGroup } from "@radix-ui/react-select"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import type { User } from '@supabase/supabase-js'
import type { GetServerSidePropsContext } from 'next'

import { createClient } from '@utils/supabase/server-props'

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const apiURL = "/api/feed"

interface IndexProps {
  user: User
}

const Index: React.FC<IndexProps> = ({ user }) => {
  const { data } = useSWR<any[]>(apiURL, fetcher)
  const [filterPagado, setFilterPagado] = useState("all") // 'all', 'paid', 'notPaid'
  const [filterFechaProgramada, setFilterFechaProgramada] = useState("all") // 'all', 'hasDate', 'noDate'
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEstado, setFilterEstado] = useState("pending") // 'all', 'delivered', 'pending', etc.

  if (!data)
    return (
      <Layout>
        <TablePlaceholder />
      </Layout>
    )

  const filteredData = data.filter((entrega) => {
    // Filter by 'pagado'
    if (filterPagado === "paid" && !entrega.pagado) return false
    if (filterPagado === "notPaid" && entrega.pagado) return false

    // Filter by 'fecha_programada'
    if (filterFechaProgramada === "hasDate" && !entrega.fecha_programada)
      return false
    if (filterFechaProgramada === "noDate" && entrega.fecha_programada)
      return false

    // Search Filter
    if (
      searchQuery &&
      !entrega.customers.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entrega.customers.domicilio?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entrega.producto?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false

    // Filter by 'estado' as string
    if (filterEstado !== "all" && entrega.estado !== filterEstado) return false

    return true
  })

  const estadoDeliveredCount = data.filter(
    (entrega) => entrega.estado === "delivered"
  ).length
  const estadoPendingCount = data.filter(
    (entrega) => entrega.estado === "pending"
  ).length

  return (
    <Layout>
      <p className="text-gray-500">Hola {user.email.split('@')[0]}!</p>
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Tabs
          defaultValue="pending"
          className="w-full mb-4 mt-6"
          onValueChange={setFilterEstado}
        >
          <TabsList aria-label="Filter by estado">
            <TabsTrigger value="pending">
              Pendientes {estadoPendingCount}
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Entregadas {estadoDeliveredCount}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form>
          <div className="flex space-x-2">
            <div className="relative w-full pb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, domicilio o producto"
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex w-auto">
              <Select
                value={filterPagado}
                onValueChange={(value) => setFilterPagado(value)}
              >
                <SelectTrigger
                  aria-label="Filter"
                  className="bg-white text-black"
                >
                  <SelectValue placeholder="Filtrar por 'pagado'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Estado del Pago</SelectLabel>
                    <SelectItem value="all">Estado del Pago: Todos</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                    <SelectItem value="notPaid">No Pagados</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-auto">
              <Select
                value={filterFechaProgramada}
                onValueChange={(value) => setFilterFechaProgramada(value)}
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
                    <SelectItem value="all">
                      Fecha Programada: Todas
                    </SelectItem>
                    <SelectItem value="hasDate">
                      Fecha programada
                    </SelectItem>
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
      {filteredData.map((entrega: any) => (
        <div className="py-2" key={entrega.id}>
          <EntregaDesktop entrega={entrega} fetchURL={apiURL} />
        </div>
      ))}
    </Layout>
  )
}

export default Index

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context)

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: data.user,
    },
  }
}
