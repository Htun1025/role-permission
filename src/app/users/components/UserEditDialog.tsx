"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

import type { UserRow } from "@/types";

const roleOptions = [
  { label: "ADMIN", value: "ADMIN" },
  { label: "MAKER", value: "MAKER" },
  { label: "CHECKER", value: "CHECKER" },
  { label: "APPROVER", value: "APPROVER" },
  { label: "USER", value: "USER" },
];

type EditForm = {
  name: string;
  username: string;
  email: string;
  role: UserRow["role"];
};

type Props = {
  visible: boolean;
  user: UserRow | null;
  form: EditForm;
  loading: boolean;
  canEdit: boolean;
  onHide: () => void;
  onChange: (form: EditForm) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function UserEditDialog({
  visible,
  user,
  form,
  loading,
  canEdit,
  onHide,
  onChange,
  onSubmit,
}: Props) {
  const footer = (
    <div className="permission-footer">
      <Button
        label="Cancel"
        className="btn"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        disabled={loading}
      />

      <Button
        label="Update User"
        className="btn"
        icon="pi pi-save"
        type="submit"
        form="edit-user-form"
        loading={loading}
        disabled={loading || !canEdit}
      />
    </div>
  );

  return (
    <Dialog
      className="form"
      header={`Edit User - ${user?.name ?? ""}`}
      visible={visible}
      onHide={onHide}
      style={{
        width: "min(600px, 95vw)",
      }}
      modal
      draggable={false}
      blockScroll
      footer={footer}
    >
      <form id="edit-user-form" onSubmit={onSubmit} className="new-user-form">
        <div className="new-user-field">
          <label htmlFor="edit-name">Full Name</label>

          <InputText
            id="edit-name"
            value={form.name}
            onChange={(event) =>
              onChange({
                ...form,
                name: event.target.value,
              })
            }
            minLength={2}
            maxLength={100}
            required
            disabled={loading}
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="edit-username">Username</label>

          <InputText
            id="edit-username"
            value={form.username}
            onChange={(event) =>
              onChange({
                ...form,
                username: event.target.value,
              })
            }
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            required
            disabled={loading}
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="edit-email">Email</label>

          <InputText
            id="edit-email"
            type="email"
            value={form.email}
            onChange={(event) =>
              onChange({
                ...form,
                email: event.target.value,
              })
            }
            maxLength={255}
            required
            disabled={loading}
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="edit-role">Role</label>

          <Dropdown
            inputId="edit-role"
            value={form.role}
            options={roleOptions}
            onChange={(event) =>
              onChange({
                ...form,
                role: event.value,
              })
            }
            className="w-full"
            disabled={loading}
          />
        </div>
      </form>
    </Dialog>
  );
}
