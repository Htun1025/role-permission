import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
params: Promise<{
role: string;
}>;
};

type PermissionInput = {
resource: string;
canView?: boolean;
canCreate?: boolean;
canEdit?: boolean;
canDelete?: boolean;
canApprove?: boolean;
canReject?: boolean;
};

const VALID_RESOURCES = [
"USER",
"REQUEST",
"ROLE",
"PERMISSION",
] as const;

function normalizePermission(
permission: PermissionInput,
) {
return {
resource: permission.resource,
canView: Boolean(permission.canView),
canCreate: Boolean(permission.canCreate),
canEdit: Boolean(permission.canEdit),
canDelete: Boolean(permission.canDelete),
canApprove: Boolean(permission.canApprove),
canReject: Boolean(permission.canReject),
};
}

// GET /api/roles/[role]/permissions
export async function GET(
_request: Request,
context: RouteContext,
) {
try {
const { role } = await context.params;


const roleData =
  await prisma.roleDefinition.findUnique({
    where: {
      name: role,
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

const permissions =
  await prisma.rolePermission.findMany({
    where: {
      roleId: roleData.id,
    },
    orderBy: {
      resource: "asc",
    },
  });

return NextResponse.json({
  role: {
    id: roleData.id,
    name: roleData.name,
    description: roleData.description,
  },
  permissions,
});


} catch (error) {
console.error(
"GET /api/roles/[role]/permissions error:",
error,
);


return NextResponse.json(
  {
    error: "Failed to load role permissions",
  },
  {
    status: 500,
  },
);


}
}

// PUT /api/roles/[role]/permissions
export async function PUT(
request: Request,
context: RouteContext,
) {
try {
const { role } = await context.params;


const body = await request.json();

const inputPermissions =
  Array.isArray(body?.permissions)
    ? body.permissions
    : [];

const roleData =
  await prisma.roleDefinition.findUnique({
    where: {
      name: role,
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

const permissions: PermissionInput[] =
  inputPermissions.filter(
    (permission: unknown): permission is PermissionInput =>
      typeof permission === "object" &&
      permission !== null &&
      "resource" in permission &&
      typeof (
        permission as PermissionInput
      ).resource === "string",
  );

for (const permission of permissions) {
  if (
    !VALID_RESOURCES.includes(
      permission.resource as (typeof VALID_RESOURCES)[number],
    )
  ) {
    return NextResponse.json(
      {
        error: `Invalid resource: ${permission.resource}`,
      },
      {
        status: 400,
      },
    );
  }
}

await prisma.$transaction(
  permissions.map((permission) => {
    const normalized =
      normalizePermission(permission);

    return prisma.rolePermission.upsert({
      where: {
        roleId_resource: {
          roleId: roleData.id,
          resource:
            normalized.resource as
              | "USER"
              | "REQUEST"
              | "ROLE"
              | "PERMISSION",
        },
      },
      update: {
        canView: normalized.canView,
        canCreate: normalized.canCreate,
        canEdit: normalized.canEdit,
        canDelete: normalized.canDelete,
        canApprove: normalized.canApprove,
        canReject: normalized.canReject,
      },
      create: {
        roleId: roleData.id,
        resource:
          normalized.resource as
            | "USER"
            | "REQUEST"
            | "ROLE"
            | "PERMISSION",
        canView: normalized.canView,
        canCreate: normalized.canCreate,
        canEdit: normalized.canEdit,
        canDelete: normalized.canDelete,
        canApprove: normalized.canApprove,
        canReject: normalized.canReject,
      },
    });
  }),
);

const updatedPermissions =
  await prisma.rolePermission.findMany({
    where: {
      roleId: roleData.id,
    },
    orderBy: {
      resource: "asc",
    },
  });

return NextResponse.json({
  success: true,
  role: {
    id: roleData.id,
    name: roleData.name,
    description: roleData.description,
  },
  permissions: updatedPermissions,
});


} catch (error) {
console.error(
"PUT /api/roles/[role]/permissions error:",
error,
);


return NextResponse.json(
  {
    error: "Failed to save role permissions",
  },
  {
    status: 500,
  },
);


}
}
