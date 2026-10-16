import "dotenv/config";
import { hash } from "bcryptjs";

import { prisma } from "../src/lib/prisma";

const defaultRoles = [
  {
    name: "ADMIN",
    description: "System Administrator",
  },
  {
    name: "MAKER",
    description: "Request Maker",
  },
  {
    name: "CHECKER",
    description: "Request Checker",
  },
  {
    name: "APPROVER",
    description: "Request Approver",
  },
  {
    name: "USER",
    description: "Normal User",
  },
] as const;

const defaultUsers = [
  {
    name: "Admin",
    username: "admin123",
    email: "admin@example.com",
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD,
  },
  {
    name: "Maker",
    username: "maker123",
    email: "maker@example.com",
    role: "MAKER",
    password: process.env.MAKER_PASSWORD,
  },
  {
    name: "Checker",
    username: "checker123",
    email: "checker@example.com",
    role: "CHECKER",
    password: process.env.CHECKER_PASSWORD,
  },
  {
    name: "Approver",
    username: "approver123",
    email: "approver@example.com",
    role: "APPROVER",
    password: process.env.APPROVER_PASSWORD,
  },
  {
    name: "User",
    username: "user123",
    email: "user@example.com",
    role: "USER",
    password: process.env.USER_PASSWORD,
  },
] as const;

async function main() {
  console.log("Starting database seed...");


  const roles = new Map<string, string>();

  for (const role of defaultRoles) {
    const roleDefinition =
      await prisma.roleDefinition.upsert({
        where: {
          name: role.name,
        },

        update: {
          description: role.description,
        },

        create: {
          name: role.name,
          description: role.description,
        },
      });

    roles.set(role.name, roleDefinition.id);

    console.log(`Role ready: ${role.name}`);
  }

  for (const user of defaultUsers) {
    if (!user.password) {
      throw new Error(
        `Missing password for ${user.username}`,
      );
    }

    if (
      user.password.length < 8 ||
      user.password.length > 72
    ) {
      throw new Error(
        `Password for ${user.username} must be 8-72 characters`,
      );
    }
  }

  for (const user of defaultUsers) {
    const roleId = roles.get(user.role);

    if (!roleId) {
      throw new Error(
        `Role not found: ${user.role}`,
      );
    }

    const hashedPassword = await hash(
      user.password!,
      12,
    );

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: user.username,
          },
          {
            email: user.email,
          },
        ],
      },
    });


    if (existing) {
      await prisma.user.update({
        where: {
          id: existing.id,
        },

        data: {
          name: user.name,
          username: user.username,
          email: user.email,
          roleId,
          password: hashedPassword,
        },
      });

      console.log(
        `Updated: ${user.username} (${user.role})`,
      );

      continue;
    }

    await prisma.user.create({
      data: {
        name: user.name,
        username: user.username,
        email: user.email,
        password: hashedPassword,
        roleId,
      },
    });

    console.log(
      `Created: ${user.username} (${user.role})`,
    );
  }

  console.log("");
  console.log("=================================");
  console.log("Database seed completed.");
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });