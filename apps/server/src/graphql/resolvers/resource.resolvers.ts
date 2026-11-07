
import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import { requireAuth, requireRole } from "../../lib/auth-guards.js";
import type { GraphQLContext } from "../../types/context.js";
import {
    badInput,
    createResourceSlug,
    resourceInclude,
    validateHttpUrl,
} from "./shared.js";

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

type ResourceFilters = {
    search?: string;
    providerSlug?: string;
    categorySlug?: string;
    resourceType?:
    | "ARTICLE"
    | "VIDEO"
    | "COURSE"
    | "TUTORIAL"
    | "DOCUMENT"
    | "OTHER";
    difficulty?:
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED"
    | "ALL_LEVELS"
    | "UNKNOWN";
    accessType?:
    | "FREE"
    | "PAID"
    | "SUBSCRIPTION"
    | "FREEMIUM"
    | "UNKNOWN";
};

type CreateAdminResourceInput = {
    title: string;
    url: string;
    summary?: string | null;
    thumbnailUrl?: string | null;
    resourceType:
    | "ARTICLE"
    | "VIDEO"
    | "COURSE"
    | "TUTORIAL"
    | "DOCUMENT"
    | "OTHER";
    accessType?:
    | "FREE"
    | "PAID"
    | "SUBSCRIPTION"
    | "FREEMIUM"
    | "UNKNOWN"
    | null;
    difficulty?:
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED"
    | "ALL_LEVELS"
    | "UNKNOWN"
    | null;
    language?: string | null;
    durationMinutes?: number | null;
    providerId: string;
    categoryIds?: string[] | null;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | null;
};

type UpdateAdminResourceInput = {
    title?: string | null;
    url?: string | null;
    summary?: string | null;
    thumbnailUrl?: string | null;
    resourceType?:
    | "ARTICLE"
    | "VIDEO"
    | "COURSE"
    | "TUTORIAL"
    | "DOCUMENT"
    | "OTHER"
    | null;
    accessType?:
    | "FREE"
    | "PAID"
    | "SUBSCRIPTION"
    | "FREEMIUM"
    | "UNKNOWN"
    | null;
    difficulty?:
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED"
    | "ALL_LEVELS"
    | "UNKNOWN"
    | null;
    language?: string | null;
    durationMinutes?: number | null;
    providerId?: string | null;
    categoryIds?: string[] | null;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | null;
};

