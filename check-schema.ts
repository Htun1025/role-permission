import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT
      column_name,
      data_type,
      udt_name,
      is_nullable
    FROM information_schema.columns
    WHERE table_name IN ('RoleDefinition', 'User')
      AND column_name IN ('name', 'roleId')
    ORDER BY table_name, column_name;
  `);

  console.log("=== CURRENT SCHEMA ===");
  console.table(result);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });