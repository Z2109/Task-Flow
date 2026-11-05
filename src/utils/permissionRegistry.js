const permissionRegistry = [
  // Project permissions
  {
    key: "project:create",
    resource: "project",
    action: "create",
    description: "Create projects",
  },
  {
    key: "project:read",
    resource: "project",
    action: "read",
    description: "View authorized projects",
  },
  {
    key: "project:update",
    resource: "project",
    action: "update",
    description: "Update authorized projects",
  },
  {
    key: "project:delete",
    resource: "project",
    action: "delete",
    description: "Delete authorized projects",
  },

  // Task permissions
  {
    key: "task:create",
    resource: "task",
    action: "create",
    description: "Create tasks",
  },
  {
    key: "task:read",
    resource: "task",
    action: "read",
    description: "View authorized tasks",
  },
  {
    key: "task:update",
    resource: "task",
    action: "update",
    description: "Update authorized tasks",
  },
  {
    key: "task:delete",
    resource: "task",
    action: "delete",
    description: "Delete authorized tasks",
  },
  {
    key: "task:assign",
    resource: "task",
    action: "assign",
    description: "Assign tasks to team members",
  },

  // Comment permissions
  {
    key: "comment:create",
    resource: "comment",
    action: "create",
    description: "Add comments",
  },
  {
    key: "comment:read",
    resource: "comment",
    action: "read",
    description: "View authorized comments",
  },

  {
    key: "comment:update",
    resource: "comment",
    action: "update",
    description: "Update own comments",
},
{
    key: "comment:delete",
    resource: "comment",
    action: "delete",
    description: "Delete own comments",
},

  // Organization and RBAC permissions
  {
    key: "member:manage",
    resource: "member",
    action: "manage",
    description: "Manage organization members",
  },
  {
    key: "role:manage",
    resource: "role",
    action: "manage",
    description: "Manage roles and their permissions",
  },

  // Dashboard and analytics
  {
    key: "dashboard:read",
    resource: "dashboard",
    action: "read",
    description: "View the dashboard",
  },
  {
    key: "analytics:read",
    resource: "analytics",
    action: "read",
    description: "View analytics",
  },
  // AI Assistant permissions
{
    key: "ai:chat",
    resource: "ai",
    action: "chat",
    description: "Access the TaskFlow AI assistant",
},
];

export default permissionRegistry;