export const resourceResolvers = {
    Query: {
        resources: async (
            _parent: unknown,
            args: {
                filters?: ResourceFilters;
                pagination?: {
                    page?: number;
                    limit?: number;
                };
            },
            context: GraphQLContext,
        ) => {
            const filters = args.filters ?? {};
            const search = filters.search?.trim();

            if (search && search.length > 100) {
                badInput("Search must not exceed 100 characters.");
            }

            const page = args.pagination?.page ?? 1;
            const limit = args.pagination?.limit ?? 12;

            if (!Number.isSafeInteger(page) || page < 1) {
                badInput("Page must be a positive integer.");
            }

            if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
                badInput("Limit must be between 1 and 50.");
            }

            const skip = (page - 1) * limit;

            if (!Number.isSafeInteger(skip)) {
                badInput("Requested page is too large.");
            }

            const where = {
                status: "PUBLISHED" as const,
                ...(search
                    ? {
                        OR: [
                            {
                                title: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                summary: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                },
                            },
                        ],
                    }
                    : {}),
                provider: {
                    isActive: true,
                    ...(filters.providerSlug
                        ? { slug: filters.providerSlug }
                        : {}),
                },
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

            const [resources, totalItems] = await Promise.all([
                context.prisma.resource.findMany({
                    where,
                    include: resourceInclude,
                    orderBy: { createdAt: "desc" },
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

        resource: async (
            _parent: unknown,
            args: { slug: string },
            context: GraphQLContext,
        ) => {
            return context.prisma.resource.findFirst({
                where: {
                    slug: args.slug,
                    status: "PUBLISHED",
                    provider: {
                        isActive: true,
                    },
                },
                include: resourceInclude,
            });
        },

        bookmarks: async (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            const bookmarks = await context.prisma.bookmark.findMany({
                where: {
                    userId: user.id,
                    resource: {
                        status: "PUBLISHED",
                        provider: {
                            isActive: true,
                        },
                    },
                },
                include: {
                    resource: {
                        include: resourceInclude,
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            return bookmarks.map((bookmark) => bookmark.resource);
        },
    },

    Mutation: {
        createAdminResource: async (
            _parent: unknown,
            args: { input: CreateAdminResourceInput },
            context: GraphQLContext,
        ) => {
            const admin = requireRole(context, ["ADMIN"]);
            const input = args.input;

            const title = input.title.trim();
            const summary = input.summary?.trim() || null;
            const language = input.language?.trim() || null;

            if (!title || title.length > 200) {
                badInput("Title must contain between 1 and 200 characters.");
            }

            if (summary && summary.length > 5000) {
                badInput("Summary cannot exceed 5000 characters.");
            }

            if (language && language.length > 50) {
                badInput("Language cannot exceed 50 characters.");
            }

            if (
                input.durationMinutes != null &&
                (!Number.isInteger(input.durationMinutes) ||
                    input.durationMinutes <= 0)
            ) {
                badInput("Duration must be a positive integer.");
            }

            const url = validateHttpUrl(input.url, "Resource URL");

            const thumbnailUrl = input.thumbnailUrl?.trim()
                ? validateHttpUrl(input.thumbnailUrl, "Thumbnail URL")
                : null;

            const provider = await context.prisma.provider.findFirst({
                where: {
                    id: input.providerId,
                    isActive: true,
                },
                select: { id: true },
            });

            if (!provider) {
                badInput(
                    "The selected provider does not exist or is inactive.",
                );
            }

            const categoryIds = input.categoryIds ?? [];

            if (new Set(categoryIds).size !== categoryIds.length) {
                badInput("Duplicate category IDs are not allowed.");
            }

            if (categoryIds.length > 0) {
                const categories = await context.prisma.category.findMany({
                    where: {
                        id: { in: categoryIds },
                        isActive: true,
                    },
                    select: { id: true },
                });

                if (categories.length !== categoryIds.length) {
                    badInput(
                        "One or more selected categories do not exist or are inactive.",
                    );
                }
            }

            const resourceId = randomUUID();

            return context.prisma.resource.create({
                data: {
                    id: resourceId,
                    title,
                    slug: createResourceSlug(title, resourceId),
                    url,
                    summary,
                    thumbnailUrl,
                    resourceType: input.resourceType,
                    accessType: input.accessType ?? "UNKNOWN",
                    difficulty: input.difficulty ?? "UNKNOWN",
                    language,
                    durationMinutes: input.durationMinutes ?? null,
                    status: input.status ?? "DRAFT",
                    source: "ADMIN_CURATED",
                    providerId: provider.id,
                    createdById: admin.id,
                    categories: {
                        create: categoryIds.map((categoryId) => ({
                            category: {
                                connect: { id: categoryId },
                            },
                        })),
                    },
                },
                include: resourceInclude,
            });
        },

        updateAdminResource: async (
            _parent: unknown,
            args: {
                resourceId: string;
                input: UpdateAdminResourceInput;
            },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            const { input } = args;

            const existingResource = await context.prisma.resource.findUnique({
                where: { id: args.resourceId },
                select: { id: true },
            });

            if (!existingResource) {
                throw new GraphQLError("Resource not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            const data: {
                title?: string;
                url?: string;
                summary?: string | null;
                thumbnailUrl?: string | null;
                resourceType?:
                | "ARTICLE"
                | "VIDEO"
                | "COURSE"
                | "TUTORIAL"
                | "DOCUMENT"
                | "OTHER";
                accessType?:
                | "FREE"
                | "PAID"
                | "SUBSCRIPTION"
                | "FREEMIUM"
                | "UNKNOWN";
                difficulty?:
                | "BEGINNER"
                | "INTERMEDIATE"
                | "ADVANCED"
                | "ALL_LEVELS"
                | "UNKNOWN";
                language?: string | null;
                durationMinutes?: number | null;
                providerId?: string;
                status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            } = {};

            if (input.title !== undefined) {
                if (input.title === null) {
                    badInput("Title cannot be null.");
                }

                const title = input.title.trim();

                if (!title || title.length > 200) {
                    badInput("Title must contain between 1 and 200 characters.");
                }

                data.title = title;
            }

            if (input.url !== undefined) {
                if (input.url === null) {
                    badInput("Resource URL cannot be null.");
                }

                data.url = validateHttpUrl(input.url, "Resource URL");
            }

            if (input.summary !== undefined) {
                const summary = input.summary?.trim() || null;

                if (summary && summary.length > 5000) {
                    badInput("Summary cannot exceed 5000 characters.");
                }

                data.summary = summary;
            }

            if (input.thumbnailUrl !== undefined) {
                data.thumbnailUrl = input.thumbnailUrl?.trim()
                    ? validateHttpUrl(input.thumbnailUrl, "Thumbnail URL")
                    : null;
            }

            if (input.resourceType !== undefined) {
                if (input.resourceType === null) {
                    badInput("Resource type cannot be null.");
                }

                data.resourceType = input.resourceType;
            }

            if (input.accessType !== undefined) {
                if (input.accessType === null) {
                    badInput("Access type cannot be null.");
                }

                data.accessType = input.accessType;
            }

            if (input.difficulty !== undefined) {
                if (input.difficulty === null) {
                    badInput("Difficulty cannot be null.");
                }

                data.difficulty = input.difficulty;
            }

            if (input.language !== undefined) {
                const language = input.language?.trim() || null;

                if (language && language.length > 50) {
                    badInput("Language cannot exceed 50 characters.");
                }

                data.language = language;
            }

            if (input.durationMinutes !== undefined) {
                if (
                    input.durationMinutes !== null &&
                    (!Number.isInteger(input.durationMinutes) ||
                        input.durationMinutes <= 0)
                ) {
                    badInput("Duration must be a positive integer.");
                }

                data.durationMinutes = input.durationMinutes;
            }

            if (input.providerId !== undefined) {
                if (!input.providerId) {
                    badInput("Provider ID cannot be empty.");
                }

                const provider = await context.prisma.provider.findFirst({
                    where: {
                        id: input.providerId,
                        isActive: true,
                    },
                    select: { id: true },
                });

                if (!provider) {
                    badInput(
                        "The selected provider does not exist or is inactive.",
                    );
                }

                data.providerId = provider.id;
            }

            if (input.status !== undefined) {
                if (input.status === null) {
                    badInput("Resource status cannot be null.");
                }

                data.status = input.status;
            }

            const shouldUpdateCategories = input.categoryIds !== undefined;
            const categoryIds = input.categoryIds ?? [];

            if (new Set(categoryIds).size !== categoryIds.length) {
                badInput("Duplicate category IDs are not allowed.");
            }

            if (categoryIds.length > 0) {
                const categories = await context.prisma.category.findMany({
                    where: {
                        id: { in: categoryIds },
                        isActive: true,
                    },
                    select: { id: true },
                });

                if (categories.length !== categoryIds.length) {
                    badInput(
                        "One or more selected categories do not exist or are inactive.",
                    );
                }
            }

            return context.prisma.$transaction(async (tx) => {
                await tx.resource.update({
                    where: { id: args.resourceId },
                    data,
                });

                if (shouldUpdateCategories) {
                    await tx.resourceCategory.deleteMany({
                        where: { resourceId: args.resourceId },
                    });

                    if (categoryIds.length > 0) {
                        await tx.resourceCategory.createMany({
                            data: categoryIds.map((categoryId) => ({
                                resourceId: args.resourceId,
                                categoryId,
                            })),
                        });
                    }
                }

                return tx.resource.findUniqueOrThrow({
                    where: { id: args.resourceId },
                    include: resourceInclude,
                });
            });
        },

        archiveResource: async (
            _parent: unknown,
            args: { resourceId: string },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            const resource = await context.prisma.resource.findUnique({
                where: { id: args.resourceId },
            });

            if (!resource) {
                throw new GraphQLError("Resource not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            if (resource.status === "ARCHIVED") {
                return context.prisma.resource.findUniqueOrThrow({
                    where: { id: args.resourceId },
                    include: resourceInclude,
                });
            }

            return context.prisma.resource.update({
                where: { id: args.resourceId },
                data: { status: "ARCHIVED" },
                include: resourceInclude,
            });
        },

        bookmarkResource: async (
            _parent: unknown,
            args: { resourceId: string },
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            const resource = await context.prisma.resource.findFirst({
                where: {
                    id: args.resourceId,
                    status: "PUBLISHED",
                    provider: {
                        isActive: true,
                    },
                },
            });

            if (!resource) {
                throw new GraphQLError("Published resource not found.", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            await context.prisma.bookmark.upsert({
                where: {
                    userId_resourceId: {
                        userId: user.id,
                        resourceId: resource.id,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    resourceId: resource.id,
                },
            });

            return context.prisma.resource.findUniqueOrThrow({
                where: { id: resource.id },
                include: resourceInclude,
            });
        },

        removeBookmark: async (
            _parent: unknown,
            args: { resourceId: string },
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            const result = await context.prisma.bookmark.deleteMany({
                where: {
                    userId: user.id,
                    resourceId: args.resourceId,
                },
            });

            return result.count > 0;
        },
    },

    Resource: {
        createdAt: (parent: { createdAt: Date }) =>
            parent.createdAt.toISOString(),

        categories: (parent: ResourceParent) =>
            parent.categories.map((item) => item.category),
    },
};
