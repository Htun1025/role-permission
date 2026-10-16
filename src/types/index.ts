import type { ReactNode } from "react";

export type Role = string;

export type Resource =
  | "USER"
  | "REQUEST"
  | "ROLE"
  | "PERMISSION";

export type PermissionItem = {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

export type PermissionAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type PermissionsClientProps = {
  access: PermissionAccess;
  role?: Role | null;
};

export type Permission = {
  resource: Resource;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
};

export type ProfileProps = {
  user: {
    name: string;
    email: string;
    role: Role;
  };
  permissions: Permission[];
};

export type UserStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECT";

export type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string;

  role: Role | null;

  status: UserStatus;
  createdAt: string;
};

export type PermissionKey =
  | "canView"
  | "canCreate"
  | "canEdit"
  | "canDelete"
  | "canApprove"
  | "canReject";

export type NewUserForm = {
  name: string;
  username: string;
  email: string;
  password: string;

  role: Role;
};

export type UserAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
};

export type UserProps = {
  users: UserRow[];

  /**
   * Current logged-in user's role name.
   */
  currentUserRole: Role | null;

  access: UserAccess;
};

export type PermissionEditorProps = {
  permissions: Permission[];
  disabled: boolean;

  onChange: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean
  ) => void;

  onResourceChange: (
    resource: Resource,
    checked: boolean
  ) => void;

  onAllChange: (
    checked: boolean
  ) => void;
};

export type MenuItem = {
  label: string;
  icon: string;
  path: string;
};

export type SidebarContextType = {
  open: boolean;
  toggleSidebar: () => void;
  setOpen: (open: boolean) => void;
};

/**
 * Sidebar Props
 */
export type SidebarProps = {
  menuItems?: MenuItem[];
  name?: string;
  role?: Role | null;
  children?: ReactNode;
};

export type ActiveMenu =
  | "sidebar"
  | "header"
  | null;

export type RoleItem = {
  name: string;
  description: string;
};

export type RoleAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type RolesClientProps = {
  access: RoleAccess;
};

export type ReportData = {
  labels: string[];
  requests: number[];
  approvals: number[];
};

export type ReportSummary = {
  totalRequests: number;
  totalApprovals: number;
  pendingRequests: number;
  rejectedRequests: number;
};

export type EditForm = {
  name: string;
  username: string;
  email: string;

  role: UserRow["role"];
};


export type UserEditProps = {
  visible: boolean;
  user: UserRow | null;
  form: EditForm;
  loading: boolean;
  canEdit: boolean;

  onHide: () => void;

  onChange: (
    form: EditForm
  ) => void;

  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
};


export type PostUser = {
  id: string;
  name: string;
  username: string;
};

export type PostData = {
  id: number;
  title: string;
  description: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
};

export type PostStore = {
  // Data
  posts: PostData[];

  // Loading / saving
  loading: boolean;
  saving: boolean;
  deleting: boolean;

  // Messages
  error: string;
  success: string;

  // Form
  title: string;
  description: string;
  image: string | null;

  // Edit
  editingId: number | null;

  // Actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setImage: (image: string | null) => void;

  setError: (error: string) => void;
  setSuccess: (success: string) => void;

  setEditingId: (id: number | null) => void;

  loadPosts: () => Promise<void>;

  createOrUpdatePost: () => Promise<boolean>;

  deletePost: (id: number) => Promise<boolean>;

  editPost: (post: PostData) => void;

  resetForm: () => void;

  clearMessages: () => void;
};
export type UserStore = {
  // Users
  users: UserRow[];
  keyword: string;
  selectedUsers: UserRow[];

  // Add
  addDialogVisible: boolean;
  newUser: NewUserForm;
  addingUser: boolean;

  // Edit
  editingUser: UserRow | null;
  editDialogVisible: boolean;
  editForm: EditForm;
  editSaving: boolean;

  // Permissions
  permissions: Permission[];
  permissionUser: UserRow | null;
  permissionDialogVisible: boolean;
  permissionLoading: boolean;
  permissionSaving: boolean;

  // Delete
  deletingId: string | null;

  // Approval
  approvingId: string | null;

  // Pagination
  first: number;

  // Actions
  setUsers: (users: UserRow[]) => void;
  setKeyword: (keyword: string) => void;
  setSelectedUsers: (users: UserRow[]) => void;
  setFirst: (first: number) => void;

  // Add
  openAddUser: () => void;
  closeAddUser: () => void;
  setNewUser: (user: NewUserForm) => void;
  addUser: (user: NewUserForm) => Promise<UserRow>;

  // Edit
  openEdit: (user: UserRow) => void;
  closeEdit: () => void;
  setEditForm: (form: EditForm) => void;
  saveEdit: (
    userId: string,
    form: EditForm,
  ) => Promise<UserRow>;

  // Permissions
  openUserPermissions: (user: UserRow) => void;
  closeUserPermissions: () => void;
  loadUserPermissions: (user: UserRow) => Promise<void>;

  handlePermissionChange: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => void;

  handleResourceChange: (
    resource: Resource,
    checked: boolean,
  ) => void;

  handleAllChange: (checked: boolean) => void;

  saveUserPermissions: (
    userId: string,
  ) => Promise<void>;

  // Delete
  deleteUser: (user: UserRow) => Promise<void>;

  // Approval
  handleApproval: (
    user: UserRow,
    action: "APPROVE" | "REJECT",
  ) => Promise<void>;

  resetNewUser: () => void;
};

 export type SaveRoleInput = {
  mode: "new" | "edit";
  oldRoleName?: string;
  name: string;
  description: string;
  permissions: Permission[];
};

export type RolesStore = {
  roles: RoleItem[];
  selectedRoles: RoleItem[];
  permissions: Permission[];

  loading: boolean;
  permissionLoading: boolean;
  saving: boolean;
  deleting: boolean;

  setSelectedRoles: (roles: RoleItem[]) => void;
  setPermissions: (permissions: Permission[]) => void;

  updatePermission: (
    resource: Resource,
    key: PermissionKey,
    checked: boolean,
  ) => void;

  loadRoles: (showLoading?: boolean) => Promise<void>;
  loadRolePermissions: (role: RoleItem) => Promise<void>;
  saveRole: (input: SaveRoleInput) => Promise<void>;
  deleteRoles: (items: RoleItem[]) => Promise<void>;
};
