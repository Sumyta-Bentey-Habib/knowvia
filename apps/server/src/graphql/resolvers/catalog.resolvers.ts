
import { GraphQLError } from "graphql";
import { requireRole } from "../../lib/auth-guards.js";
import type { GraphQLContext } from "../../types/context.js";
import {
    badInput,
    validateHttpUrl,
} from "./shared.js";

type CreateProviderInput = {
    name: string;
    slug: string;
    websiteUrl?: string | null;
};

type UpdateProviderInput = {
    name?: string | null;
    slug?: string | null;
    websiteUrl?: string | null;
};

type CreateCategoryInput = {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
};

type UpdateCategoryInput = {
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    parentId?: string | null;
};

function normalizeName(value: string, field: string): string {
    const name = value.trim();

    if (!name || name.length > 100) {
        return badInput(`${field} must contain between 1 and 100 characters.`);
    }

    return name;
}

function normalizeSlug(value: string): string {
    const slug = value.trim().toLowerCase();

    if (
        slug.length > 100 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
        return badInput(
            "Slug must contain lowercase letters, numbers, and single hyphens only.",
        );
    }

    return slug;
}

function normalizeOptionalText(
    value: string | null | undefined,
    field: string,
    maxLength: number,
): string | null | undefined {
    if (value === undefined || value === null) {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
        return badInput(`${field} cannot exceed ${maxLength} characters.`);
    }

    return trimmed || null;
}

function normalizeWebsiteUrl(
    value: string | null | undefined,
): string | null | undefined {
    if (value === undefined || value === null) {
        return value;
    }

    return validateHttpUrl(value, "Website URL");
}

function handleCatalogError(error: unknown): never {
    if (
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
    ) {
        return badInput("A record with this name or slug already exists.");
    }

    throw error;
}

async function validateCategoryParent(
    context: GraphQLContext,
    parentId: string | null,
    categoryId?: string,
) {
    if (!parentId) return;

    if (categoryId && parentId === categoryId) {
        return badInput("A category cannot be its own parent.");
    }

    const visited = new Set<string>();
    let currentId: string | null = parentId;

    while (currentId) {
        if (visited.has(currentId)) {
            return badInput("The category hierarchy contains a cycle.");
        }

        visited.add(currentId);

        if (categoryId && currentId === categoryId) {
            return badInput(
                "A category cannot be moved beneath one of its descendants.",
            );
        }

        const ancestor: {
            id: string;
            parentId: string | null;
            isActive: boolean;
        } | null = await context.prisma.category.findUnique({
            where: { id: currentId },
            select: {
                id: true,
                parentId: true,
                isActive: true,
            },
        });

        if (!ancestor || !ancestor.isActive) {
            return badInput("The selected parent category is unavailable.");
        }

        currentId = ancestor.parentId;
    }
}

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

        adminProviders: async (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            return context.prisma.provider.findMany({
                orderBy: { name: "asc" },
            });
        },

        adminCategories: async (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            return context.prisma.category.findMany({
                orderBy: { name: "asc" },
            });
        },
    },

    Mutation: {
        createProvider: async (
            _parent: unknown,
            args: { input: CreateProviderInput },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            try {
                return await context.prisma.provider.create({
                    data: {
                        name: normalizeName(args.input.name, "Provider name"),
                        slug: normalizeSlug(args.input.slug),
                        websiteUrl: normalizeWebsiteUrl(
                            args.input.websiteUrl,
                        ),
                    },
                });
            } catch (error) {
                return handleCatalogError(error);
            }
        },

        updateProvider: async (
            _parent: unknown,
            args: {
                providerId: string;
                input: UpdateProviderInput;
            },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            const existing = await context.prisma.provider.findUnique({
                where: { id: args.providerId },
            });

            if (!existing) {
                throw new GraphQLError("Provider not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            const input = args.input;
            const data = {
                ...(input.name !== undefined && {
                    name:
                        input.name === null
                            ? badInput("Provider name cannot be null.")
                            : normalizeName(input.name, "Provider name"),
                }),
                ...(input.slug !== undefined && {
                    slug:
                        input.slug === null
                            ? badInput("Provider slug cannot be null.")
                            : normalizeSlug(input.slug),
                }),
                ...(input.websiteUrl !== undefined && {
                    websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
                }),
            };

            if (Object.keys(data).length === 0) {
                return badInput("Provide at least one field to update.");
            }

            try {
                return await context.prisma.provider.update({
                    where: { id: args.providerId },
                    data,
                });
            } catch (error) {
                return handleCatalogError(error);
            }
        },

        setProviderActive: async (
            _parent: unknown,
            args: { providerId: string; isActive: boolean },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            const existing = await context.prisma.provider.findUnique({
                where: { id: args.providerId },
            });

            if (!existing) {
                throw new GraphQLError("Provider not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            return context.prisma.provider.update({
                where: { id: args.providerId },
                data: { isActive: args.isActive },
            });
        },

        createCategory: async (
            _parent: unknown,
            args: { input: CreateCategoryInput },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            await validateCategoryParent(
                context,
                args.input.parentId ?? null,
            );

            try {
                return await context.prisma.category.create({
                    data: {
                        name: normalizeName(args.input.name, "Category name"),
                        slug: normalizeSlug(args.input.slug),
                        description: normalizeOptionalText(
                            args.input.description,
                            "Description",
                            1000,
                        ),
                        parentId: args.input.parentId ?? null,
                    },
                });
            } catch (error) {
                return handleCatalogError(error);
            }
        },

        updateCategory: async (
            _parent: unknown,
            args: {
                categoryId: string;
                input: UpdateCategoryInput;
            },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            const existing = await context.prisma.category.findUnique({
                where: { id: args.categoryId },
            });

            if (!existing) {
                throw new GraphQLError("Category not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            const input = args.input;

            if (input.parentId !== undefined) {
                await validateCategoryParent(
                    context,
                    input.parentId,
                    args.categoryId,
                );
            }

            const data = {
                ...(input.name !== undefined && {
                    name:
                        input.name === null
                            ? badInput("Category name cannot be null.")
                            : normalizeName(input.name, "Category name"),
                }),
                ...(input.slug !== undefined && {
                    slug:
                        input.slug === null
                            ? badInput("Category slug cannot be null.")
                            : normalizeSlug(input.slug),
                }),
                ...(input.description !== undefined && {
                    description: normalizeOptionalText(
                        input.description,
                        "Description",
                        1000,
                    ),
                }),
                ...(input.parentId !== undefined && {
                    parentId: input.parentId,
                }),
            };

            if (Object.keys(data).length === 0) {
                return badInput("Provide at least one field to update.");
            }

            try {
                return await context.prisma.category.update({
                    where: { id: args.categoryId },
                    data,
                });
            } catch (error) {
                return handleCatalogError(error);
            }
        },

        setCategoryActive: async (
            _parent: unknown,
            args: { categoryId: string; isActive: boolean },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            const existing = await context.prisma.category.findUnique({
                where: { id: args.categoryId },
            });

            if (!existing) {
                throw new GraphQLError("Category not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            return context.prisma.category.update({
                where: { id: args.categoryId },
                data: { isActive: args.isActive },
            });
        },
    },
};
