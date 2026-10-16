"use client";

import { create } from "zustand";

import type {
  RoleItem,
  Permission,
  PermissionKey,
  Resource,
  SaveRoleInput,
  RolesStore
  
} from "@/types";

const resources: Resource[] = [
  "USER",
  "REQUEST",
  "ROLE",
  "PERMISSION",
];

export const createEmptyPermissions = (): Permission[] =>
  resources.map((resource) => ({
    resource,
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
  }));

function normalizeRole(value: unknown): RoleItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;

  if (typeof item.name !== "string" || !item.name.trim()) {
    return null;
  }

  return {
    name: item.name.trim(),
    description:
      typeof item.description === "string"
        ? item.description
        : "",
  };
}

function extractRoles(data: unknown): RoleItem[] {
  if (Array.isArray(data)) {
    return data
      .map(normalizeRole)
      .filter((role): role is RoleItem => role !== null);
  }

  if (!data || typeof data !== "object") return [];

  const object = data as Record<string, unknown>;

  for (const key of ["roles", "data", "items"]) {
    if (Array.isArray(object[key])) {
      return (object[key] as unknown[])
        .map(normalizeRole)
        .filter((role): role is RoleItem => role !== null);
    }
  }

  const role = normalizeRole(object.role);

  return role ? [role] : [];
}

function normalizePermissions(saved: unknown): Permission[] {
  const defaults = createEmptyPermissions();

  if (!Array.isArray(saved)) return defaults;

  return defaults.map((permission) => {
    const found = saved.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as Record<string, unknown>).resource ===
          permission.resource,
    ) as Record<string, unknown> | undefined;

    if (!found) return permission;

    return {
      resource: permission.resource,
      canView: found.canView === true,
      canCreate: found.canCreate === true,
      canEdit: found.canEdit === true,
      canDelete: found.canDelete === true,
      canApprove: found.canApprove === true,
      canReject: found.canReject === true,
    };
  });
}

async function readResponse(response: Response): Promise<unknown> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const body =
      data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : {};

    throw new Error(
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `Request failed (${response.status}).`,
    );
  }

  return data;
}

export const useRolesStore = create<RolesStore>((set, get) => ({
  roles: [],
  selectedRoles: [],
  permissions: createEmptyPermissions(),

  loading: true,
  permissionLoading: false,
  saving: false,
  deleting: false,

  setSelectedRoles: (selectedRoles) => set({ selectedRoles }),

  setPermissions: (permissions) => set({ permissions }),

  updatePermission: (resource, key, checked) => {
    set((state) => ({
      permissions: state.permissions.map((permission) =>
        permission.resource === resource
          ? { ...permission, [key]: checked }
          : permission,
      ),
    }));
  },
  loadRoles: async (showLoading = true) => {
    if (showLoading) set({ loading: true });

    try {
      const response = await fetch("/api/roles", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readResponse(response);
      const roles = extractRoles(data);

      set((state) => ({
        roles,
        selectedRoles: state.selectedRoles.filter((selected) =>
          roles.some((role) => role.name === selected.name),
        ),
      }));
    } finally {
      if (showLoading) set({ loading: false });
    }
  },

  loadRolePermissions: async (role) => {
    set({
      permissionLoading: true,
      permissions: createEmptyPermissions(),
    });

    try {
      const response = await fetch(
        `/api/roles/${encodeURIComponent(role.name)}/permissions`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await readResponse(response);

      const object =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {};

      const saved = Array.isArray(data)
        ? data
        : object.permissions ??
          object.rolePermissions ??
          object.data;

      set({ permissions: normalizePermissions(saved) });
    } finally {
      set({ permissionLoading: false });
    }
  },

  saveRole: async ({
    mode,
    oldRoleName,
    name,
    description,
    permissions,
  }) => {
    set({ saving: true });

    try {
      const isEdit = mode === "edit";

      const roleResponse = await fetch(
        isEdit
          ? `/api/roles/${encodeURIComponent(oldRoleName ?? "")}`
          : "/api/roles",
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, description }),
        },
      );

      await readResponse(roleResponse);

      const permissionResponse = await fetch(
        `/api/roles/${encodeURIComponent(name)}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions }),
        },
      );

      await readResponse(permissionResponse);

      await get().loadRoles(false);

      set({
        selectedRoles: [],
        permissions: createEmptyPermissions(),
      });
    } finally {
      set({ saving: false });
    }
  },

  deleteRoles: async (items) => {
    if (items.length === 0) return;

    set({ deleting: true });

    try {
      for (const role of items) {
        const response = await fetch(
          `/api/roles/${encodeURIComponent(role.name)}`,
          { method: "DELETE" },
        );

        await readResponse(response);
      }

      await get().loadRoles(false);

      set({ selectedRoles: [] });
    } finally {
      set({ deleting: false });
    }
  },
}));