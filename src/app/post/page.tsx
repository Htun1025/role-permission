import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import SidebarMenu from "@/components/sidebar";
import Post from "./Post";

import { getCurrentPermissions } from "@/lib/permissions";

import "../globals.css";
import "./post.css";

export default async function PostPage() {
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

  // Permissions

  const permissions = await getCurrentPermissions();

  const canView = (resource: string) =>
    permissions.some(
      (permission) =>
        permission.resource === resource && permission.canView === true,
    );

  // Sidebar Menu

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      path: "/dashboard",
    },

    ...(canView("USER")
      ? [
          {
            label: "Users",
            icon: "pi pi-users",
            path: "/users",
          },
        ]
      : []),

    ...(canView("ROLE")
      ? [
          {
            label: "Roles",
            icon: "pi pi-id-card",
            path: "/roles",
          },
        ]
      : []),

    ...(canView("PERMISSION")
      ? [
          {
            label: "Permissions",
            icon: "pi pi-lock",
            path: "/permissions",
          },
        ]
      : []),

    {
      label: "Posts",
      icon: "pi pi-file-edit",
      path: "/post",
    },
  ];

  // Render

  return (
    <SidebarMenu
      menuItems={menuItems}
      name={user.name ?? ""}
      role={user.role?.name ?? ""}
    >
      <div className="post-page">
        <Post />
      </div>
    </SidebarMenu>
  );
}
