// pages/carriers/[id]/balance.tsx
import CarrierBalance from "@/components/CarrierBalance";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function CarrierBalancePage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || Array.isArray(id)) {
    return <div>Invalid carrier ID</div>;
  }

  return (
    <Layout title="Cuenta Corriente">
      <Button asChild variant="ghost">
        <Link href="/carriers" className="flex items-center mb-4 space-x-2">
          <MoveLeft size={16} />
          <span className="text-sm">Volver</span>
        </Link>
      </Button>
      <CarrierBalance carrierId={id} />
    </Layout>
  );
}
