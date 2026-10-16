"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import "@/app/globals.css";
import type { RoleItem } from "@/types";

type RoleViewDialogProps = {
  visible: boolean;
  role: RoleItem | null;
  onHide: () => void;
};

const BUTTON_COLOR = "#0D9488";

export default function RoleViewDialog({
  visible,
  role,
  onHide,
}: RoleViewDialogProps) {
  return (
    <Dialog
      header="Role Details"
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
      {!role ? (
        <div className="role-view-empty">No role selected.</div>
      ) : (
        <div className="role-view-content">
          <div className="role-view-field">
            <h3>Role Name</h3>

            <Tag value={role.name} severity="info" />
          </div>

          <div className="role-view-field">
            <h3>Description</h3>

            <p>{role.description || "No description available."}</p>
          </div>

          <div className="role-view-note">
            <i className="pi pi-info-circle" />

            <span>
              Use "View Roles Permissions" to see the permission settings for
              this role.
            </span>
          </div>

          <div className="role-dialog-footer">
            <Button
              type="button"
              label="Close"
              className="btn"
              icon="pi pi-times"
              onClick={onHide}
              style={{
                background: BUTTON_COLOR,
                borderColor: BUTTON_COLOR,
                color: "#FFFFFF",
              }}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
