"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import "../globals.css";

import type { Permission, PermissionKey, ProfileProps } from "@/types";

const roleSeverity: Record<
  string,
  "danger" | "info" | "warning" | "secondary" | "success"
> = {
  ADMIN: "danger",
  MAKER: "info",
  CHECKER: "warning",
  APPROVER: "secondary",
  USER: "success",
};

const permissionFields: {
  key: PermissionKey;
  label: string;
}[] = [
  { key: "canView", label: "View" },
  { key: "canCreate", label: "Create" },
  { key: "canEdit", label: "Edit" },
  { key: "canDelete", label: "Delete" },
  { key: "canApprove", label: "Approve" },
  { key: "canReject", label: "Reject" },
];

const resources = ["USER", "REQUEST", "ROLE", "PERMISSION"] as const;

export default function ProfileClient({ user, permissions }: ProfileProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const currentRole = user.role?.trim() || "USER";

  const currentRoleSeverity = roleSeverity[currentRole] ?? "info";

  const isAdmin = currentRole === "ADMIN";

  async function handleLogout() {
    setLoading(true);

    try {
      await signOut({
        callbackUrl: "/login",
      });
    } catch {
      setLoading(false);
    }
  }

  function hasPermission(resource: Permission["resource"], key: PermissionKey) {
    if (isAdmin) {
      return true;
    }

    const permission = permissions.find((item) => item.resource === resource);

    return permission?.[key] ?? false;
  }

  return (
    <main className="management-page profile-page">
      <div className="mb-4">
        <h1 className="text-m font-bold m-0">My Profile</h1>

        <p className="text-600 mt-2">
          Account information and access permissions.
        </p>
      </div>

      <div className="profile-layout">
        <Card className="profile-card">
          {/* PROFILE HEADER */}
          <div className="flex align-items-center gap-3 mb-4">
            <Avatar
              icon="pi pi-user"
              shape="circle"
              size="xlarge"
              className="profile-avatar"
            />

            <div>
              <h2 className="text-xl font-semibold m-0">
                {user.name?.trim() || "Unnamed User"}
              </h2>

              <div className="mt-2">
                <Tag value={currentRole} severity={currentRoleSeverity} />
              </div>
            </div>
          </div>

          {/* ACCOUNT INFORMATION */}
          <div className="flex flex-column gap-3">
            <div className="profile-info">
              <div className="text-600 text-sm mb-1">Full Name</div>

              <div className="font-medium">
                {user.name?.trim() || "Not provided"}
              </div>
            </div>

            <div className="profile-info">
              <div className="text-600 text-sm mb-1">Email</div>

              <div className="font-medium">
                {user.email?.trim() || "Not provided"}
              </div>
            </div>

            <div className="profile-info">
              <div className="text-600 text-sm mb-1">Role</div>

              <div className="font-medium">{currentRole}</div>
            </div>
          </div>

          {/* ACCESS LEVEL */}
          <div className="mt-4">
            <div className="text-600 text-sm mb-2">Access Level</div>

            {isAdmin ? (
              <Tag value="FULL ACCESS" severity="danger" icon="pi pi-shield" />
            ) : (
              <Tag
                value="ASSIGNED PERMISSIONS"
                severity="info"
                icon="pi pi-lock"
              />
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="profile-actions">
            <Button
              label="Dashboard"
              icon="pi pi-home"
              severity="secondary"
              outlined
              onClick={() => router.push("/dashboard")}
            />

            <Button
              label={loading ? "Logging out..." : "Logout"}
              icon="pi pi-sign-out"
              severity="danger"
              outlined
              onClick={handleLogout}
              disabled={loading}
            />
          </div>
        </Card>

        <Card className="profile-permissions-card">
          {/* PERMISSION HEADER */}
          <div className="permissions-heading">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-lock" />

              <h2>Access Permissions</h2>
            </div>

            <p>Permissions currently assigned to this account.</p>
          </div>

          {/* ADMIN FULL ACCESS */}
          {isAdmin && (
            <div className="permission-full-access mb-3">
              <i className="pi pi-shield" />

              <span>This account has full access to all resources.</span>
            </div>
          )}

          <div className="profile-permission-table-wrapper">
            <table className="profile-permission-table">
              <thead>
                <tr>
                  <th>Resource</th>

                  {permissionFields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {resources.map((resource) => (
                  <tr key={resource}>
                    <td className="profile-resource">{resource}</td>

                    {permissionFields.map((field) => {
                      const allowed = hasPermission(resource, field.key);

                      return (
                        <td key={field.key}>
                          {allowed ? (
                            <Tag value="✓" severity="success" rounded />
                          ) : (
                            <span className="profile-permission-disabled">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
