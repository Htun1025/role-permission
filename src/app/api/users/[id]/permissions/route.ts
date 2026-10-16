
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import {
  PermissionResource as PrismaPermissionResource,
} from "../../../../../../generated/prisma";

import type {
  PermissionResource,
} from "../../../../../../generated/prisma";

// =========================================================
// RESOURCES
// =========================================================

const resources: PermissionResource[] = [
  PrismaPermissionResource.USER,
  PrismaPermissionResource.REQUEST,
  PrismaPermissionResource.ROLE,
  PrismaPermissionResource.PERMISSION,
];

// =========================================================
// PERMISSION KEYS
// =========================================================

const permissionKeys = [
  "canView",
  "canCreate",
  "canEdit",
  "canDelete",
  "canApprove",
  "canReject",
] as const;

type PermissionKey =
  (typeof permissionKeys)[number];

// =========================================================
// NORMALIZE PERMISSIONS
// =========================================================

function normalizePermissions(
  input: unknown,
) {
  const source =
    Array.isArray(input)
      ? input
      : [];

  return resources.map(
    (resource) => {
      const found =
        source.find(
          (item: any) =>
            item?.resource === resource,
        ) as any;

      return {
        resource,

        canView:
          found?.canView === true,

        canCreate:
          found?.canCreate === true,

        canEdit:
          found?.canEdit === true,

        canDelete:
          found?.canDelete === true,

        canApprove:
          found?.canApprove === true,

        canReject:
          found?.canReject === true,
      };
    },
  );
}

// =========================================================
// CHECK ADMIN
// =========================================================

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const currentUser =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        id: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (
    !currentUser ||
    currentUser.role.name !== "ADMIN"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Admin permission required.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    ok: true as const,
    currentUser,
  };
}

// =========================================================
// GET
// =========================================================

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    // -----------------------------------------------------
    // AUTH
    // -----------------------------------------------------

    const authResult =
      await requireAdmin();

    if (!authResult.ok) {
      return authResult.response;
    }

    // -----------------------------------------------------
    // PARAMS
    // -----------------------------------------------------

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message:
            "User ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    // -----------------------------------------------------
    // IMPORTANT
    //
    // Get the clicked USER by ID.
    //
    // Then get:
    //
    // User.roleId
    //       ↓
    // RoleDefinition
    //       ↓
    // RolePermission
    // -----------------------------------------------------

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          name: true,

          username: true,

          email: true,

          roleId: true,

          role: {
            select: {
              id: true,

              name: true,

              description: true,

              rolePermissions: {
                orderBy: {
                  resource: "asc",
                },

                select: {
                  id: true,

                  resource: true,

                  canView: true,

                  canCreate: true,

                  canEdit: true,

                  canDelete: true,

                  canApprove: true,

                  canReject: true,
                },
              },
            },
          },
        },
      });

    // -----------------------------------------------------
    // USER NOT FOUND
    // -----------------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          message:
            "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    // -----------------------------------------------------
    // ROLE
    // -----------------------------------------------------

    const role = user.role;

    // -----------------------------------------------------
    // ROLE PERMISSIONS
    // -----------------------------------------------------

    const rolePermissions =
      normalizePermissions(
        role.rolePermissions,
      );

    // -----------------------------------------------------
    // DEBUG
    // -----------------------------------------------------

    console.log(
      "========================================",
    );

    console.log(
      "USER ROLE PERMISSION GET",
    );

    console.log(
      "Clicked User ID:",
      user.id,
    );

    console.log(
      "Clicked Username:",
      user.username,
    );

    console.log(
      "User roleId:",
      user.roleId,
    );

    console.log(
      "Role ID:",
      role.id,
    );

    console.log(
      "Role Name:",
      role.name,
    );

    console.log(
      "Role Permissions:",
      rolePermissions,
    );

    console.log(
      "========================================",
    );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return NextResponse.json({
      user: {
        id: user.id,

        name: user.name,

        username: user.username,

        email: user.email,

        roleId: user.roleId,

        role: role.name,

        roleName: role.name,
      },

      role: {
        id: role.id,

        name: role.name,

        description:
          role.description,
      },

      rolePermissions,

      // Keep this for compatibility
      permissions:
        rolePermissions,
    });
  } catch (error) {
    console.error(
      "GET USER ROLE PERMISSIONS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to load role permissions.",
      },
      {
        status: 500,
      },
    );
  }
}

