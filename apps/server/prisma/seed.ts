import { prisma } from "../src/lib/prisma.js";

const providers = [
  { name: "YouTube", slug: "youtube" },
  { name: "Coursera", slug: "coursera" },
  { name: "Udemy", slug: "udemy" },
  { name: "edX", slug: "edx" },
  { name: "freeCodeCamp", slug: "freecodecamp" },
  { name: "MDN Web Docs", slug: "mdn-web-docs" },
];

const categories = [
  { name: "Technology", slug: "technology" },
  { name: "Business", slug: "business" },
  { name: "Design", slug: "design" },
  { name: "Science", slug: "science" },
  { name: "Languages", slug: "languages" },
  {
    name: "Personal Development",
    slug: "personal-development",
  },
];

async function main() {
  console.log("Seeding providers...");

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: { name: provider.name },
      create: provider,
    });
  }

  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  console.log("✅ Database seeding completed!");
}

main()
  .catch((error: unknown) => {
    console.error("❌ Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
