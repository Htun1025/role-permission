
"use client";

import { create } from "zustand";

import type {
  UserRow,
  NewUserForm,
  EditForm,
  Permission,
  PermissionKey,
  Resource,
} from "@/types";

import { UserService } from "@/services/UserService";

// INITIAL FORMS

const initialNewUser: NewUserForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "USER",
};

const initialEditForm: EditForm = {
  name: "",
  username: "",
  email: "",
  role: null,
};

// RESOURCES

const resources: Resource[] = [
  "USER",
  "REQUEST",
  "ROLE",
  "PERMISSION",
];

// CREATE EMPTY PERMISSION

const createEmptyPermission = (
  resource: Resource,
): Permission => ({
  resource,
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
  canReject: false,
});

// NORMALIZE PERMISSIONS

const normalizePermissions = (
  input?: unknown,
): Permission[] => {
  const source: Permission[] = Array.isArray(input)
    ? (input as Permission[])
    : [];

  return resources.map((resource) => {
    const existing = source.find(
      (permission) =>
        permission?.resource === resource,
    );

    return {
      ...createEmptyPermission(resource),
      ...(existing ?? {}),
      resource,
    };
  });
};

const getApiRoleName = (
  data: any,
  fallback?: string | null,
): string => {
  const roleName =
    data?.role?.name ??
    data?.user?.role?.name ??
    data?.user?.role ??
    fallback ??
    "USER";

  return typeof roleName === "string" &&
    roleName.trim()
    ? roleName
    : "USER";
};

// GET ROLE PERMISSIONS FROM API

const getApiRolePermissions = (
  data: any,
): Permission[] => {
  const permissions =
    data?.rolePermissions ??
    data?.permissions ??
    data?.role?.rolePermissions ??
    data?.user?.role?.rolePermissions ??
    data?.user?.rolePermissions ??
    [];

  return normalizePermissions(permissions);

};
// STORE TYPE

type UserStore = {

  users: UserRow[];
  keyword: string;
  selectedUsers: UserRow[];
  rows: number;
  first: number;

  addDialogVisible: boolean;
  newUser: NewUserForm;
  addingUser: boolean;

  editingUser: UserRow | null;
  editDialogVisible: boolean;
  editForm: EditForm;
  editSaving: boolean;

  rolePermissions: Permission[];

  permissionUser: UserRow | null;

  permissionDialogVisible: boolean;

  permissionLoading: boolean;

  permissionSaving: boolean;

  deletingId: string | null;

  approvingId: string | null;

  initializeUsers: (
    users: UserRow[],
  ) => void;

  setKeyword: (
    keyword: string,
  ) => void;

  setSelectedUsers: (
    users: UserRow[],
  ) => void;

  setFirst: (
    first: number,
  ) => void;

  openAddDialog: () => void;

  closeAddDialog: () => void;

  setNewUser: (
    user: NewUserForm,
  ) => void;

  createUser: () => Promise<UserRow | null>;

  openEditDialog: (
    user: UserRow,
  ) => void;

  closeEditDialog: () => void;

  setEditForm: (
    form: EditForm,
  ) => void;

  updateUser: () => Promise<UserRow | null>;

  openPermissionDialog: (
    user: UserRow,
  ) => Promise<void>;

  closePermissionDialog: () => void;

  loadPermissions: (
    user: UserRow,
  ) => Promise<void>;

  setPermission: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => void;

  savePermissions: () => Promise<boolean>;

  deleteUser: (
    user: UserRow,
  ) => Promise<boolean>;

  updateApproval: (
    user: UserRow,
    action: "APPROVE" | "REJECT",
  ) => Promise<boolean>;
  reset: () => void;
};

// STORE

