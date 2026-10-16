import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    role: string;
  }>;
};

// GET /api/roles/[role]

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { role } = await context.params;

    const roleName = decodeURIComponent(role).trim();

    const roleData = await prisma.roleDefinition.findUnique({
      where: {
        name: roleName,
      },
      include: {
        rolePermissions: {
          orderBy: {
            resource: "asc",
          },
        },
      },
    });

    if (!roleData) {
      return NextResponse.json(
        {
          error: "Role not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      role: {
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
      },

      permissions: roleData.rolePermissions,
    });
  } catch (error) {
    console.error(
      "GET /api/roles/[role] error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load role",
      },
      {
        status: 500,
      },
    );
  }
}

// PUT /api/roles/[role]

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { role } = await context.params;

    const oldRoleName = decodeURIComponent(role).trim();

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim().toUpperCase()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          error: "Role name is required",
        },
        {
          status: 400,
        },
      );
    }
    
    // Find the role being edited
    
    const existingRole =
      await prisma.roleDefinition.findUnique({
        where: {
          name: oldRoleName,
        },
      });

    if (!existingRole) {
      return NextResponse.json(
        {
          error: "Role not found",
        },
        {
          status: 404,
        },
      );
    }
   
    // Prevent duplicate role names
    
    const duplicateRole =
      await prisma.roleDefinition.findFirst({
        where: {
          name,
          NOT: {
            id: existingRole.id,
          },
        },
      });

    if (duplicateRole) {
      return NextResponse.json(
        {
          error: "Role name already exists",
        },
        {
          status: 409,
        },
      );
    }

    
    // Update role
    

    const updatedRole =
      await prisma.roleDefinition.update({
        where: {
          id: existingRole.id,
        },

        data: {
          name,
          description,
        },

        include: {
          rolePermissions: {
            orderBy: {
              resource: "asc",
            },
          },
        },
      });

    
    // Return the ACTUAL updated role
    

    return NextResponse.json({
      success: true,

      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
      },

      permissions: updatedRole.rolePermissions,
    });
  } catch (error) {
    console.error(
      "PUT /api/roles/[role] error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to update role",
      },
      {
        status: 500,
      },
    );
  }
}


// DELETE /api/roles/[role]


export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { role } = await context.params;

    const roleName = decodeURIComponent(role).trim();

    const existingRole =
      await prisma.roleDefinition.findUnique({
        where: {
          name: roleName,
        },

        include: {
          users: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!existingRole) {
      return NextResponse.json(
        {
          error: "Role not found",
        },
        {
          status: 404,
        },
      );
    }

    
    // ADMIN cannot be deleted
    

    if (existingRole.name === "ADMIN") {
      return NextResponse.json(
        {
          error: "ADMIN role cannot be deleted",
        },
        {
          status: 403,
        },
      );
    }

    
    // Cannot delete role assigned to users
    

    if (existingRole.users.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete role because it is assigned to users",
        },
        {
          status: 409,
        },
      );
    }

    
    // Delete role
    

    await prisma.roleDefinition.delete({
      where: {
        id: existingRole.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/roles/[role] error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to delete role",
      },
      {
        status: 500,
      },
    );
  }
}