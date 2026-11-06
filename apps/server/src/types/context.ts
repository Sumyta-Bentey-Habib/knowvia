import type { prisma } from "../lib/prisma.js";

export type GraphQLContext = {
  prisma: typeof prisma;
};
