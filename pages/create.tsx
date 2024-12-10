import React from "react";
import type { GetServerSidePropsContext } from "next";
import { createClient } from "@/utils/supabase/server-props";
import CreateDelivery from "@/components/CreateDelivery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreateDeliveryPage({ user }) {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="w-[540px] container px-0">
          <Tabs defaultValue="delivery">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="delivery">Entrega</TabsTrigger>
              <TabsTrigger value="pickup">Retiro</TabsTrigger>
              <TabsTrigger value="inter_store">Entre locales</TabsTrigger>
            </TabsList>
            <TabsContent value="delivery">
              <CreateDelivery user={user} />
            </TabsContent>
            <TabsContent value="pickup">
              <p>En proceso</p>
            </TabsContent>
            <TabsContent value="inter_store">
              <p>En proceso</p>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

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

  return {
    props: {
      user: {
        id: user.id
      }
    }
  };
}