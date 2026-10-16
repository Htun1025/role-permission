
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (user?.role?.name !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const roles =
      await prisma.roleDefinition.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              users: true,
              rolePermissions: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error(
      "GET /api/roles error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load roles.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST
 * Create a new dynamic role
 */
export async function POST(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (user?.role?.name !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const name = String(
      body.name ?? "",
    )
      .trim()
      .toUpperCase();

    const description = String(
      body.description ?? "",
    ).trim();

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Role name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          message:
            "Role name must not exceed 100 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (!/^[A-Z0-9_ ]+$/.test(name)) {
      return NextResponse.json(
        {
          message:
            "Role name can contain only letters, numbers, spaces and underscores.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.roleDefinition.findUnique({
        where: {
          name,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          message:
            "This role already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const role =
      await prisma.roleDefinition.create({
        data: {
          name,
          description,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        data: role,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/roles error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create role.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * DELETE
 * Delete dynamic roles
 */
export async function DELETE(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (user?.role?.name !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const names: string[] =
      Array.isArray(body.names)
        ? body.names
            .map((name: unknown) =>
              String(name)
                .trim()
                .toUpperCase(),
            )
            .filter(
              (name: string) =>
                name.length > 0,
            )
        : [];

    if (names.length === 0) {
      return NextResponse.json(
        {
          message:
            "No roles selected.",
        },
        {
          status: 400,
        },
      );
    }

    // ADMIN role cannot be deleted
    if (names.includes("ADMIN")) {
      return NextResponse.json(
        {
          message:
            "The ADMIN role cannot be deleted.",
        },
        {
          status: 400,
        },
      );
    }

    const roles =
      await prisma.roleDefinition.findMany({
        where: {
          name: {
            in: names,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (roles.length !== names.length) {
      return NextResponse.json(
        {
          message:
            "One or more roles were not found.",
        },
        {
          status: 404,
        },
      );
    }

    const roleIds = roles.map(
      (role) => role.id,
    );

    const assignedUsers =
      await prisma.user.count({
        where: {
          roleId: {
            in: roleIds,
          },
        },
      });

    if (assignedUsers > 0) {
      return NextResponse.json(
        {
          message:
            "One or more selected roles are currently assigned to users. Reassign those users before deleting the role.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.roleDefinition.deleteMany({
      where: {
        id: {
          in: roleIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Roles deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/roles error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete roles.",
      },
      {
        status: 500,
      },
    );
  }
}