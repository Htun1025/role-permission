"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import type { Permission, PermissionKey, Resource, RoleItem } from "@/types";

import PermissionEditor from "@/app/users/components/PermissionEditor";
import "../../globals.css";

type RoleDialogMode = "edit" | "view";

type RoleEditDialogProps = {
  visible: boolean;

  role: RoleItem | null;

  roleName: string;
  description: string;

  permissions?: Permission[];

  saving?: boolean;
  permissionLoading?: boolean;

  canEdit?: boolean;

  mode?: RoleDialogMode;

  onRoleNameChange: (value: string) => void;

  onDescriptionChange: (value: string) => void;

  onPermissionChange: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => void;

  onSave: () => void;

  onHide: () => void;
};

const BUTTON_COLOR = "#0D9488";

export default function RoleEditDialog({
  visible,
  role,
  roleName,
  description,
  permissions = [],
  saving = false,
  permissionLoading = false,
  canEdit = false,
  mode = "edit",
  onRoleNameChange,
  onDescriptionChange,
  onPermissionChange,
  onSave,
  onHide,
}: RoleEditDialogProps) {
  const isViewMode = mode === "view";

  const disabled = isViewMode || saving || permissionLoading || !canEdit;

  const footer = (
    <div className="role-dialog-footer">
      <Button
        type="button"
        className="role-dialog-button role-dialog-cancel"
        label={isViewMode ? "Close" : "Cancel"}
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        disabled={saving || permissionLoading}
      />

      {!isViewMode && (
        <Button
          type="button"
          className="role-dialog-button role-dialog-save"
          label="Save"
          icon="pi pi-check"
          onClick={onSave}
          loading={saving}
          disabled={saving || permissionLoading || !roleName.trim() || !canEdit}
        />
      )}
    </div>
  );

  return (
    <Dialog
      className="role-dialog"
      header={
        isViewMode
          ? `View Role - ${role?.name ?? roleName}`
          : `Edit Role - ${role?.name ?? roleName}`
      }
      visible={visible}
      onHide={() => {
        if (!saving && !permissionLoading) {
          onHide();
        }
      }}
      footer={footer}
      modal
      draggable={false}
      blockScroll
    >
      <div className="role-dialog-form">
        <div className="role-dialog-field">
          <div className="role-dialog-label">Role Name</div>

          <InputText
            className="role-dialog-input"
            value={roleName}
            onChange={(event) => onRoleNameChange(event.target.value)}
            disabled={disabled}
            placeholder="Enter role name"
          />
        </div>

        <div className="role-dialog-field">
          <div className="role-dialog-label">Description</div>

          <InputText
            className="role-dialog-input"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            disabled={disabled}
            placeholder="Enter description"
          />
        </div>

        <div className="role-dialog-field">
          <div className="role-dialog-permission-title">Permissions</div>

          {permissionLoading ? (
            <div className="role-dialog-loading">
              <i className="pi pi-spin pi-spinner" />
            </div>
          ) : (
            <PermissionEditor
              permissions={permissions}
              disabled={disabled}
              onChange={onPermissionChange}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}
