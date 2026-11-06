import { parseApiError } from "./ApiError";

export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw await parseApiError(response);
  // 204 No Content, such as the logout.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

