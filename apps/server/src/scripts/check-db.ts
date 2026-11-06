import { prisma } from "../lib/prisma.js";

async function main() {
  await prisma.$connect();

  console.log("✅ PostgreSQL connection successful!");

  const result = await prisma.$queryRaw<
    { current_database: string }[]
  >`SELECT current_database()`;

  console.log("Connected database:", result[0]?.current_database);
}

main()
  .catch((error: unknown) => {
    console.error("❌ Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
