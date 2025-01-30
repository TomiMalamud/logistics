import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPLOYEE_TIER_TARGETS, TIER_BONUSES } from "@/lib/utils/constants";
import React from "react";
import { Progress } from "../ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const getTierTargets = (employeeId: string | undefined) => {
  if (!employeeId || employeeId === "all") {
    // Default targets when no specific employee is selected
    return {
      base: {
        name: "Base",
        target: 50000000,
        color: "bg-purple-600/40",
        bonus: TIER_BONUSES.base,
      },
      despegue: {
        name: "Despegue",
        target: 60000000,
        color: "bg-purple-600/80",
        bonus: TIER_BONUSES.despegue,
      },
      full: {
        name: "Full",
        target: 70000000,
        color: "bg-purple-600",
        bonus: TIER_BONUSES.full,
      },
      xxl: {
        name: "XXL",
        target: 80000000,
        color: "bg-yellow-500",
        bonus: TIER_BONUSES.xxl,
      },
    };
  }

  const employeeTargets = EMPLOYEE_TIER_TARGETS[employeeId];
  return {
    base: {
      name: "Base",
      target: employeeTargets.base,
      color: "bg-purple-600/40",
      bonus: TIER_BONUSES.base,
    },
    despegue: {
      name: "Despegue",
      target: employeeTargets.despegue,
      color: "bg-purple-600/80",
      bonus: TIER_BONUSES.despegue,
    },
    full: {
      name: "Full",
      target: employeeTargets.full,
      color: "bg-purple-600",
      bonus: TIER_BONUSES.full,
    },
    xxl: {
      name: "XXL",
      target: employeeTargets.xxl,
      color: "bg-yellow-500",
      bonus: TIER_BONUSES.xxl,
    },
  };
};

const getCurrentTier = (
  sales: number,
  tiers: ReturnType<typeof getTierTargets>
) => {
  if (sales >= tiers.xxl.target) return tiers.xxl;
  if (sales >= tiers.full.target) return tiers.full;
  if (sales >= tiers.despegue.target) return tiers.despegue;
  if (sales >= tiers.base.target) return tiers.base;
  return { ...tiers.base, name: "Objetivo base no alcanzado (todavía 😉)" };
};

const getNextTierTarget = (
  sales: number,
  tiers: ReturnType<typeof getTierTargets>
) => {
  if (sales < tiers.base.target) return tiers.base;
  if (sales < tiers.despegue.target) return tiers.despegue;
  if (sales < tiers.full.target) return tiers.full;
  if (sales < tiers.xxl.target) return tiers.xxl;
  return tiers.xxl;
};

const getProgressBarColor = (
  sales: number,
  tiers: ReturnType<typeof getTierTargets>
) => {
  if (sales >= tiers.xxl.target) return tiers.xxl.color;
  if (sales >= tiers.full.target) return tiers.full.color;
  if (sales >= tiers.despegue.target) return tiers.despegue.color;
  return tiers.base.color;
};

const Checkpoint = ({ value, tierName, color, tiers, bonus }) => {
  const position = `${(value / tiers.xxl.target) * 100}%`;

  return (
    <div
      className="absolute transform -translate-x-1/2"
      style={{ left: position }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex justify-center">
              <div className={`w-4 h-4 rounded-full ${color}`} />
            </div>
            <div className="text-xs text-muted-foreground flex flex-col items-center mt-1">
              <div>{tierName}</div>
              <div>${(value / 1000000).toFixed(0)}M</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {bonus > 0
                ? `Bono: $${bonus.toLocaleString("es-AR")}`
                : "Sin bono en esta etapa"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

interface TierProgressProps {
  totalSales: number;
  isLoading: boolean;
  employeeId?: string;
}

const TierProgress: React.FC<TierProgressProps> = ({
  totalSales,
  isLoading,
  employeeId,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progreso hacia el objetivo</CardTitle>
          <div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const tiers = getTierTargets(employeeId);
  const currentTier = getCurrentTier(totalSales, tiers);
  const nextTierTarget = getNextTierTarget(totalSales, tiers);
  const progressBarColor = getProgressBarColor(totalSales, tiers);

  const progressToNextTier = Math.min(
    (totalSales / tiers.xxl.target) * 100,
    100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso hacia el objetivo</CardTitle>
        <CardDescription className="text-muted-foreground">
          Ventas del mes: ${(totalSales / 1000000).toFixed(2)}M
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Etapa</p>
              <p className="text-2xl font-bold">{currentTier.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">
                Próxima etapa:{" "}
                {totalSales >= tiers.xxl.target ? "" : nextTierTarget.name}
              </p>
              <p className="text-2xl font-bold">
                {totalSales >= tiers.xxl.target
                  ? "Alcanzaste el máximo, avisanos!"
                  : `${((nextTierTarget.target - totalSales) / 1000000).toFixed(
                      1
                    )}M para avanzar`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative mb-12">
              <Progress
                value={progressToNextTier}
                className="h-2 w-full"
                indicatorClassName={progressBarColor}
              />

              <div className="mt-4">
                <Checkpoint
                  value={tiers.base.target}
                  tierName="Base"
                  color={tiers.base.color}
                  tiers={tiers}
                  bonus={tiers.base.bonus}
                />
                <Checkpoint
                  value={tiers.despegue.target}
                  tierName="Despegue"
                  color={tiers.despegue.color}
                  tiers={tiers}
                  bonus={tiers.despegue.bonus}
                />
                <Checkpoint
                  value={tiers.full.target}
                  tierName="Full"
                  color={tiers.full.color}
                  tiers={tiers}
                  bonus={tiers.full.bonus}
                />
                <Checkpoint
                  value={tiers.xxl.target}
                  tierName="XXL"
                  color={tiers.xxl.color}
                  tiers={tiers}
                  bonus={tiers.xxl.bonus}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0M</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TierProgress;
