import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const getBaseUrl = (): string =>
  (import.meta.env.VITE_PUBLIC_URL as string | undefined) ?? "";

const LOGIN_PATH = "/login";

function handleAuthExpired(status: number): void {
  if (status !== 401 || typeof window === "undefined") {
    return;
  }
  // Best-effort sign out; redirect so SecureRoute/gated pages re-auth.
  signOut(auth).catch(() => undefined);
  const pathname = window.location.pathname;
  if (pathname !== LOGIN_PATH && pathname !== `${LOGIN_PATH}/`) {
    window.location.assign(LOGIN_PATH);
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;
  const authHeader = await getAuthHeader();
  const resp = await fetch(`${getBaseUrl()}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...authHeader,
      ...(headers ?? {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!resp.ok) {
    let errorBody: unknown;
    try {
      const contentType = resp.headers.get("content-type") ?? "";
      errorBody = contentType.includes("application/json")
        ? await resp.json()
        : await resp.text();
    } catch {
      errorBody = undefined;
    }
    handleAuthExpired(resp.status);
    const message =
      typeof errorBody === "string" && errorBody
        ? errorBody
        : (errorBody as { message?: string } | undefined)?.message ||
          resp.statusText ||
          `Request failed with status ${resp.status}`;
    throw new ApiError(message, resp.status, errorBody);
  }

  if (resp.status === 204) {
    return undefined as T;
  }
  const contentType = resp.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await resp.json()) as T;
  }
  const text = await resp.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiGet = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "GET" });

export const apiPost = <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "POST", body });

export const apiPut = <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "PUT", body });

export const apiPatch = <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "PATCH", body });

export const apiDelete = <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "DELETE", body });
