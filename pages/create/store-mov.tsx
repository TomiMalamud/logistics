import React from "react";
import type { GetServerSidePropsContext } from "next";
import { createClient } from "@/utils/supabase/server-props";
import CreateStoreMov from "@/components/CreateStoreMov";

export default function CreateStoreMovPage({ user }) {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="w-[540px] container px-0">
      <CreateStoreMov user={user} />
      </div>
    </div>
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