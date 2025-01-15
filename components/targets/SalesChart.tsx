import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const SalesChart = ({ data, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Diarias</CardTitle>
        <CardDescription>Rendimiento del período</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data?.dailyData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value.slice(0, 5)}`}
            />
            <YAxis
              tickFormatter={(value) => `${(value / 1000).toFixed(0)} k`}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, "auto"]}
              allowDataOverflow={true}
            />
            <Tooltip
              formatter={(value) => [
                `$${value.toLocaleString("es-AR")}`,
                "Sales"
              ]}
            />
            <defs>
              <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              fill="url(#gradientSales)"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
