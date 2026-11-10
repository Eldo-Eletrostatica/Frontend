    import { sendApiRequest } from "@/lib/api/client";
import type { CreateInventoryItemInput, InventoryItem } from "./types";

export function listInventoryItems() {
  return sendApiRequest<InventoryItem[]>("/inventory-items");
}

export function createInventoryItem(input: CreateInventoryItemInput) {
  return sendApiRequest<InventoryItem>("/inventory-items", { method: "POST", body: input });
}