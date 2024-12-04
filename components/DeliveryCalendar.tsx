import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { titleCase } from "title-case";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

const DeliveryCalendar = ({ searchUrl }) => {
  const [date, setDate] = useState(new Date());
  const [deliveries, setDeliveries] = useState({});
  const [unscheduledCount, setUnscheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Helper function to get normalized date string (YYYY-MM-DD)
  const getNormalizedDate = (date) => {
    return date.split("T")[0];
  };

  const fetchMonthDeliveries = useCallback(
    async (month) => {
      setLoading(true);
      try {
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const response = await fetch(
          `${searchUrl}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (!response.ok) throw new Error("Failed to fetch deliveries");

        const data = await response.json();

        // Count unscheduled deliveries BEFORE applying any filters
        const unscheduled = data.feed.filter(
          (delivery) => !delivery.scheduled_date && delivery.state === 'pending'
        ).length;
        setUnscheduledCount(unscheduled);

        // Filter deliveries based on selected type
        const filteredDeliveries = data.feed.filter((delivery) => {
          if (filter === "all") return true;
          return delivery.type === filter;
        });

        // Group filtered deliveries by date
        const grouped = filteredDeliveries.reduce((acc, delivery) => {
          const dateToUse =
            delivery.type === "delivered"
              ? delivery.delivery_date
              : delivery.scheduled_date;

          if (dateToUse) {
            const normalizedDate = getNormalizedDate(dateToUse);
            acc[normalizedDate] = acc[normalizedDate] || [];
            acc[normalizedDate].push(delivery);
          }
          return acc;
        }, {});

        setDeliveries(grouped);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchUrl, filter]
  );

  useEffect(() => {
    fetchMonthDeliveries(date);
  }, [date, fetchMonthDeliveries]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const renderDeliveryItem = (delivery) => {
    const today = new Date().toISOString().split("T")[0];
    const scheduledDate = delivery.scheduled_date
      ? getNormalizedDate(delivery.scheduled_date)
      : null;

    // Compare dates
    const isPastDue =
      scheduledDate && scheduledDate < today && delivery.type !== "delivered";

    // Today's deliveries should not be marked as past due
    const isToday = scheduledDate && scheduledDate === today;

    return (
      <TooltipProvider key={delivery.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                text-xs p-1 rounded cursor-pointer
                ${
                  delivery.type === "delivered"
                    ? "bg-gray-50 hover:bg-gray-100 text-gray-500"
                    : isPastDue && !isToday
                    ? "bg-red-200 hover:bg-red-300"
                    : "bg-blue-50 hover:bg-blue-100"
                }
              `}
            >
              <div className="truncate">
                {titleCase(delivery.customers?.name.toLowerCase())}
              </div>
              <div className="truncate text-gray-500">
                {titleCase(delivery.products.toLowerCase())}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>🛏️ {delivery.products}</p>
              <p>📍 {delivery.customers?.address}</p>
              <p>📱 {delivery.customers?.phone}</p>
              {delivery.type === "delivered" && <p>✅ Entregado</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderDeliveryCell = (day) => {
    const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayDeliveries = deliveries[dateStr] || [];

    if (currentDate.getDay() === 0) {
      return null;
    }

    const today = new Date().toISOString().split("T")[0];
    const cellDate = currentDate.toISOString().split("T")[0];
    const isToday = today === cellDate;

    return (
      <div className="h-full min-h-24 p-1 border-gray-200">
        <div className="font-medium text-sm mb-1 flex justify-start">
          {isToday ? (
            <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
              {day}
            </div>
          ) : (
            <span>{day}</span>
          )}
        </div>
        <div className="space-y-1">{dayDeliveries.map(renderDeliveryItem)}</div>
      </div>
    );
  };

  const { daysInMonth, startingDay } = getDaysInMonth(date);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks =
    startingDay === 0
      ? []
      : Array.from({ length: startingDay - 1 }, (_, i) => i);
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="space-y-4">
      {unscheduledCount > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Hay <span className="font-bold">{unscheduledCount}</span> entregas sin programar que no se ven en el
            calendario.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">
            {date.toLocaleDateString("es", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="delivered">Entregadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setDate(new Date(date.getFullYear(), date.getMonth() - 1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setDate(new Date(date.getFullYear(), date.getMonth() + 1))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="grid">
            <div className="grid grid-cols-6 gap-px mb-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-medium py-2 bg-gray-50"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-6 auto-rows-fr gap-px bg-gray-200">
              {blanks.map((blank) => (
                <div key={`blank-${blank}`} className="bg-gray-50 min-h-24" />
              ))}

              {days.map((day) => {
                const currentDate = new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  day
                );
                return currentDate.getDay() !== 0 ? (
                  <div key={`day-${day}`} className="bg-white">
                    {renderDeliveryCell(day)}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DeliveryCalendar;
