/**
 * CampusX backend API helpers.
 *
 * `API_BASE` is relative — during development the Vite dev server proxies
 * `/api` to the FastAPI backend (see vite.config.ts).
 */

export const API_BASE = "/api";

export async function fetchApi<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${path}`);
  }
  return (await res.json()) as T;
}
