import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// Update Schema
// ============================================================

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100),

  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),

  email: z.string().trim().email().max(255),

  role: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9_ ]+$/),
});

type Context = {
  params: Promise<{ id: string }>;
};

// ============================================================
// Require USER Edit Permission
// ============================================================

async function requireUserEditPermission() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,

      role: {
        select: {
          id: true,
          name: true,

          rolePermissions: {
            where: {
              resource: "USER",
            },

            select: {
              canEdit: true,
            },
          },
        },
      },

      userPermissions: {
        where: {
          resource: "USER",
        },

        select: {
          canEdit: true,
        },
      },
    },
  });

  if (!currentUser) {
    return null;
  }

  // ==========================================================
  // ADMIN always has permission
  // ==========================================================

  if (currentUser.role?.name === "ADMIN") {
    return currentUser;
  }

  // ==========================================================
  // Role Permission
  // ==========================================================

  const roleCanEdit =
    currentUser.role?.rolePermissions.some(
      (permission) => permission.canEdit,
    ) ?? false;

  // ==========================================================
  // User-specific Permission
  // ==========================================================

  const userCanEdit =
    currentUser.userPermissions.some(
      (permission) => permission.canEdit,
    ) ?? false;

  // ==========================================================
  // Either role OR user permission is enough
  // ==========================================================

  if (!roleCanEdit && !userCanEdit) {
    return null;
  }

  return currentUser;
}

// ============================================================
// PATCH - Update User
// ============================================================

export async function PATCH(
  request: Request,
  { params }: Context,
) {
  try {
    // ========================================================
    // Check USER.canEdit
    // ========================================================

    const currentUser = await requireUserEditPermission();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "You do not have permission to edit users",
        },
        {
          status: 403,
        },
      );
    }

    // ========================================================
    // Get User ID
    // ========================================================

    const { id } = await params;

    // ========================================================
    // Read Request Body
    // ========================================================

    const body = await request.json();

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid user information",
          errors: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const {
      name,
      username,
      email,
      role,
    } = parsed.data;

    // ========================================================
    // Find Target User
    // ========================================================

    const targetUser = await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        roleId: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // ========================================================
    // Find New Role
    // ========================================================

    const roleDefinition =
      await prisma.roleDefinition.findUnique({
        where: {
          name: role,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!roleDefinition) {
      return NextResponse.json(
        {
          message: `Role "${role}" not found`,
        },
        {
          status: 400,
        },
      );
    }

    // ========================================================
    // Check Duplicate Username / Email
    // ========================================================

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username,
          },
          {
            email,
          },
        ],

        NOT: {
          id,
        },
      },

      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (existingUser) {
      const duplicateField =
        existingUser.username === username
          ? "Username"
          : "Email";

      return NextResponse.json(
        {
          message: `${duplicateField} already exists`,
        },
        {
          status: 409,
        },
      );
    }

    // ========================================================
    // Protect ADMIN User
    //
    // Existing ADMIN cannot be changed to another role.
    // ========================================================

    if (
      targetUser.role?.name === "ADMIN" &&
      roleDefinition.name !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "ADMIN role cannot be changed",
        },
        {
          status: 403,
        },
      );
    }

    // ========================================================
    // Protect ADMIN role
    //
    // Non-ADMIN users should not be able to assign ADMIN.
    // ========================================================

    if (
      currentUser.role?.name !== "ADMIN" &&
      roleDefinition.name === "ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "Only ADMIN can assign ADMIN role",
        },
        {
          status: 403,
        },
      );
    }

    // ========================================================
    // Update User
    // ========================================================

    const user = await prisma.user.update({
      where: {
        id,
      },

      data: {
        name,
        username,
        email,
        roleId: roleDefinition.id,
      },

      select: {
        id: true,
        name: true,
        username: true,
        email: true,

        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },

        createdAt: true,
      },
    });

    // ========================================================
    // Success
    // ========================================================

    return NextResponse.json({
      message: "User updated successfully",

      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,

        role: user.role?.name ?? null,
        roleId: user.role?.id ?? null,

        roleDescription:
          user.role?.description ?? "",

        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error,
    );

    // ========================================================
    // Prisma Duplicate Error
    // ========================================================

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "Username or email already exists",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Server error",
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================
// DELETE - Delete User
// ============================================================
//
// DELETE remains ADMIN-only.
// USER.canDelete can be enabled later if you want.
// ============================================================

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,

      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!currentUser) {
    return null;
  }

  if (currentUser.role?.name !== "ADMIN") {
    return null;
  }

  return currentUser;
}

export async function DELETE(
  _: Request,
  { params }: Context,
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          message: "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    // ========================================================
    // Cannot delete yourself
    // ========================================================

    if (id === admin.id) {
      return NextResponse.json(
        {
          message:
            "You cannot delete your own account",
        },
        {
          status: 400,
        },
      );
    }

    // ========================================================
    // Find Target User
    // ========================================================

    const targetUser = await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // ========================================================
    // Protect ADMIN
    // ========================================================

    if (targetUser.role?.name === "ADMIN") {
      return NextResponse.json(
        {
          message:
            "ADMIN user cannot be deleted",
        },
        {
          status: 403,
        },
      );
    }

    // ========================================================
    // Delete
    // ========================================================

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete user error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Could not delete user. Check related records.",
      },
      {
        status: 500,
      },
    );
  }
}