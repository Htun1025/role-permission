import type {
  Permission,
  UserRow,
  UserStatus,
  NewUserForm,
} from "@/types";

const BASE_URL = "/api/users";

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

export const UserService = {

  async getAll(): Promise<UserRow[]> {
    return request<UserRow[]>(BASE_URL);
  },

  async getById(id: string): Promise<UserRow> {
    return request<UserRow>(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );
  },

  async create(
    data: NewUserForm,
  ): Promise<UserRow> {
    return request<UserRow>(BASE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Compatibility alias
  async createUser(
    data: NewUserForm,
  ): Promise<UserRow> {
    return this.create(data);
  },


  async update(
    id: string,
    data: {
      name: string;
      username: string;
      email: string;
      role: string;
    },
  ): Promise<UserRow> {
    return request<UserRow>(
      `${BASE_URL}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },


  async updateUser(
    id: string,
    data: {
      name: string;
      username: string;
      email: string;
      role: string;
    },
  ): Promise<UserRow> {
    return this.update(id, data);
  },

  async remove(id: string): Promise<void> {
    await request<unknown>(
      `${BASE_URL}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  async deleteUser(id: string): Promise<void> {
    return this.remove(id);
  },

  async getPermissions(
    userId: string,
  ): Promise<Permission[]> {
    const result = await request<
      Permission[] | {
        permissions: Permission[];
      }
    >(
      `${BASE_URL}/${encodeURIComponent(
        userId,
      )}/permissions`,
    );

    if (Array.isArray(result)) {
      return result;
    }

    if (
      result &&
      typeof result === "object" &&
      "permissions" in result &&
      Array.isArray(result.permissions)
    ) {
      return result.permissions;
    }

    return [];
  },

  async savePermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    await request<unknown>(
      `${BASE_URL}/${encodeURIComponent(
        userId,
      )}/permissions`,
      {
        method: "PUT",
        body: JSON.stringify({
          permissions,
        }),
      },
    );
  },

  async approval(
    userId: string,
    action: "APPROVE" | "REJECT",
  ): Promise<{
    message?: string;
    status?: UserStatus;
  }> {
    return request<{
      message?: string;
      status?: UserStatus;
    }>(
      `${BASE_URL}/${encodeURIComponent(
        userId,
      )}/approval`,
      {
        method: "PATCH",
        body: JSON.stringify({
          action,
        }),
      },
    );
  },
 
  async updateApproval(
    userId: string,
    action: "APPROVE" | "REJECT",
  ): Promise<{
    message?: string;
    status?: UserStatus;
  }> {
    return this.approval(userId, action);
  },
};