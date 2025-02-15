import Layout from "@/components/Layout";
import { Balance } from "@/components/manufacturing/Balance";
import { CreateOrderForm } from "@/components/manufacturing/CreateOrderForm";
import ManufacturingOrdersList from "@/components/manufacturing/Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/utils/supabase/server-props";
import { GetServerSidePropsContext } from "next";

interface Props {
  user: {
    id: string;
  };
}

export default function ManufacturingPage({ user }: Props) {
  return (
    <Layout title="Camas con Cajones">
      <div className="space-y-8">
        <Balance user={user} />
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Camas con Cajones</CardTitle>
            <CreateOrderForm user={user} />
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
