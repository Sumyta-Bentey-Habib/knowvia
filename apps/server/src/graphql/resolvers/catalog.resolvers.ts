import type { GraphQLContext } from "../../types/context.js";

export const catalogResolvers = {
    Query: {
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
    },
};
