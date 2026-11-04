
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../src/config/db.js";
import Organization from "../src/models/organizationModel.js";
import Permission from "../src/models/permissionModel.js";
import Role from "../src/models/roleModel.js";

dotenv.config();

// Your existing organization ID
const ORGANIZATION_ID = "6ae898e65e0b966cc682e058";

const defaultRoles = [
  {
    name: "Backend Developer",
    slug: "backend-developer",
    description:
      "Develop and maintain backend features, APIs and project tasks.",
    permissions: [
      "project:read",
      "task:create",
      "task:read",
      "task:update",
      "comment:create",
      "comment:read",
    ],
  },
  {
    name: "UI/UX Designer",
    slug: "ui-ux-designer",
    description:
      "Design user experiences and collaborate with the development team.",
    permissions: [
      "project:read",
      "task:read",
      "task:update",
      "comment:create",
      "comment:read",
    ],
  },
  {
    name: "Project Manager",
    slug: "project-manager",
    description:
      "Manage projects, tasks, team members and project progress.",
    permissions: [
      "project:create",
      "project:read",
      "project:update",
      "project:delete",
      "task:create",
      "task:read",
      "task:update",
      "task:delete",
      "task:assign",
      "comment:create",
      "comment:read",
      "comment:update",
      "comment:delete",
      "member:manage",
      "role:manage",
      "dashboard:read",
      "analytics:read",
    ],
  },
  {
    name: "Viewer",
    slug: "viewer",
    description:
      "View projects, tasks, comments and dashboard information.",
    permissions: [
      "project:read",
      "task:read",
      "comment:read",
      "dashboard:read",
    ],
  },
];

const seedDefaultRoles = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Verify organization
    const organization = await Organization.findById(
      ORGANIZATION_ID
    );

    if (!organization) {
      throw new Error("Organization not found.");
    }

    console.log(`Organization: ${organization.name}`);

    // Fetch seeded permissions
    const permissions = await Permission.find({}).select(
      "_id key"
    );

    const permissionMap = new Map(
      permissions.map((permission) => [
        permission.key,
        permission._id,
      ])
    );

    // Create default roles
    for (const roleData of defaultRoles) {
      // Check missing permissions
      const missingPermissions = roleData.permissions.filter(
        (key) => !permissionMap.has(key)
      );

      if (missingPermissions.length > 0) {
        throw new Error(
          `Missing permissions for ${roleData.name}: ${missingPermissions.join(", ")}`
        );
      }

      // Prevent duplicate roles
      const existingRole = await Role.findOne({
        organization: ORGANIZATION_ID,
        slug: roleData.slug,
      });

      if (existingRole) {
        console.log(
          `${roleData.name} already exists. Skipping.`
        );
        continue;
      }

      // Create role
      await Role.create({
        name: roleData.name,
        slug: roleData.slug,
        description: roleData.description,
        organization: ORGANIZATION_ID,
        permissions: roleData.permissions.map((key) =>
          permissionMap.get(key)
        ),
        scope: "organization",
        isSystem: true,
      });

      console.log(
        `${roleData.name} created successfully.`
      );
    }

    console.log(
      "All default organization roles processed successfully."
    );

  } catch (error) {
    console.error("Role seeding error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDefaultRoles();
