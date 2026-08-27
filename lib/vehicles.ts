export interface Vehicle {
  plan: "small" | "builder" | "featured" | "premium";
  path: string;
  scale: number;
  yOffset: number;
}

export const VEHICLES: Record<string, Vehicle> = {
  small: {
    plan: "small",
    path: "/models/Level1.glb",
    scale: 5.0,
    yOffset: 0.1,
  },
  builder: {
    plan: "builder",
    path: "/models/Level2.glb",
    scale: 5.0,
    yOffset: 0.1,
  },
  featured: {
    plan: "featured",
    path: "/models/Level3.glb",
    scale: 5.0,
    yOffset: 0.1,
  },
  premium: {
    plan: "premium",
    path: "/models/Level4.glb",
    scale: 5.0,
    yOffset: 0.1,
  },
};

/**
 * Returns the vehicle object associated with a given spot plan.
 */
export function getVehicleForPlan(plan: string): Vehicle {
  const normalizedPlan = (plan || "small").toLowerCase();
  return VEHICLES[normalizedPlan] || VEHICLES.small;
}

export function getAllVehiclePaths(): string[] {
  return Object.values(VEHICLES).map((v) => v.path);
}

