import Layout from "@/components/Layout";
import { CreateOrderForm } from "@/components/manufacturing/CreateOrderForm";
import { createClient } from "@/lib/utils/supabase/server-props";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

interface Props {
  user: {
    id: string;
  };
}

export default function CreateManufacturingOrderPage({ user }: Props) {
  const router = useRouter();
  const { delivery_id } = router.query;

  return (
    <Layout title="Crear Pedido de Fabricación">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Nuevo Pedido</h1>
        <p className="text-muted-foreground mb-6">
          Nueva cama con cajones para Maxi. Si son 2 unidades, creá 2 pedidos.
        </p>
        
        <CreateOrderForm 
          user={user}
          defaultDeliveryId={delivery_id ? String(delivery_id) : undefined}
          onSuccess={() => router.push('/manufacturing')}
        />
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