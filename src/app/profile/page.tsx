import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import ProfileClient from "./Profile";
import Sidebar from "@/components/sidebar";

const resources = ["USER", "REQUEST", "ROLE", "PERMISSION"] as const;

const menuItems = [
  {
    label: "Dashboard",
    icon: "pi pi-home",
    path: "/dashboard",
  },
  {
    label: "Users",
    icon: "pi pi-users",
    path: "/users",
  },
  {
    label: "Roles",
    icon: "pi pi-shield",
    path: "/roles",
  },
  {
    label: "Permissions",
    icon: "pi pi-lock",
    path: "/permissions",
  },
];

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,

      role: {
        select: {
          name: true,

          rolePermissions: {
            orderBy: {
              resource: "asc",
            },
          },
        },
      },

      userPermissions: {
        orderBy: {
          resource: "asc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const role = user.role?.name ?? "USER";
  const isAdmin = role === "ADMIN";

  const rolePermissions = user.role?.rolePermissions ?? [];
  const userPermissions = user.userPermissions ?? [];

  const permissions = resources.map((resource) => {
    const rolePermission = rolePermissions.find(
      (permission) => permission.resource === resource,
    );

    const userPermission = userPermissions.find(
      (permission) => permission.resource === resource,
    );

    return {
      resource,

      canView:
        isAdmin ||
        rolePermission?.canView === true ||
        userPermission?.canView === true,

      canCreate:
        isAdmin ||
        rolePermission?.canCreate === true ||
        userPermission?.canCreate === true,

      canEdit:
        isAdmin ||
        rolePermission?.canEdit === true ||
        userPermission?.canEdit === true,

      canDelete:
        isAdmin ||
        rolePermission?.canDelete === true ||
        userPermission?.canDelete === true,

      canApprove:
        isAdmin ||
        rolePermission?.canApprove === true ||
        userPermission?.canApprove === true,

      canReject:
        isAdmin ||
        rolePermission?.canReject === true ||
        userPermission?.canReject === true,
    };
  });

  return (
    <Sidebar menuItems={menuItems} name={user.name ?? "User"} role={role}>
      <ProfileClient
        user={{
          name: user.name ?? "",
          email: user.email ?? "",
          role,
        }}
        permissions={permissions}
      />
    </Sidebar>
  );
}
