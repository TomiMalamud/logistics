import Layout from "@/components/Layout";
import ManufacturingOrdersList from "@/components/manufacturing/Table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/utils/supabase/server-props";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { Wallet, Plus } from "lucide-react";
import Link from "next/link";

interface Props {
  user: {
    id: string;
  };
}

export default function ManufacturingPage({ user }: Props) {
  const router = useRouter();
  const { delivery_id } = router.query;

  return (
    <Layout title="Camas con Cajones">
      <div className="space-y-8">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Camas con Cajones</CardTitle>
              <Button
                variant="link"
                asChild
                className="gap-2 text-blue-500 hover:text-blue-700 hover:underline"
              >
                <Link href="/manufacturing/balance">
                  <Wallet className="h-4 w-4" />
                  Ver Cuenta Corriente
                </Link>
              </Button>
            </div>
            <Button asChild>
              <Link href={delivery_id ? `/manufacturing/create?delivery_id=${delivery_id}` : "/manufacturing/create"}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ManufacturingOrdersList />
          </CardContent>
        </Card>
      </div>
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