// =========================================================
// PUT
// =========================================================

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    // -----------------------------------------------------
    // AUTH
    // -----------------------------------------------------

    const authResult =
      await requireAdmin();

    if (!authResult.ok) {
      return authResult.response;
    }

    // -----------------------------------------------------
    // PARAMS
    // -----------------------------------------------------

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message:
            "User ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    // -----------------------------------------------------
    // FIND USER + ROLE
    // -----------------------------------------------------

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          username: true,

          roleId: true,

          role: {
            select: {
              id: true,

              name: true,

              description: true,
            },
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    // -----------------------------------------------------
    // BODY
    // -----------------------------------------------------

    const body =
      await request.json();

    const input =
      body?.rolePermissions ??
      body?.permissions;

    if (!Array.isArray(input)) {
      return NextResponse.json(
        {
          message:
            "rolePermissions must be an array.",
        },
        {
          status: 400,
        },
      );
    }

    // -----------------------------------------------------
    // NORMALIZE
    // -----------------------------------------------------

    const normalized =
      normalizePermissions(input);

    // -----------------------------------------------------
    // UPDATE ROLE PERMISSIONS
    //
    // IMPORTANT:
    //
    // We update the USER'S ROLE.
    //
    // NOT the UserPermission table.
    // -----------------------------------------------------

    await prisma.$transaction(
      normalized.map(
        (permission) =>
          prisma.rolePermission.upsert({
            where: {
              roleId_resource: {
                roleId:
                  user.roleId,

                resource:
                  permission.resource,
              },
            },

            update: {
              canView:
                permission.canView,

              canCreate:
                permission.canCreate,

              canEdit:
                permission.canEdit,

              canDelete:
                permission.canDelete,

              canApprove:
                permission.canApprove,

              canReject:
                permission.canReject,
            },

            create: {
              roleId:
                user.roleId,

              resource:
                permission.resource,

              canView:
                permission.canView,

              canCreate:
                permission.canCreate,

              canEdit:
                permission.canEdit,

              canDelete:
                permission.canDelete,

              canApprove:
                permission.canApprove,

              canReject:
                permission.canReject,
            },
          }),
      ),
    );

    // -----------------------------------------------------
    // LOAD UPDATED ROLE
    // -----------------------------------------------------

    const updatedRole =
      await prisma.roleDefinition.findUnique({
        where: {
          id: user.roleId,
        },

        select: {
          id: true,

          name: true,

          description: true,

          rolePermissions: {
            orderBy: {
              resource: "asc",
            },

            select: {
              id: true,

              resource: true,

              canView: true,

              canCreate: true,

              canEdit: true,

              canDelete: true,

              canApprove: true,

              canReject: true,
            },
          },
        },
      });

    if (!updatedRole) {
      return NextResponse.json(
        {
          message:
            "Role not found.",
        },
        {
          status: 404,
        },
      );
    }

    const updatedPermissions =
      normalizePermissions(
        updatedRole.rolePermissions,
      );

    // -----------------------------------------------------
    // DEBUG
    // -----------------------------------------------------

    console.log(
      "========================================",
    );

    console.log(
      "USER ROLE PERMISSION PUT",
    );

    console.log(
      "User:",
      user.username,
    );

    console.log(
      "Role ID:",
      user.roleId,
    );

    console.log(
      "Role Name:",
      updatedRole.name,
    );

    console.log(
      "Updated Permissions:",
      updatedPermissions,
    );

    console.log(
      "========================================",
    );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return NextResponse.json({
      message:
        "Role permissions updated successfully.",

      user: {
        id: user.id,

        username:
          user.username,

        roleId:
          user.roleId,

        role:
          updatedRole.name,
      },

      role: {
        id:
          updatedRole.id,

        name:
          updatedRole.name,

        description:
          updatedRole.description,
      },

      rolePermissions:
        updatedPermissions,

      permissions:
        updatedPermissions,
    });
  } catch (error) {
    console.error(
      "PUT USER ROLE PERMISSIONS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to update role permissions.",
      },
      {
        status: 500,
      },
    );
  }
}

