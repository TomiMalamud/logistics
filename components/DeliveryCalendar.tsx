import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import _ from "lodash";
import Link from "next/link";

const DraggableDeliveryItem = ({ delivery, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "DELIVERY",
    item: { id: delivery.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor: { getDropResult: () => { date: string } | null }) => {
      const dropResult = monitor.getDropResult();
      if (dropResult) {
        onDragEnd(item.id, dropResult.date);
      }
    }
  }));

  const today = new Date().toISOString().split("T")[0];
  const scheduledDate = delivery.scheduled_date
    ? delivery.scheduled_date.split("T")[0]
    : null;
  const isPastDue =
    scheduledDate && scheduledDate < today && delivery.state !== "delivered";
  const isToday = scheduledDate && scheduledDate === today;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={drag}
            className={`
              text-xs p-1 rounded cursor-move
              ${isDragging ? "opacity-50" : "opacity-100"}
              ${
                delivery.state === "delivered"
                  ? "bg-gray-50 cursor-auto text-gray-500"
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
            {(delivery.balance > 0 && delivery.state == "pending") && 
            <div className="text-red-600">
              Saldo {delivery.balance}
            </div>
            }
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>🛏️ {titleCase(delivery.products.toLowerCase())}</p>
            <p>📍 {titleCase(delivery.customers?.address.toLowerCase())}</p>
            <p>📱 {delivery.customers?.phone}</p>
            {delivery.delivery_cost && (
              <p>
                💲{" "}
                {delivery.delivery_cost.toLocaleString("es-AR", {
                  maximumFractionDigits: 0
                })}{" "}
              </p>
            )}
            {delivery.state === "delivered" && <p>✅ Entregado</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Droppable calendar cell component
const DroppableCell = ({ date, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "DELIVERY",
    drop: () => ({ date }),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className={`h-full min-h-24 p-1 border-gray-200 ${
        isOver ? "bg-blue-50" : "bg-white"
      }`}
    >
      {children}
    </div>
  );
};

const DeliveryCalendar = ({ searchUrl }) => {
  const [date, setDate] = useState(new Date());
  const [deliveries, setDeliveries] = useState({});
  const [unscheduledCount, setUnscheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // Calculate monthly total from deliveries
  const calculateMonthlyTotal = useCallback((deliveriesData) => {
    return _(deliveriesData)
      .values()
      .flatten()
      .map((delivery) => delivery.delivery_cost || 0)
      .sum();
  }, []);

  const handleDeliveryDragEnd = async (deliveryId, newDate) => {
    try {
      const response = await fetch(`/api/delivery/${deliveryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scheduled_date: newDate
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update delivery date");
      }

      // Refetch calendar data
      fetchMonthDeliveries(date);
    } catch (error) {
      console.error("Error updating delivery date:", error);
      // Here you might want to add a toast notification
    }
  };

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
          (delivery) => !delivery.scheduled_date && delivery.state === "pending"
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

        const total = calculateMonthlyTotal(grouped);
        setMonthlyTotal(total);
        setDeliveries(grouped);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchUrl, filter, calculateMonthlyTotal]
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
    const totalCost = dayDeliveries
      .map((delivery) => delivery.delivery_cost || 0)
      .reduce((sum, cost) => sum + cost, 0);

    // Format the total cost in ARS currency
    const formattedTotalCost =
      totalCost > 0
        ? totalCost.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
          })
        : "";

    return (
      <DroppableCell date={dateStr}>
        <div className="font-medium text-sm m-2 flex justify-between">
          {totalCost > 0 && (
            <span className="text-gray-500 font-light">{formattedTotalCost}</span>
          )}
          {isToday ? (
            <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
              {day}
            </div>
          ) : (
            <span>{day}</span>
          )}
        </div>
        <div className="space-y-1">
          {dayDeliveries.map((delivery) => (
            <DraggableDeliveryItem
              key={delivery.id}
              delivery={delivery}
              onDragEnd={handleDeliveryDragEnd}
            />
          ))}
        </div>
      </DroppableCell>
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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <Link href="/?scheduledDate=noDate&page=">
          <Alert variant="destructive">
            <AlertDescription>
              Hay <span className="font-bold">{unscheduledCount}</span> entregas
              sin programar que no se ven en el calendario.
            </AlertDescription>
          </Alert>
          </Link>
        <Card>
          <CardHeader className="flex-row justify-between items-center">
            <div className="flex items-center gap-x-4">
              <CardTitle className="text-xl">
                {date.toLocaleDateString("es", {
                  month: "long",
                  year: "numeric"
                })}
              </CardTitle>
              <CardDescription>
                {monthlyTotal > 0 &&
                  monthlyTotal.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0
                  })}
              </CardDescription>
            </div>
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
          </CardHeader>
          <CardContent>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="grid">
              <div className="grid grid-cols-6 gap-px mb-1 border-b border-gray-400">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-right mr-2 font-light py-2"
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
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
};

export default DeliveryCalendar;
