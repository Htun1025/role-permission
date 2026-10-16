"use client";

import { useEffect, useState } from "react";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";

import type { NewUserForm } from "@/types";

type RoleOption = {
  label: string;
  value: string;
};

type Props = {
  visible: boolean;
  user: NewUserForm;
  loading: boolean;
  canCreate: boolean;
  onHide: () => void;
  onChange: (user: NewUserForm) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function UserAddDialog({
  visible,
  user,
  loading,
  canCreate,
  onHide,
  onChange,
  onSubmit,
}: Props) {
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError("");

      try {
        const response = await fetch("/api/roles", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error("Failed to load roles.");
        }

        // Support common API response structures.
        let roleList: unknown[] = [];

        if (Array.isArray(data)) {
          roleList = data;
        } else if (data && typeof data === "object") {
          const result = data as Record<string, unknown>;

          if (Array.isArray(result.roles)) {
            roleList = result.roles;
          } else if (Array.isArray(result.data)) {
            roleList = result.data;
          } else if (Array.isArray(result.items)) {
            roleList = result.items;
          } else if (result.role && typeof result.role === "object") {
            roleList = [result.role];
          }
        }

        const options = roleList
          .filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object",
          )
          .filter(
            (item) =>
              typeof item.name === "string" && item.name.trim().length > 0,
          )
          .map((item) => {
            const name = (item.name as string).trim();

            return {
              label: name,
              value: name,
            };
          });

        setRoleOptions(options);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load roles:", error);
        setRolesError(
          error instanceof Error ? error.message : "Failed to load roles.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setRolesLoading(false);
        }
      }
    };

    void loadRoles();

    return () => controller.abort();
  }, [visible]);

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
        label="Create User"
        className="btn"
        icon="pi pi-user-plus"
        type="submit"
        form="new-user-form"
        loading={loading}
        disabled={
          loading || !canCreate || rolesLoading || roleOptions.length === 0
        }
      />
    </div>
  );

  return (
    <Dialog
      className="form"
      header="Add New User"
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: "min(600px, 95vw)" }}
      modal
      draggable={false}
      blockScroll
    >
      <form id="new-user-form" onSubmit={onSubmit} className="new-user-form">
        <div className="new-user-field">
          <label htmlFor="new-name">Full Name</label>
          <InputText
            id="new-name"
            value={user.name}
            onChange={(event) =>
              onChange({ ...user, name: event.target.value })
            }
            placeholder="Enter full name"
            minLength={2}
            maxLength={100}
            required
            disabled={loading}
            autoComplete="name"
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="new-username">Username</label>
          <InputText
            id="new-username"
            value={user.username}
            onChange={(event) =>
              onChange({ ...user, username: event.target.value })
            }
            placeholder="Enter username"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            title="Only letters, numbers and underscores are allowed"
            required
            disabled={loading}
            autoComplete="username"
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="new-email">Email</label>
          <InputText
            id="new-email"
            type="email"
            value={user.email}
            onChange={(event) =>
              onChange({ ...user, email: event.target.value })
            }
            placeholder="Enter email address"
            maxLength={255}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="new-password">Password</label>
          <Password
            inputId="new-password"
            value={user.password}
            onChange={(event) =>
              onChange({ ...user, password: event.target.value })
            }
            placeholder="Enter password"
            minLength={8}
            maxLength={72}
            required
            disabled={loading}
            feedback
            toggleMask
            inputStyle={{ width: "100%" }}
            style={{ width: "100%" }}
            autoComplete="new-password"
          />
        </div>

        <div className="new-user-field">
          <label htmlFor="new-role">Role</label>
          <Dropdown
            inputId="new-role"
            value={user.role}
            options={roleOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(event) => onChange({ ...user, role: event.value })}
            placeholder={rolesLoading ? "Loading roles..." : "Select role"}
            disabled={loading || rolesLoading}
            loading={rolesLoading}
            className="w-full"
            emptyMessage="No roles available"
            emptyFilterMessage="No matching roles"
            showClear
            required
          />

          {rolesError && <small className="p-error">{rolesError}</small>}
        </div>
      </form>
    </Dialog>
  );
}
