"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { useToast } from "@/context/ToastContext";

import type { PermissionItem, PermissionsClientProps } from "@/types";

import { permissionService } from "@/services/PermissionService";

import "../globals.css";

export default function PermissionsClient({
  access,
  role,
}: PermissionsClientProps) {
  const router = useRouter();
  const { show } = useToast();
  const isAdmin = role === "ADMIN";

  const canView = isAdmin || access.canView;
  const canCreate = isAdmin || access.canCreate;
  const canEdit = isAdmin || access.canEdit;
  const canDelete = isAdmin || access.canDelete;

  const [permissions, setPermissions] = useState<PermissionItem[]>([]);

  const [selectedPermissions, setSelectedPermissions] = useState<
    PermissionItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [dialogVisible, setDialogVisible] = useState(false);

  const [editing, setEditing] = useState<PermissionItem | null>(null);

  const [name, setName] = useState("");

  const [code, setCode] = useState("");

  const [saving, setSaving] = useState(false);

  const [first, setFirst] = useState(0);

  const rows = 5;

  const menuRefs = useRef<Record<number, Menu | null>>({});

  const loadData = async () => {
    setLoading(true);

    try {
      const data = await permissionService.getAll();

      setPermissions(data);

      setSelectedPermissions([]);

      setFirst(0);
    } catch (error) {
      show({
        severity: "error",
        summary: "Error",
        detail:
          error instanceof Error
            ? error.message
            : "Unable to load permissions.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) {
      router.replace("/dashboard");
      setLoading(false);
      return;
    }

    void loadData();
  }, []);

  const openCreate = () => {
    if (!canCreate) {
      return;
    }

    setEditing(null);

    setName("");

    setCode("");

    setDialogVisible(true);
  };

  const openEdit = (permission: PermissionItem) => {
    if (!canEdit) {
      return;
    }

    setEditing(permission);

    setName(permission.name);

    setCode(permission.code);

    setDialogVisible(true);
  };

  const savePermission = async () => {
    if (editing ? !canEdit : !canCreate) {
      return;
    }

    const trimmedName = name.trim();

    const trimmedCode = code.trim();

    if (!trimmedName || !trimmedCode) {
      show({
        severity: "warn",
        summary: "Validation",
        detail: "Name and code are required.",
      });

      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await permissionService.update(editing.id, {
          name: trimmedName,
          code: trimmedCode,
        });

        show({
          severity: "success",
          summary: "Success",
          detail: "Permission updated successfully.",
        });
      } else {
        await permissionService.create({
          name: trimmedName,
          code: trimmedCode,
        });

        show({
          severity: "success",
          summary: "Success",
          detail: "Permission created successfully.",
        });
      }

      setDialogVisible(false);

      setEditing(null);

      setName("");

      setCode("");

      await loadData();
    } catch (error) {
      show({
        severity: "error",
        summary: "Error",
        detail: error instanceof Error ? error.message : "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete

  const deletePermission = async (permission: PermissionItem) => {
    if (!canDelete) {
      throw new Error("You do not have permission to delete.");
    }

    await permissionService.remove(permission.id);
  };

  // Confirm Delete

  const confirmDelete = (permission: PermissionItem) => {
    if (!canDelete) {
      return;
    }

    confirmDialog({
      message: `Delete "${permission.name}"?`,

      header: "Confirm Delete",

      icon: "pi pi-exclamation-triangle",

      acceptLabel: "Delete",

      rejectLabel: "Cancel",

      acceptClassName: "p-button-danger",

      accept: async () => {
        try {
          await deletePermission(permission);

          show({
            severity: "success",
            summary: "Success",
            detail: "Permission deleted successfully.",
          });

          await loadData();
        } catch (error) {
          show({
            severity: "error",
            summary: "Error",
            detail: error instanceof Error ? error.message : "Delete failed.",
          });
        }
      },
    });
  };

  // Bulk Delete

  const confirmBulkDelete = () => {
    if (!canDelete || selectedPermissions.length === 0) {
      return;
    }

    confirmDialog({
      message: `Delete ${selectedPermissions.length} selected permission(s)?`,

      header: "Confirm Delete",

      icon: "pi pi-exclamation-triangle",

      acceptLabel: "Delete",

      rejectLabel: "Cancel",

      acceptClassName: "p-button-danger",

      accept: async () => {
        const results = await Promise.allSettled(
          selectedPermissions.map(deletePermission),
        );

        const failed = results.filter(
          (result) => result.status === "rejected",
        ).length;

        if (failed > 0) {
          show({
            severity: "warn",
            summary: "Partially completed",
            detail: `${results.length - failed} deleted; ${failed} failed.`,
          });
        } else {
          show({
            severity: "success",
            summary: "Success",
            detail: "Selected permissions deleted successfully.",
          });
        }

        await loadData();
      },
    });
  };

  // Clear Search

  const clearSearch = () => {
    setSearch("");

    setSelectedPermissions([]);

    setFirst(0);
  };

  // Filter

  const filteredPermissions = permissions.filter((permission) => {
    const value = search.trim().toLowerCase();

    return (
      permission.name.toLowerCase().includes(value) ||
      permission.code.toLowerCase().includes(value)
    );
  });

  // Date Format

  const formatDate = (value: string) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const datePart = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${datePart} ${weekday} ${time}`;
  };

  // Table Templates

  const createdAtBody = (permission: PermissionItem) =>
    formatDate(permission.createdAt);

  const updatedAtBody = (permission: PermissionItem) =>
    formatDate(permission.updatedAt);

  const indexBody = (_row: PermissionItem, options: { rowIndex: number }) =>
    first + options.rowIndex + 1;

  // Action Menu

  const actionBody = (permission: PermissionItem) => {
    const items: MenuItem[] = [];

    if (canEdit) {
      items.push({
        label: "Edit",

        icon: "pi pi-pencil",

        command: () => openEdit(permission),
      });
    }

    if (canDelete) {
      items.push({
        label: "Delete",

        icon: "pi pi-trash",

        className: "permission-delete-menu-item",

        command: () => confirmDelete(permission),
      });
    }

    return (
      <div className="permission-action-wrapper">
        <Menu
          model={items}
          popup
          ref={(el) => {
            menuRefs.current[permission.id] = el;
          }}
        />

        <Button
          type="button"
          icon="pi pi-ellipsis-v"
          severity="secondary"
          size="small"
          disabled={items.length === 0}
          onClick={(event) => menuRefs.current[permission.id]?.toggle(event)}
        />
      </div>
    );
  };

  // Access Check

  if (!canView) {
    return null;
  }

  // UI

  return (
    <main className="page">
      <div className="header">
        <div className="header-title">
          <h1 className="title">Permissions</h1>

          <p className="description">Manage system permissions.</p>
        </div>

        <div className="hader-actions">
          <InputText
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);

              setFirst(0);
            }}
            placeholder="Search..."
          />
          {canCreate && (
            <Button
              className="addbtn"
              label="New"
              icon="pi pi-plus"
              severity="success"
              size="small"
              onClick={openCreate}
            />
          )}

          {canDelete && (
            <Button
              className="delete-button"
              label="Delete"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              disabled={selectedPermissions.length === 0}
              onClick={confirmBulkDelete}
            />
          )}
        </div>
      </div>

      {/* Table */}

      <div className="table">
        <DataTable
          value={filteredPermissions}
          dataKey="id"
          selection={selectedPermissions}
          selectionMode="multiple"
          cellSelection={false}
          onSelectionChange={(e) => {
            const value = e.value;

            setSelectedPermissions(
              Array.isArray(value) ? value : value ? [value] : [],
            );
          }}
          paginator
          first={first}
          rows={rows}
          onPage={(e) => setFirst(e.first)}
          stripedRows
          showGridlines
          emptyMessage="No permissions found."
          responsiveLayout="scroll"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} permissions"
        >
          <Column
            selectionMode="multiple"
            headerStyle={{
              width: "3rem",
            }}
          />

          <Column
            header="#"
            body={indexBody}
            style={{
              width: "4rem",
            }}
          />

          <Column field="name" header="Permission Name" sortable />

          <Column field="code" header="Code" sortable />

          <Column
            field="createdAt"
            header="Created At"
            body={createdAtBody}
            sortable
          />

          <Column
            field="updatedAt"
            header="Updated At"
            body={updatedAtBody}
            sortable
          />

          {(canEdit || canDelete) && (
            <Column
              header="Actions"
              body={actionBody}
              style={{
                width: "9rem",
              }}
            />
          )}
        </DataTable>
      </div>

      {/* Create / Edit Dialog */}

      <Dialog
        header={editing ? "Edit Permission" : "New Permission"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        modal
        style={{
          width: "450px",
          maxWidth: "95vw",
        }}
        footer={
          <div className="permissions-dialog-footer">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => setDialogVisible(false)}
              disabled={saving}
              style={{
                width: "80px",
                height: "35px",
                fontSize: "12px",
                padding: "5px",
              }}
            />

            <Button
              label={editing ? "Update" : "Save"}
              icon="pi pi-check"
              onClick={savePermission}
              loading={saving}
              style={{
                background: "#0D9488",
                width: "80px",
                height: "35px",
                fontSize: "12px",
                padding: "5px",
              }}
            />
          </div>
        }
      >
        <div className="permissions-form">
          <div className="permissions-field">
            <label htmlFor="permission-name">Permission Name</label>

            <InputText
              id="permission-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. User View"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="permissions-field">
            <label htmlFor="permission-code">Code</label>

            <InputText
              id="permission-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. USER_VIEW"
              maxLength={100}
            />
          </div>
        </div>
      </Dialog>
    </main>
  );
}
