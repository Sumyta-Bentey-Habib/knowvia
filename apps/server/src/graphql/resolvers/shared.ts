import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../../types/context.js";

export const resourceInclude = {
    provider: true,
    categories: {
        where: {
            category: {
                isActive: true,
            },
        },
        include: {
            category: true,
        },
    },
};

export const submissionInclude = {
    provider: true,
    category: true,
};

export function badInput(message: string): never {
    throw new GraphQLError(message, {
        extensions: { code: "BAD_USER_INPUT" },
    });
}

export function validateHttpUrl(
    value: string,
    fieldName: string,
): string {
    const trimmed = value.trim();

    try {
        const parsedUrl = new URL(trimmed);

        if (
            !["http:", "https:"].includes(parsedUrl.protocol) ||
            !parsedUrl.hostname
        ) {
            throw new Error("Invalid URL");
        }

        return trimmed;
    } catch {
        return badInput(
            `${fieldName} must be a valid HTTP or HTTPS URL.`,
        );
    }
}

export function createResourceSlug(
    title: string,
    uniqueId: string,
): string {
    const baseSlug =
        title
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 80) || "resource";

    return `${baseSlug}-${uniqueId}`;
}
export function requireAuth(context: GraphQLContext) {
    const session = context.session;

    if (!session) {
        throw new GraphQLError("Authentication required.", {
            extensions: { code: "UNAUTHENTICATED" },
        });
    }

    return session.user;
}
