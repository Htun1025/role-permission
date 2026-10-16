import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PermissionsClient from "./Permission";
import Sidebar from "@/components/sidebar";

import { getCurrentPermissions } from "@/lib/permissions";
import "../globals.css";

export default async function PermissionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,
      name: true,

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
    redirect("/login");
  }
  const isAdmin = user.role?.name === "ADMIN";

  const permissions = await getCurrentPermissions();

  const permissionAccess = permissions.find(
    (permission) => permission.resource === "PERMISSION",
  );

  const access = {
    canView: isAdmin || permissionAccess?.canView === true,

    canCreate: isAdmin || permissionAccess?.canCreate === true,

    canEdit: isAdmin || permissionAccess?.canEdit === true,

    canDelete: isAdmin || permissionAccess?.canDelete === true,
  };

  if (!access.canView) {
    redirect("/dashboard");
  }

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      path: "/dashboard",
    },

    ...(isAdmin ||
    permissions.some(
      (permission) =>
        permission.resource === "USER" && permission.canView === true,
    )
      ? [
          {
            label: "Users",
            icon: "pi pi-users",
            path: "/users",
          },
        ]
      : []),

    ...(isAdmin ||
    permissions.some(
      (permission) =>
        permission.resource === "ROLE" && permission.canView === true,
    )
      ? [
          {
            label: "Roles",
            icon: "pi pi-shield",
            path: "/roles",
          },
        ]
      : []),

    ...(isAdmin ||
    permissions.some(
      (permission) =>
        permission.resource === "PERMISSION" && permission.canView === true,
    )
      ? [
          {
            label: "Permissions",
            icon: "pi pi-lock",
            path: "/permissions",
          },
        ]
      : []),
  ];

  return (
    <Sidebar
      menuItems={menuItems}
      name={user.name ?? "User"}
      role={user.role?.name ?? "USER"}
    >
      <PermissionsClient access={access} />
    </Sidebar>
  );
}
