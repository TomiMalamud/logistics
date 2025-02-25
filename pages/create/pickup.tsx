import CreatePickup from "@/components/deliveries/CreatePickup";
import Layout from "@/components/Layout";
import { createClient } from "@/lib/utils/supabase/server-props";
import type { GetServerSidePropsContext } from "next";

export default function CreatePickupPage({ user }) {
  return (
    <Layout title="Crear Retiro">
      <CreatePickup user={user} />
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
