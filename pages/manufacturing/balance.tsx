import Layout from "@/components/Layout";
import { Balance } from "@/components/manufacturing/Balance";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/utils/supabase/server-props";
import { ArrowLeft } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";

interface Props {
  user: {
    id: string;
  };
}

export default function BalancePage({ user }: Props) {
  return (
    <Layout title="Cuenta Corriente - Stilo Propio">
      <div className="space-y-4">
        <Button
          variant="link"
          asChild
          className="gap-2 text-blue-500 hover:text-blue-700 hover:underline"
        >
          <Link href="/manufacturing">
            <ArrowLeft className="h-4 w-4" />
            Volver a Pedidos
          </Link>
        </Button>
        <Balance user={user} />
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
