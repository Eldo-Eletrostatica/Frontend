    // Mirrors the Backend inventory-items. The unit values are confirmed by the
// Backend validation message (US13: kg, liter or unit).
export type InventoryUnit = "kg" | "liter" | "unit";
export type StockMovementType = "inbound" | "outbound";

export interface InventoryItem {
  inventoryItemId: string;
  name: string;
  category: string;
  supplierName: string;
  unit: InventoryUnit;
  balance: number;
  minimumStock: number;
  updatedAt: string;
}

export interface CreateInventoryItemInput {
  name: string;
  category: string;
  supplierName: string;
  unit: InventoryUnit;
  balance: number;
  minimumStock: number;
}

export const UNIT_LABELS: Record<InventoryUnit, string> = {
  kg: "kg",
  liter: "L",
  unit: "un",
};

export const INVENTORY_UNITS: InventoryUnit[] = ["kg", "liter", "unit"];

// MinimumStock (glossary): equal to or below the minimum is an alert.
export function isBelowMinimum(item: Pick<InventoryItem, "balance" | "minimumStock">): boolean {
  return item.balance <= item.minimumStock;
}


export interface CreateStockMovementInput {
  inventoryItemId: string;
  employeeId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
}

// Mirrors GET /stock-movements.
export interface StockMovement {
  stockMovementId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  movedAt: string;
  inventoryItem: { inventoryItemId: string; name: string; unit: InventoryUnit };
  employee: { employeeId: string; name: string };
}