import { GraphQLError } from "graphql";
import { requireAuth, requireRole } from "../../lib/auth-guards.js";
import type { GraphQLContext } from "../../types/context.js";
import { badInput, validateHttpUrl } from "./shared.js";

export const creatorResolvers = {
    Query: {
        myCreatorProfile: async (
            _parent: unknown,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            const user = requireAuth(context);

            return context.prisma.creatorProfile.findUnique({
                where: { userId: user.id },
            });
        },

        creatorApplications: async (
            _parent: unknown,
            args: {
                status?:
                | "PENDING"
                | "VERIFIED"
                | "REJECTED"
                | "SUSPENDED";
            },
            context: GraphQLContext,
        ) => {
            requireRole(context, ["ADMIN"]);

            return context.prisma.creatorProfile.findMany({
                where: {
                    verificationStatus: args.status ?? "PENDING",
                },
                orderBy: { createdAt: "asc" },
            });
        },
    },

    Mutation: {
        applyForCreator: async (
            _parent: unknown,
            args: {
                displayName: string;
                bio?: string | null;
                websiteUrl?: string | null;
            },
            context: GraphQLContext,
        ) => {
            const user = requireRole(context, ["USER"]);

            const displayName = args.displayName.trim();
            const bio = args.bio?.trim() || null;
            const websiteUrl = args.websiteUrl?.trim() || null;

            if (!displayName || displayName.length > 100) {
                badInput(
                    "Display name must contain between 1 and 100 characters.",
                );
            }

            if (bio && bio.length > 1000) {
                badInput("Bio cannot exceed 1000 characters.");
            }

            const validatedWebsiteUrl = websiteUrl
                ? validateHttpUrl(websiteUrl, "Website URL")
                : null;

            const existingProfile =
                await context.prisma.creatorProfile.findUnique({
                    where: { userId: user.id },
                });

            if (!existingProfile) {
                return context.prisma.creatorProfile.create({
                    data: {
                        userId: user.id,
                        displayName,
                        bio,
                        websiteUrl: validatedWebsiteUrl,
                        verificationStatus: "PENDING",
                    },
                });
            }

            if (existingProfile.verificationStatus === "PENDING") {
                throw new GraphQLError(
                    "You already have a pending creator application.",
                    { extensions: { code: "CONFLICT" } },
                );
            }

            if (existingProfile.verificationStatus === "VERIFIED") {
                throw new GraphQLError(
                    "Your creator account is already verified.",
                    { extensions: { code: "CONFLICT" } },
                );
            }

            if (existingProfile.verificationStatus === "SUSPENDED") {
                throw new GraphQLError(
                    "Your creator account is suspended. Contact an administrator.",
                    { extensions: { code: "FORBIDDEN" } },
                );
            }

            const result = await context.prisma.creatorProfile.updateMany({
                where: {
                    id: existingProfile.id,
                    userId: user.id,
                    verificationStatus: "REJECTED",
                },
                data: {
                    displayName,
                    bio,
                    websiteUrl: validatedWebsiteUrl,
                    verificationStatus: "PENDING",
                    verifiedAt: null,
                    reviewedAt: null,
                    reviewedById: null,
                    rejectionReason: null,
                },
            });

            if (result.count === 0) {
                throw new GraphQLError(
                    "Your application changed before it could be resubmitted. Please refresh and try again.",
                    { extensions: { code: "CONFLICT" } },
                );
            }

            return context.prisma.creatorProfile.findUniqueOrThrow({
                where: { id: existingProfile.id },
            });
        },

        reviewCreatorApplication: async (
            _parent: unknown,
            args: {
                profileId: string;
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
                    "A rejection reason cannot be provided when approving an application.",
                );
            }

            if (rejectionReason && rejectionReason.length > 1000) {
                badInput("Rejection reason cannot exceed 1000 characters.");
            }

            return context.prisma.$transaction(async (tx) => {
                const profile = await tx.creatorProfile.findUnique({
                    where: { id: args.profileId },
                });

                if (!profile) {
                    throw new GraphQLError("Creator application not found.", {
                        extensions: { code: "NOT_FOUND" },
                    });
                }

                if (profile.verificationStatus !== "PENDING") {
                    throw new GraphQLError(
                        "This application has already been reviewed.",
                        { extensions: { code: "CONFLICT" } },
                    );
                }

                const now = new Date();

                const result = await tx.creatorProfile.updateMany({
                    where: {
                        id: args.profileId,
                        verificationStatus: "PENDING",
                    },
                    data:
                        args.decision === "APPROVE"
                            ? {
                                verificationStatus: "VERIFIED",
                                verifiedAt: now,
                                reviewedAt: now,
                                reviewedById: admin.id,
                                rejectionReason: null,
                            }
                            : {
                                verificationStatus: "REJECTED",
                                verifiedAt: null,
                                reviewedAt: now,
                                reviewedById: admin.id,
                                rejectionReason,
                            },
                });

                if (result.count === 0) {
                    throw new GraphQLError(
                        "This application was already reviewed by another administrator.",
                        { extensions: { code: "CONFLICT" } },
                    );
                }

                if (args.decision === "APPROVE") {
                    await tx.user.update({
                        where: { id: profile.userId },
                        data: { role: "CREATOR" },
                    });
                }

                return tx.creatorProfile.findUniqueOrThrow({
                    where: { id: args.profileId },
                });
            });
        },
    },

    CreatorProfile: {
        verifiedAt: (parent: { verifiedAt: Date | null }) =>
            parent.verifiedAt?.toISOString() ?? null,

        reviewedAt: (parent: { reviewedAt: Date | null }) =>
            parent.reviewedAt?.toISOString() ?? null,

        createdAt: (parent: { createdAt: Date }) =>
            parent.createdAt.toISOString(),

        updatedAt: (parent: { updatedAt: Date }) =>
            parent.updatedAt.toISOString(),
    },
};
