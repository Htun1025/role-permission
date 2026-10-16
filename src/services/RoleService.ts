import type { RoleItem } from "@/types";

const BASE_URL = "/api/roles";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result
        ? String(
            (result as { message?: unknown }).message ??
              "Request failed.",
          )
        : "Request failed.";

    throw new Error(message);
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    return (result as ApiResponse<T>).data as T;
  }

  return result as T;
}

export const RoleService = {

  async getAll(): Promise<RoleItem[]> {
    return request<RoleItem[]>(BASE_URL);
  },

  async getByName(name: string): Promise<RoleItem> {
    return request<RoleItem>(
      `${BASE_URL}/${encodeURIComponent(name)}`,
    );
  },

  async create(data: RoleItem): Promise<RoleItem> {
    return request<RoleItem>(BASE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    name: string,
    data: {
      name: string;
      description: string;
    },
  ): Promise<RoleItem> {
    return request<RoleItem>(
      `${BASE_URL}/${encodeURIComponent(name)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  async remove(name: string): Promise<void> {
    await request<unknown>(
      `${BASE_URL}/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
      },
    );
  },

  async removeMany(names: string[]): Promise<void> {
    await request<unknown>(BASE_URL, {
      method: "DELETE",
      body: JSON.stringify({
        names,
      }),
    });
  },
};