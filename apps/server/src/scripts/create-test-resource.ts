import { prisma } from "../lib/prisma.js";

async function main() {
  // Find existing provider and category.
  const provider = await prisma.provider.findUnique({
    where: { slug: "mdn-web-docs" },
  });

  const category = await prisma.category.findUnique({
    where: { slug: "technology" },
  });

  if (!provider || !category) {
    throw new Error("Required provider or category was not found.");
  }

  // Create or update the test resource.
  const resource = await prisma.resource.upsert({
    where: {
      slug: "javascript-guide-test",
    },
    update: {
      title: "JavaScript Guide",
      summary: "A guide to JavaScript fundamentals and concepts.",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      resourceType: "ARTICLE",
      accessType: "FREE",
      difficulty: "BEGINNER",
      language: "English",
      status: "PUBLISHED",
      providerId: provider.id,
    },
    create: {
      title: "JavaScript Guide",
      slug: "javascript-guide-test",
      summary: "A guide to JavaScript fundamentals and concepts.",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      resourceType: "ARTICLE",
      accessType: "FREE",
      difficulty: "BEGINNER",
      language: "English",
      status: "PUBLISHED",
      source: "ADMIN_CURATED",
      providerId: provider.id,
    },
  });

  // Create the resource-category relationship if it doesn't exist.
  await prisma.resourceCategory.upsert({
    where: {
      resourceId_categoryId: {
        resourceId: resource.id,
        categoryId: category.id,
      },
    },
    update: {},
    create: {
      resourceId: resource.id,
      categoryId: category.id,
    },
  });

  console.log("Test resource created/updated successfully:");
  console.log({
    title: resource.title,
    slug: resource.slug,
    provider: provider.name,
    category: category.name,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Failed to create test resource:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
