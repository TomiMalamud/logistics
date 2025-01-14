import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPLOYEE_TIER_TARGETS } from "@/utils/constants";
import React from "react";

const getTierTargets = (employeeId: string | undefined) => {
  if (!employeeId || employeeId === 'all') {
    // Default targets when no specific employee is selected
    return {
      base: { name: "Base", target: 20000000, color: "bg-purple-500/40" },
      despegue: { name: "Despegue", target: 22000000, color: "bg-purple-500/60" },
      full: { name: "Full", target: 25000000, color: "bg-purple-500/80" },
      xxl: { name: "XXL", target: 28000000, color: "bg-yellow-500 animate-pulse" }
    };
  }

  const employeeTargets = EMPLOYEE_TIER_TARGETS[employeeId];
  return {
    base: { name: "Base", target: employeeTargets.base, color: "bg-purple-500/40" },
    despegue: { name: "Despegue", target: employeeTargets.despegue, color: "bg-purple-500/60" },
    full: { name: "Full", target: employeeTargets.full, color: "bg-purple-500/80" },
    xxl: { name: "XXL", target: employeeTargets.xxl, color: "bg-purple-500" }
  };
};

const getCurrentTier = (sales: number, tiers: ReturnType<typeof getTierTargets>) => {
  if (sales >= tiers.xxl.target) return tiers.xxl;
  if (sales >= tiers.full.target) return tiers.full;
  if (sales >= tiers.despegue.target) return tiers.despegue;
  return tiers.base;
};

const getCurrentTierBase = (sales: number, tiers: ReturnType<typeof getTierTargets>) => {
  if (sales < tiers.base.target) return 0;
  if (sales < tiers.despegue.target) return tiers.base.target;
  if (sales < tiers.full.target) return tiers.despegue.target;
  if (sales < tiers.xxl.target) return tiers.full.target;
  return tiers.xxl.target;
};

const getNextTierTarget = (sales: number, tiers: ReturnType<typeof getTierTargets>) => {
  if (sales < tiers.base.target) return tiers.base.target;
  if (sales < tiers.despegue.target) return tiers.despegue.target;
  if (sales < tiers.full.target) return tiers.full.target;
  if (sales < tiers.xxl.target) return tiers.xxl.target;
  return tiers.xxl.target;
};

const getProgressBarColor = (sales: number, tiers: ReturnType<typeof getTierTargets>) => {
  if (sales >= tiers.xxl.target) return tiers.xxl.color;
  if (sales >= tiers.full.target) return tiers.full.color;
  if (sales >= tiers.despegue.target) return tiers.despegue.color;
  return tiers.base.color;
};

const Checkpoint = ({ value, currentValue, tierName, color, tiers }) => {
  const position = `${(value / tiers.xxl.target) * 100}%`;
  
  return (
    <div 
      className="absolute transform -translate-x-1/2" 
      style={{ left: position }}
    >
      <div className="flex justify-center">
        <div className={`w-4 h-4 rounded-full ${color}`} />
      </div>
      <div className="text-xs text-muted-foreground flex flex-col items-center mt-1">
        <div>{tierName}</div>
        <div>${(value / 1000000).toFixed(0)}M</div>
      </div>
    </div>
  );
};

const CustomProgress = ({ value, color }) => {
  return (
    <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`absolute h-full ${color} transition-all duration-300` } 
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

interface TierProgressProps {
  totalSales: number;
  isLoading: boolean;
  employeeId?: string;
}

const TierProgress: React.FC<TierProgressProps> = ({ totalSales, isLoading, employeeId }) => {
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
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const tiers = getTierTargets(employeeId);
  const currentTier = getCurrentTier(totalSales, tiers);
  const nextTierTarget = getNextTierTarget(totalSales, tiers);
  const currentTierBase = getCurrentTierBase(totalSales, tiers);
  const progressBarColor = getProgressBarColor(totalSales, tiers);

  const progressToNextTier = Math.min(
    ((totalSales) / (tiers.xxl.target)) * 100,
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
              <p className="text-sm font-medium">Etapa</p>
              <p className="text-2xl font-bold">{currentTier.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Próxima etapa</p>
              <p className="text-2xl font-bold">
                {totalSales >= tiers.xxl.target
                  ? "Alcanzaste el máximo, avisanos!"
                  : `${((nextTierTarget - totalSales) / 1000000).toFixed(1)}M para avanzar`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative mb-12">
              <CustomProgress value={progressToNextTier} color={progressBarColor} />
              <div className="mt-4">
                <Checkpoint value={tiers.base.target} currentValue={totalSales} tierName="Base" color={tiers.base.color} tiers={tiers} />
                <Checkpoint value={tiers.despegue.target} currentValue={totalSales} tierName="Despegue" color={tiers.despegue.color} tiers={tiers} />
                <Checkpoint value={tiers.full.target} currentValue={totalSales} tierName="Full" color={tiers.full.color} tiers={tiers} />
                <Checkpoint value={tiers.xxl.target} currentValue={totalSales} tierName="XXL" color={tiers.xxl.color} tiers={tiers} />
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