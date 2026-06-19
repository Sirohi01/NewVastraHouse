import { useAuthStore } from "@/stores/authStore";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  public readonly status: number;
  public readonly requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);

    if (response.status === 401) {
      useAuthStore.getState().clearSession();
      if (typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const loginPath = window.location.pathname.startsWith("/admin")
          ? "/admin/login"
          : `/login?redirect=${encodeURIComponent(currentPath)}`;

        if (window.location.pathname !== "/login" && window.location.pathname !== "/admin/login") {
          window.location.assign(loginPath);
        }
      }
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return "Request failed";
  }

  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message || text;
  } catch {
    return text;
  }
}
