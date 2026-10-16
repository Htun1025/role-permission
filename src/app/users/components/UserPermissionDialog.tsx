"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

import type { Permission, PermissionKey, Resource, UserRow } from "@/types";

import PermissionEditor from "./PermissionEditor";
import "../../globals.css";

type Props = {
  visible: boolean;
  user: UserRow | null;

  // IMPORTANT:
  // These are RoleDefinition -> RolePermission
  rolePermissions: Permission[];

  loading: boolean;
  saving: boolean;
  canEdit: boolean;

  onHide: () => void;

  onPermissionChange: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => void;

  onSave: () => void | Promise<void>;
};

export default function UserPermissionDialog({
  visible,
  user,
  rolePermissions,
  loading,
  saving,
  canEdit,
  onHide,
  onPermissionChange,
  onSave,
}: Props) {
  const disabled = loading || saving || !canEdit;

  const roleName = user?.role?.trim() || "USER";

  const footer = (
    <div className="permission-footer">
      <Button
        type="button"
        label="Close"
        icon="pi pi-times"
        severity="secondary"
        outlined
        className="permission-close-button"
        onClick={onHide}
        disabled={loading || saving}
      />

      {canEdit && (
        <Button
          type="button"
          label="Save"
          icon="pi pi-save"
          className="permission-save-button"
          onClick={() => {
            void onSave();
          }}
          loading={saving}
          disabled={disabled || !user}
        />
      )}
    </div>
  );

  return (
    <Dialog
      className="user-permission-dialog"
      header={`${roleName} Role Permissions`}
      visible={visible}
      onHide={() => {
        if (!loading && !saving) {
          onHide();
        }
      }}
      footer={footer}
      style={{
        width: "min(1000px, 98vw)",
      }}
      modal
      draggable={false}
      blockScroll
    >
      {loading ? (
        <div className="permission-loading">
          <i className="pi pi-spin pi-spinner" />
          <span>Loading {roleName} role permissions...</span>
        </div>
      ) : (
        <div className="user-permission-content">
          <div className="permission-user-info">
            <div className="permission-user-info-item">
              <span className="permission-info-label">User</span>

              <strong>{user?.name ?? "-"}</strong>
            </div>

            <div className="permission-user-info-item">
              <span className="permission-info-label">Username</span>

              <strong>{user?.username ?? "-"}</strong>
            </div>

            <div className="permission-user-info-item">
              <span className="permission-info-label">Role</span>

              <span className="permission-role-badge">{roleName}</span>
            </div>
          </div>

          {!canEdit && (
            <div className="permission-readonly-message">
              <i className="pi pi-lock" />

              <span>
                You can view these permissions, but you do not have permission
                to edit them.
              </span>
            </div>
          )}

          {canEdit && (
            <div className="permission-role-warning">
              <i className="pi pi-info-circle" />

              <span>
                These are the permissions of the <strong>{roleName}</strong>{" "}
                role. Changes will affect every user assigned to this role.
              </span>
            </div>
          )}

          <div className="permission-table-section">
            <div className="permission-section-header">
              <div>
                <h3>{roleName} Role Permissions</h3>

                <small>Permissions inherited from the {roleName} role</small>
              </div>
            </div>

            <PermissionEditor
              permissions={rolePermissions}
              disabled={disabled}
              onChange={onPermissionChange}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
