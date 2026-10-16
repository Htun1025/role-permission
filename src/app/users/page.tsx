import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import SidebarMenu from "@/components/sidebar";
import UsersClient from "./User";

import {
  getCurrentPermissions,
  type PermissionResource,
} from "@/lib/permissions";

import type { UserAccess, UserRow } from "@/types";

import "../globals.css";

export default async function UsersPage() {
  // Authentication

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
      username: true,
      email: true,

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

  const currentUserRole = user.role?.name ?? "";

  // Role Permissions

  const permissions = await getCurrentPermissions();

  // Check Resource View Access

  const canView = (resource: PermissionResource) => {
    return permissions.some(
      (permission) =>
        permission.resource === resource && permission.canView === true,
    );
  };

  // USER PAGE ACCESS
  //
  // If USER canView = false,
  // do not show Access Denied.
  // Redirect back to Dashboard.

  if (!canView("USER")) {
    redirect("/dashboard");
  }

  // USER Permission

  const userPermission = permissions.find(
    (permission) => permission.resource === "USER",
  );

  const access: UserAccess = {
    canView: userPermission?.canView ?? false,
    canCreate: userPermission?.canCreate ?? false,
    canEdit: userPermission?.canEdit ?? false,
    canDelete: userPermission?.canDelete ?? false,
    canApprove: userPermission?.canApprove ?? false,
    canReject: userPermission?.canReject ?? false,
  };

  // Sidebar Menu

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      path: "/dashboard",
    },

    // USER
    ...(canView("USER")
      ? [
          {
            label: "Users",
            icon: "pi pi-users",
            path: "/users",
          },
        ]
      : []),

    // REQUEST
    ...(canView("REQUEST")
      ? [
          {
            label: "Requests",
            icon: "pi pi-file",
            path: "/requests",
          },
        ]
      : []),

    // ROLE
    ...(canView("ROLE")
      ? [
          {
            label: "Roles",
            icon: "pi pi-id-card",
            path: "/roles",
          },
        ]
      : []),

    // PERMISSION
    ...(canView("PERMISSION")
      ? [
          {
            label: "Permissions",
            icon: "pi pi-lock",
            path: "/permissions",
          },
        ]
      : []),
  ];

  // Load Users

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      role: true,
    },
  });

  // Format Users

  const formattedUsers: UserRow[] = users.map((item) => ({
    id: item.id,
    name: item.name,
    username: item.username,
    email: item.email,
    role: item.role?.name ?? null,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  }));

  // Render

  return (
    <SidebarMenu
      menuItems={menuItems}
      name={user.name ?? ""}
      role={currentUserRole}
    >
      <div className="users-page">
        <div className="users-page-header">
          <div className="users-page-header-icon">
            <i className="pi pi-users" />
          </div>
        </div>

        <div className="users-page-card">
          <UsersClient
            users={formattedUsers}
            currentUserRole={currentUserRole}
            access={access}
          />
        </div>
      </div>
    </SidebarMenu>
  );
}
