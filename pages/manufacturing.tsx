import Layout from "@/components/Layout";
import { CreateOrderForm } from "@/components/manufacturing/CreateOrderForm";
import ManufacturingOrdersList from "@/components/manufacturing/Table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/utils/supabase/server-props";
import { Plus } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { useState } from "react";

interface Props {
  user: {
    id: string;
  };
}

export default function ManufacturingPage({ user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Layout>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Camas con Cajones</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[70vh] overflow-y-scroll my-4">
              <DialogHeader>
                <DialogTitle>Nuevo Pedido</DialogTitle>
                <DialogDescription>
                  Nueva cama con cajones para Maxi
                </DialogDescription>
              </DialogHeader>
              <CreateOrderForm user={user} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ManufacturingOrdersList />
        </CardContent>
      </Card>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

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

  return {
    props: {
      user: {
        id: user.id,
      },
    },
  };
}
