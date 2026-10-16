
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // =========================
  // ROLES
  // =========================

  const roles = await prisma.roleDefinition.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log("\n=== ROLES ===");
  console.table(roles);

  // =========================
  // USERS
  // =========================

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      roleId: true,
      status: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  console.log("\n=== USERS ===");
  console.table(users);

  // =========================
  // USERS + ROLE
  // =========================

  const usersWithRole = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      username: "asc",
    },
  });

  console.log("\n=== USERS WITH ROLE ===");
  console.table(
    usersWithRole.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.name,
    }))
  );
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

