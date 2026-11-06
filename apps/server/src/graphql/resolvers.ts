
import type { GraphQLContext } from "../types/context.js";

type ResourceParent = {
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    };
  }>;
};

export const resolvers = {
  Query: {
    health: () => "Knowvia API is running 🚀",
    me: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.session?.user ?? null;
    },

    providers: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.prisma.provider.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    },

    categories: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    },

    resources: async (
      _parent: unknown,
      args: {
        filters?: {
          search?: string;
          providerSlug?: string;
          categorySlug?: string;
          resourceType?: "ARTICLE" | "VIDEO" | "COURSE" | "TUTORIAL" | "DOCUMENT" | "OTHER";
          difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | "UNKNOWN";
          accessType?: "FREE" | "PAID" | "SUBSCRIPTION" | "FREEMIUM" | "UNKNOWN";
        };
        pagination?: {
          page?: number;
          limit?: number;
        };
      },
      context: GraphQLContext,
    ) => {
      const filters = args.filters ?? {};
      const page = args.pagination?.page ?? 1;
      const limit = args.pagination?.limit ?? 12;

      if (!Number.isInteger(page) || page < 1) {
        throw new Error("Page must be a positive integer.");
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new Error("Limit must be between 1 and 50.");
      }

      const where = {
        status: "PUBLISHED" as const,

        ...(filters.search
          ? {
              OR: [
                {
                  title: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  summary: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),

        ...(filters.providerSlug
          ? {
              provider: {
                slug: filters.providerSlug,
                isActive: true,
              },
            }
          : {}),

        ...(filters.categorySlug
          ? {
              categories: {
                some: {
                  category: {
                    slug: filters.categorySlug,
                    isActive: true,
                  },
                },
              },
            }
          : {}),

        ...(filters.resourceType
          ? { resourceType: filters.resourceType }
          : {}),

        ...(filters.difficulty
          ? { difficulty: filters.difficulty }
          : {}),

        ...(filters.accessType
          ? { accessType: filters.accessType }
          : {}),
      };

      const skip = (page - 1) * limit;

      const [resources, totalItems] = await Promise.all([
        context.prisma.resource.findMany({
          where,
          include: {
            provider: true,
            categories: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),

        context.prisma.resource.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        items: resources,
        pageInfo: {
          totalItems,
          currentPage: page,
          pageSize: limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1 && totalItems > 0,
        },
      };
    },
  },

  Resource: {
    categories: (parent: ResourceParent) => {
      return parent.categories.map((item) => item.category);
    },
  },
};
