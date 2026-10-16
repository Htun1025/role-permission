import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import SidebarMenu from "@/components/sidebar";
import ReportChart from "@/components/ReportChart";

import { getCurrentPermissions } from "@/lib/permissions";

import "./dashboard.css";

export default async function DashboardPage() {
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

  const permissions = await getCurrentPermissions();
  const permissionCount = permissions.reduce((total, permission) => {
    return (
      total +
      (permission.canView ? 1 : 0) +
      (permission.canCreate ? 1 : 0) +
      (permission.canEdit ? 1 : 0) +
      (permission.canDelete ? 1 : 0) +
      (permission.canApprove ? 1 : 0) +
      (permission.canReject ? 1 : 0)
    );
  }, 0);

  const userCount = await prisma.user.count();
  const totalCount = userCount;

  const canView = (resource: string) =>
    permissions.some(
      (permission) =>
        permission.resource === resource && permission.canView === true,
    );

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

  return (
    <SidebarMenu
      menuItems={menuItems}
      name={user.name ?? ""}
      role={user.role?.name ?? ""}
    >
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card users-card">
            <div className="stat-icon">
              <i className="pi pi-users" />
            </div>
            <div className="stat-info">
              <p>Total Users</p>

              <h2>{userCount.toLocaleString()}</h2>
            </div>
          </div>

          <div className="stat-card permissions-card">
            <div className="stat-icon">
              <i className="pi pi-shield" />
            </div>

            <div className="stat-info">
              <p>User Permissions</p>

              <h2>{permissionCount.toLocaleString()}</h2>
            </div>
          </div>

          <div className="stat-card total-card">
            <div className="stat-icon">
              <i className="pi pi-chart-bar" />
            </div>

            <div className="stat-info">
              <p>Total</p>

              <h2>{totalCount.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        <ReportChart title="Dashboard Report" />
      </div>
    </SidebarMenu>
  );
}
