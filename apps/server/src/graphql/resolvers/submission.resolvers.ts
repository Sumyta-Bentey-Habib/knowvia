import { GraphQLError } from "graphql";
import { requireAuth, requireRole } from "../../lib/auth-guards.js";
import type { GraphQLContext } from "../../types/context.js";
import {
    badInput,
    createResourceSlug,
    submissionInclude,
    validateHttpUrl,
} from "./shared.js";

export const submissionResolvers = {
    Query: {
        myResourceSubmissions: async (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            return context.prisma.resourceSubmission.findMany({
                where: { submittedById: user.id },
                include: submissionInclude,
                orderBy: { createdAt: "desc" },
            });
        },

        resourceSubmissions: async (
            _parent: unknown,
            args: {
                status?: "PENDING" | "APPROVED" | "REJECTED";
            },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            return context.prisma.resourceSubmission.findMany({
                where: {
                    status: args.status ?? "PENDING",
                },
                include: submissionInclude,
                orderBy: { createdAt: "asc" },
            });
        },
    },

    Mutation: {
        submitResource: async (
            _parent: unknown,
            args: {
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
                | "UNKNOWN";
                difficulty?:
                | "BEGINNER"
                | "INTERMEDIATE"
                | "ADVANCED"
                | "ALL_LEVELS"
                | "UNKNOWN";
                language?: string | null;
                durationMinutes?: number | null;
                providerId: string;
                categoryId?: string | null;
            },
            context: GraphQLContext,
        ) => {
            const creator = requireRole(context, ["CREATOR"]);

            const profile = await context.prisma.creatorProfile.findUnique({
                where: { userId: creator.id },
                select: { verificationStatus: true },
            });

            if (profile?.verificationStatus !== "VERIFIED") {
                throw new GraphQLError(
                    "Only verified creators can submit learning resources.",
                    { extensions: { code: "FORBIDDEN" } },
                );
            }

            const title = args.title.trim();
            const summary = args.summary?.trim() || null;
            const language = args.language?.trim() || null;

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
                args.durationMinutes != null &&
                (!Number.isInteger(args.durationMinutes) ||
                    args.durationMinutes <= 0)
            ) {
                badInput("Duration must be a positive integer.");
            }

            const url = validateHttpUrl(args.url, "Resource URL");

            const thumbnailUrl = args.thumbnailUrl?.trim()
                ? validateHttpUrl(args.thumbnailUrl, "Thumbnail URL")
                : null;

            const provider = await context.prisma.provider.findFirst({
                where: {
                    id: args.providerId,
                    isActive: true,
                },
                select: { id: true },
            });

            if (!provider) {
                badInput(
                    "The selected provider does not exist or is inactive.",
                );
            }

            if (args.categoryId) {
                const category = await context.prisma.category.findFirst({
                    where: {
                        id: args.categoryId,
                        isActive: true,
                    },
                    select: { id: true },
                });

                if (!category) {
                    badInput(
                        "The selected category does not exist or is inactive.",
                    );
                }
            }

            return context.prisma.resourceSubmission.create({
                data: {
                    title,
                    url,
                    summary,
                    thumbnailUrl,
                    resourceType: args.resourceType,
                    accessType: args.accessType ?? "UNKNOWN",
                    difficulty: args.difficulty ?? "UNKNOWN",
                    language,
                    durationMinutes: args.durationMinutes ?? null,
                    submittedById: creator.id,
                    providerId: provider.id,
                    categoryId: args.categoryId || null,
                },
                include: submissionInclude,
            });
        },

        reviewResourceSubmission: async (
            _parent: unknown,
            args: {
                submissionId: string;
                decision: "APPROVE" | "REJECT";
                rejectionReason?: string | null;
            },
            context: GraphQLContext,
        ) => {
            const admin = requireRole(context, ["ADMIN"]);
            const rejectionReason = args.rejectionReason?.trim() || null;

            if (args.decision === "REJECT" && !rejectionReason) {
                badInput("A rejection reason is required.");
            }

            if (args.decision === "APPROVE" && rejectionReason) {
                badInput(
                    "A rejection reason cannot be provided when approving a submission.",
                );
            }

            if (rejectionReason && rejectionReason.length > 1000) {
                badInput("Rejection reason cannot exceed 1000 characters.");
            }

            return context.prisma.$transaction(async (tx) => {
                const submission = await tx.resourceSubmission.findUnique({
                    where: { id: args.submissionId },
                });

                if (!submission) {
                    throw new GraphQLError("Resource submission not found.", {
                        extensions: { code: "NOT_FOUND" },
                    });
                }

                if (submission.status !== "PENDING") {
                    throw new GraphQLError(
                        "This resource submission has already been reviewed.",
                        { extensions: { code: "CONFLICT" } },
                    );
                }

                const now = new Date();

                const result = await tx.resourceSubmission.updateMany({
                    where: {
                        id: args.submissionId,
                        status: "PENDING",
                    },
                    data:
                        args.decision === "APPROVE"
                            ? {
                                status: "APPROVED",
                                reviewedById: admin.id,
                                reviewedAt: now,
                                rejectionReason: null,
                            }
                            : {
                                status: "REJECTED",
                                reviewedById: admin.id,
                                reviewedAt: now,
                                rejectionReason,
                            },
                });

                if (result.count === 0) {
                    throw new GraphQLError(
                        "This submission was already reviewed by another administrator.",
                        { extensions: { code: "CONFLICT" } },
                    );
                }

                if (args.decision === "APPROVE") {
                    await tx.resource.create({
                        data: {
                            title: submission.title,
                            slug: createResourceSlug(
                                submission.title,
                                submission.id,
                            ),
                            url: submission.url,
                            summary: submission.summary,
                            thumbnailUrl: submission.thumbnailUrl,
                            resourceType: submission.resourceType,
                            accessType: submission.accessType,
                            difficulty: submission.difficulty,
                            language: submission.language,
                            durationMinutes: submission.durationMinutes,
                            status: "PUBLISHED",
                            source: "CREATOR_SUBMISSION",
                            providerId: submission.providerId,
                            createdById: submission.submittedById,
                            submissionId: submission.id,
                            ...(submission.categoryId
                                ? {
                                    categories: {
                                        create: [
                                            {
                                                categoryId: submission.categoryId,
                                            },
                                        ],
                                    },
                                }
                                : {}),
                        },
                    });
                }

                return tx.resourceSubmission.findUniqueOrThrow({
                    where: { id: args.submissionId },
                    include: submissionInclude,
                });
            });
        },
    },

    ResourceSubmission: {
        reviewedAt: (parent: { reviewedAt: Date | null }) =>
            parent.reviewedAt?.toISOString() ?? null,

        createdAt: (parent: { createdAt: Date }) =>
            parent.createdAt.toISOString(),

        updatedAt: (parent: { updatedAt: Date }) =>
            parent.updatedAt.toISOString(),
    },
};
