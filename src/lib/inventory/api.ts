import { sendApiRequest } from "@/lib/api/client";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  InventoryItem,
  StockMovement,
} from "./types";

export function listInventoryItems() {
  return sendApiRequest<InventoryItem[]>("/inventory-items");
}

export function createInventoryItem(input: CreateInventoryItemInput) {
  return sendApiRequest<InventoryItem>("/inventory-items", { method: "POST", body: input });
}

// The Backend answers 409 when an outbound is bigger than the balance.
export function createStockMovement(input: CreateStockMovementInput) {
  return sendApiRequest<unknown>("/stock-movements", { method: "POST", body: input });
}

// Dates as YYYY-MM-DD; the item filter is optional. Only managers and
// administrators can read the history.
export function listStockMovements(from: string, to: string, inventoryItemId?: string) {
  const query = new URLSearchParams({ from, to });
  if (inventoryItemId) query.set("inventoryItemId", inventoryItemId);
  return sendApiRequest<StockMovement[]>(`/stock-movements?${query.toString()}`);
}