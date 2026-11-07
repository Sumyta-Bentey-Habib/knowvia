
import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../../types/context.js";
import { requireAuth } from "./shared.js";

export const userResolvers = {
    Query: {
        me: (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            return context.session?.user ?? null;
        },

        myInterests: async (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            const interests = await context.prisma.userInterest.findMany({
                where: {
                    userId: user.id,
                    category: {
                        isActive: true,
                    },
                },
                include: {
                    category: true,
                },
            });

            return interests
                .map((interest) => interest.category)
                .sort((a, b) => a.name.localeCompare(b.name));
        },
    },

    Mutation: {
        updateMyInterests: async (
            _parent: unknown,
            args: { categoryIds: string[] },
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            // Remove duplicate IDs before validating or saving.
            const categoryIds = [...new Set(args.categoryIds)];

            return context.prisma.$transaction(async (tx) => {
                // Validate every requested category before replacing interests.
                const categories = await tx.category.findMany({
                    where: {
                        id: { in: categoryIds },
                        isActive: true,
                    },
                });

                if (categories.length !== categoryIds.length) {
                    throw new GraphQLError(
                        "One or more selected categories are invalid or inactive.",
                        {
                            extensions: { code: "BAD_USER_INPUT" },
                        },
                    );
                }

                // Replace the user's existing interests.
                await tx.userInterest.deleteMany({
                    where: { userId: user.id },
                });

                if (categoryIds.length > 0) {
                    await tx.userInterest.createMany({
                        data: categoryIds.map((categoryId) => ({
                            userId: user.id,
                            categoryId,
                        })),
                    });
                }

                return categories.sort((a, b) =>
                    a.name.localeCompare(b.name),
                );
            });
        },
    },
};
