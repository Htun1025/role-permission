import type { PermissionItem } from "@/types";

const BASE_URL = "/api/permissions";

interface ApiResponse<T> {
  success: boolean;
  message: string;
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

  let result: ApiResponse<T> | T;

  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid server response.");
  }

  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result
        ? String(result.message)
        : "Request failed.";

    throw new Error(message);
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    "data" in result
  ) {
    const apiResult = result as ApiResponse<T>;

    if (!apiResult.success) {
      throw new Error(apiResult.message || "Request failed.");
    }

    return apiResult.data as T;
  }

  return result as T;
}

export const permissionService = {

  async getAll(): Promise<PermissionItem[]> {
    return request<PermissionItem[]>(BASE_URL);
  },

  async getById(id: number): Promise<PermissionItem> {
    return request<PermissionItem>(`${BASE_URL}/${id}`);
  },

  async create(
    data: Pick<PermissionItem, "name" | "code">,
  ): Promise<PermissionItem> {
    return request<PermissionItem>(BASE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Pick<PermissionItem, "name" | "code">,
  ): Promise<PermissionItem> {
    return request<PermissionItem>(`${BASE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async remove(id: number): Promise<void> {
    await request<unknown>(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
  },
};