import Layout from "@/components/Layout";
import SalesDashboard from "@/components/targets/SalesDashboard";
import type { Profile } from "@/types/types";
import { createClient } from "@/lib/utils/supabase/server-props";
import type { GetServerSidePropsContext } from "next";

interface TargetsPageProps {
  profile: Profile;
}

export default function TargetsPage({ profile }: TargetsPageProps) {
  return (
    <Layout title="Objetivos">
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
