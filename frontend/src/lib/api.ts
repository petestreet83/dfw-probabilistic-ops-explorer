import type { DashboardResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchDashboard(operation: string, horizon: string): Promise<DashboardResponse> {
  const url = `${API_BASE}/api/v1/dashboard?operation=${operation}&horizon=${horizon}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status}`);
  }

  return response.json() as Promise<DashboardResponse>;
}
