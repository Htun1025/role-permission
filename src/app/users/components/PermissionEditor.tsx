"use client";

import { Checkbox } from "primereact/checkbox";

import type { Permission, PermissionKey, Resource } from "@/types";

const resources: {
  value: Resource;
  label: string;
}[] = [
  {
    value: "USER",
    label: "Users",
  },
  {
    value: "REQUEST",
    label: "Requests",
  },
  {
    value: "ROLE",
    label: "Roles",
  },
  {
    value: "PERMISSION",
    label: "Permissions",
  },
];

const permissionFields: {
  key: PermissionKey;
  label: string;
}[] = [
  {
    key: "canView",
    label: "View",
  },
  {
    key: "canCreate",
    label: "Create",
  },
  {
    key: "canEdit",
    label: "Edit",
  },
  {
    key: "canDelete",
    label: "Delete",
  },
  {
    key: "canApprove",
    label: "Approve",
  },
  {
    key: "canReject",
    label: "Reject",
  },
];

type Props = {
  permissions?: Permission[];
  rolePermissions?: Permission[];

  disabled?: boolean;

  onChange: (resource: Resource, key: PermissionKey, checked: boolean) => void;

  onResourceChange?: (resource: Resource, checked: boolean) => void;

  onAllChange?: (checked: boolean) => void;
};

export default function PermissionEditor({
  permissions,
  rolePermissions = [],
  disabled = false,
  onChange,
}: Props) {
  const actualPermissions = permissions ?? rolePermissions;

  const permissionMap = new Map<Resource, Permission>(
    actualPermissions.map((permission) => [permission.resource, permission]),
  );

  const getPermission = (resource: Resource, key: PermissionKey): boolean => {
    return permissionMap.get(resource)?.[key] === true;
  };

  const handleChange = (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => {
    if (disabled) {
      return;
    }

    onChange(resource, key, checked);
  };

  return (
    <div className="permission-editor">
      {/* Header */}
      <div className="permission-description">
        <div>
          <strong>Permission Access</strong>
        </div>

        <small>Manage the permissions for this role.</small>
      </div>

      {/* Permission Table */}
      <div className="permission-table-wrapper">
        <table className="permission-table">
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
              <tr key={resource.value}>
                {/* Resource */}
                <td>
                  <div className="permission-resource-cell">
                    <span>{resource.label}</span>
                  </div>
                </td>

                {/* Permission checkboxes */}
                {permissionFields.map((field) => {
                  const checked = getPermission(resource.value, field.key);

                  return (
                    <td key={field.key}>
                      <div className="permission-checkbox-cell">
                        <Checkbox
                          inputId={`${resource.value}-${field.key}`}
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) => {
                            handleChange(
                              resource.value,
                              field.key,
                              Boolean(event.checked),
                            );
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
