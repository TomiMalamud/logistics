export const INVENTORY_LOCATIONS: Record<string, string> = {
  "24471": "9 DE JULIO 322",
  "60835": "CD",
  "31312": "CÁRCANO",
  "64512": "PENDIENTE DE ENTREGA",
  "70749": "SEGUNDA SELECCIÓN"
};

export const PICKUP_STORES = [
  { value: "cd", label: "CD" },
  { value: "9dejulio", label: "9 de Julio" },
  { value: "carcano", label: "Cárcano" }
];

export const ERP_PROFILES: Record<string, string> = {
  "24194": "Noe",
  "25996": "Amadeo",
  "13048": "Ema",
  "11995": "Flavia"
}

export const EMPLOYEE_TIER_TARGETS: Record<string, {
  base: number;
  despegue: number;
  full: number;
  xxl: number;
}> = {
  "24194": { // Noe
    base: 20000000,
    despegue: 22000000,
    full: 25000000,
    xxl: 28000000
  },
  "25996": { // Amadeo
    base: 9000000,
    despegue: 12000000,
    full: 15000000,
    xxl: 17000000
  },
  "13048": { // Ema
    base: 20000000,
    despegue: 22000000,
    full: 25000000,
    xxl: 28000000
  },
  "11995": { // Flavia
    base: 20000000,
    despegue: 22000000,
    full: 25000000,
    xxl: 28000000
  }
};

export interface FinancingOption {
  months: number;
  discount: number;
  label: string;
}

export const CASH_DISCOUNT = 20; // 20% discount for cash payments

export const FINANCING_OPTIONS: FinancingOption[] = [
  { months: 6, discount: 0, label: "6 cuotas" },
  { months: 3, discount: 5, label: "3 cuotas o Plan Z" },
  { months: 1, discount: 15, label: "1 cuota" }
];