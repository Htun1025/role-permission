import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import Sidebar from "@/components/sidebar";
import RolesClient from "../roles/Role";

import { getCurrentPermissions, hasPermission } from "@/lib/permissions";

export default async function RolesPage() {
  // Session

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Current User

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

  // Effective Permissions

  //
  // Role Permission
  //       +
  // Extra User Permission
  //       ↓
  // Effective Permission
  //

  const permissions = await getCurrentPermissions();

  // ROLE Access

  const access = {
    canView: await hasPermission("ROLE", "canView"),

    canCreate: await hasPermission("ROLE", "canCreate"),

    canEdit: await hasPermission("ROLE", "canEdit"),

    canDelete: await hasPermission("ROLE", "canDelete"),
  };

  // No ROLE View Permission

  if (!access.canView) {
    redirect("/dashboard");
  }

  // Sidebar

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      path: "/dashboard",
    },

    ...(permissions.some(
      (permission) => permission.resource === "USER" && permission.canView,
    )
      ? [
          {
            label: "Users",
            icon: "pi pi-users",
            path: "/users",
          },
        ]
      : []),

    ...(permissions.some(
      (permission) => permission.resource === "ROLE" && permission.canView,
    )
      ? [
          {
            label: "Roles",
            icon: "pi pi-shield",
            path: "/roles",
          },
        ]
      : []),

    ...(permissions.some(
      (permission) =>
        permission.resource === "PERMISSION" && permission.canView,
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

  // Render

  return (
    <Sidebar
      menuItems={menuItems}
      name={user.name ?? "User"}
      role={user.role?.name ?? ""}
    >
      <RolesClient access={access} />
    </Sidebar>
  );
}
