import Layout from "@/components/Layout";
import SalesDashboard from "@/components/metrics/Metrics";
import { createClient } from "@/utils/supabase/server-props";
import type { GetServerSidePropsContext } from "next";
import type { Profile } from "@/types/types";

interface MetricsPageProps {
  profile: Profile;
}

export default function MetricsPage({ profile }: MetricsPageProps) {
  return (
    <Layout>
      <SalesDashboard profile={profile} />
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

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return {
      props: {
        profile: null
      }
    };
  }

  return {
    props: {
      profile: profile || null // Ensure we always return null if no profile
    }
  };
}
