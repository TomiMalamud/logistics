import CreateDelivery from "@/components/deliveries/CreateDelivery";
import Layout from "@/components/Layout";
import { createClient } from "@/utils/supabase/server-props";
import type { GetServerSidePropsContext } from "next";

export default function CreateDeliveryPage({ user }) {
  return (
    <Layout title="Crear Entrega">
      <CreateDelivery user={user} />
    </Layout>
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
