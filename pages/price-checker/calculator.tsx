import Layout from "@/components/Layout";
import PriceCalculator from "@/components/price-checker/PriceCalculator";

export default function PriceCalculatorPage() {
  return (
    <Layout title="Calculadora">
      <PriceCalculator basePrice={1000} />
    </Layout>
  );
}
