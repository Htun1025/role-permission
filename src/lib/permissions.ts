
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Permission Resource

export type PermissionResource =
  | "USER"
  | "REQUEST"
  | "ROLE"
  | "PERMISSION";

// Permission Keys

export type PermissionKey =
  | "canView"
  | "canCreate"
  | "canEdit"
  | "canDelete"
  | "canApprove"
  | "canReject";

// Permission Item

export type PermissionItem = {
  resource: PermissionResource;

  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
};

// All Resources

const ALL_RESOURCES: PermissionResource[] = [
  "USER",
  "REQUEST",
  "ROLE",
  "PERMISSION",
];

// Full Permission

function fullPermission(
  resource: PermissionResource,
): PermissionItem {
  return {
    resource,

    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canReject: true,
  };
}

// Empty Permission

function emptyPermission(
  resource: PermissionResource,
): PermissionItem {
  return {
    resource,

    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
  };
}

// Get Current User
//
// IMPORTANT:
// User permissions are inherited from RolePermission.
// UserPermission is NOT used here.

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    include: {
      role: {
        include: {
          rolePermissions: true,
        },
      },
    },
  });

  return user;
}

// Get Current User Permissions
//
// Permission Source:
//
// User
//   ↓
// RoleDefinition
//   ↓
// RolePermission
//   ↓
// Effective Permission
//
// There is NO UserPermission merge.
//
// Every user with the same role receives the same permissions.

export async function getCurrentPermissions(): Promise<
  PermissionItem[]
> {
  const user = await getCurrentUser();

  // ----------------------------------------------------------
  // No authenticated user
  // ----------------------------------------------------------

  if (!user) {
    return ALL_RESOURCES.map(emptyPermission);
  }

  // ----------------------------------------------------------
  // ADMIN
  //
  // ADMIN has full access.
  // ----------------------------------------------------------

  if (user.role?.name === "ADMIN") {
    return ALL_RESOURCES.map(fullPermission);
  }

  // ----------------------------------------------------------
  // Role Permissions
  // ----------------------------------------------------------

  const rolePermissions =
    user.role?.rolePermissions ?? [];

  // ----------------------------------------------------------
  // Build effective permissions
  // ----------------------------------------------------------

  return ALL_RESOURCES.map((resource) => {
    const permission = rolePermissions.find(
      (item) => item.resource === resource,
    );

    return {
      resource,

      canView:
        permission?.canView === true,

      canCreate:
        permission?.canCreate === true,

      canEdit:
        permission?.canEdit === true,

      canDelete:
        permission?.canDelete === true,

      canApprove:
        permission?.canApprove === true,

      canReject:
        permission?.canReject === true,
    };
  });
}

// Has Permission

export async function hasPermission(
  resource: PermissionResource,
  key: PermissionKey,
): Promise<boolean> {
  const permissions =
    await getCurrentPermissions();

  const permission = permissions.find(
    (item) => item.resource === resource,
  );

  return permission?.[key] === true;
}

// Can View

export async function canView(
  resource: PermissionResource,
): Promise<boolean> {
  return hasPermission(
    resource,
    "canView",
  );
}

// Can Create

export async function canCreate(
  resource: PermissionResource,
): Promise<boolean> {
  return hasPermission(
    resource,
    "canCreate",
  );
}

// Can Edit

export async function canEdit(
  resource: PermissionResource,
): Promise<boolean> {
  return hasPermission(
    resource,
    "canEdit",
  );
}

// Can Delete

export async function canDelete(
  resource: PermissionResource,
): Promise<boolean> {
  return hasPermission(
    resource,
    "canDelete",
  );
}

// Can Approve

export async function canApprove(
  resource: PermissionResource,
): Promise<boolean> {
  return hasPermission(
    resource,
    "canApprove",
  );
}

// Can Reject

export async function canReject(
  resource: PermissionResource,
): Promise<boolean> {
  return hasPermission(
    resource,
    "canReject",
  );
}
