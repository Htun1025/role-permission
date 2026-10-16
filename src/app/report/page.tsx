import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/sidebar";
import ReportChart from "@/components/ReportChart";
import "../globals.css";

export default async function ReportPage() {
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

      // Dynamic Role
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },

      userPermissions: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Dynamic role name
  const isAdmin = user.role?.name === "ADMIN";

  const canView = (resource: string) =>
    isAdmin ||
    user.userPermissions.some(
      (permission) => permission.resource === resource && permission.canView,
    );

  if (!canView("PERMISSION")) {
    redirect("/dashboard");
  }

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

    ...(canView("PERMISSION")
      ? [
          {
            label: "Report",
            icon: "pi pi-chart-bar",
            path: "/report",
          },
        ]
      : []),
  ];

  return (
    <Sidebar
      menuItems={menuItems}
      name={user.name ?? ""}
      role={user.role?.name ?? ""}
    >
      <ReportChart title="Report" />
    </Sidebar>
  );
}
