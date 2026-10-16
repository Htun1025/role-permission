"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

type RoleAddDialogProps = {
  visible: boolean;
  roleName: string;
  description: string;
  saving?: boolean;
  onRoleNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onHide: () => void;
};

const BUTTON_COLOR = "#0D9488";

export default function RoleAddDialog({
  visible,
  roleName,
  description,
  saving = false,
  onRoleNameChange,
  onDescriptionChange,
  onSave,
  onHide,
}: RoleAddDialogProps) {
  const canSave = roleName.trim().length > 0 && !saving;

  return (
    <Dialog
      header="New Role"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="role-dialog"
      style={{
        width: "min(550px, 95vw)",
      }}
    >
      <div className="role-form">
        <div className="role-form-field">
          <label htmlFor="role-name">Role Name</label>

          <InputText
            id="role-name"
            value={roleName}
            onChange={(event) => onRoleNameChange(event.target.value)}
            placeholder="Enter role name"
            autoFocus
            disabled={saving}
            className="w-full"
          />

          <small>Example: ADMIN, MAKER, CHECKER</small>
        </div>

        <div className="role-form-field">
          <label htmlFor="role-description">Description</label>

          <InputText
            id="role-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Enter description"
            disabled={saving}
            className="w-full"
          />
        </div>

        <div className="role-dialog-footer">
          <Button
            type="button"
            label="Cancel"
            onClick={onHide}
            disabled={saving}
            className="btn"
            style={{
              background: BUTTON_COLOR,
              borderColor: BUTTON_COLOR,
              color: "#FFFFFF",
            }}
          />

          <Button
            type="button"
            label={saving ? "Saving..." : "Save"}
            icon="pi pi-check"
            onClick={onSave}
            disabled={!canSave}
            loading={saving}
            className="btn"
            style={{
              background: BUTTON_COLOR,
              borderColor: BUTTON_COLOR,
              color: "#FFFFFF",
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}
