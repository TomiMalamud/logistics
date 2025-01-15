import CreateStoreMov from "@/components/CreateStoreMov";
import Layout from "@/components/Layout";
import { createClient } from "@/utils/supabase/server-props";
import type { GetServerSidePropsContext } from "next";

export default function CreateStoreMovPage({ user }) {
  return (
    <Layout title="Crear movimiento entre locales">
      <CreateStoreMov user={user} />
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
