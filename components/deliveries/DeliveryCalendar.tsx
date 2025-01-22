import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useDeliveryBalance } from "@/hooks/useDeliveryBalance";
import { useRole } from "@/hooks/useRole";
import { getStore } from "@/lib/utils/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { titleCase } from "title-case";

interface DropResult {
  date: string;
}

interface DroppableCellProps {
  date: string;
  children: React.ReactNode;
}
interface CalendarDelivery {
  id: number;
  type: "pending" | "delivered";
  display_date: string;
  customer: {
    name: string;
    address: string;
    phone: string | null;
  };
  items: Array<{
    quantity: number;
    pending_quantity: number;
    name: string;
  }>;
  created_by?: {
    name: string | null;
  } | null;
  operation_cost?: number | null;
  cost?: number | null;
  carrier?: string | null;
  pickup_store?: string | null;
  invoice_id?: number | null;
}

interface CalendarResponse {
  feed: CalendarDelivery[];
  totalItems: number;
  unscheduledCount: number;
  dailyCosts: Record<string, number>;
  totalCost: number;
}

export const DraggableDeliveryItem = ({
  delivery,
  onDragEnd,
  showCosts
}: {
  delivery: CalendarDelivery;
  onDragEnd: (id: number, date: string) => void;
  showCosts: boolean;
}) => {
  const { balance, isRefreshing } = useDeliveryBalance({
    invoice_id: delivery.invoice_id || null
  });

  const hasBalance = balance && balance !== "0,00";
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "DELIVERY",
    item: { id: delivery.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult() as DropResult | null;
      if (dropResult) {
        onDragEnd(item.id, dropResult.date);
      }
    }
  }));

  const today = new Date().toISOString().split("T")[0];
  const isPastDue =
    delivery.display_date < today && delivery.type !== "delivered";
  const isToday = delivery.display_date === today;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={drag as unknown as React.RefObject<HTMLDivElement>}
            className={`
              text-xs p-1 rounded cursor-move
              ${isDragging ? "opacity-50" : "opacity-100"}
              ${
                delivery.type === "delivered"
                  ? "bg-gray-50 cursor-auto text-gray-500"
                  : isPastDue && !isToday
                  ? "bg-red-200 hover:bg-red-300"
                  : "bg-blue-50 hover:bg-blue-100"
              }
            `}
          >
            <div className="truncate capitalize">
              {delivery.customer.name.toLowerCase()}
            </div>
            {hasBalance && delivery.type === "pending" && (
              <div
                className={`text-red-600 ${isRefreshing ? "opacity-50" : ""}`}
              >
                Saldo $ {balance}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 capitalize">
            {delivery.items.length > 0 && (
              <div className="space-y-1">
                {delivery.items.map((item, index) => (
                  <div key={index}>
                    {item.quantity}x {titleCase(item.name.toLowerCase())}
                    {delivery.type === "pending" &&
                      item.pending_quantity > 0 && (
                        <span className="text-amber-600">
                          {" "}
                          (Pendiente: {item.pending_quantity})
                        </span>
                      )}
                  </div>
                ))}
              </div>
            )}
            <p>📍 {delivery.customer.address.toLowerCase()}</p>
            <p>📱 {delivery.customer.phone}</p>
            {showCosts && delivery.operation_cost && (
              <>
                <p>
                  💲{" "}
                  {delivery.operation_cost.toLocaleString("es-AR", {
                    maximumFractionDigits: 0
                  })}{" "}
                </p>
                {delivery.carrier && <p>🚚 {delivery.carrier}</p>}
              </>
            )}
            {delivery.created_by?.name && <p>✏️ {delivery.created_by.name}</p>}
            {delivery.type === "delivered" && <p>✅ Entregado</p>}
            {delivery.pickup_store && (
              <p>Retiró en {getStore(delivery.pickup_store).label}</p>
            )}
          </div>
        </TooltipContent>{" "}
      </Tooltip>
    </TooltipProvider>
  );
};

// Droppable calendar cell component
const DroppableCell = ({ date, children }: DroppableCellProps) => {
  const [{ isOver }, drop] = useDrop<
    { id: number }, // Item type
    DropResult, // DropResult type
    { isOver: boolean } // Collect props type
  >(() => ({
    accept: "DELIVERY",
    drop: () => ({ date }),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
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
  const [unscheduledCount, setUnscheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { role } = useRole();
  const showCosts = role === "admin";
  const [deliveries, setDeliveries] = useState<
    Record<string, CalendarDelivery[]>
  >({});
  const [dailyCosts, setDailyCosts] = useState<Record<string, number>>({});
  const [totalCost, setTotalCost] = useState(0);

  const handleDeliveryDragEnd = async (deliveryId, newDate) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
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

        const data: CalendarResponse = await response.json();

        setUnscheduledCount(data.unscheduledCount);
        setDailyCosts(data.dailyCosts);
        setTotalCost(data.totalCost);

        // Filter deliveries based on selected type
        const filteredDeliveries = data.feed.filter((delivery) => {
          if (filter === "all") return true;
          return delivery.type === filter;
        });

        // Group filtered deliveries by date
        const grouped = filteredDeliveries.reduce((acc, delivery) => {
          const normalizedDate = delivery.display_date.split("T")[0];
          acc[normalizedDate] = acc[normalizedDate] || [];
          acc[normalizedDate].push(delivery);
          return acc;
        }, {} as Record<string, CalendarDelivery[]>);

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
    const dayCost = dailyCosts[dateStr] || 0;

    const formattedDayCost =
      dayCost > 0 && showCosts
        ? dayCost.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
          })
        : "";

    return (
      <DroppableCell date={dateStr}>
        <div className="font-medium text-sm m-2 flex justify-between">
          {formattedDayCost && (
            <span className="text-gray-500 font-light">{formattedDayCost}</span>
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
              showCosts={showCosts}
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
              {showCosts && (
                <CardDescription>
                  {totalCost > 0 &&
                    totalCost.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0
                    })}
                </CardDescription>
              )}{" "}
            </div>
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
                    <div key={day} className="text-right mr-2 font-light py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-6 auto-rows-fr gap-px bg-gray-200">
                  {blanks.map((blank) => (
                    <div
                      key={`blank-${blank}`}
                      className="bg-gray-50 min-h-24"
                    />
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
