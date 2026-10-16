"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";

import type { MenuItem } from "primereact/menuitem";

import type { UserProps, UserRow } from "@/types";

import { useUserStore } from "@/store/UserStore";

import UserAddDialog from "./components/UserAddDialog";
import UserEditDialog from "./components/UserEditDialog";
import UserPermissionDialog from "./components/UserPermissionDialog";

import "../globals.css";

export default function UsersClient({
  users: initialUsers,
  currentUserRole,
  access,
}: UserProps) {
  const router = useRouter();

  const toast = useRef<Toast>(null);

  // =========================================================
  // STORE
  // =========================================================

  const users = useUserStore((state) => state.users);

  const keyword = useUserStore((state) => state.keyword);

  const selectedUsers = useUserStore((state) => state.selectedUsers);

  const addDialogVisible = useUserStore((state) => state.addDialogVisible);

  const newUser = useUserStore((state) => state.newUser);

  const addingUser = useUserStore((state) => state.addingUser);

  const editingUser = useUserStore((state) => state.editingUser);

  const editDialogVisible = useUserStore((state) => state.editDialogVisible);

  const editForm = useUserStore((state) => state.editForm);

  const editSaving = useUserStore((state) => state.editSaving);

  // =========================================================
  // ROLE PERMISSIONS
  // =========================================================

  const rolePermissions = useUserStore((state) => state.rolePermissions);

  const permissionUser = useUserStore((state) => state.permissionUser);

  const permissionDialogVisible = useUserStore(
    (state) => state.permissionDialogVisible,
  );

  const permissionLoading = useUserStore((state) => state.permissionLoading);

  const permissionSaving = useUserStore((state) => state.permissionSaving);

  // =========================================================
  // OTHER
  // =========================================================

  const deletingId = useUserStore((state) => state.deletingId);

  const approvingId = useUserStore((state) => state.approvingId);

  const first = useUserStore((state) => state.first);

  const rows = useUserStore((state) => state.rows);

  // =========================================================
  // STORE ACTIONS
  // =========================================================

  const initializeUsers = useUserStore((state) => state.initializeUsers);

  const setKeyword = useUserStore((state) => state.setKeyword);

  const setSelectedUsers = useUserStore((state) => state.setSelectedUsers);

  const setFirst = useUserStore((state) => state.setFirst);

  // =========================================================
  // ADD
  // =========================================================

  const openAddDialog = useUserStore((state) => state.openAddDialog);

  const closeAddDialog = useUserStore((state) => state.closeAddDialog);

  const setNewUser = useUserStore((state) => state.setNewUser);

  const createUser = useUserStore((state) => state.createUser);

  // =========================================================
  // EDIT
  // =========================================================

  const openEditDialog = useUserStore((state) => state.openEditDialog);

  const closeEditDialog = useUserStore((state) => state.closeEditDialog);

  const setEditForm = useUserStore((state) => state.setEditForm);

  const updateUser = useUserStore((state) => state.updateUser);

  // =========================================================
  // ROLE PERMISSIONS
  // =========================================================

  const openPermissionDialog = useUserStore(
    (state) => state.openPermissionDialog,
  );

  const closePermissionDialog = useUserStore(
    (state) => state.closePermissionDialog,
  );

  const setPermission = useUserStore((state) => state.setPermission);

  const savePermissions = useUserStore((state) => state.savePermissions);

  // =========================================================
  // DELETE
  // =========================================================

  const deleteUser = useUserStore((state) => state.deleteUser);

  // =========================================================
  // APPROVAL
  // =========================================================

  const updateApproval = useUserStore((state) => state.updateApproval);

  // =========================================================
  // INITIALIZE USERS
  // =========================================================

  useEffect(() => {
    initializeUsers(initialUsers);
  }, [initialUsers, initializeUsers]);

  // =========================================================
  // ACCESS
  // =========================================================

  const canView = access.canView;
  const canCreate = access.canCreate;
  const canEdit = access.canEdit;
  const canDelete = access.canDelete;
  const canApprove = access.canApprove;
  const canReject = access.canReject;

  // =========================================================
  // REVIEW ACCESS
  // =========================================================

  const canReviewUsers =
    currentUserRole === "ADMIN" || currentUserRole === "APPROVER";

  // =========================================================
  // ROLE PERMISSION ACCESS
  // =========================================================

  const canManageUserPermissions = currentUserRole === "ADMIN" || canEdit;

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    const uniqueUsers = Array.from(
      new Map(
        users.filter((user) => Boolean(user.id)).map((user) => [user.id, user]),
      ).values(),
    );

    if (!search) {
      return uniqueUsers;
    }

    return uniqueUsers.filter((user) => {
      return (
        user.name.toLowerCase().includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.role ?? "").toLowerCase().includes(search) ||
        user.status.toLowerCase().includes(search)
      );
    });
  }, [users, keyword]);

  // =========================================================
  // TOAST
  // =========================================================

  const showError = (message: string) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: message,
      life: 4000,
    });
  };

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: "success",
      summary: "Success",
      detail: message,
      life: 3000,
    });
  };

  // =========================================================
  // ADD USER
  // =========================================================

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreate || addingUser) {
      return;
    }

    try {
      await createUser();

      showSuccess("User created successfully");

      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to create user",
      );
    }
  };

  // =========================================================
  // EDIT USER
  // =========================================================

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canEdit || !editingUser || editSaving) {
      return;
    }

    try {
      await updateUser();

      showSuccess("User updated successfully");

      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Update failed");
    }
  };

  // =========================================================
  // OPEN USER ROLE PERMISSIONS
  // =========================================================
  //
  // IMPORTANT:
  //
  // The `user` argument here is the USER CLICKED
  // in the DataTable.
  //
  // It is NOT currentUserRole.
  //
  // ADMIN user
  //   -> ADMIN RolePermission
  //
  // MAKER user
  //   -> MAKER RolePermission
  //
  // CHECKER user
  //   -> CHECKER RolePermission
  //
  // APPROVER user
  //   -> APPROVER RolePermission
  //
  // USER user
  //   -> USER RolePermission
  //
  // =========================================================

  const handleOpenPermissions = async (user: UserRow) => {
    if (!canManageUserPermissions) {
      return;
    }

    console.log("=================================");

    console.log("PERMISSIONS BUTTON CLICK");

    console.log("Clicked User ID:", user.id);

    console.log("Clicked Username:", user.username);

    console.log("Clicked User Name:", user.name);

    console.log("Clicked User Role:", user.role);

    console.log("=================================");

    try {
      await openPermissionDialog(user);
    } catch (error) {
      console.error("OPEN PERMISSION ERROR:", error);

      showError(
        error instanceof Error
          ? error.message
          : "Failed to load role permissions",
      );
    }
  };

  // =========================================================
  // SAVE ROLE PERMISSIONS
  // =========================================================

  const handleSavePermissions = async () => {
    if (!canManageUserPermissions || permissionSaving || permissionLoading) {
      return;
    }

    try {
      const saved = await savePermissions();

      if (!saved) {
        showError("Failed to save role permissions");
        return;
      }

      showSuccess("Role permissions updated successfully");

      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to save role permissions",
      );
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDeleteUser = async (user: UserRow) => {
    if (!canDelete || deletingId !== null || approvingId !== null) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      await deleteUser(user);

      showSuccess("User deleted successfully");

      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Delete failed");
    }
  };

  // =========================================================
  // APPROVAL
  // =========================================================

  const handleUserApproval = async (
    user: UserRow,
    action: "APPROVE" | "REJECT",
  ) => {
    const permitted = action === "APPROVE" ? canApprove : canReject;

    if (
      !canReviewUsers ||
      !permitted ||
      user.status !== "PENDING" ||
      approvingId !== null ||
      deletingId !== null
    ) {
      return;
    }

    const actionLabel = action === "APPROVE" ? "approve" : "reject";

    if (
      !window.confirm(`Are you sure you want to ${actionLabel} ${user.name}?`)
    ) {
      return;
    }

    try {
      await updateApproval(user, action);

      showSuccess(
        action === "APPROVE"
          ? "User approved successfully"
          : "User rejected successfully",
      );

      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Approval failed");
    }
  };

  // =========================================================
  // ROLE BODY
  // =========================================================

  const roleBody = (user: UserRow) => {
    const role = user.role ?? "";

    const severity =
      role === "ADMIN"
        ? "danger"
        : role === "MAKER"
          ? "info"
          : role === "CHECKER"
            ? "warning"
            : role === "APPROVER"
              ? "secondary"
              : "success";

    return <Tag value={role || "—"} severity={severity} />;
  };

  // =========================================================
  // STATUS BODY
  // =========================================================

  const statusBody = (user: UserRow) => {
    const severity =
      user.status === "APPROVED"
        ? "success"
        : user.status === "REJECT"
          ? "danger"
          : "warning";

    return <Tag value={user.status} severity={severity} />;
  };

  // =========================================================
  // APPROVAL BODY
  // =========================================================

  const approvalBody = (user: UserRow) => {
    if (
      !canReviewUsers ||
      (!canApprove && !canReject) ||
      user.status !== "PENDING"
    ) {
      return <span className="text-color-secondary">—</span>;
    }

    return (
      <div className="action-buttons">
        {canApprove && (
          <Button
            label="Approve"
            icon="pi pi-check-circle"
            size="small"
            onClick={() => void handleUserApproval(user, "APPROVE")}
            loading={approvingId === user.id}
            disabled={approvingId !== null || deletingId !== null}
            style={{
              background: "#0D9488",
              borderColor: "#0D9488",
              color: "#FFFFFF",
            }}
          />
        )}

        {canReject && (
          <Button
            label="Reject"
            icon="pi pi-times-circle"
            severity="danger"
            outlined
            size="small"
            onClick={() => void handleUserApproval(user, "REJECT")}
            disabled={approvingId !== null || deletingId !== null}
          />
        )}
      </div>
    );
  };

  // =========================================================
  // ACTION MENU
  // =========================================================

  const userActionBody = (user: UserRow) => {
    const items: MenuItem[] = [];

    // -------------------------------------------------------
    // EDIT
    // -------------------------------------------------------

    if (canEdit) {
      items.push({
        label: "Edit",
        icon: "pi pi-pencil",
        command: () => {
          openEditDialog(user);
        },
      });
    }

    // -------------------------------------------------------
    // PERMISSIONS
    // -------------------------------------------------------

    if (canManageUserPermissions) {
      if (items.length > 0) {
        items.push({
          separator: true,
        });
      }

      items.push({
        label: "Permissions",
        icon: "pi pi-lock",
        command: () => {
          void handleOpenPermissions(user);
        },
      });
    }

    // -------------------------------------------------------
    // DELETE
    // -------------------------------------------------------

    if (canDelete) {
      if (items.length > 0) {
        items.push({
          separator: true,
        });
      }

      items.push({
        label: "Delete",
        icon: "pi pi-trash",
        className: "user-delete-menu-item",
        disabled: deletingId !== null || approvingId !== null,
        command: () => {
          void handleDeleteUser(user);
        },
      });
    }

    if (items.length === 0) {
      return <span className="text-color-secondary">—</span>;
    }

    const menuRef = useRef<Menu>(null);

    return (
      <div className="action-buttons">
        <Menu model={items} popup ref={menuRef} id={`user-menu-${user.id}`} />

        <Button
          icon="pi pi-ellipsis-v"
          size="small"
          severity="secondary"
          text
          rounded
          aria-label={`Actions for ${user.name}`}
          aria-haspopup="true"
          aria-controls={`user-menu-${user.id}`}
          onClick={(event) => menuRef.current?.toggle(event)}
        />
      </div>
    );
  };
  if (!canView) {
    return null;
  }
  return (
    <div className="page">
      <Toast ref={toast} />
      <div className="header">
        <div className="header-title">
          <h1 className="title">Users</h1>

          <p className="description">Manage system users.</p>
        </div>

        <div className="header-actions">
          <InputText
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search users..."
          />

          {canCreate && (
            <Button
              className="addbtn"
              label="Add User"
              icon="pi pi-user-plus"
              severity="success"
              size="small"
              onClick={openAddDialog}
            />
          )}

          <Button
            label="Refresh"
            icon="pi pi-sync"
            severity="info"
            outlined
            size="small"
            onClick={() => router.refresh()}
          />
        </div>
      </div>
      <DataTable
        className="table"
        value={filteredUsers}
        dataKey="id"
        selection={selectedUsers}
        selectionMode="multiple"
        cellSelection={false}
        onSelectionChange={(event) => {
          const value = event.value;

          setSelectedUsers(Array.isArray(value) ? value : value ? [value] : []);
        }}
        paginator
        first={first}
        rows={rows}
        onPage={(event) => setFirst(event.first)}
        stripedRows
        showGridlines
        emptyMessage="No users found."
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
      >
        <Column
          field="name"
          header="Name"
          sortable
          style={{
            width: "120px",
          }}
        />

        <Column
          field="username"
          header="Username"
          sortable
          style={{
            width: "125px",
          }}
        />

        <Column
          field="email"
          header="Email"
          style={{
            width: "180px",
          }}
        />

        <Column
          field="role"
          header="Role"
          body={roleBody}
          sortable
          style={{
            width: "90px",
          }}
        />

        <Column
          field="status"
          header="Status"
          body={statusBody}
          sortable
          style={{
            width: "100px",
          }}
        />

        {canReviewUsers && (canApprove || canReject) && (
          <Column
            header="Approval"
            body={approvalBody}
            style={{
              width: "150px",
            }}
          />
        )}

        {(canEdit || canDelete || canManageUserPermissions) && (
          <Column
            header="Actions"
            body={userActionBody}
            style={{
              width: "65px",
            }}
          />
        )}
      </DataTable>
      <UserAddDialog
        visible={addDialogVisible}
        user={newUser}
        loading={addingUser}
        canCreate={canCreate}
        onHide={closeAddDialog}
        onChange={setNewUser}
        onSubmit={handleAddUser}
      />
      <UserEditDialog
        visible={editDialogVisible}
        user={editingUser}
        form={editForm}
        loading={editSaving}
        canEdit={canEdit}
        onHide={closeEditDialog}
        onChange={setEditForm}
        onSubmit={handleSaveEdit}
      />
      <UserPermissionDialog
        visible={permissionDialogVisible}
        user={permissionUser}
        rolePermissions={rolePermissions}
        loading={permissionLoading}
        saving={permissionSaving}
        canEdit={canManageUserPermissions}
        onHide={closePermissionDialog}
        onPermissionChange={setPermission}
        onSave={handleSavePermissions}
      />
    </div>
  );
}
