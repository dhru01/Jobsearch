export const PLANS = {
  free: {
    id: "free" as const,
    label: "Free",
    priceZar: 0,
    tailoredGenerationsPerMonth: 3,
    dailyDigest: false,
  },
  pro: {
    id: "pro" as const,
    label: "Pro",
    priceZar: 99,
    tailoredGenerationsPerMonth: null as number | null,
    dailyDigest: true,
  },
};

export type PlanId = keyof typeof PLANS;
