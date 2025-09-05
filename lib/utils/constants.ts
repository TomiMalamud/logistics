import { Store } from "@/types/types";

export const STORES: Store[] = [
  { id: "60835", label: "CD" },
  { id: "24471", label: "9 de Julio" },
  { id: "31312", label: "Cárcano" },
  { id: "70749", label: "Segunda Selección" },
];

export const getStore = (id: string): Store | undefined =>
  STORES.find((store) => store.id === id);

export const ERP_PROFILES: Record<string, string> = {
  "24194": "Noe",
  "28119": "Silvi",
  "29577": "Guido",
};

export const EMPLOYEE_BASE_TARGETS: Record<string, number> = {
  "24194": 25000000, // Noe
  "28119": 15000000, // Silvi
  "29577": 20000000, // Guido
};

export const TIER_MULTIPLIERS = {
  base: 1,
  despegue: 1.1,
  full: 1.25,
  xxl: 1.4,
};

export const getEmployeeTierTarget = (employeeId: string, tier: keyof typeof TIER_MULTIPLIERS): number => {
  const baseTarget = EMPLOYEE_BASE_TARGETS[employeeId];
  if (!baseTarget) return 0;
  return baseTarget * TIER_MULTIPLIERS[tier];
};

export const TIER_BONUSES = {
  base: 0,
  despegue: 125000,
  full: 200000,
  xxl: 300000,
};

export interface FinancingOption {
  months: number;
  discount?: number;
  interest?: number;
  label: string;
  cards?: string[];
  helper?: string;
}

export const CASH_DISCOUNT = 30;

export const FINANCING_OPTIONS: FinancingOption[] = [
  {
    months: 12,
    discount: 0,
    label: "12 cuotas",
    cards: ["Bancaria"],
    helper: "Código 12",
  },
  {
    months: 6,
    discount: 15,
    label: "6 cuotas",
    cards: ["Bancaria"],
    helper: "Código 6",
  },
  {
    months: 3,
    discount: 20,
    label: "3 cuotas",
    cards: ["Bancaria"],
    helper: "Código 3",
  },
  {
    months: 1,
    discount: 25,
    label: "1 cuota",
    cards: ["Bancaria", "Naranja"],
    helper: "Código 1",
  },
  {
    months: 12,
    discount: 0,
    label: "12 cuotas",
    cards: ["Naranja"],
    helper: "Código 12",
  },
  {
    months: 6,
    discount: 10,
    label: "6 cuotas",
    cards: ["Naranja"],
    helper: "Código 6",
  },
  {
    months: 3,
    discount: 15,
    label: "Plan Z",
    cards: ["Naranja"],
    helper: "Código 11",
  },
];
