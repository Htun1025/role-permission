import type { DefaultSession } from "next-auth";

type PermissionItem = {
  resource:
    | "USER"
    | "REQUEST"
    | "ROLE"
    | "PERMISSION";

  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
};

declare module "next-auth" {
  interface User {
    id: string;

    username: string;

    role: string;

    rolePermissions: PermissionItem[];

    userPermissions: PermissionItem[];
  }

  interface Session {
    user: {
      id: string;

      username: string;

      role: string;

      rolePermissions: PermissionItem[];

      userPermissions: PermissionItem[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;

    role: string;

    rolePermissions: PermissionItem[];

    userPermissions: PermissionItem[];
  }
}

export {};