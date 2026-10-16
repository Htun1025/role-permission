"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { MouseEvent } from "react";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import type { DataTableSelectionMultipleChangeEvent } from "primereact/datatable";

import type { RoleItem, RolesClientProps } from "@/types";

import { AccessProvider, useAccess } from "@/context/AccessContext";

import { createEmptyPermissions, useRolesStore } from "@/store/RoleStore";

import RoleAddDialog from "./components/RoleAddDialog";
import RoleEditDialog from "./components/RoleEditDialog";

import "../globals.css";

const BUTTON_COLOR = "#0D9488";

export default function RolesClient(props: RolesClientProps) {
  return (
    <AccessProvider access={props.access}>
      <RolesContent />
    </AccessProvider>
  );
}

function RolesContent() {
  const access = useAccess();

  // Zustand state
  const roles = useRolesStore((state) => state.roles);
  const selectedRoles = useRolesStore((state) => state.selectedRoles);
  const permissions = useRolesStore((state) => state.permissions);

  const loading = useRolesStore((state) => state.loading);
  const saving = useRolesStore((state) => state.saving);
  const deleting = useRolesStore((state) => state.deleting);
  const permissionLoading = useRolesStore((state) => state.permissionLoading);

  // Zustand actions
  const setSelectedRoles = useRolesStore((state) => state.setSelectedRoles);
  const setPermissions = useRolesStore((state) => state.setPermissions);
  const updatePermission = useRolesStore((state) => state.updatePermission);
  const loadRoles = useRolesStore((state) => state.loadRoles);
  const loadRolePermissions = useRolesStore(
    (state) => state.loadRolePermissions,
  );
  const saveRoleAction = useRolesStore((state) => state.saveRole);
  const deleteRolesAction = useRolesStore((state) => state.deleteRoles);

  // Local UI state
  const [keyword, setKeyword] = useState("");
  const [activeRole, setActiveRole] = useState<RoleItem | null>(null);

  const [dialogType, setDialogType] = useState<"new" | "edit" | "view" | null>(
    null,
  );

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");

  const [openAction, setOpenAction] = useState<string | null>(null);

  const [actionPosition, setActionPosition] = useState({
    top: 0,
    left: 0,
  });

  const [first, setFirst] = useState(0);
  const rows = 10;

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const actionButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  // Fetch roles
  useEffect(() => {
    if (!access.canView) return;

    void loadRoles().catch((error: unknown) => {
      window.alert(
        error instanceof Error ? error.message : "Failed to load roles.",
      );
    });
  }, [access.canView, loadRoles]);

  // Filter roles
  const filteredRoles = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    if (!search) return roles;

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(search) ||
        (role.description ?? "").toLowerCase().includes(search),
    );
  }, [roles, keyword]);

  const closeAction = () => setOpenAction(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openAction) return;

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (actionMenuRef.current?.contains(target)) return;

      const button = actionButtonRefs.current.get(openAction);

      if (button?.contains(target)) return;

      setOpenAction(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openAction]);

  const resetRoleForm = () => {
    setRoleName("");
    setDescription("");
  };

  const resetPermissions = () => {
    setPermissions(createEmptyPermissions());
  };

  const closeDialog = () => {
    if (saving || permissionLoading) return;

    setDialogType(null);
    setActiveRole(null);
    resetRoleForm();
    resetPermissions();
  };

  // New role
  const openNewDialog = () => {
    if (!access.canCreate || saving) return;

    closeAction();
    setActiveRole(null);
    resetRoleForm();
    resetPermissions();
    setDialogType("new");
  };

  // Edit role
  const openEditDialog = async (role: RoleItem) => {
    if (!access.canEdit || saving || permissionLoading) return;

    closeAction();
    setActiveRole(role);
    setRoleName(role.name);
    setDescription(role.description ?? "");
    resetPermissions();
    setDialogType("edit");

    try {
      await loadRolePermissions(role);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to load role permissions.",
      );
    }
  };

  // View permissions
  const openViewDialog = async (role: RoleItem) => {
    if (!access.canView || permissionLoading) return;

    closeAction();
    setActiveRole(role);
    setRoleName(role.name);
    setDescription(role.description ?? "");
    resetPermissions();
    setDialogType("view");

    try {
      await loadRolePermissions(role);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to load role permissions.",
      );
    }
  };

  // Save role
  const saveRole = async () => {
    if (dialogType === "new" && !access.canCreate) return;
    if (dialogType === "edit" && !access.canEdit) return;
    if (dialogType === "view" || saving || permissionLoading) return;

    const name = roleName.trim().toUpperCase();
    const desc = description.trim();

    if (!name) {
      window.alert("Role name is required.");
      return;
    }

    if (dialogType === "edit" && !activeRole) return;

    try {
      await saveRoleAction({
        mode: dialogType === "edit" ? "edit" : "new",
        oldRoleName: activeRole?.name,
        name,
        description: desc,
        permissions,
      });

      setSelectedRoles([]);
      setFirst(0);
      closeAction();
      setDialogType(null);
      setActiveRole(null);
      resetRoleForm();
      resetPermissions();

      window.alert("Role and permissions saved successfully.");
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to save role.",
      );
    }
  };

  // Delete roles
  const deleteRoles = async (items: RoleItem[]) => {
    if (!access.canDelete || items.length === 0 || deleting || saving) {
      return;
    }

    if (!window.confirm(`Delete ${items.length} selected role(s)?`)) {
      return;
    }

    try {
      await deleteRolesAction(items);
      setFirst(0);
      closeAction();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete roles.",
      );
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setFirst(0);
    setSelectedRoles([]);
    closeAction();
  };

  // Dropdown positioning
  const toggleAction = (
    role: RoleItem,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (openAction === role.name) {
      closeAction();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 140;

    const left = Math.max(
      8,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
    );

    const top =
      rect.bottom + menuHeight + 8 > window.innerHeight
        ? Math.max(8, rect.top - menuHeight - 4)
        : rect.bottom + 4;

    setActionPosition({ top, left });
    setOpenAction(role.name);
  };

  const actionBody = (role: RoleItem) => {
    if (!access.canEdit && !access.canDelete) return null;

    const isOpen = openAction === role.name;

    return (
      <div className="action-wrapper">
        <Button
          type="button"
          label="Action"
          icon={isOpen ? "pi pi-chevron-up" : "pi pi-chevron-down"}
          iconPos="right"
          className="action-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={(event) => toggleAction(role, event)}
          style={{
            background: BUTTON_COLOR,
            borderColor: BUTTON_COLOR,
            color: "#FFFFFF",
          }}
          ref={(element) => {
            if (!element) {
              actionButtonRefs.current.delete(role.name);
              return;
            }

            const button = (
              element as unknown as {
                getElement?: () => HTMLButtonElement | null;
              }
            ).getElement?.();

            if (button) {
              actionButtonRefs.current.set(role.name, button);
            }
          }}
        />
      </div>
    );
  };

  const permissionsBody = (role: RoleItem) => (
    <Button
      type="button"
      label="View Roles Permissions"
      icon="pi pi-eye"
      className="permissions-button"
      disabled={permissionLoading}
      onClick={() => void openViewDialog(role)}
      style={{
        background: BUTTON_COLOR,
        borderColor: BUTTON_COLOR,
        color: "#FFFFFF",
      }}
    />
  );

  if (!access.canView) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view Roles.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <div className="header-title">
          <h1 className="title">Roles</h1>
          <p className="description">
            Manage system roles and their permissions.
          </p>
        </div>

        <div className="header-actions">
          <InputText
            value={keyword}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search roles..."
          />

          {access.canCreate && (
            <Button
              type="button"
              label="New"
              icon="pi pi-plus"
              className="addbtn"
              disabled={saving || deleting}
              onClick={openNewDialog}
              style={{
                background: BUTTON_COLOR,
                borderColor: BUTTON_COLOR,
                color: "#FFFFFF",
              }}
            />
          )}

          {access.canDelete && (
            <Button
              type="button"
              label="Delete"
              icon="pi pi-trash"
              className="delete-button"
              disabled={
                selectedRoles.length === 0 || deleting || loading || saving
              }
              loading={deleting}
              onClick={() => void deleteRoles(selectedRoles)}
            />
          )}
        </div>
      </div>

      <DataTable<RoleItem[]>
        value={filteredRoles}
        dataKey="name"
        className="table roles-table"
        selection={access.canDelete ? selectedRoles : []}
        onSelectionChange={(
          event: DataTableSelectionMultipleChangeEvent<RoleItem[]>,
        ) => {
          if (access.canDelete) setSelectedRoles(event.value);
        }}
        selectionMode={access.canDelete ? "checkbox" : null}
        paginator
        first={first}
        onPage={(event) => setFirst(event.first)}
        rows={rows}
        stripedRows
        emptyMessage="No roles found."
        sortMode="single"
        removableSort
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles"
      >
        {access.canDelete && (
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "38px" }}
            bodyStyle={{ textAlign: "center", width: "38px" }}
          />
        )}

        <Column
          header="#"
          body={(_, options) => first + options.rowIndex + 1}
          headerStyle={{ width: "38px" }}
          bodyStyle={{ width: "38px" }}
        />

        <Column
          field="name"
          header="Name"
          sortable
          style={{ width: "150px" }}
        />

        <Column field="description" header="Description" sortable />

        <Column
          header="Permissions"
          body={permissionsBody}
          style={{ width: "190px" }}
        />

        {(access.canEdit || access.canDelete) && (
          <Column
            header="Actions"
            body={actionBody}
            style={{ width: "110px" }}
          />
        )}
      </DataTable>

      {openAction && (
        <div
          ref={actionMenuRef}
          className="role-action-menu"
          style={{
            position: "fixed",
            top: actionPosition.top,
            left: actionPosition.left,
            zIndex: 99999,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {access.canEdit && (
            <button
              type="button"
              className="btn"
              disabled={saving || permissionLoading}
              onClick={() => {
                const role = roles.find((item) => item.name === openAction);

                if (role) void openEditDialog(role);
              }}
            >
              <i className="pi pi-pencil" />
              <span>Edit</span>
            </button>
          )}

          {access.canDelete && (
            <button
              type="button"
              className="btn"
              disabled={deleting || saving}
              onClick={() => {
                const role = roles.find((item) => item.name === openAction);

                if (role) void deleteRoles([role]);
              }}
            >
              <i className="pi pi-trash" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      <RoleAddDialog
        visible={dialogType === "new"}
        roleName={roleName}
        description={description}
        saving={saving}
        onRoleNameChange={setRoleName}
        onDescriptionChange={setDescription}
        onSave={saveRole}
        onHide={closeDialog}
      />

      <RoleEditDialog
        visible={dialogType === "edit" || dialogType === "view"}
        role={activeRole}
        roleName={roleName}
        description={description}
        permissions={permissions}
        saving={saving}
        permissionLoading={permissionLoading}
        canEdit={access.canEdit}
        mode={dialogType === "view" ? "view" : "edit"}
        onRoleNameChange={setRoleName}
        onDescriptionChange={setDescription}
        onPermissionChange={updatePermission}
        onSave={saveRole}
        onHide={closeDialog}
      />
    </div>
  );
}
