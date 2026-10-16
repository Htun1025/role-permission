"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

import type { Permission, PermissionKey, Resource, RoleItem } from "@/types";

import PermissionEditor from "@/app/users/components/PermissionEditor";
import "@/app/globals.css";

type PermissionMode = "edit" | "view";

type Props = {
  visible: boolean;
  role: RoleItem | null;

  permissions: Permission[];

  loading: boolean;
  saving: boolean;

  canEdit: boolean;

  mode?: PermissionMode;

  onHide: () => void;

  onPermissionChange: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => void;

  onSave: () => void;
};

export default function RolePermissionDialog({
  visible,
  role,
  permissions,
  loading,
  saving,
  canEdit,
  mode = "edit",
  onHide,
  onPermissionChange,
  onSave,
}: Props) {
  const isViewMode = mode === "view";

  const title = isViewMode
    ? `View Permissions - ${role?.name ?? ""}`
    : `Edit Permissions - ${role?.name ?? ""}`;

  const disabled = loading || saving || isViewMode || !canEdit;

  const footer = (
    <div className="permission-footer">
      <Button
        type="button"
        label={isViewMode ? "Close" : "Cancel"}
        className="btn"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        disabled={saving || loading}
      />

      {!isViewMode && (
        <Button
          type="button"
          label="Save"
          className="btn"
          icon="pi pi-save"
          onClick={() => {
            onSave();
          }}
          loading={saving}
          disabled={loading || saving || !role || !canEdit}
        />
      )}
    </div>
  );

  return (
    <Dialog
      className="form"
      header={title}
      visible={visible}
      onHide={() => {
        if (!saving && !loading) {
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
          <i className="pi pi-spin pi-spinner text-2xl" />
          <span>Loading permissions...</span>
        </div>
      ) : (
        <div className="role-permission-content">
          {/* ROLE INFO */}

          <div className="permission-user-info">
            <div className="permission-user-info-item">
              <span className="permission-info-label">Role</span>

              <strong>{role?.name ?? "-"}</strong>
            </div>

            <div className="permission-user-info-item">
              <span className="permission-info-label">Description</span>

              <span>{role?.description || "-"}</span>
            </div>
          </div>

          {/* VIEW MODE */}

          {isViewMode && (
            <div className="permission-readonly-message">
              <i className="pi pi-eye" />

              <span>
                You are viewing this role's permissions in read-only mode.
              </span>
            </div>
          )}

          {/* EDIT MODE */}

          {!isViewMode && !canEdit && (
            <div className="permission-readonly-message">
              <i className="pi pi-lock" />

              <span>
                You can view these permissions, but you do not have permission
                to edit them.
              </span>
            </div>
          )}

          {!isViewMode && canEdit && (
            <div className="permission-role-warning">
              <i className="pi pi-info-circle" />

              <span>
                Changes to this role's permissions will affect every user
                assigned to this role.
              </span>
            </div>
          )}

          {/* PERMISSION TABLE */}

          <div className="permission-table-section">
            <div className="permission-section-header">
              <div>
                <h3>Role Permissions</h3>

                <small>
                  {role?.name
                    ? `${role.name} role permissions`
                    : "Role permissions"}
                </small>
              </div>
            </div>

            <PermissionEditor
              permissions={permissions}
              disabled={disabled}
              onChange={onPermissionChange}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