export const useUserStore =
  create<UserStore>((set, get) => ({
   // initial state
    users: [],

    keyword: "",

    selectedUsers: [],

    rows: 10,

    first: 0,
  
    addDialogVisible: false,

    newUser: {
      ...initialNewUser,
    },

    addingUser: false,
  
    editingUser: null,

    editDialogVisible: false,

    editForm: {
      ...initialEditForm,
    },

    editSaving: false,
  
    rolePermissions: [],

    permissionUser: null,

    permissionDialogVisible: false,

    permissionLoading: false,

    permissionSaving: false,
  
    deletingId: null,

    approvingId: null,
 
    initializeUsers: (users) => {
      set({
        users,
        selectedUsers: [],
        first: 0,
      });
    },

    setKeyword: (keyword) => {
      set({
        keyword,
        first: 0,
        selectedUsers: [],
      });
    },

    setSelectedUsers: (users) => {
      set({
        selectedUsers: users,
      });
    },

    setFirst: (first) => {
      set({
        first,
      });
    },

     // ADD USER
   
    openAddDialog: () => {
      set({
        addDialogVisible: true,

        newUser: {
          ...initialNewUser,
        },
      });
    },

    closeAddDialog: () => {
      if (get().addingUser) {
        return;
      }

      set({
        addDialogVisible: false,

        newUser: {
          ...initialNewUser,
        },
      });
    },

    setNewUser: (user) => {
      set({
        newUser: user,
      });
    },

    createUser: async () => {
      const {
        newUser,
        addingUser,
      } = get();

      if (addingUser) {
        return null;
      }

      if (!newUser.name.trim()) {
        throw new Error(
          "Name is required.",
        );
      }

      if (!newUser.username.trim()) {
        throw new Error(
          "Username is required.",
        );
      }

      if (!newUser.email.trim()) {
        throw new Error(
          "Email is required.",
        );
      }

      if (!newUser.password.trim()) {
        throw new Error(
          "Password is required.",
        );
      }

      set({
        addingUser: true,
      });

      try {
        const createdUser =
          await UserService.createUser({
            ...newUser,

            name: newUser.name.trim(),

            username:
              newUser.username.trim(),

            email:
              newUser.email.trim(),
          });

        set((state) => ({
          users: [
            createdUser,
            ...state.users,
          ],

          newUser: {
            ...initialNewUser,
          },

          addDialogVisible: false,
        }));

        return createdUser;
      } finally {
        set({
          addingUser: false,
        });
      }
    },

       // EDIT USER
   
    openEditDialog: (user) => {
      if (get().editSaving) {
        return;
      }

      set({
        editingUser: user,

        editDialogVisible: true,

        editForm: {
          name: user.name,

          username: user.username,

          email: user.email,

          role: user.role,
        },
      });
    },

    closeEditDialog: () => {
      if (get().editSaving) {
        return;
      }

      set({
        editingUser: null,

        editDialogVisible: false,

        editForm: {
          ...initialEditForm,
        },
      });
    },

    setEditForm: (form) => {
      set({
        editForm: form,
      });
    },

    updateUser: async () => {
      const {
        editingUser,
        editForm,
        editSaving,
      } = get();

      if (!editingUser || editSaving) {
        return null;
      }

      if (!editForm.name.trim()) {
        throw new Error(
          "Name is required.",
        );
      }

      if (!editForm.username.trim()) {
        throw new Error(
          "Username is required.",
        );
      }

      if (!editForm.email.trim()) {
        throw new Error(
          "Email is required.",
        );
      }

      if (!editForm.role) {
        throw new Error(
          "Please select a role.",
        );
      }

      set({
        editSaving: true,
      });

      try {
        const updatedUser =
          await UserService.updateUser(
            editingUser.id,
            {
              name:
                editForm.name.trim(),

              username:
                editForm.username.trim(),

              email:
                editForm.email.trim(),

              role:
                editForm.role,
            },
          );

        set((state) => ({
          users:
            state.users.map(
              (user) =>
                user.id ===
                editingUser.id
                  ? {
                      ...user,
                      ...updatedUser,
                    }
                  : user,
            ),

          editingUser: null,

          editDialogVisible: false,

          editForm: {
            ...initialEditForm,
          },
        }));

        return updatedUser;
      } finally {
        set({
          editSaving: false,
        });
      }
    },

       // LOAD ROLE PERMISSIONS
   
    loadPermissions: async (user) => {
      set({
        permissionLoading: true,
      });

      try {
        const response =
          await fetch(
            `/api/users/${user.id}/permissions`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

        const data =
          await response.json();

        console.log(
          "=================================",
        );
        console.log(
          "ROLE PERMISSION API RESPONSE",
        );
        console.log(
          "User:",
          user,
        );
        console.log(
          "Response:",
          data,
        );
        console.log(
          "Role:",
          data?.role,
        );
        console.log(
          "User Role:",
          data?.user?.role,
        );
        console.log(
          "Role Permissions:",
          data?.rolePermissions,
        );
        console.log(
          "=================================",
        );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to load role permissions.",
          );
        }

        const roleName =
          getApiRoleName(
            data,
            user.role,
          );

        const normalized =
          getApiRolePermissions(
            data,
          );
        set((state) => ({
          permissionUser:
            state.permissionUser
              ? {
                  ...state.permissionUser,

                  role: roleName,
                }
              : {
                  ...user,

                  role: roleName,
                },

          rolePermissions:
            normalized,

          permissionLoading: false,
        }));
      } catch (error) {
        set({
          permissionLoading: false,
        });

        console.error(
          "LOAD ROLE PERMISSIONS ERROR:",
          error,
        );

        throw error;
      }
    },

    openPermissionDialog:
      async (user) => {
        set({
          permissionUser: user,

          rolePermissions:
            normalizePermissions([]),

          permissionDialogVisible:
            true,

          permissionLoading:
            true,

          permissionSaving:
            false,
        });

        try {
          await get().loadPermissions(
            user,
          );
        } catch (error) {
          console.error(
            "OPEN PERMISSION DIALOG ERROR:",
            error,
          );
          set({
            permissionLoading:
              false,
          });
        }
      },

       // CLOSE ROLE PERMISSION DIALOG
   
    closePermissionDialog: () => {
      const {
        permissionLoading,
        permissionSaving,
      } = get();

      if (
        permissionLoading ||
        permissionSaving
      ) {
        return;
      }

      set({
        permissionDialogVisible:
          false,

        permissionUser:
          null,

        rolePermissions: [],

        permissionLoading:
          false,

        permissionSaving:
          false,
      });
    },

       // CHANGE ONE ROLE PERMISSION
   
    setPermission: (
      resource,
      key,
      checked,
    ) => {
      set((state) => ({
        rolePermissions:
          state.rolePermissions.map(
            (permission) =>
              permission.resource ===
              resource
                ? {
                    ...permission,

                    [key]: checked,
                  }
                : permission,
          ),
      }));
    },

       // SAVE ROLE PERMISSIONS
   
    savePermissions:
      async () => {
        const {
          permissionUser,
          rolePermissions,
          permissionSaving,
          permissionLoading,
        } = get();

        if (
          !permissionUser ||
          permissionSaving ||
          permissionLoading
        ) {
          return false;
        }

        const normalized =
          normalizePermissions(
            rolePermissions,
          );

        set({
          permissionSaving: true,
        });

        try {
          const response =
            await fetch(
              `/api/users/${permissionUser.id}/permissions`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  rolePermissions:
                    normalized,
                }),
              },
            );

          const data =
            await response.json();

          console.log(
            "=================================",
          );
          console.log(
            "SAVE ROLE PERMISSIONS",
          );
          console.log(
            "Response:",
            data,
          );
          console.log(
            "=================================",
          );

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                "Failed to save role permissions.",
            );
          }

          const saved =
            getApiRolePermissions(
              data,
            );

          set({
            rolePermissions:
              saved,
          });

          return true;
        } catch (error) {
          console.error(
            "SAVE ROLE PERMISSIONS ERROR:",
            error,
          );

          return false;
        } finally {
          set({
            permissionSaving:
              false,
          });
        }
      },

       // DELETE USER
   
    deleteUser: async (user) => {
      const {
        deletingId,
        approvingId,
      } = get();

      if (
        deletingId !== null ||
        approvingId !== null
      ) {
        return false;
      }

      set({
        deletingId: user.id,
      });

      try {
        await UserService.deleteUser(
          user.id,
        );

        set((state) => ({
          users:
            state.users.filter(
              (item) =>
                item.id !== user.id,
            ),

          selectedUsers:
            state.selectedUsers.filter(
              (item) =>
                item.id !== user.id,
            ),
        }));

        return true;
      } finally {
        set({
          deletingId: null,
        });
      }
    },

       // APPROVAL
   
    updateApproval: async (
      user,
      action,
    ) => {
      const {
        approvingId,
        deletingId,
      } = get();

      if (
        approvingId !== null ||
        deletingId !== null ||
        user.status !== "PENDING"
      ) {
        return false;
      }

      set({
        approvingId: user.id,
      });

      try {
        await UserService.updateApproval(
          user.id,
          action,
        );

        const newStatus =
          action === "APPROVE"
            ? "APPROVED"
            : "REJECT";

        set((state) => ({
          users:
            state.users.map(
              (item) =>
                item.id === user.id
                  ? {
                      ...item,

                      status:
                        newStatus,
                    }
                  : item,
            ),
        }));

        return true;
      } finally {
        set({
          approvingId: null,
        });
      }
    },

       // RESET
   
    reset: () => {
      set({
        users: [],

        keyword: "",

        selectedUsers: [],

        first: 0,

        addDialogVisible:
          false,

        newUser: {
          ...initialNewUser,
        },

        addingUser: false,

        editingUser:
          null,

        editDialogVisible:
          false,

        editForm: {
          ...initialEditForm,
        },

        editSaving: false,

        rolePermissions: [],

        permissionUser:
          null,

        permissionDialogVisible:
          false,

        permissionLoading:
          false,

        permissionSaving:
          false,

        deletingId:
          null,

        approvingId:
          null,
      });
    },
  }));

