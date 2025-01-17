// pages/calendar.tsx
import DeliveryCalendar from "@/components/deliveries/DeliveryCalendar";
import Layout from "@/components/Layout";

export default function CalendarPage() {
  return (
    <Layout title="Calendario">
      <h1 className="text-2xl font-bold my-2">Calendario</h1>
      <DeliveryCalendar searchUrl="/api/deliveries/calendar" />
    </Layout>
  );
}
