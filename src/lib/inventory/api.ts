import { sendApiRequest } from "@/lib/api/client";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  InventoryCategory,
  InventoryItem,
  StockMovement,
} from "./types";

// Any signed-in employee lists the categories; only the administrator changes
// them. The Backend answers 409 for a name that already exists.
export function listInventoryCategories() {
  return sendApiRequest<InventoryCategory[]>("/inventory-categories");
}

export function createInventoryCategory(name: string) {
  return sendApiRequest<InventoryCategory>("/inventory-categories", { method: "POST", body: { name } });
}

export function renameInventoryCategory(inventoryCategoryId: string, name: string) {
  return sendApiRequest<InventoryCategory>(`/inventory-categories/${inventoryCategoryId}`, { method: "PATCH", body: { name } });
}

export function removeInventoryCategory(inventoryCategoryId: string) {
  return sendApiRequest<void>(`/inventory-categories/${inventoryCategoryId}`, { method: "DELETE" });
}

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

// Items at or below the minimum stock. Any signed-in employee can read it.
export function countLowStockItems() {
  return sendApiRequest<{ count: number }>("/inventory-items/low-stock/count");
}
